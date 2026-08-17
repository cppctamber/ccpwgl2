// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/EveSmartLightQuad.h
// Hand-maintained from Carbon source, promoted out of generated intake.
import { meta } from "utils";
import { quat, mat4, vec3, vec4 } from "math";
// TODO(port): EveChildTransform does not exist yet in ccpwgl
// (src/eve/child/EveChildTransform.js). Kept as the faithful base class from
// runtime-trinity - it supplies `worldTransform` and `UpdateTransform`, both
// used below, which are unresolved until EveChildTransform is ported.
import { EveChildTransform } from "../child/EveChildTransform.js";
// TODO(port): ccpwgl's EveChildQuad currently lives at
// src/unsupported/eve/child/EveChildQuad.js (not src/eve/child/EveChildQuad.js)
// and has no `GetQuadDefinition()` static - kept as the faithful import path
// from runtime-trinity; unresolved until EveChildQuad is promoted/ported with
// that method.
import { EveChildQuad } from "../child/EveChildQuad.js";
import { resolveGroupColor } from "./EveSmartLightBaseGroup.js";
// TODO(port): ccpwgl has no Tr2Effect class - the nearest analog is
// src/core/mesh/Tw2Effect.js. Kept as the faithful import path from
// runtime-trinity; unresolved until Tr2Effect (or an equivalent) is ported.
import { Tr2Effect } from "../../shader/Tr2Effect.js";
// TODO(port): ccpwgl has no TriBatchType enum (no quad-renderer module
// exists yet at all - RegisterEffect/AddQuads below are unresolved). Kept as
// the closest bare-specifier guess (global/constant already exists as a
// module, just without this export); unresolved until quad-renderer
// infrastructure is ported.
import { TriBatchType } from "global/constant";

/** A smart-light group member that places faction-colour-aware flare quads at each distribution placement and submits them to the quad renderer. */
@meta.type("EveSmartLightQuad")
@meta.ccp.define("EveSmartLightQuad")
export class EveSmartLightQuad extends EveChildTransform
{

    /** m_name (std::string) [READWRITE, PERSIST] */
    @meta.string
    name = "";

    /** m_effect (Tr2EffectPtr) [READWRITE, PERSIST] */
    @meta.struct("Tr2Effect")
    effect = null;

    /** m_brightness (float) [READWRITE, PERSIST] */
    @meta.float
    brightness = 1;

    /** m_display (bool) [READWRITE, PERSIST] */
    @meta.boolean
    display = true;

    /** m_staticQuadScale (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    staticQuadScale = vec3.fromValues(1, 1, 1);

    /** m_staticOffsetTranslation (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    staticOffsetTranslation = vec3.create();

    /** m_editMode (bool) [READWRITE] */
    @meta.boolean
    editMode = false;

    /** m_softQuad (bool) [READWRITE, PERSIST, NOTIFY] */
    @meta.boolean
    softQuad = false;

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
    // TODO(port): vec4.createLinear() does not exist in ccpwgl's math/vec4 -
    // kept verbatim from runtime-trinity; verify the intended default once a
    // ccpwgl equivalent is ported.
    @meta.color
    customColor = vec4.createLinear();

    /** m_parentColorSet (const Color*) - inherited faction color set, never persisted. */
    _parentColorSet = null;

    /** m_effectKey (unsigned) - cached Tr2Effect hash used as the quad-renderer bucket key (EveSmartLightQuad.h:59). */
    _effectKey = 0;

    /** m_activationStrength (float) - captured from the update params (EveSmartLightQuad.h:54). */
    _activationStrength = 1;

    /** Last softQuad value the settle hook applied (JS-only change detection). */
    _lastAppliedSoftQuad = false;

