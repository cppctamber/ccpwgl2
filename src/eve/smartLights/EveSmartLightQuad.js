// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/EveSmartLightQuad.h
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/EveSmartLightQuad.cpp
// Hand-maintained from Carbon source, promoted out of generated intake.
//
// THE ONE ADAPTATION: Carbon has no per-set geometry. Every quad-ish child
// pushes a 108-byte instance record into the process-wide `Tr2QuadRenderer`
// singleton, which merges the pool once a frame and issues ONE instanced draw
// per registered effect (Tr2QuadRenderer.cpp:210-313).
//
// ccpwgl has no instancing path for this, and `EveChildQuad`
// (src/unsupported/eve/child/EveChildQuad.js) has already solved the same
// problem by de-instancing: it replicates the instance record into all four
// corner vertices of a single quad and draws it with `drawElements`. This class
// generalises that from one quad to N, so the vertex layout below is
// `EveChildQuad.vertexDeclarations` unchanged - which is the same layout Carbon
// declares in `EveChildQuad.cpp:33-51` and that this class reuses verbatim
// (EveSmartLightQuad.cpp:61,70). Every float lands where the shader expects it;
// only the draw call differs.
//
// The org's `runtime-trinity` carries a CPU port of the singleton
// (core/Tr2QuadRenderer.js). It is deliberately NOT followed here: its
// `AddQuads` integer-indexes a named-key record so every instance uploads
// zeros, and its 108-byte stride conflates the float32 pool with Carbon's
// float16 tail. ccpwgl keeps everything float32, which is what makes the
// de-instanced route simpler AND correct.
//
// Everything else - the per-placement maths, the quaternion order, the matrix
// packing, the alpha asymmetry - is the org transcription unchanged.
import { meta } from "utils";
import { quat, mat4, vec3, vec4 } from "math";
import { device } from "global/tw2";
import { Tw2Effect, Tw2ForwardingRenderBatch, Tw2PerObjectData, Tw2VertexDeclaration } from "core";
import { EveChildTransform } from "../child/EveChildTransform";
import { EveChildQuad } from "unsupported/eve/child/EveChildQuad";
import { resolveGroupColor } from "./EveSmartLightBaseGroup";


/** A smart-light group member that places faction-colour-aware flare quads at each distribution placement. */
@meta.type("EveSmartLightQuad")
@meta.ccp.define("EveSmartLightQuad")
export class EveSmartLightQuad extends EveChildTransform
{

    /** m_name (std::string) [READWRITE, PERSIST] */
    @meta.string
    name = "";

    /** m_effect (Tr2EffectPtr) [READWRITE, PERSIST] - ccpwgl's Tw2Effect. */
    @meta.struct("Tw2Effect")
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

    /** m_editMode (bool) [READWRITE] - not persisted (EveSmartLightQuad_Blue.cpp). */
    @meta.boolean
    editMode = false;

    /** m_softQuad (bool) [READWRITE, PERSIST, NOTIFY] */
    @meta.boolean
    softQuad = false;

    // Flattened EveSmartLightBaseGroup secondary base (Carbon multiple
    // inheritance; EXPOSURE_CHAINTO at EveSmartLightQuad_Blue.cpp:28 is why
    // these fields are on this class's wire format).

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

    /** m_activationStrength (float) - captured from the update params (EveSmartLightQuad.h:54). */
    _activationStrength = 1;

    /** Last softQuad value the settle hook applied (JS-only change detection). */
    _lastAppliedSoftQuad = false;

    _decl = Tw2VertexDeclaration.from(EveChildQuad.vertexDeclarations);
    _perObjectData = Tw2PerObjectData.from(EveChildQuad.perObjectData);

    /** CPU-side vertex scratch, grown on demand; `_quadCount` is how much of it is live. */
    _array = null;
    _quadCount = 0;
    _capacity = 0;
    _vertexBuffer = null;
    _indexBuffer = null;

    /**
     * The frustum the owning set captured in `UpdateLod`. Carbon culls per
     * placement inside AddQuadsToQuadRenderer, which runs at render time with a
     * frustum in hand; ccpwgl's equivalent hand-off point is UpdateLod, so the
     * set stores it and passes it down. Null means "cull nothing".
     */
    _frustum = null;

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

    /** Overwrites the custom color (Carbon base EveSmartLightBaseGroup.cpp:55-58). */
    SetColor(color)
    {
        vec4.copy(this.customColor, color);
    }

    /** Stores the inherited faction color set and fans it out (Carbon base EveSmartLightBaseGroup.cpp:30-41). */
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

    /** Fans a controller variable out to the attribute modifiers (Carbon base EveSmartLightBaseGroup.cpp:60-66). */
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

    /** Creates the default flare-quad effect when none was authored (Carbon constructor, EveSmartLightQuad.cpp:10-34). */
    Initialize()
    {
        if (!this.effect)
        {
            this.effect = new Tw2Effect();
            this._ApplyEffectPath();
        }
        this._lastAppliedSoftQuad = this.softQuad;
        return true;
    }

