import { GLESPerObjectData } from "core";


/**
 * Carbon's shared EveChildSpherePin per-object payload. The same ten registers
 * are bound unchanged to VS and PS: one world matrix followed by six vectors.
 */
export class EveChildSpherePinPerObjectData extends GLESPerObjectData
{

    constructor(opt)
    {
        super(EveChildSpherePinPerObjectData.layout, opt);
        this.carbonPerObjectPacker = EveChildSpherePinPerObjectData.carbonPerObjectPacker;
    }

    /**
     * Copies the pin values into both stages' shared layout.
     * @param {Object} pinData
     * @returns {EveChildSpherePinPerObjectData}
     */
    Pack(pinData)
    {
        for (const rawData of [ this.vs, this.ps ])
        {
            rawData.Set("WorldMat", pinData.worldTransformTranspose);
            rawData.Set("PinPosition", pinData.pinPosition);
            rawData.Set("PinRotation", pinData.pinRotation);
            rawData.Set("PinColor", pinData.pinColor);
            rawData.Set("PinThreshold", pinData.pinThreshold);
            rawData.Set("PinRadiusPrecalc", pinData.pinRadiusPrecalc);
            rawData.Set("PinUV", pinData.pinUV);
        }
        return this;
    }

    /** Shared ten-register field run used verbatim by both shader stages. */
    static sharedLayout = Object.freeze([
        [ "WorldMat", 16 ],
        [ "PinPosition", 4 ],
        [ "PinRotation", 4 ],
        [ "PinColor", 4 ],
        [ "PinThreshold", 4 ],
        [ "PinRadiusPrecalc", 4 ],
        [ "PinUV", 4 ]
    ]);

    static layout = Object.freeze({
        vs: EveChildSpherePinPerObjectData.sharedLayout,
        ps: EveChildSpherePinPerObjectData.sharedLayout
    });

    /** Carbon binds the same payload bytes directly to cb3 and cb4. */
    static carbonPerObjectPacker = {
        OnBeforeCarbonConstants(context)
        {
            context.carbonPerObjectPacker = this;
        },

        PackPerObjectVS(out, perObjectData)
        {
            return EveChildSpherePinPerObjectData.CopyStage(out, perObjectData.vs);
        },

        PackPerObjectPS(out, perObjectData)
        {
            return EveChildSpherePinPerObjectData.CopyStage(out, perObjectData.ps);
        }
    };

    static CopyStage(out, rawData)
    {
        out.fill(0);
        if (rawData) out.set(rawData.data.subarray(0, Math.min(rawData.data.length, out.length)));
        return out;
    }
}