    /**
     * Faction-aware group color (Carbon base EveSmartLightBaseGroup.cpp:43-53).
     *
     * Carbon inherits EveSmartLightBaseGroup; JS single inheritance flattens
     * the base-group surface through the shared resolveGroupColor helper.
     */
    GetGroupColor()
    {
        return resolveGroupColor(this.customColor, this.useFactionColor, this.factionColor, this._parentColorSet);
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
     * softQuad edits swap the flare-quad effect path (EveSmartLightQuad.cpp:36-54).
     *
     * The settle hook receives no changed-property list; the softQuad edit is
     * detected by comparing the cached last-applied value.
     */
    OnModified(_options = {})
    {
        if (this.softQuad !== this._lastAppliedSoftQuad)
        {
            this._lastAppliedSoftQuad = this.softQuad;
            this._ApplyEffectPath();
        }
        return true;
    }

    /**
     * Creates the default flare-quad effect when none was authored (Carbon
     * constructor, EveSmartLightQuad.cpp:10-34) and caches the effect key
     * (EveSmartLightQuad.cpp:56-65).
     *
     * Tr2QuadRenderer::Instance() is engine-owned; Initialize caches the
     * effect key and defers effect registration to RegisterWithQuadRenderer.
     */
    Initialize()
    {
        if (!this.effect)
        {
            this.effect = new Tr2Effect();
            this._ApplyEffectPath();
        }
        this._effectKey = Number(this.effect.GetHashValue?.() ?? 0) >>> 0;
        this._lastAppliedSoftQuad = this.softQuad;
        return true;
    }

    /**
     * Registers the effect bucket with a quad renderer (EveSmartLightQuad.cpp:68-71).
     *
     * The quad renderer is an injected engine-owned capability; the Carbon
     * arguments are forwarded through a duck-typed contract using
     * EveChildQuad's shared quad definition.
     */
    RegisterWithQuadRenderer(quadRenderer)
    {
        quadRenderer?.RegisterEffect?.(
            this._effectKey,
            TriBatchType.TRIBATCHTYPE_ADDITIVE,
            EveSmartLightQuad.QUAD_INSTANCE_SIZE,
            1,
            EveChildQuad.GetQuadDefinition(),
            this.effect
        );
    }

    /**
     * Captures the activation strength, refreshes the effect key in edit mode,
     * and updates the attribute modifiers with full strength
     * (EveSmartLightQuad.cpp:73-98).
     *
     * Carbon re-registers through the Tr2QuadRenderer singleton; the
     * relocated renderer arrives via the threaded update context when
     * present.
     */
    UpdateSyncronous(updateContext, params, _distribution)
    {
        this._activationStrength = params?.activationStrength ?? 1;

        if (this.editMode)
        {
            if (this.effect)
            {
                const key = Number(this.effect.GetHashValue?.() ?? 0) >>> 0;
                if (key !== this._effectKey)
                {
                    this._effectKey = key;
                    const quadRenderer = updateContext?.GetQuadRenderer?.() ?? updateContext?.quadRenderer;
                    if (quadRenderer)
                    {
                        this.RegisterWithQuadRenderer(quadRenderer);
                    }
                }
            }
            else
            {
                this._effectKey = 0;
            }
        }

        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.UpdateSyncronous?.(updateContext, params, 1);
        }
    }

    /**
     * Rebuilds the world transform against the nearest parent's local-to-world
     * matrix (EveSmartLightQuad.cpp:100-114); the child parent wins over the
     * space object parent.
     */
    UpdateAsyncronous(_updateContext, params, _distribution)
    {
        let localToWorld = params?.localToWorldTransform ?? EveSmartLightQuad._identity;

        const parent = params?.childParent ?? params?.spaceObjectParent;
        if (parent?.GetLocalToWorldTransform)
        {
            const transform = parent.GetLocalToWorldTransform(EveSmartLightQuad._parentTransform);
            if (transform)
            {
                localToWorld = transform;
            }
        }

        this.UpdateTransform(localToWorld);
    }

