import { meta, toArray, assignIfExists } from "utils";
import { Tw2Effect } from "core";
import { Tw2CurveSet } from "curve";
import { CollectOverlayAreaBlocks, EmitOverlayBatches } from "./overlayBatches";
import {
    RM_OPAQUE,
    RM_TRANSPARENT,
    RM_ADDITIVE,
    RM_DECAL,
    RM_DISTORTION
} from "constant";


@meta.define("EveMeshOverlayEffect", true)
export class EveMeshOverlayEffect extends meta.Model
{

    /** Carbon EveMeshOverlayEffect::SetShaderOption ignores render visibility. */
    SetShaderOption(name, value)
    {
        for (const effects of [
            this.opaqueEffects, this.decalEffects, this.transparentEffects,
            this.additiveEffects, this.distortionEffects
        ])
        {
            for (const effect of effects)
            {
                if (effect) effect.SetOption(name, value);
            }
        }
    }

    @meta.string
    name = "";

    @meta.list("Tw2Effect")
    additiveEffects = [];

    @meta.list("Tr2Controller")
    controllers = [];

    @meta.struct("Tw2CurveSet")
    curveSet = null;

    @meta.list("Tw2Effect")
    decalEffects = [];

    @meta.boolean
    display = true;

    @meta.list("Tw2Effect")
    distortionEffects = [];

    @meta.list("Tw2Effect")
    opaqueEffects = [];

    @meta.list("Tw2Effect")
    transparentEffects = [];

    @meta.boolean
    update = true;

    /** Overlay visibility follows the mesh it decorates. */
    isVisible = true;

    @meta.plain
    visible = {
        opaqueEffects: true,
        decalEffects: true,
        transparentEffects: true,
        additiveEffects: true,
        distortionEffects: true
    };

    /**
     * Per frame update
     * @param {number} dt - delta Time
     */
    Update(dt)
    {
        if (this.update && this.curveSet)
        {
            this.curveSet.UpdateDelta(dt);
            for (const controller of this.controllers)
            {
                controller?.Update?.(0.5);
            }
        }
    }

    Initialize()
    {
        for (const controller of this.controllers)
        {
            if (!controller?.IsLinked?.()) controller?.Link?.(this);
        }
        return true;
    }

    SetControllerVariable(name, value)
    {
        let handled = false;
        for (const controller of this.controllers)
        {
            if (controller?.SetVariable?.(name, value)) handled = true;
        }
        return handled;
    }

    HandleControllerEvent(name)
    {
        let handled = false;
        for (const controller of this.controllers)
        {
            if (controller?.HandleEvent?.(name)) handled = true;
        }
        return handled;
    }

    StartControllers()
    {
        for (const controller of this.controllers) controller?.Start?.();
    }

    PlayCurveSet(name, rangeName = "")
    {
        if (!this.curveSet || this.curveSet.GetName() !== name) return false;
        if (rangeName) this.curveSet.PlayTimeRange(rangeName);
        else
        {
            this.curveSet.ResetTimeRange();
            this.curveSet.Play();
        }
        return true;
    }

    StopCurveSet(name)
    {
        if (!this.curveSet || this.curveSet.GetName() !== name) return false;
        this.curveSet.Stop();
        return true;
    }

    GetCurveSetDuration(name)
    {
        return this.curveSet && this.curveSet.GetName() === name
            ? Math.max(0, this.curveSet.GetMaxCurveDuration())
            : 0;
    }

    GetRangeDuration(name, rangeName)
    {
        return this.curveSet && this.curveSet.GetName() === name
            ? Math.max(0, this.curveSet.GetRangeDuration(rangeName))
            : 0;
    }

    /** @param {EveUpdateContext} updateContext @param {Boolean} parentVisible */
    UpdateLod(updateContext, parentVisible)
    {
        this.isVisible = this.display && parentVisible;
    }

    /** Restores authored visibility. */
    ResetLod()
    {
        this.isVisible = true;
    }

    /** Mesh overlays own no independent dynamic lights in ccpwgl. */
    GetLights(collector, parentContext)
    {

    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {Tw2Mesh} mesh
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData, mesh)
    {
        if (!this.display || !this.isVisible || !mesh || !mesh.IsGood()) return false;
        perObjectData = perObjectData || accumulator.GetCurrentPerObjectData?.();
        if (!perObjectData) return false;

        return EmitOverlayBatches(
            accumulator,
            perObjectData,
            mode,
            [ this ],
            CollectOverlayAreaBlocks(mesh),
            mesh.geometryResource,
            mesh.meshIndex
        );
    }

    /**
     * Gets effects
     * @param {number} mode
     * @returns {Array.<Tw2Effect>}
     */
    GetEffects(mode)
    {
        if (this.display)
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

    GetType(mode)
    {
        return mode === RM_OPAQUE
            ? EveMeshOverlayEffect.OverlayType.TYPE_OPAQUEONLY
            : EveMeshOverlayEffect.OverlayType.TYPE_ALL;
    }

    HasTransparentArea()
    {
        return this.transparentEffects.length > 0;
    }

    /**
     * Creates an area's effects
     * @param {EveMeshOverlayEffect} dest
     * @param {*} src
     * @param {String|String[]} names
     */
    static createAreaEffects(dest, src, names)
    {
        names = toArray(names);
        for (let i = 0; i < names.length; i++)
        {
            const name = names[i];
            if (name in src && name in dest)
            {
                for (let i = 0; i < src[name].length; i++)
                {
                    dest[name].push(Tw2Effect.from(src[name][i]));
                }
            }
        }
    }

    /**
     * Creates a mesh from an object
     * @param {*} [values]
     * @param {*} [options]
     * @returns {EveMeshOverlayEffect}
     */
    static from(values, options)
    {
        const item = new EveMeshOverlayEffect();

        if (values)
        {
            assignIfExists(item, values, [ "name", "display", "update" ]);

            if (values.curveSet)
            {
                item.curveSet = Tw2CurveSet.from(values.curveSet);
            }

            const areas = [
                "additiveEffects", "distortionEffects", "opaqueEffects", "transparentEffects", "decalEffects"
            ];

            if (values.visible)
            {
                assignIfExists(item.visible, values.visible, areas);
            }

            this.createAreaEffects(item, values, areas);

        }

        if (!options || !options.skipUpdate)
        {
            // No Op
        }

        return item;
    }

    static OverlayType = Object.freeze({
        TYPE_OPAQUEONLY: 0,
        TYPE_ALL: 1,
        TYPE_COUNT: 2
    });

}
