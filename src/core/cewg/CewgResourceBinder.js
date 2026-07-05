const { CewgLightList } = require("./CewgLightList");
const CewgCarbonData = require("./CewgCarbonData");

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

        // Post-fx buffer textures by register index
        this._bufferTextureSources = {};
        this._zeroFloatTexture = null;

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
     */
    ApplyConstants(program, device)
    {
        const gl = this.gl;
        const cbh = program.constantBufferHandles;

        if (cbh[1] && device.perFrameVSData)
        {
            gl.uniform4fv(cbh[1], CewgCarbonData.PackPerFrameVS(this._perFrameVS, device.perFrameVSData.data));
        }
        if (cbh[2] && device.perFramePSData)
        {
            gl.uniform4fv(cbh[2], CewgCarbonData.PackPerFramePS(this._perFramePS, device.perFramePSData.data));
        }

        const pod = device.perObjectData;
        if (!pod) return;

        const vsData = pod.vs ? pod.vs.data
            : (this._zeroObjectVS || (this._zeroObjectVS = new Float32Array(12 * 4)));

        if (cbh[3] && pod.vs)
        {
            gl.uniform4fv(cbh[3], CewgCarbonData.PackPerObjectVS(this._perObjectVS, pod.vs.data));
        }
        if (cbh[4] && pod.ps)
        {
            gl.uniform4fv(cbh[4], CewgCarbonData.PackPerObjectPS(this._perObjectPS, vsData, pod.ps.data));
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
                    if (!lightTexturesReady)
                    {
                        this._UpdateLightTextures(device);
                        lightTexturesReady = true;
                    }
                    this._BindLightTexture(entry);
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

/** Bone UBO size when a block reports no capacity (69 joints x 48 bytes) */
CewgResourceBinder.DEFAULT_BONE_BYTE_LENGTH = 69 * 48;

module.exports = { CewgResourceBinder };
