// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/EveSmartLightColorShareGroup.h
// Hand-maintained from Carbon source, promoted out of generated intake.
import { meta } from "utils";
import { vec3, vec4 } from "math";
// TODO(port): EveEntity does not exist yet in ccpwgl (src/eve/EveEntity.js).
// Kept as the faithful base class from runtime-trinity - it supplies the
// registry surface this class calls (IsInRegistry/ReRegister/
// GetComponentRegistry/RegisterComponents/UnRegisterComponents), which is
// unresolved until EveEntity is ported.
import { EveEntity } from "../EveEntity.js";
import { resolveGroupColor } from "./EveSmartLightBaseGroup.js";
import { PlacementDataWithIdentifier } from "../PlacementDataWithIdentifier.js";

/** A smart-light group that computes one shared faction-aware colour, applies it to its child light groups, and fans out their per-frame updates. */
@meta.type("EveSmartLightColorShareGroup")
@meta.ccp.define("EveSmartLightColorShareGroup")
export class EveSmartLightColorShareGroup extends EveEntity
{

    /** m_display (bool) [READWRITE, PERSIST, NOTIFY] */
    @meta.boolean
    display = true;

    /** m_name (std::string) [READWRITE, PERSIST] */
    @meta.string
    name = "";

    /** m_lightGroups (PIEveSmartLightGroupVector) [READ, PERSIST, NOTIFY] */
    @meta.list("IEveSmartLightGroup")
    lightGroups = [];

    // Flattened EveSmartLightBaseGroup secondary base (Carbon multiple
    // inheritance; EveSmartLightBaseGroup_Blue.cpp:15-20 - the wire format of
    // this class carries these fields).

    /** m_selectedColor (int32_t) [READWRITE, PERSIST, NOTIFY, ENUM] (EveSmartLightBaseGroup.h:31) */
    @meta.int32
    factionColor = -1;

    /** m_useFactionColor (bool) [READWRITE, PERSIST] (EveSmartLightBaseGroup.h:32) */
    @meta.boolean
    useFactionColor = false;

    /** m_attributeModifiers (PIEveSmartLightGroupAttributeModifierVector) [READ, PERSIST] (EveSmartLightBaseGroup.h:29) */
    @meta.list("IEveSmartLightGroupAttributeModifier")
    attributeModifiers = [];

    /** m_color (Color) [READWRITE, PERSIST] (EveSmartLightBaseGroup.h:30) */
    @meta.color
    customColor = vec4.createLinear();

    /** m_parentColorSet (const Color*) - inherited faction color set, never persisted. */
    _parentColorSet = null;

    /** Scratch for a resolved faction colour; read immediately, never retained. */
    _resolvedGroupColor = vec4.create();

    /** Last `display` value the settle hook applied (JS-only change detection). */
    _lastAppliedDisplay = true;

    /**
     * Faction-aware group color (Carbon base EveSmartLightBaseGroup.cpp:43-53).
     *
     * Carbon inherits EveSmartLightBaseGroup; JS single inheritance flattens
     * the base-group surface through the shared resolveGroupColor helper.
     */
    GetGroupColor()
    {
        return resolveGroupColor(this.customColor, this.useFactionColor, this.factionColor, this._parentColorSet, this._resolvedGroupColor);
    }

    /**
     * Overwrites the custom color (Carbon base EveSmartLightBaseGroup.cpp:55-58).
     *
     * Carbon inherits EveSmartLightBaseGroup; JS single inheritance flattens
     * the base-group surface.
     */
    SetColor(color)
    {
        vec4.copy(this.customColor, color);
    }

    /**
     * display edits re-register the shared groups (EveSmartLightColorShareGroup.cpp:17-24).
     *
     * The settle hook receives no changed-property list; the display edit is
     * detected by comparing the cached last-applied value.
     */
    OnModified(_options = {})
    {
        if (this.display !== this._lastAppliedDisplay)
        {
            this._lastAppliedDisplay = this.display;
            this.ReRegister();
        }
        return true;
    }

    /**
     * Inserted attribute modifiers and light groups inherit the current color
     * set; inserted light groups register while this entity is registered
     * (EveSmartLightColorShareGroup.cpp:26-82).
     *
     * List events carry no BELIST insert/remove mask; inserted values (or,
     * absent one, the whole list) are re-fanned idempotently, and registry
     * wiring re-registers this entity rather than the individual group.
     */
    OnListModified(_event, _key, _key2, value, list)
    {
        if (this._parentColorSet && (list === this.attributeModifiers || list === this.lightGroups))
        {
            if (value)
            {
                value.SetInheritProperties?.(this._parentColorSet);
            }
            else
            {
                for (const entry of list)
                {
                    entry?.SetInheritProperties?.(this._parentColorSet);
                }
            }
        }

        if (list === this.lightGroups && this.IsInRegistry())
        {
            this.ReRegister();
        }
    }

    /** Registers the shared groups while displayed (EveSmartLightColorShareGroup.cpp:84-97). */
    RegisterComponents()
    {
        const registry = this.GetComponentRegistry();
        if (registry && this.display)
        {
            for (const group of this.lightGroups)
            {
                group?.Register?.(registry);
            }
        }
    }

    /** Unregisters the shared groups (EveSmartLightColorShareGroup.cpp:99-112). */
    UnRegisterComponents()
    {
        const registry = this.GetComponentRegistry();
        if (registry)
        {
            for (const group of this.lightGroups)
            {
                group?.UnRegister?.(registry);
            }
        }
    }