    /** Applies the softQuad-selected flare effect path (EveSmartLightQuad.cpp:25-33 and cpp:40-51). */
    _ApplyEffectPath()
    {
        // Both paths are tier-pinned to sm_hi in src/config.js (FX_TIER_PINS):
        // their sm_depth bodies disable depth testing and sample an unpublished
        // DepthMap, so the pinned tier is what keeps them behind the hull.
        this.effect?.SetValue?.(
            this.softQuad
                ? "res:/Graphics/Effect/Managed/Space/SpecialFX/flarequadsoft.fx"
                : "res:/Graphics/Effect/Managed/Space/SpecialFX/FlareQuad.fx"
        );
    }

    /** @returns {Boolean} */
    IsGood()
    {
        return !!(this.effect && this.effect.IsGood() && this._vertexBuffer && this._quadCount);
    }

    /** Keeps the effect alive. */
    KeepAlive()
    {
        if (this.effect) this.effect.KeepAlive();
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    GetResources(out = [])
    {
        if (this.effect) this.effect.GetResources(out);
        return out;
    }

    /** Unloads the gl buffers. */
    Unload()
    {
        const { gl } = device;

        if (this._vertexBuffer)
        {
            gl.deleteBuffer(this._vertexBuffer);
            this._vertexBuffer = null;
        }

        if (this._indexBuffer)
        {
            gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        this._quadCount = 0;
        this._capacity = 0;
        this._array = null;
    }

    /**
     * Captures the activation strength and updates the attribute modifiers with
     * full strength (EveSmartLightQuad.cpp:73-98).
     *
     * The geometry is NOT built here. It was, and that was wrong: the world
     * transform this class packs into every vertex is written by
     * UpdateAsyncronous, which the owning set calls AFTER this - so the quads
     * were built against an identity transform on the first frame and a
     * one-frame-stale one after. Identity puts every flare at the world origin,
     * which is where the ship is, which is where the camera is looking.
     *
     * Carbon builds at render time inside AddQuadsToQuadRenderer, after both
     * update phases have run. GetBatches is the equivalent moment here, so the
     * build happens there instead - see BuildQuads.
     *
     * The edit-mode effect-key refresh (cpp:78-90) has no counterpart: the key
     * exists only to pick a bucket in the quad-renderer singleton, and there is
     * no singleton here.
     */
    UpdateSyncronous(updateContext, params, _distribution)
    {
        this._activationStrength = params && params.activationStrength !== undefined
            ? params.activationStrength
            : 1;

        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.UpdateSyncronous?.(updateContext, params, 1);
        }

        if (!this.effect) this.Initialize();
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
     * Builds one frustum-culled quad per placement (EveSmartLightQuad.cpp:116-170).
     *
     * The transforms are packed as Carbon's Vector4 rows (_11,_21,_31,_41 /
     * ...), which on the shared D3D-row-major / GL-column-major byte layout is
     * the column-stride pattern (m[0],m[4],m[8],m[12]) - the same packing
     * EveChildQuad.Rebuild already writes.
     *
     * Note two faithful asymmetries that read as bugs and are not:
     *  - alpha comes from the RAW customColor, not from the faction-resolved
     *    group colour (cpp:162);
     *  - localTransform here is SYNTHESISED per placement (diagonal scale plus
     *    the placement translation), unlike EveChildQuad which copies its own
     *    authored localTransform.
     *
     * @param {Array} placements
     * @param {Number} size - may be SMALLER than placements.length; Carbon
     *  passes the live count separately and it is the one that counts.
     * @param {?Tw2Frustum} frustum - null culls nothing
     */
    BuildQuads(placements, size, frustum)
    {
        this._quadCount = 0;

        if (!this.display || !this.effect) return;

        const statics = EveSmartLightQuad;
        const rotation = statics._rotation;
        const position = statics._position;
        const direction = statics._direction;
        const worldPosition = statics._worldPosition;
        const sphere = statics._sphere;
        const color = statics._color;
        const m = this.worldTransform;
        const groupColor = this.GetGroupColor();
        const count = Math.min(Number(size ?? placements?.length ?? 0), placements?.length ?? 0);

        if (!count) return;

        const vertexSize = EveChildQuad.vertexSize;
        this._Reserve(count);

        const array = this._array;
        let written = 0;

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

            // IntersectsSph3, not IsSphereVisible: the latter takes (center,
            // radius) as two arguments, so handing it a vec4 leaves radius
            // undefined, every comparison against -NaN is false, and the test
            // silently passes everything. Accidentally permissive rather than
            // broken, but it was not testing anything.
            if (frustum?.IntersectsSph3?.(sphere) === false) continue;

            const strength = this._activationStrength;
            vec3.set(color, groupColor[0] * strength, groupColor[1] * strength, groupColor[2] * strength);

            for (const attributeModifier of this.attributeModifiers)
            {
                attributeModifier?.ProcessAttributeModifier?.(color, placement, worldPosition, direction, strength);
            }

            // De-instanced: the record is replicated into all four corners, the
            // corner index riding in float 0 exactly as EveChildQuad does.
            const base = written * 4 * vertexSize;

            for (let corner = 0; corner < 4; corner++)
            {
                const o = base + corner * vertexSize;

                array[o] = corner;

                array[o + 1] = m[0];
                array[o + 2] = m[4];
                array[o + 3] = m[8];
                array[o + 4] = m[12];

                array[o + 5] = m[1];
                array[o + 6] = m[5];
                array[o + 7] = m[9];
                array[o + 8] = m[13];

                array[o + 9] = m[2];
                array[o + 10] = m[6];
                array[o + 11] = m[10];
                array[o + 12] = m[14];

                array[o + 13] = scaleX;
                array[o + 14] = 0;
                array[o + 15] = 0;
                array[o + 16] = position[0];

                array[o + 17] = 0;
                array[o + 18] = scaleY;
                array[o + 19] = 0;
                array[o + 20] = position[1];

                array[o + 21] = 0;
                array[o + 22] = 0;
                array[o + 23] = scaleZ;
                array[o + 24] = position[2];

                array[o + 25] = color[0];
                array[o + 26] = color[1];
                array[o + 27] = color[2];
                // Carbon takes alpha from the raw authored colour (cpp:162).
                array[o + 28] = this.customColor[3];

                array[o + 29] = this.brightness;
                array[o + 30] = 0;
            }

            written++;
        }

        this._quadCount = written;

        if (written) this._Upload(written * 4 * vertexSize);
    }

