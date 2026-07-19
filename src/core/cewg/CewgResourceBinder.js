const { CewgLightList } = require("./CewgLightList");
const CewgCarbonData = require("./CewgCarbonData");

function fitConstantBuffer(data, registerCount)
{
    const floatCount = Number(registerCount) * 4;
    return floatCount > 0 && data.length > floatCount ? data.subarray(0, floatCount) : data;
}

/**
 * CewgResourceBinder
 *
 * GL upload/binding layer for the CEWG (translated DX11) shader path.
 * Owns the GPU resources behind the emitter's non-sampler bindings and
 * binds them when a CEWG pass is applied:
 *
 * - structuredUbo  (CewgSb<r>) — the dedicated bone UBO. Joint matrices
 *   arrive as the same 12-floats-per-joint float4x3 row layout the legacy
 *   path stores in perObjectData's "JointMat" (and the DXBC bytecode
 *   expects), so upload is a straight copy into a std140 vec4 array.
 * - structuredTexture (sb<r>) — the tiled light-list RGBA32UI data
 *   textures, sourced from a CewgLightList. The binding's structure
 *   stride discriminates which buffer a register wants: stride 4 is
 *   Buffer A (tile headers + list nodes), stride 48 is Buffer B (light
 *   data rows).
 * - bufferTexture (bt<r>) — post-processing Buffer<> emulation textures
 *   (RGBA32F). Sources are registered per register index by the post-fx
 *   chain; unset registers bind a 1x1 zero texture so sampling is
 *   complete and deterministic.
 *
 * If no scene-owned light list has been provided, a fallback list sized
 * to the device viewport is maintained with an empty draw list: every
 * tile chains to the null light (index 0, radius 0, disabled), so lit
 * shaders render correctly with zero light contribution until scene
 * light collection is wired up.
 *
 * Like CewgLightList, this module is CommonJS with no ccpwgl aliases so
 * the node regression tests can require it without the webpack bundle.
 */
class CewgResourceBinder
{

    /**
     * Constructs a binder for a gl context
     * @param {WebGL2RenderingContext} gl
     */
    constructor(gl)
    {
        this.gl = gl;

        // Bone UBO
        this._boneBuffer = null;
        this._boneBufferByteLength = 0;
        this._boneStaging = null;
        this._jointMatrices = null;
        this._jointsDirty = false;

        // Light-list data textures
        this._lightList = null;
        this._fallbackLightList = null;
        this._texA = { texture: null, width: 0, height: 0 };
        this._texB = { texture: null, width: 0, height: 0 };
        this._texPacked = { texture: null, width: 0, height: 0 };
        this._packedLightStaging = null;

        // Post-fx buffer textures by register index
        this._bufferTextureSources = {};
        this._zeroFloatTexture = null;

        // Dedicated scratch unit for texture creation/upload binds, so
        // uploading (which happens mid-ApplyPass, after material textures
        // are applied) never clobbers whatever unit is currently active
        // (e.g. unit 8 = the last-applied material sampler). WebGL2
        // guarantees at least 32 combined units; fall back to 31 under
        // test stubs that don't implement getParameter.
        this._scratchUnit = typeof gl.getParameter === "function"
            ? gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) - 1
            : 31;

        this._warnedStrides = {};

