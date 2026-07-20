const
    REGISTER_SIZE = 4,
    JOINT_FLOATS = 12,
    JOINT_REGISTERS = 3,
    POINT_LIGHT_REGISTERS = 6;


/**
 * Carbon/DX11 register layout used by skinned interior shaders.
 *
 * The joint palette is inline at the start of cb3. The generic CEWG worker can
 * also consume the same view as palette register sb0 without another copy.
 */
export const CEWG_INTERIOR_LAYOUT = Object.freeze({
    maxJoints: 69,
    jointFloats: 69 * JOINT_FLOATS,
    jointRegisters: 69 * JOINT_REGISTERS,
    cb3Registers: 212,
    cb4Registers: 79,
    worldRegister: 207,
    uvLinearTransformRegister: 211,
    lightCountRegister: 0,
    pointLightsRegister: 1,
    maxPointLights: 10,
    shadowCaster0Register: 61,
    shadowCaster1Register: 62,
    spotLightsRegister: 63,
    spotLightMatrices: 4
});


/**
 * Packed character/interior data for converted DX11 shaders.
 */
export class CewgInteriorPerObjectData
{
    constructor()
    {
        const layout = CEWG_INTERIOR_LAYOUT;

        this.cb3 = new Float32Array(layout.cb3Registers * REGISTER_SIZE);
        this.cb4 = new Float32Array(layout.cb4Registers * REGISTER_SIZE);
        this.cb4Int = new Int32Array(this.cb4.buffer);
        this.jointMatrices = this.cb3.subarray(0, layout.jointFloats);
        this.jointCount = 0;

        this.constantBuffers = { cb3: this.cb3, cb4: this.cb4 };
        this.jointPalette = {
            name: "JointMat",
            kind: "structuredUbo",
            semantic: "jointMatrices",
            register: 0,
            registerIndex: 0,
            data: this.jointMatrices,
            count: 0,
            capacityElements: layout.maxJoints,
            strideFloats: JOINT_FLOATS,
            strideBytes: JOINT_FLOATS * Float32Array.BYTES_PER_ELEMENT
        };
        this.palettes = [ this.jointPalette ];
        this.workerData = {
            constantBuffers: this.constantBuffers,
            palettes: this.palettes
        };
    }

    /**
     * Packs a semantic interior data bag into Carbon's converted registers.
     * @param {Object} bag
     * @returns {CewgInteriorPerObjectData}
     */
    Pack(bag = {})
    {
        const layout = CEWG_INTERIOR_LAYOUT;

        this.cb3.fill(0);
        fillIdentityJoints(this.jointMatrices);
        this.jointCount = copyJointMatrices(this.jointMatrices, bag.jointMatrices);
        this.jointPalette.count = this.jointCount;

        copy(this.cb3, layout.worldRegister * REGISTER_SIZE, bag.worldTransform, IDENTITY_MAT4, 16);
        copy(
            this.cb3,
            layout.uvLinearTransformRegister * REGISTER_SIZE,
            bag.uvLinearTransform,
            IDENTITY_UV,
            REGISTER_SIZE
        );

        this.cb4.fill(0);
        const lights = bag.pointLights || bag.interiorLights || EMPTY;
        const lightCount = Math.min(lights.length || 0, layout.maxPointLights);
        this.cb4Int[layout.lightCountRegister * REGISTER_SIZE] = lightCount;

        for (let i = 0; i < lightCount; i++)
        {
            const light = lights[i] && lights[i].PopulateLightData
                ? lights[i].PopulateLightData()
                : lights[i];
            packLight(this.cb4, layout.pointLightsRegister + i * POINT_LIGHT_REGISTERS, light);
        }

        copy(this.cb4, layout.shadowCaster0Register * REGISTER_SIZE, bag.shadowCaster0, null, REGISTER_SIZE);
        copy(this.cb4, layout.shadowCaster1Register * REGISTER_SIZE, bag.shadowCaster1, null, REGISTER_SIZE);

        const spotLights = bag.spotLightMatrices || bag.spotLights || bag.spotLightData;
        copyMatrices(
            this.cb4,
            layout.spotLightsRegister * REGISTER_SIZE,
            spotLights,
            layout.spotLightMatrices * 16
        );

        return this;
    }

    /** Standard converted-constant adapter contract. */
    GetConstantBuffers()
    {
        return this.constantBuffers;
    }

    /** Palette contract used by the generic CEWG worker. */
    GetPalettes()
    {
        return this.palettes;
    }

    GetPaletteData()
    {
        return this.jointPalette;
    }

    GetJointMatrices()
    {
        return this.jointMatrices;
    }

    /** Combined worker payload for workers which resolve constants and palettes together. */
    GetCewgData()
    {
        return this.workerData;
    }

    static Pack(bag, out = new this())
    {
        return out.Pack(bag);
    }
}


/**
 * Resolves the CEWG snapshot attached to an interior POD. This implements the
 * same GetConstantBuffers hook used by converted-effect workers while exposing
 * the palette alongside it for CEWG workers.
 */
export class CewgInteriorPerObjectAdapter
{
    constructor(source = null)
    {
        this.source = source;
    }

    GetData(perObjectData, context)
    {
        let source = perObjectData || this.source;
        if (typeof this.source === "function") source = this.source(perObjectData, context);
        if (source && source.cewgInteriorData) source = source.cewgInteriorData;
        return source && source.cb3 && source.cb4 ? source : null;
    }

    GetConstantBuffers(perObjectData, context)
    {
        const data = this.GetData(perObjectData, context);
        return data ? data.GetConstantBuffers() : null;
    }

    GetPalettes(perObjectData, context)
    {
        const data = this.GetData(perObjectData, context);
        return data ? data.GetPalettes() : null;
    }

