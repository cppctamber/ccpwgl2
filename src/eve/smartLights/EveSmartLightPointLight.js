// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/EveSmartLightPointLight.h
// Hand-maintained from Carbon source, promoted out of generated intake.
import { meta } from "utils";
import { mat4, quat, vec3, vec4 } from "math";
// TODO(port): EveEntity does not exist yet in ccpwgl (src/eve/EveEntity.js).
// Kept as the faithful base class from runtime-trinity - it supplies the
// registry surface this class calls (GetComponentRegistry), which is
// unresolved until EveEntity is ported.
import { EveEntity } from "../EveEntity.js";
import { resolveGroupColor } from "./EveSmartLightBaseGroup.js";
// TODO(port): ccpwgl has no shared Tr2Light base (see the doc comment on
// src/core/lighting/Tr2PointLight.js - "ccpwgl has no shared Tr2Light base
// class file"). Kept as the faithful import path for the POINT_LIGHT/
// SPOT_LIGHT type constants; unresolved until a shared Tr2Light module (or
// equivalent enum) is ported.
import { Tr2Light } from "../lights/Tr2Light.js";
// TODO(port): EveComponentTypes.js does not exist yet in ccpwgl.
import { EveComponentType } from "../EveComponentTypes.js";
// TODO(port): CjsLightData.js (the flattened light-data compat view +
// SetValues helpers) does not exist yet in ccpwgl.
import {
    createCjsLightDataView,
    setCjsLightDataOwnerValues
} from "../lights/CjsLightData.js";

/** A smart-light group member that places faction-colour-aware point or spot lights at each distribution placement and submits them to the light manager. */
@meta.type("EveSmartLightPointLight")
@meta.ccp.define("EveSmartLightPointLight")
export class EveSmartLightPointLight extends EveEntity
{
    /** m_lightGroupData.flags (uint16_t) [READWRITE, PERSIST] */
    @meta.uint
    flags = 1;

    /** m_lightGroupData.innerRadius (float) [READWRITE, PERSIST] */
    @meta.float
    innerRadius = 0;

    /** m_lightGroupData.brightness (float) [READWRITE, PERSIST] */
    @meta.float
    brightness = 1;

    /** m_lightGroupData.radius (float) [READWRITE, PERSIST] */
    @meta.float
    radius = 0;

    /** m_lightProfile (Tr2LightProfileResPtr) [READ] */
    @meta.struct("Tr2LightProfileRes")
    lightProfile = null;

    /** m_name (std::string) [READWRITE, PERSIST] */
    @meta.string
    name = "";

    /** m_display (bool) [READWRITE, PERSIST] */
    @meta.boolean
    display = true;

    /** m_lightProfilePath (std::wstring) [READWRITE, PERSIST, NOTIFY] */
    @meta.string
    lightProfilePath = "";

    /** m_staticOffsetTranslation (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    staticOffsetTranslation = vec3.create();

    /** m_staticOffsetRotation (Quaternion) [READWRITE, PERSIST] */
    @meta.quaternion
    staticOffsetRotation = quat.create();

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

    /** m_lightType (Tr2Light::LIGHT_TYPE) - POINT_LIGHT here, SPOT_LIGHT on the subclass (EveSmartLightPointLight.cpp:15). */
    lightType = Tr2Light.POINT_LIGHT;

    /** m_parentColorSet (const Color*) - inherited faction color set, never persisted. */
    _parentColorSet = null;

    /** Scratch for a resolved faction colour; read immediately, never retained. */
    _resolvedGroupColor = vec4.create();

    /** m_activationStrength (float) - captured from the update params (EveSmartLightPointLight.h:49). */
    _activationStrength = 1;

    /** m_worldTransform (Matrix) - captured from the update params (EveSmartLightPointLight.h:45). */
    _worldTransform = mat4.create();

    /** m_distribution (IEveDistributionMethodPtr) - captured from the update pass (EveSmartLightPointLight.h:52). */
    _distribution = null;

    /** Last lightProfilePath the settle hook applied (JS-only change detection). */
    _lastAppliedProfilePath = "";

    // Compat view over the flattened m_lightGroupData fields (2026-07-23
    // flatten decision); light-manager records and the pre-flatten hydration
    // shape keep reading a LightData-shaped object.
    _lightDataView = null;

    /**
     * A lazily built compatibility view over the flattened light-group fields,
     * shaped like the pre-flatten light-data object its readers still expect.
     */
    get lightData()
    {
        this._lightDataView ??= createCjsLightDataView(this, this.constructor.LightDataFields);
        return this._lightDataView;
    }

    /**
     * Routes light-data properties through the shared light-data setter and delegates everything else to the base entity.
     */
    SetValues(values = {}, options = {})
    {
        return setCjsLightDataOwnerValues(
            this,
            values,
            options,
            (ownerValues, ownerOptions) => super.SetValues(ownerValues, ownerOptions),
            this.constructor.LightDataFields
        );
    }

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
     * Stores the inherited faction color set and fans it out to the attribute
     * modifiers (Carbon base EveSmartLightBaseGroup.cpp:30-41).
     *
     * Carbon inherits EveSmartLightBaseGroup; JS single inheritance flattens
     * the base-group surface.
     */
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