        // Carbon-shaped constant scratch buffers (packed per apply)
        this._perFrameVS = new Float32Array(CewgCarbonData.PER_FRAME_VS_REGS * 4);
        this._perFramePS = new Float32Array(CewgCarbonData.PER_FRAME_PS_REGS * 4);
        this._perObjectVS = new Float32Array(CewgCarbonData.PER_OBJECT_REGS * 4);
        this._perObjectPS = new Float32Array(CewgCarbonData.PER_OBJECT_REGS * 4);
        this._zeroObjectVS = null;
    }

    /**
     * Gets (or lazily creates) the device's binder instance
     * @param {Tw2Device} device
     * @returns {CewgResourceBinder}
     */
    static Get(device)
    {
        if (!device._cewgResourceBinder)
        {
            device._cewgResourceBinder = new CewgResourceBinder(device.gl);
        }
        return device._cewgResourceBinder;
    }

    /**
     * Sets the scene-owned light list (owner is responsible for
     * SetScreenSize/SetLights/WriteDrawList; the binder only uploads)
     * @param {CewgLightList|null} lightList
     */
    SetLightList(lightList)
    {
        this._lightList = lightList || null;
    }

    /**
     * Registers a post-fx source texture for a bt<register> binding
     * @param {Number} registerIndex
     * @param {WebGLTexture|null} texture
     */
    SetBufferTextureSource(registerIndex, texture)
    {
        this._bufferTextureSources[registerIndex] = texture || null;
    }

    /**
     * Stages joint matrices for the bone UBO (12 floats per joint,
     * float4x3 rows — the legacy "JointMat" layout)
     * @param {Float32Array|null} jointMatrices
     */
    SetJointMatrices(jointMatrices)
    {
        this._jointMatrices = jointMatrices || null;
        // Animation mutates the same Float32Array in place and different
        // objects stage different arrays between draws, so any staging
        // call marks the UBO for re-upload on the next skinned apply.
        this._jointsDirty = true;
    }

    /**
     * Uploads Carbon-shaped per-frame / per-object constants (b1-b4)
     * packed from the device's GLES-v8-shaped arrays. CEWG shaders were
     * compiled against Carbon's DX11 layouts, so the legacy uploads in
     * Tw2Effect.ApplyPass are skipped for CEWG passes in favour of this.
     * Shadow-pass note: Carbon carries ShadowViewMat inside b1 rather
     * than swapping in a separate shadow buffer pair; the normal
     * per-frame arrays are used for all CEWG techniques.
     * @param {Tw2ShaderProgram} program
     * @param {Tw2Device} device
     * @param {{PackPerObjectVS?: Function, PackPerObjectPS?: Function}} [perObjectPacker]
     * @param {{perFrameVSData?: Tw2RawData, perFramePSData?: Tw2RawData}} [frameData]
     */
    ApplyConstants(program, device, perObjectPacker, frameData)
    {
        const
            gl = this.gl,
            cbh = program.constantBufferHandles,
            perFrameVSData = frameData && frameData.perFrameVSData || device.perFrameVSData,
            perFramePSData = frameData && frameData.perFramePSData || device.perFramePSData;

        if (cbh[1] && perFrameVSData)
        {
            const packed = perObjectPacker?.PackPerFrameVS
                ? perObjectPacker.PackPerFrameVS(this._perFrameVS, perFrameVSData.data, device, program) || this._perFrameVS
                : CewgCarbonData.PackPerFrameVS(this._perFrameVS, perFrameVSData.data);
            gl.uniform4fv(cbh[1], fitConstantBuffer(packed, program.constantBufferSizes?.[1]));
        }
        if (cbh[2] && perFramePSData)
        {
            const packed = perObjectPacker?.PackPerFramePS
                ? perObjectPacker.PackPerFramePS(this._perFramePS, perFramePSData.data, device, program) || this._perFramePS
                : CewgCarbonData.PackPerFramePS(this._perFramePS, perFramePSData.data);
            gl.uniform4fv(cbh[2], fitConstantBuffer(packed, program.constantBufferSizes?.[2]));
        }

        const pod = device.perObjectData;
        if (!pod) return;

        const vsData = pod.vs ? pod.vs.data
            : (this._zeroObjectVS || (this._zeroObjectVS = new Float32Array(12 * 4)));

        // Decals carry their own per-object layout (Carbon DecalVS/PSPerObjectData);
        // the hull packers would reorganize it (esp. the PS path) and corrupt cb4.
        const isDecal = pod.cewgKind === "decal";

        if (cbh[3] && pod.vs)
        {
            let packedVs;
            if (perObjectPacker?.PackPerObjectVS)
            {
                this._perObjectVS.fill(0);
                packedVs = perObjectPacker.PackPerObjectVS(this._perObjectVS, pod, device, program) || this._perObjectVS;
            }
            else
            {
                packedVs = isDecal
                    ? CewgCarbonData.PackDecalPerObjectVS(this._perObjectVS, pod.vs.data)
                    : CewgCarbonData.PackPerObjectVS(this._perObjectVS, pod.vs.data);
            }
            gl.uniform4fv(cbh[3], fitConstantBuffer(packedVs, program.constantBufferSizes?.[3]));
        }
        if (cbh[4] && pod.ps)
        {
            let packedPs;
            if (perObjectPacker?.PackPerObjectPS)
            {
                this._perObjectPS.fill(0);
                packedPs = perObjectPacker.PackPerObjectPS(this._perObjectPS, pod, device, program) || this._perObjectPS;
            }
            else
            {
                packedPs = isDecal
                    ? CewgCarbonData.PackDecalPerObjectPS(this._perObjectPS, pod.ps.data)
                    : CewgCarbonData.PackPerObjectPS(this._perObjectPS, vsData, pod.ps.data);
            }
            gl.uniform4fv(cbh[4], fitConstantBuffer(packedPs, program.constantBufferSizes?.[4]));
        }
    }

    /**
     * Binds all CEWG resources a program declared
     * @param {Tw2ShaderProgram} program
     * @param {Tw2Device} device
     */
    ApplyPass(program, device)
    {
        const gl = this.gl;

        const blocks = program.cewgUniformBlocks;
        if (blocks && blocks.length)
        {
            this._ApplyBoneBlocks(blocks);
        }

        const dataTextures = program.cewgDataTextures;
        if (dataTextures && dataTextures.length)
        {
            let lightTexturesReady = false;
            for (let i = 0; i < dataTextures.length; ++i)
            {
                const entry = dataTextures[i];
                if (entry.kind === "structuredTexture")
                {
                    if (entry.cewgSemantic === "packedLocalLights")
                    {
                        this._UpdatePackedLightTexture(device, entry);
                        this._BindPackedLightTexture(entry);
                    }
                    else
                    {
                        if (!lightTexturesReady)
                        {
                            this._UpdateLightTextures(device);
                            lightTexturesReady = true;
                        }
                        this._BindLightTexture(entry);
                    }
                }
                else if (entry.kind === "bufferTexture")
                {
                    gl.activeTexture(gl.TEXTURE0 + entry.unit);
                    gl.bindTexture(gl.TEXTURE_2D,
                        this._bufferTextureSources[entry.registerIndex] || this._GetZeroFloatTexture());
                }
            }
            gl.activeTexture(gl.TEXTURE0);
        }
    }

    /**
     * Ensures the bone UBO exists, uploads staged joints, binds blocks
     * @param {Array} blocks - program.cewgUniformBlocks
     * @private
     */
    _ApplyBoneBlocks(blocks)
    {
        const gl = this.gl;

        let byteLength = 0;
        for (let i = 0; i < blocks.length; ++i)
        {
            if (blocks[i].byteLength > byteLength) byteLength = blocks[i].byteLength;
        }
        if (!byteLength) byteLength = CewgResourceBinder.DEFAULT_BONE_BYTE_LENGTH;

        if (!this._boneBuffer || byteLength > this._boneBufferByteLength)
        {
            if (this._boneBuffer) gl.deleteBuffer(this._boneBuffer);
            this._boneBuffer = gl.createBuffer();
            this._boneBufferByteLength = byteLength;
            this._boneStaging = new Float32Array(byteLength >> 2);
            gl.bindBuffer(gl.UNIFORM_BUFFER, this._boneBuffer);
            gl.bufferData(gl.UNIFORM_BUFFER, this._boneStaging, gl.DYNAMIC_DRAW);
            this._jointsDirty = !!this._jointMatrices;
        }

        if (this._jointsDirty)
        {
            const staging = this._boneStaging;
            const joints = this._jointMatrices;
            if (joints)
            {
                const count = Math.min(joints.length, staging.length);
                staging.set(count === joints.length ? joints : joints.subarray(0, count));
                // Joints past the staged set stay from the previous upload;
                // they are never indexed by a mesh with fewer bones.
            }
            else
            {
                staging.fill(0);
            }
            gl.bindBuffer(gl.UNIFORM_BUFFER, this._boneBuffer);
            gl.bufferData(gl.UNIFORM_BUFFER, staging, gl.DYNAMIC_DRAW);
            this._jointsDirty = false;
        }

        for (let i = 0; i < blocks.length; ++i)
        {
            gl.bindBufferBase(gl.UNIFORM_BUFFER, blocks[i].bindingPoint, this._boneBuffer);
        }
    }

    /**
     * Gets the active light list, maintaining the viewport-sized
     * fallback when the scene has not provided one
     * @param {Tw2Device} device
     * @returns {CewgLightList}
     * @private
     */
    _GetLightList(device)
    {
        if (this._lightList) return this._lightList;

        if (!this._fallbackLightList)
        {
            this._fallbackLightList = new CewgLightList();
        }

        // The shader derives its tile count from the screen size in the
        // per-frame constants, so the fallback's headers must track the
        // real viewport. SetScreenSize is a no-op unless the tile layout
        // actually changed.
        const width = device.viewportWidth || 16;
        const height = device.viewportHeight || 16;
        if (this._fallbackLightList.SetScreenSize(width, height))
        {
            this._fallbackLightList.WriteDrawList([]);
        }
        return this._fallbackLightList;
    }

    /**
     * Uploads dirty light-list regions into the RGBA32UI textures
     * @param {Tw2Device} device
     * @private
     */
    _UpdateLightTextures(device)
    {
        const list = this._GetLightList(device);
        const infoA = list.GetBufferATextureInfo();
        const infoB = list.GetBufferBTextureInfo();
        this._UploadUintTexture(this._texA, list.GetBufferA(), infoA, list.GetDirtyARows());
        if (this._texA.uploaded) list.ClearDirtyA();
        this._UploadUintTexture(this._texB, list.GetBufferBUint(), infoB, list.GetDirtyBRows());
        if (this._texB.uploaded) list.ClearDirtyB();
    }

    /**
     * Uploads the local-light buffers packed into one RGBA32UI texture.
     * Buffer A starts at texel 0; Buffer B starts at entry.dataTexelBase.
     * @param {Tw2Device} device
     * @param {{width:Number,dataTexelBase:Number}} entry
     * @private
     */
    _UpdatePackedLightTexture(device, entry)
    {
        const list = this._GetLightList(device);
        const infoA = list.GetBufferATextureInfo();
        const infoB = list.GetBufferBTextureInfo();
        const width = entry.width || infoA.width || CewgResourceBinder.DEFAULT_DATA_TEXTURE_WIDTH;
        const dataTexelBase = entry.dataTexelBase || CewgResourceBinder.PACKED_LIGHT_DATA_TEXEL_BASE;
        const dataRowBase = Math.floor(dataTexelBase / width);
        const height = Math.max(infoA.height, Math.ceil((dataTexelBase + infoB.texelCount) / width));
        const rowElements = width * 4;
        const totalElements = rowElements * height;

        const fullUpload = !this._packedLightStaging || this._packedLightStaging.length !== totalElements
            || !this._texPacked.texture || this._texPacked.width !== width || this._texPacked.height !== height;

        if (!this._packedLightStaging || this._packedLightStaging.length !== totalElements)
        {
            this._packedLightStaging = new Uint32Array(totalElements);
        }

        const staging = this._packedLightStaging;
        if (fullUpload)
        {
            staging.fill(0);
            staging.set(list.GetBufferA(), 0);
            staging.set(list.GetBufferBUint(), dataTexelBase * 4);
            this._UploadUintTexture(this._texPacked, staging, { width, height }, { y0: 0, y1: height - 1 });
            if (this._texPacked.uploaded)
            {
                list.ClearDirtyA();
                list.ClearDirtyB();
            }
            return;
        }

        const dirtyA = list.GetDirtyARows();
        if (dirtyA)
        {
            const y0 = Math.max(0, dirtyA.y0);
            const y1 = Math.min(infoA.height - 1, dirtyA.y1);
            staging.set(list.GetBufferA().subarray(y0 * rowElements, (y1 + 1) * rowElements), y0 * rowElements);
            this._UploadUintTexture(this._texPacked, staging, { width, height }, { y0, y1 });
            if (this._texPacked.uploaded) list.ClearDirtyA();
        }

        const dirtyB = list.GetDirtyBRows();
        if (dirtyB)
        {
            const y0 = Math.max(0, dirtyB.y0);
            const y1 = Math.min(infoB.height - 1, dirtyB.y1);
            staging.set(list.GetBufferBUint().subarray(y0 * rowElements, (y1 + 1) * rowElements), (dataRowBase + y0) * rowElements);
            this._UploadUintTexture(this._texPacked, staging, { width, height }, { y0: dataRowBase + y0, y1: dataRowBase + y1 });
            if (this._texPacked.uploaded) list.ClearDirtyB();
        }
    }
    /**
     * Creates/reallocates/partially updates one RGBA32UI data texture
     * @param {{texture:WebGLTexture, width:Number, height:Number}} state
     * @param {Uint32Array} data - texel data (4 uint32s per texel)
     * @param {{width:Number, height:Number}} info
     * @param {{y0:Number, y1:Number}|null} dirtyRows
     * @private
     */
    _UploadUintTexture(state, data, info, dirtyRows)
    {
        const gl = this.gl;
        state.uploaded = false;
        if (!data || !info.width || !info.height) return;

        // Bind on the scratch unit - uploads run mid-ApplyPass and must
        // not disturb the material sampler units already applied.
        gl.activeTexture(gl.TEXTURE0 + this._scratchUnit);

        if (!state.texture || state.width !== info.width || state.height !== info.height)
        {
            if (!state.texture)
            {
                state.texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, state.texture);
                // Integer textures must sample with NEAREST
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            }
            else
            {
                gl.bindTexture(gl.TEXTURE_2D, state.texture);
            }
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32UI, info.width, info.height, 0,
                gl.RGBA_INTEGER, gl.UNSIGNED_INT, data);
            state.width = info.width;
            state.height = info.height;
            state.uploaded = true;
            return;
        }

        if (dirtyRows)
        {
            const y0 = Math.max(0, dirtyRows.y0);
            const y1 = Math.min(info.height - 1, dirtyRows.y1);
            if (y1 >= y0)
            {
                const rowElements = info.width * 4;
                gl.bindTexture(gl.TEXTURE_2D, state.texture);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y0, info.width, y1 - y0 + 1,
                    gl.RGBA_INTEGER, gl.UNSIGNED_INT,
                    data.subarray(y0 * rowElements, (y1 + 1) * rowElements));
            }
            state.uploaded = true;
        }
    }

    /**
     * Binds one sb<r> entry's texture by structure stride
     * @param {{unit:Number, strideBytes:Number}} entry
     * @private
     */
    _BindLightTexture(entry)
    {
        const gl = this.gl;
        let state = null;

        if (entry.strideBytes === CewgResourceBinder.INDEX_BUFFER_STRIDE)
        {
            state = this._texA;
        }
        else if (entry.strideBytes === CewgResourceBinder.LIGHT_BUFFER_STRIDE)
        {
            state = this._texB;
        }
        else if (!this._warnedStrides[entry.strideBytes])
        {
            this._warnedStrides[entry.strideBytes] = true;
            // eslint-disable-next-line no-console
            console.warn(`CewgResourceBinder: no data source for structured stride ${entry.strideBytes} (register ${entry.registerIndex})`);
        }

        if (state && state.texture)
        {
            gl.activeTexture(gl.TEXTURE0 + entry.unit);
            gl.bindTexture(gl.TEXTURE_2D, state.texture);
        }
    }

    /**
     * Binds the packed local-light texture.
     * @param {{unit:Number}} entry
     * @private
     */
    _BindPackedLightTexture(entry)
    {
        if (this._texPacked.texture)
        {
            const gl = this.gl;
            gl.activeTexture(gl.TEXTURE0 + entry.unit);
            gl.bindTexture(gl.TEXTURE_2D, this._texPacked.texture);
        }
    }
    /**
     * Gets the 1x1 zero RGBA32F placeholder for unset bt<r> registers
     * @returns {WebGLTexture}
     * @private
     */
    _GetZeroFloatTexture()
    {
        if (!this._zeroFloatTexture)
        {
            const gl = this.gl;
            this._zeroFloatTexture = gl.createTexture();
            // Create on the scratch unit so lazy creation mid-ApplyPass
            // can't clobber an already-applied material sampler unit.
            gl.activeTexture(gl.TEXTURE0 + this._scratchUnit);
            gl.bindTexture(gl.TEXTURE_2D, this._zeroFloatTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1, 1, 0, gl.RGBA, gl.FLOAT, new Float32Array(4));
        }
        return this._zeroFloatTexture;
    }

}

/** First texture unit used for CEWG data textures (legacy s0-15 use 0-15, vs0-15 use 12-27) */
CewgResourceBinder.FIRST_DATA_TEXTURE_UNIT = 28;

/** structuredTexture stride identifying Buffer A (tile headers / list nodes) */
CewgResourceBinder.INDEX_BUFFER_STRIDE = 4;

/** structuredTexture stride identifying Buffer B (48-byte light rows) */
CewgResourceBinder.LIGHT_BUFFER_STRIDE = 48;

/** Default fixed texel width for CEWG data textures */
CewgResourceBinder.DEFAULT_DATA_TEXTURE_WIDTH = 2048;

/** Fixed texel offset where packed local-light Buffer B begins */
CewgResourceBinder.PACKED_LIGHT_DATA_TEXEL_BASE = 131072;

/** Bone UBO size when a block reports no capacity (69 joints x 48 bytes) */
CewgResourceBinder.DEFAULT_BONE_BYTE_LENGTH = 69 * 48;

module.exports = { CewgResourceBinder };