    /**
     * Grows the CPU array and the index buffer to hold `count` quads.
     * @param {Number} count
     */
    _Reserve(count)
    {
        if (count <= this._capacity && this._array) return;

        const { gl } = device;
        const vertexSize = EveChildQuad.vertexSize;

        this._array = new Float32Array(count * 4 * vertexSize);
        this._capacity = count;

        // Carbon's quad index order (Tr2QuadRenderer.cpp:222), offset by 4 per
        // quad (cpp:228). Verified in ccpwgl at EveChildQuad.js:260-261: the
        // reversed winding culls these quads away entirely.
        const indices = new Uint16Array(count * 6);
        const pattern = EveChildQuad.indices;
        for (let q = 0; q < count; q++)
        {
            for (let i = 0; i < 6; i++)
            {
                indices[q * 6 + i] = pattern[i] + q * 4;
            }
        }

        if (!this._indexBuffer) this._indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    /**
     * Uploads the live prefix of the CPU array.
     *
     * The buffer is reused rather than recreated: creating a fresh one per
     * rebuild leaks a VBO per frame on a moving parent, and deleting the old
     * one poisons any attribute slot still attached to it, silently killing
     * unrelated draws for the rest of the frame (EveChildQuad.js:232-238).
     *
     * @param {Number} floats
     */
    _Upload(floats)
    {
        const { gl } = device;

        if (!this._vertexBuffer) this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._array.subarray(0, floats), gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    /**
     * Gets render batches.
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData, distribution)
    {
        if (!this.display || mode !== device.RM_ADDITIVE) return false;

        // Built HERE, not during update, because the vertex data packs the world
        // transform and that is only current once UpdateAsyncronous has run.
        // This is also where Carbon builds (AddQuadsToQuadRenderer), so the
        // timing now matches rather than merely working.
        const placements = distribution?.GetPlacementData?.() || [];
        const size = Number(distribution?.GetNumberOfPlacements?.() ?? placements.length);
        this.BuildQuads(placements, size, this._frustum);

        if (!this.IsGood()) return false;

        const batch = new Tw2ForwardingRenderBatch();
        batch.geometryProvider = this;
        // Without this Tw2ForwardingRenderBatch.HasTechnique is always false,
        // and any collection path with a technique filter discards the batch
        // silently - see EveChildQuad.js:282.
        batch.effect = this.effect;
        batch.perObjectData = this._perObjectData;
        batch.renderMode = mode;
        accumulator.Commit(batch);
        return true;
    }

    /**
     * Renders the quads.
     * @param {String} technique
     * @returns {Boolean}
     */
    Render(technique)
    {
        if (!this.display || !this.IsGood()) return false;

        technique = "Main";

        const
            d = device,
            gl = d.gl,
            stride = EveChildQuad.vertexSize * 4;

        d.SetStandardStates(d.RM_ADDITIVE);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        const passCount = this.effect.GetPassCount(technique);
        for (let pass = 0; pass < passCount; ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            if (!this._decl.SetDeclaration(d, this.effect.GetPassInput(technique, pass), stride)) return false;
            d.ApplyShadowState();
            gl.drawElements(gl.TRIANGLES, this._quadCount * 6, gl.UNSIGNED_SHORT, 0);
        }

        return true;
    }

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

    static _parentTransform = mat4.create();

    static _rotation = quat.create();

    static _position = vec3.create();

    static _direction = vec3.create();

    static _worldPosition = vec3.create();

    static _sphere = vec4.create();

    static _color = vec3.create();

}