    GetPaletteData(perObjectData, context)
    {
        const data = this.GetData(perObjectData, context);
        return data ? data.GetPaletteData() : null;
    }

    GetJointMatrices(perObjectData, context)
    {
        const data = this.GetData(perObjectData, context);
        return data ? data.GetJointMatrices() : null;
    }

    GetCewgData(perObjectData, context)
    {
        const data = this.GetData(perObjectData, context);
        return data ? data.GetCewgData() : null;
    }

    /**
     * Selects the interior constants and palette for the current CEWG draw.
     * @param {Object} context
     * @returns {Boolean} True when interior data was selected
     */
    OnBeforeCewgConstants(context)
    {
        const data = this.GetData(context && context.perObjectData, context);
        if (!data) return false;

        context.cewgPerObjectPacker = this;
        context.cewgJointMatrices = data.GetJointMatrices();
        context.cewgInteriorData = data.GetCewgData();
        return true;
    }

    /** Compact Carbon interior b1 is already the GLES interior VS order. */
    PackPerFrameVS(out, source)
    {
        out.fill(0);
        out.set(source.subarray(0, Math.min(out.length, source.length)));
        return out;
    }

    /**
     * Packs legacy interior PS data into Carbon's compact b2 layout. Legacy
     * carries SceneData.fogColor as four registers; Carbon carries one.
     */
    PackPerFramePS(out, source)
    {
        out.fill(0);
        copyRegisters(out, 0, source, 0, 5);
        copyRegisters(out, 5, source, 5, 1);
        copyRegisters(out, 6, source, 9, 4);
        copyRegisters(out, 10, source, 13, 10);
        return out;
    }

    /** Binder per-object VS packer contract. */
    PackPerObjectVS(out, perObjectData, device, program)
    {
        const buffers = this.GetConstantBuffers(perObjectData, { device, program });
        return buffers ? buffers.cb3 : out;
    }

    /** Binder per-object PS packer contract. */
    PackPerObjectPS(out, perObjectData, device, program)
    {
        const buffers = this.GetConstantBuffers(perObjectData, { device, program });
        return buffers ? buffers.cb4 : out;
    }

    OnAfterPerObjectData(context)
    {
        const data = this.GetCewgData(context && context.perObjectData, context);
        if (context) context.cewgInteriorData = data;
        return data;
    }
}

function copyRegisters(out, outRegister, source, sourceRegister, registerCount)
{
    const count = Math.min(registerCount * REGISTER_SIZE, source.length - sourceRegister * REGISTER_SIZE);
    if (count > 0)
    {
        const start = sourceRegister * REGISTER_SIZE;
        out.set(source.subarray(start, start + count), outRegister * REGISTER_SIZE);
    }
}


export function CreateCewgInteriorPerObjectAdapter(source)
{
    return new CewgInteriorPerObjectAdapter(source);
}


function copyJointMatrices(out, matrices)
{
    if (!matrices || !matrices.length) return 0;

    if (typeof matrices[0] === "number")
    {
        const count = Math.min(out.length, matrices.length);
        for (let i = 0; i < count; i++) out[i] = matrices[i];
        return Math.min(Math.floor(matrices.length / JOINT_FLOATS), CEWG_INTERIOR_LAYOUT.maxJoints);
    }

    const count = Math.min(matrices.length, CEWG_INTERIOR_LAYOUT.maxJoints);
    for (let i = 0; i < count; i++) copy(out, i * JOINT_FLOATS, matrices[i], null, JOINT_FLOATS);
    return count;
}


function fillIdentityJoints(out)
{
    for (let i = 0; i < out.length; i += JOINT_FLOATS)
    {
        out[i] = 1;
        out[i + 5] = 1;
        out[i + 10] = 1;
    }
}


function packLight(out, register, light = null)
{
    light = light || {};
    const
        offset = register * REGISTER_SIZE,
        position = light.position || light.translation,
        color = light.color,
        direction = light.spotDirection || light.direction;

    copy(out, offset, position, null, 3);
    out[offset + 3] = number(light.radius);
    copy(out, offset + 4, color, null, 3);
    out[offset + 7] = number(light.pointLightFalloff !== undefined ? light.pointLightFalloff : light.falloff);
    out[offset + 8] = number(light.shadow0Influence);
    out[offset + 9] = number(light.shadow1Influence);
    out[offset + 10] = number(light.coneCosAlphaOuter);
    out[offset + 11] = number(light.coneCosAlphaInner);
    copy(out, offset + 12, direction, null, 3);
    out[offset + 15] = number(light.unused2);
    copy(out, offset + 16, light.boxTransformRow3, null, REGISTER_SIZE);
    copy(out, offset + 20, light.boxTransformRow4, null, REGISTER_SIZE);
}


function copyMatrices(out, offset, matrices, maxFloats)
{
    if (!matrices || !matrices.length) return;
    if (typeof matrices[0] === "number")
    {
        copy(out, offset, matrices, null, maxFloats);
        return;
    }

    let written = 0;
    for (let i = 0; i < matrices.length && written < maxFloats; i++)
    {
        const count = Math.min(16, maxFloats - written);
        copy(out, offset + written, matrices[i], null, count);
        written += count;
    }
}


function copy(out, offset, value, fallback, count)
{
    value = value || fallback;
    if (!value) return;
    const length = Math.min(count, value.length || 0);
    for (let i = 0; i < length; i++) out[offset + i] = value[i];
}


function number(value)
{
    value = Number(value);
    return Number.isFinite(value) ? value : 0;
}


const
    EMPTY = Object.freeze([]),
    IDENTITY_UV = Object.freeze([ 1, 1, 0, 0 ]),
    IDENTITY_MAT4 = Object.freeze([ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]);