    /**
     * Fans a controller variable out to the attribute modifiers (Carbon base EveSmartLightBaseGroup.cpp:60-66).
     *
     * Carbon inherits EveSmartLightBaseGroup; JS single inheritance flattens
     * the base-group surface.
     */
    SetControllerVariable(name, value)
    {
        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.SetControllerVariable?.(name, value);
        }
    }

    /**
     * Newly inserted attribute modifiers inherit the parent color set (Carbon
     * base EveSmartLightBaseGroup.cpp:16-28).
     *
     * List events carry no BELIST insert mask; the inserted value (or, absent
     * one, the whole list) is re-fanned - SetInheritProperties is idempotent.
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

    /**
     * Carbon resolves the light profile through BeResMan
     * (EveSmartLightPointLight.cpp:18-27); profile resolution belongs to the
     * resource adapter in ccpwgl.
     */
    Initialize()
    {
        this._lastAppliedProfilePath = this.lightProfilePath;
        return true;
    }

    /**
     * A lightProfilePath edit re-resolves the profile
     * (EveSmartLightPointLight.cpp:29-41); the stale reference is dropped so the
     * resource adapter re-resolves it.
     *
     * The settle hook receives no changed-property list, and profile
     * resolution belongs to the resource adapter; a detected path edit only
     * invalidates the cached reference.
     */
    OnModified(_options = {})
    {
        if (this.lightProfilePath !== this._lastAppliedProfilePath)
        {
            this._lastAppliedProfilePath = this.lightProfilePath;
            this.lightProfile = null;
        }
        return true;
    }

    /**
     * Captures the frame state and updates the attribute modifiers with full
     * strength (EveSmartLightPointLight.cpp:43-54).
     */
    UpdateSyncronous(updateContext, params, distribution)
    {
        this._activationStrength = params?.activationStrength ?? 1;
        mat4.copy(this._worldTransform, params?.localToWorldTransform ?? EveSmartLightPointLight._identity);

        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.UpdateSyncronous?.(updateContext, params, 1);
        }

        this._distribution = distribution ?? null;
    }

    /**
     * Registers this entity as a light owner (EveSmartLightPointLight.cpp:56-63).
     *
     * Carbon's RegisterComponent<ITr2LightOwner> template is expressed as the
     * registry's explicit component-name signature (verbatim "LightOwner",
     * Lights/ITr2LightOwner.h:18).
     */
    RegisterComponents()
    {
        this.GetComponentRegistry()?.RegisterComponent?.(EveComponentType.LightOwner, this);
    }

    /**
     * Registers one light per distribution placement with the duck-typed light
     * manager (EveSmartLightPointLight.cpp:65-131). The submitted record keeps
     * typed CPU state only (float32 color/direction, unpacked flags, the
     * CjsLightData and unresolved profile reference); Carbon's Float_16/
     * Vector3_16 packing and the profile-index flag packing
     * (GetTextureIndex() + 1 << 4) are renderer/resource-adapter concerns.
     * The record is scratch - the manager must copy, as Carbon's
     * Tr2LightManager::AddLight copies PerLightData by value.
     *
     * Physical per-light packing (half floats, profile-index flag bits) moves
     * to the renderer backend; Trinity submits the typed CPU record per
     * placement.
     *
     * TODO(port): this transcribes runtime-trinity's GetLights(lightManager)
     * contract verbatim - one lightManager.AddLight(record) call per
     * placement, with a record shaped like Carbon's PerLightData (position,
     * direction, color, radius, innerRadius, flags, outerAngle, innerAngle,
     * lightType, lightData, lightProfile, owner). ccpwgl's actual light sink
     * is `Tw2CarbonLightCollector` (src/core/carbon/Tw2CarbonLightCollector.js),
     * which instead exposes `Collect(lightRows)` taking an ARRAY of rows
     * shaped `{position:[x,y,z], radius, color:[r,g,b], flags, params:[4]}`
     * (see `Tr2PointLight#GetCarbonLightData`,
     * src/core/lighting/Tr2PointLight.js), and the established caller shape
     * for a light-owning child is `GetLights(collector, parentContext)`
     * (see `EveChildContainer.GetLights`, src/eve/child/EveChildContainer.js)
     * - not `GetLights(lightManager)` with an `AddLight` push per light. The
     * two contracts do not line up (different method signature, different
     * per-light row shape, no `direction`/`innerAngle`/`outerAngle`/
     * `lightProfile`/`owner` fields on the collector's row), and no mapping
     * between them is invented here - reconcile before wiring this class into
     * a container's `GetLights`.
     */
    GetLights(lightManager)
    {
        if (!this.display || !this._distribution)
        {
            return;
        }

        const placements = this._distribution.GetPlacementData?.() ?? [];
        const size = Number(this._distribution.GetNumberOfPlacements?.() ?? placements.length);
        const statics = EveSmartLightPointLight;
        const m = this._worldTransform;

        // Carbon: (|X| + |Y| + |Z|) / 3 of the world basis rows - single-matrix
        // reads, no composition (cpp:75-78).
        const scaling = (
            Math.hypot(m[0], m[1], m[2]) +
            Math.hypot(m[4], m[5], m[6]) +
            Math.hypot(m[8], m[9], m[10])
        ) / 3;
        const groupColor = this.GetGroupColor();
        const record = statics._lightRecord;
        const rotation = statics._rotation;
        const position = statics._position;
        const direction = statics._direction;

        for (let index = 0; index < size; index++)
        {
            const placement = placements[index];

            let perLightScaling = Math.max(placement.initialScale[0], placement.initialScale[1], placement.initialScale[2]);
            perLightScaling *= Math.max(placement.additionalScale[0], placement.additionalScale[1], placement.additionalScale[2]);

            record.radius = this.radius * scaling * perLightScaling;
            record.innerRadius = this.innerRadius * scaling * perLightScaling;
            record.flags = this.flags;

            // Carbon (row-vector): initialRotation * additionalRotation - initialRotation first.
            quat.multiply(rotation, placement.additionalRotation, placement.initialRotation);
            vec3.set(position, 0, 0, 0);
            const offset = this.staticOffsetTranslation;
            if (offset[0] !== 0 || offset[1] !== 0 || offset[2] !== 0)
            {
                // TriVectorRotateQuaternion == vec3.transformQuat (q v q* on both sides).
                vec3.transformQuat(position, offset, rotation);
            }

            vec3.add(position, position, placement.initialTranslation);
            vec3.add(position, position, placement.additionalTranslation);
            // TransformCoord == vec3.transformMat4 - identical on the shared layout.
            vec3.transformMat4(position, position, m);
            vec3.copy(record.position, position);

            // Carbon (row-vector): rotation * staticOffsetRotation - rotation first.
            quat.multiply(rotation, this.staticOffsetRotation, rotation);
            vec3.set(direction, 0, 1, 0);
            vec3.transformQuat(direction, direction, rotation);
            vec3.scale(direction, direction, -1);
            // TriVectorRotateMatrix: rotate by the world basis only (no translation).
            statics._TransformNormal(direction, direction, m);
            vec3.normalize(record.direction, direction);

            const strength = this.brightness * this._activationStrength;
            vec3.set(record.color, groupColor[0] * strength, groupColor[1] * strength, groupColor[2] * strength);

            for (const attributeModifier of this.attributeModifiers)
            {
                attributeModifier?.ProcessAttributeModifier?.(record.color, placement, position, direction, this._activationStrength);
            }

            record.outerAngle = 0;
            record.innerAngle = 0;

            if (this.lightType === Tr2Light.SPOT_LIGHT)
            {
                record.outerAngle = Math.cos((2 * Math.PI * this.outerAngle) / 360);
                record.innerAngle = Math.cos((2 * Math.PI * this.innerAngle) / 360);
            }

            record.lightType = this.lightType;
            record.lightData = this.lightData;
            record.lightProfile = this.lightProfile;
            record.owner = this;

            lightManager?.AddLight?.(record);
        }
    }

    /**
     * Carbon method RenderDebugInfo (EveSmartLightPointLight.cpp:133-161).
     * RenderDebugInfo is deliberately unported org-wide.
     */
    RenderDebugInfo(..._args)
    {
        throw new Error("EveSmartLightPointLight.RenderDebugInfo is not implemented in ccpwgl.");
    }

    static LightDataFields = [ "flags", "innerRadius", "brightness", "radius" ];

    /** TriVectorRotateMatrix (TriMath.cpp:81-94): basis-rows multiply, no translation. */
    static _TransformNormal(out, direction, matrix)
    {
        const x = direction[0];
        const y = direction[1];
        const z = direction[2];
        out[0] = matrix[0] * x + matrix[4] * y + matrix[8] * z;
        out[1] = matrix[1] * x + matrix[5] * y + matrix[9] * z;
        out[2] = matrix[2] * x + matrix[6] * y + matrix[10] * z;
        return out;
    }

    static _identity = mat4.create();

    static _rotation = quat.create();

    static _position = vec3.create();

    static _direction = vec3.create();

    // Scratch per-light record (Carbon Tr2LightManager::PerLightData,
    // Tr2LightManager.h:55-68) - reused across placements; the manager copies.
    static _lightRecord = {
        owner: null,
        lightData: null,
        lightProfile: null,
        lightType: Tr2Light.POINT_LIGHT,
        position: vec3.create(),
        direction: vec3.create(),
        color: vec3.create(),
        radius: 0,
        innerRadius: 0,
        flags: 0,
        outerAngle: 0,
        innerAngle: 0
    };

}
