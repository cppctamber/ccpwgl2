import {Tw2GeometryBatch} from "../../core";
import {util, Tw2BaseClass, RM_OPAQUE, RM_TRANSPARENT, RM_ADDITIVE, RM_DECAL, RM_DISTORTION} from "../../global";


/**
 * Constructor for Overlay Effects
 * TODO: Implement "distortionEffects"
 * TODO: Identify if "decalEffects" is deprecated
 *
 * @property {Array.<Tw2Effect>} additiveEffects    - Additive overlay effects
 * @property {Tw2CurveSet} curveSet                 - Animation curve set
 * @property {Boolean} display                      - Enables/ disables all batch accumulations
 * @property {Array.<Tw2Effect>} decalEffects       - Decal overlay effects (Is this deprecated?)
 * @property {Array.<Tw2Effect>} distortionEffects  - Distortion effects (Currently not supported)
 * @property {Array.<Tw2Effect>} opaqueEffects      - Opaque overlay effects
 * @property {Array.<Tw2Effect>} transparentEffects - Transparent overlay effects
 * @property {Boolean} update                       - Enabled updating
 * @property {{}} visible                           - Batch accumulation options for the overlay effect
 * @property {Boolean} visible.opaqueEffects        - Enables/ disables opaque effect batch accumulation
 * @property {Boolean} visible.decalEffects         - Enables/ disables decal effect batch accumulation
 * @property {Boolean} visible.transparentEffects   - Enables/ disables transparent effect batch accumulation
 * @property {Boolean} visible.additiveEffects      - Enables/ disables additive effect batch accumulation
 * @property {Boolean} visible.distortionEffects    - Currently not supported
 */
export class EveMeshOverlayEffect extends Tw2BaseClass
{
    // ccp
    additiveEffects = [];
    curveSet = null;
    distortionEffects = [];
    opaqueEffects = [];
    transparentEffects = [];

    // ccpwgl
    decalEffects = [];
    display = true;
    update = true;
    visible = {
        opaqueEffects: true,
        decalEffects: true,
        transparentEffects: true,
        additiveEffects: true,
        distortionEffects: true
    };


    /**
     * Gets the mesh overlay's resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        util.perArrayChild(this.opaqueEffects, "GetResources", out);
        util.perArrayChild(this.decalEffects, "GetResources", out);
        util.perArrayChild(this.transparentEffects, "GetResources", out);
        util.perArrayChild(this.additiveEffects, "GetResources", out);
        util.perArrayChild(this.distortionEffects, "GetResources", out);
        return out;
    }

    /**
     * Per frame update
     * @param {number} dt - delta Time
     */
    Update(dt)
    {
        if (this.update && this.curveSet) this.curveSet.Update(dt);
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {Tw2Mesh} mesh
     */
    GetBatches(mode, accumulator, perObjectData, mesh)
    {
        if (!this.display || !mesh || !mesh.IsGood()) return;

        const effects = this.GetEffects(mode);
        for (let i = 0; i < effects.length; i++)
        {
            const batch = new Tw2GeometryBatch();
            batch.renderMode = mode;
            batch.perObjectData = perObjectData;
            batch.geometryRes = mesh.geometryResource;
            batch.meshIx = mesh.meshIndex;
            batch.start = 0;
            batch.count = mesh.geometryResource.meshes[mesh.meshIndex].areas.length;
            batch.effect = effects[i];
            accumulator.Commit(batch);
        }
    }

    /**
     * Gets effects
     * @param {number} mode
     * @returns {Array.<Tw2Effect>}
     */
    GetEffects(mode)
    {
        if (!this.display)
        {
            switch (mode)
            {
                case RM_OPAQUE:
                    if (this.visible.opaqueEffects) return this.opaqueEffects;
                    break;

                case RM_TRANSPARENT:
                    if (this.visible.transparentEffects) return this.transparentEffects;
                    break;

                case RM_ADDITIVE:
                    if (this.visible.additiveEffects) return this.additiveEffects;
                    break;

                case RM_DECAL:
                    if (this.visible.decalEffects) return this.decalEffects;
                    break;

                case RM_DISTORTION:
                    if (this.visible.distortionEffects) return this.distortionEffects;
            }
        }
        return [];
    }

}

Tw2BaseClass.define(EveMeshOverlayEffect, Type =>
{
    return {
        type: "EveMeshOverlayEffect",
        props: {
            additiveEffects: [["Tr2Effect"]],
            curveSet: ["TriCurveSet"],
            distortionEffects: [["Tr2Effect"]],
            display: Type.BOOLEAN,
            opaqueEffects: [["Tr2Effect"]],
            transparentEffects: [["Tr2Effect"]],
            update: Type.BOOLEAN,
            visible: Type.PLAIN
        },
        watch: [
            "decalEffects"
        ],
        notImplemented: [
            "distortionEffects"
        ]
    };
});