    /**
     * Builds one frustum-culled quad per placement and submits it to the quad
     * renderer (EveSmartLightQuad.cpp:116-170). The transforms are packed as
     * Carbon's Vector4 rows (_11,_21,_31,_41 / ...), which on the shared
     * D3D-row-major / GL-column-major byte layout is the column-stride pattern
     * (m[0],m[4],m[8],m[12]) etc. Color/brightness stay float32; the half
     * packing happens at buffer-build time in the engine.
     *
     * The quad renderer and frustum are injected engine-owned capabilities
     * reached through duck-typed contracts; a missing frustum is treated as
     * visible.
     */
    AddQuadsToQuadRenderer(placements, size, frustum, quadRenderer)
    {
        if (!this.display || !this.effect)
        {
            return;
        }

        const statics = EveSmartLightQuad;
        const quad = statics._quad;
        const rotation = statics._rotation;
        const position = statics._position;
        const direction = statics._direction;
        const worldPosition = statics._worldPosition;
        const sphere = statics._sphere;
        const color = statics._color;
        const m = this.worldTransform;
        const groupColor = this.GetGroupColor();
        const count = Math.min(Number(size ?? placements?.length ?? 0), placements?.length ?? 0);

        for (let index = 0; index < count; index++)
        {
            const placement = placements[index];

            const scaleX = placement.initialScale[0] * placement.additionalScale[0] * this.staticQuadScale[0];
            const scaleY = placement.initialScale[1] * placement.additionalScale[1] * this.staticQuadScale[1];
            const scaleZ = placement.initialScale[2] * placement.additionalScale[2] * this.staticQuadScale[2];

            vec3.set(position, 0, 0, 0);
            // Carbon (row-vector): initialRotation * additionalRotation - initialRotation first.
            quat.multiply(rotation, placement.additionalRotation, placement.initialRotation);

            const offset = this.staticOffsetTranslation;
            if (offset[0] !== 0 || offset[1] !== 0 || offset[2] !== 0)
            {
                // TriVectorRotateQuaternion == vec3.transformQuat (q v q* on both sides).
                vec3.transformQuat(position, offset, rotation);
            }

            vec3.set(direction, 0, 1, 0);
            vec3.transformQuat(direction, direction, rotation);
            // TriVectorRotateMatrix: rotate by the world basis only (no translation).
            statics._TransformNormal(direction, direction, m);

            vec3.add(position, position, placement.initialTranslation);
            vec3.add(position, position, placement.additionalTranslation);
            const maxScale = Math.max(scaleX, scaleY, scaleZ);
            // TransformCoord == vec3.transformMat4 - identical on the shared layout.
            vec3.transformMat4(worldPosition, position, m);
            vec4.set(sphere, worldPosition[0], worldPosition[1], worldPosition[2], maxScale);

            if (frustum?.IsSphereVisible?.(sphere) !== false)
            {
                const strength = this._activationStrength;
                vec3.set(color, groupColor[0] * strength, groupColor[1] * strength, groupColor[2] * strength);

                for (const attributeModifier of this.attributeModifiers)
                {
                    attributeModifier?.ProcessAttributeModifier?.(color, placement, worldPosition, direction, strength);
                }

                vec4.set(quad.parentTransform0, m[0], m[4], m[8], m[12]);
                vec4.set(quad.parentTransform1, m[1], m[5], m[9], m[13]);
                vec4.set(quad.parentTransform2, m[2], m[6], m[10], m[14]);
                vec4.set(quad.localTransform0, scaleX, 0, 0, position[0]);
                vec4.set(quad.localTransform1, 0, scaleY, 0, position[1]);
                vec4.set(quad.localTransform2, 0, 0, scaleZ, position[2]);
                vec4.set(quad.color, color[0], color[1], color[2], this.customColor[3]);
                quad.brightness[0] = this.brightness;
                quad.brightness[1] = 0;

                quadRenderer?.AddQuads?.(this._effectKey, quad, 1);
            }
        }
    }

    /** Applies the softQuad-selected flare effect path (EveSmartLightQuad.cpp:25-33 and cpp:40-51). */
    _ApplyEffectPath()
    {
        this.effect?.SetEffectPathName?.(
            this.softQuad
                ? "res:/Graphics/Effect/Managed/Space/SpecialFX/flarequadsoft.fx"
                : "res:/Graphics/Effect/Managed/Space/SpecialFX/FlareQuad.fx"
        );
    }

    /** sizeof(EveSmartLightQuad::SimplifiedQuad): 6 * 16 + 4 * 2 + 2 * 2 bytes (EveSmartLightQuad.h:38-49). */
    static QUAD_INSTANCE_SIZE = 108;

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

    // m_quad-equivalent CPU record (SimplifiedQuad, EveSmartLightQuad.h:38-49) -
    // scratch reused across placements; the quad renderer copies on AddQuads.
    static _quad = {
        parentTransform0: vec4.create(),
        parentTransform1: vec4.create(),
        parentTransform2: vec4.create(),
        localTransform0: vec4.create(),
        localTransform1: vec4.create(),
        localTransform2: vec4.create(),
        color: vec4.create(),
        brightness: new Float32Array(2)
    };

    static _identity = mat4.create();

    static _parentTransform = mat4.create();

    static _rotation = quat.create();

    static _position = vec3.create();

    static _direction = vec3.create();

    static _worldPosition = vec3.create();

    static _sphere = vec4.create();

    static _color = vec3.create();

}
