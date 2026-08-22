// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/EveSmartLightMesh.h
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/EveSmartLightMesh.cpp
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/EveSmartLightMesh_Blue.cpp
//
// The mesh half of smart light geometry: an instanced mesh driven from the
// distribution's placement list, tinted by the group colour.
//
// This class has no upstream port - the org's runtime-trinity has the rest of
// `eve/smartLights/**` but not this one - so it is a direct Carbon transcription
// rather than a transcription of a transcription.
//
// PARTIAL, DELIBERATELY. Carbon's `EveSmartLightMesh` privately inherits
// `EveChildInstanceMeshRenderer` and does its real work by calling that base:
// `ConfigureInstanceData`, `UpdateGeometryResource`, `UpdateBoundingSphere`.
// ccpwgl's `EveChildInstanceMeshRenderer` is still a stub - `@meta.notImplemented`,
// with empty `Update` and `GetBatches` - so this class HYDRATES CORRECTLY AND
// DOES NOT DRAW YET.
//
// That is on purpose and it is not a no-op. Before this existed the reader hit
// "Binary object type not found (EveSmartLightMesh)" and the ENTIRE .black
// failed - so `amarr_primaryspotlight_01a` and everything like it loaded
// nothing at all, not merely no smart lights. Hydrating is what makes the rest
// of the file load again, and it is the prerequisite for the instanced renderer
// rather than a substitute for it.
import { meta } from "utils";
import { vec4 } from "math";
import { EveChildInstanceMeshRenderer } from "unsupported/eve/child/EveChildInstanceMeshRenderer";
import { resolveGroupColor } from "./EveSmartLightBaseGroup";


/** A smart-light group member that instances a mesh at each distribution placement and tints it with the faction-aware group colour. */
@meta.type("EveSmartLightMesh")
@meta.ccp.define("EveSmartLightMesh")
export class EveSmartLightMesh extends EveChildInstanceMeshRenderer
{

    /**
     * m_castShadow (bool) [READWRITE, PERSIST].
     *
     * Declared here despite the base carrying `castShadow`: Carbon maps this
     * member under the wire name "castShadowS" for this class
     * (EveSmartLightMesh_Blue.cpp), and the black reader matches on the wire
     * name, so without the plural the property is unknown and the read throws.
     */
    @meta.boolean
    castShadows = false;

    /**
     * m_shaderParamColorName (BlueSharedString) [READWRITE, PERSIST].
     * When empty - the common case - Carbon's SetMeshColorParameter returns
     * immediately and the mesh is never tinted at all.
     */
    @meta.string
    shaderParamColorName = "";

    /** m_currentScreenSize (float) [READ] - runtime readout, never persisted. */
    @meta.float
    currentScreenSize = 0;

    // Flattened EveSmartLightBaseGroup secondary base. Carbon multiple-inherits
    // it publicly here (EveSmartLightMesh.h:12-14) and maps its fields into this
    // class's own exposure rather than chaining, so they are part of this wire
    // format directly.

    /** m_selectedColor (int32_t) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.int32
    factionColor = -1;

    /** m_useFactionColor (bool) [READWRITE, PERSIST] */
    @meta.boolean
    useFactionColor = false;

    /** m_attributeModifiers (PIEveSmartLightGroupAttributeModifierVector) [READ, PERSIST] */
    @meta.list("IEveSmartLightGroupAttributeModifier")
    attributeModifiers = [];

    /** m_color (Color) [READWRITE, PERSIST] */
    @meta.color
    customColor = vec4.createLinear();

    /** m_parentColorSet (const Color*) - inherited faction color set, never persisted. */
    _parentColorSet = null;

    /** m_lastEntityCount - placement count the geometry was last built for. */
    _lastEntityCount = 0;

    /** m_lastAreaColor (Color) - Carbon seeds this BLACK, not to the group colour. */
    _lastAreaColor = vec4.fromValues(0, 0, 0, 1);

    /** m_activationStrength - captured from the update params. */
    _activationStrength = 1;

    /** Faction-aware group color (EveSmartLightBaseGroup.cpp:43-53). */
    GetGroupColor()
    {
        return resolveGroupColor(this.customColor, this.useFactionColor, this.factionColor, this._parentColorSet);
    }

    /** Overwrites the custom color (EveSmartLightBaseGroup.cpp:55-58). */
    SetColor(color)
    {
        vec4.copy(this.customColor, color);
    }