    /** Quad fan-out, gated on display (EveSmartLightColorShareGroup.cpp:114-125). */
    AddQuadsToQuadRenderer(placements, size, frustum, quadRenderer)
    {
        if (!this.display)
        {
            return;
        }

        for (const group of this.lightGroups)
        {
            group?.AddQuadsToQuadRenderer?.(placements, size, frustum, quadRenderer);
        }
    }

    /** Renderable fan-out, gated on display (EveSmartLightColorShareGroup.cpp:127-138). */
    GetRenderables(renderables = [])
    {
        if (!this.display)
        {
            return renderables;
        }

        for (const group of this.lightGroups)
        {
            group?.GetRenderables?.(renderables);
        }
        return renderables;
    }

    /**
     * Batch fan-out to the shared groups.
     *
     * ccpwgl's counterpart to Carbon's GetRenderables/AddQuadsToQuadRenderer
     * split - it has one batch accumulator, so members accumulate directly.
     * Without this a group nested under a colour-share group is collected by
     * nothing and silently never draws, which is exactly the shape smart light
     * sets ship in (EveChildSmartLightSet > ColorShareGroup > mesh/quad).
     *
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @param {IEveDistributionMethod} distribution
     * @returns {Boolean} true if any batch was accumulated
     */
    GetBatches(mode, accumulator, perObjectData, distribution)
    {
        if (!this.display) return false;

        let accumulated = false;

        for (const group of this.lightGroups)
        {
            if (group?.GetBatches?.(mode, accumulator, perObjectData, distribution))
            {
                accumulated = true;
            }
        }

        return accumulated;
    }

    /**
     * Updates the shared groups, then the group's own attribute modifiers with
     * full strength (EveSmartLightColorShareGroup.cpp:140-151).
     */
    UpdateSyncronous(updateContext, params, distribution)
    {
        for (const group of this.lightGroups)
        {
            group?.UpdateSyncronous?.(updateContext, params, distribution);
        }

        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.UpdateSyncronous?.(updateContext, params, 1);
        }
    }

    /**
     * Runs the shared attribute modifiers once over the group color (default
     * placement key, up direction), then pushes the shared color into every
     * child group before their asynchronous update
     * (EveSmartLightColorShareGroup.cpp:153-168).
     */
    UpdateAsyncronous(updateContext, params, distribution)
    {
        const statics = EveSmartLightColorShareGroup;
        const groupColor = this.GetGroupColor();
        const colorValues = statics._colorValues;
        vec3.set(colorValues, groupColor[0], groupColor[1], groupColor[2]);

        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.ProcessAttributeModifier?.(
                colorValues,
                statics._defaultPlacement,
                statics._defaultPlacement.initialTranslation,
                statics._up,
                params?.activationStrength ?? 1
            );
        }
        const sharedColor = statics._sharedColor;
        vec4.set(sharedColor, colorValues[0], colorValues[1], colorValues[2], this.customColor[3]);

        for (const group of this.lightGroups)
        {
            group?.SetColor?.(sharedColor);
            group?.UpdateAsyncronous?.(updateContext, params, distribution);
        }
    }

    /**
     * Fans a controller variable to the group's own modifiers, then to the
     * shared groups (EveSmartLightColorShareGroup.cpp:170-178).
     */
    SetControllerVariable(name, value)
    {
        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.SetControllerVariable?.(name, value);
        }

        for (const group of this.lightGroups)
        {
            group?.SetControllerVariable?.(name, value);
        }
    }

    /**
     * Stores the inherited color set and fans it out to the modifiers and shared
     * groups; a null set is ignored entirely
     * (EveSmartLightColorShareGroup.cpp:180-190).
     */
    SetInheritProperties(colorSet)
    {
        if (colorSet)
        {
            this._parentColorSet = colorSet;
            for (const attributeModifier of this.attributeModifiers)
            {
                attributeModifier?.SetInheritProperties?.(colorSet);
            }
            for (const group of this.lightGroups)
            {
                group?.SetInheritProperties?.(colorSet);
            }
        }
    }

    /** Effect-registration fan-out (EveSmartLightColorShareGroup.cpp:192-198). */
    RegisterWithQuadRenderer(quadRenderer)
    {
        for (const group of this.lightGroups)
        {
            group?.RegisterWithQuadRenderer?.(quadRenderer);
        }
    }

    /**
     * Carbon method RenderDebugInfo (EveSmartLightColorShareGroup.cpp:200-211).
     * RenderDebugInfo is deliberately unported org-wide.
     */
    RenderDebugInfo(..._args)
    {
        throw new Error("EveSmartLightColorShareGroup.RenderDebugInfo is not implemented in ccpwgl.");
    }

    /** Visibility fan-out (EveSmartLightColorShareGroup.cpp:213-219). */
    UpdateVisibility(updateContext, parentTransform, parentLod)
    {
        for (const group of this.lightGroups)
        {
            group?.UpdateVisibility?.(updateContext, parentTransform, parentLod);
        }
    }

    // s_PlacementDataWithIdentifierDefaultKey (EveSmartLightColorShareGroup.cpp:7).
    static _defaultPlacement = new PlacementDataWithIdentifier();

    static _up = vec3.fromValues(0, 1, 0);

    static _colorValues = vec3.create();

    static _sharedColor = vec4.create();

}