    /** Stores the inherited faction color set and fans it out (EveSmartLightBaseGroup.cpp:30-41). */
    SetInheritProperties(colorSet)
    {
        if (colorSet)
        {
            this._parentColorSet = colorSet;
        }

        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.SetInheritProperties?.(colorSet);
        }
    }

    /** Fans a controller variable out to the attribute modifiers (EveSmartLightBaseGroup.cpp:60-66). */
    SetControllerVariable(name, value)
    {
        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.SetControllerVariable?.(name, value);
        }
    }

    /**
     * Newly inserted attribute modifiers inherit the parent color set
     * (EveSmartLightBaseGroup.cpp:16-28).
     */
    OnListModified(_event, _key, _key2, value, list)
    {
        if (list === this.attributeModifiers && this._parentColorSet)
        {
            if (value)
            {
                value.SetInheritProperties?.(this._parentColorSet);
            }
            else
            {
                for (const attributeModifier of this.attributeModifiers)
                {
                    attributeModifier?.SetInheritProperties?.(this._parentColorSet);
                }
            }
        }
    }

    /** How many placements the geometry currently covers (EveSmartLightMesh.cpp:16-19). */
    GetNumberOfEntities()
    {
        return this._lastEntityCount;
    }

    /**
     * Tracks the placement count and the tint (EveSmartLightMesh.cpp:21-77).
     *
     * The geometry rebuild Carbon does here - ConfigureInstanceData,
     * UpdateGeometryResource, UpdateBoundingSphere - has no counterpart until
     * ccpwgl's EveChildInstanceMeshRenderer is implemented, so this keeps the
     * bookkeeping those calls are gated on and stops there.
     *
     * Note Carbon feeds the attribute modifiers from the FIRST placement only,
     * with the comment "we can't set the shader params per instance" - the
     * whole instanced batch shares one colour. That is why this is one tint and
     * not a per-placement loop.
     */
    UpdateSyncronous(_updateContext, params, distribution)
    {
        this._activationStrength = params && params.activationStrength !== undefined
            ? params.activationStrength
            : 1;

        if (!distribution || !this.display) return;

        const count = Number(distribution.GetNumberOfPlacements?.() ?? 0);
        this._lastEntityCount = count;
        if (!count) return;

        const
            groupColor = this.GetGroupColor(),
            color = EveSmartLightMesh._color;

        vec4.set(
            color,
            groupColor[0] * this._activationStrength,
            groupColor[1] * this._activationStrength,
            groupColor[2] * this._activationStrength,
            groupColor[3] * this._activationStrength
        );

        this.SetMeshColorParameter(color);
    }

    /**
     * Pushes the colour into the named parameter on every mesh area's effect
     * (EveSmartLightMesh.cpp:79-134).
     *
     * Carbon's chain of early returns is kept whole: an empty parameter name, a
     * hidden mesh, an unchanged colour, or a mesh whose geometry has not loaded
     * all mean "do nothing", and an empty name is the common case.
     *
     * @param {vec4} color
     */
    SetMeshColorParameter(color)
    {
        if (!this.shaderParamColorName) return;
        if (!this.display) return;
        if (vec4.equals(this._lastAreaColor, color)) return;
        if (!this.mesh) return;
        if (!this.mesh.IsGood?.()) return;
        if (this.mesh.display === false) return;

        // Carbon calls `GetAllAreas()`; ccpwgl has no such method - a mesh holds
        // one list per render mode, so "all areas" is their concatenation.
        for (const listName of EveSmartLightMesh.AREA_LISTS)
        {
            const areas = this.mesh[listName];
            if (!areas) continue;

            for (let i = 0; i < areas.length; i++)
            {
                areas[i]?.effect?.SetParameter?.(this.shaderParamColorName, color);
            }
        }

        vec4.copy(this._lastAreaColor, color);
    }

    /** No asynchronous work of its own (EveSmartLightMesh.cpp:136-139). */
    UpdateAsyncronous(_updateContext, _params, _distribution)
    {
    }

    /** The mesh area lists that together stand in for Carbon's GetAllAreas(). */
    static AREA_LISTS = Object.freeze([
        "transparentAreas",
        "pickableAreas",
        "opaqueAreas",
        "distortionAreas",
        "depthAreas",
        "additiveAreas",
        "opaquePrepassAreas",
        "depthNormalAreas"
    ]);

    static _color = vec4.create();

}
