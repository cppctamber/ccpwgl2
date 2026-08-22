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
// Carbon's `EveSmartLightMesh` privately inherits `EveChildInstanceMeshRenderer`
// and does its real work by calling that base: `ConfigureInstanceData`,
// `UpdateGeometryResource`, `UpdateInstanceData`. ccpwgl's
// `EveChildInstanceMeshRenderer` is still `@meta.notImplemented`, so those three
// are implemented HERE rather than by rewriting the base for a consumer that
// does not exist yet. They are transcribed from
// EveChildInstanceMeshRenderer.cpp:225-352 and marked as such.
//
// ONE ADAPTATION, at the distribution. Carbon's renderer owns an
// `m_distribution` of its own; a smart light mesh is driven by the SET's
// distribution, handed down as the third update argument. That is why nothing
// here reads the base's `distribution` field, which the black reader skips.
//
// The instance stream is genuinely instanced - unlike EveSmartLightQuad, which
// de-instances into corner vertices. `ubershaderinstanced` wants per-instance
// attributes, so `drawElementsInstanced` is the only shape that feeds it.
import { meta } from "utils";
import { mat4, quat, vec3, vec4 } from "math";
import { device } from "global/tw2";
import { Tw2VertexDeclaration } from "core/vertex";
import { Tw2DirectInstanceData } from "core/Tw2DirectInstanceData";
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

    /** Packed instance scratch, grown on demand and reused between frames. */
    _instances = null;

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
     * Tracks the placement count, tints the mesh, and rebuilds the instance
     * stream (EveSmartLightMesh.cpp:21-77 plus the base's
     * EveChildInstanceMeshRenderer.cpp:167-201).
     *
     * Note Carbon feeds the attribute modifiers from the FIRST placement only,
     * with the comment "we can't set the shader params per instance" - the
     * whole instanced batch shares one colour. That is why this is one tint and
     * not a per-placement loop.
     */
    UpdateSyncronous(updateContext, params, distribution)
    {
        this._activationStrength = params && params.activationStrength !== undefined
            ? params.activationStrength
            : 1;

        this._UpdateAttributeModifiers(updateContext, params);

        if (!distribution || !this.display) return;

        const count = Number(distribution.GetNumberOfPlacements?.() ?? 0);
        this._lastEntityCount = count;
        if (!count) return;

        const
            statics = EveSmartLightMesh,
            placements = distribution.GetPlacementData?.() || [],
            groupColor = this.GetGroupColor(),
            color = statics._color;

        vec4.set(
            color,
            groupColor[0] * this._activationStrength,
            groupColor[1] * this._activationStrength,
            groupColor[2] * this._activationStrength,
            groupColor[3] * this._activationStrength
        );

        // The attribute modifiers run against the FIRST placement only, with
        // Carbon's own reason: "we can't set the shader params per instance".
        // One instanced batch, one colour - so the modifiers see a reference
        // placement, the distribution's centre as the position, and the first
        // placement's world-space up as the direction.
        if (this.attributeModifiers.length && placements.length)
        {
            const
                first = placements[0],
                direction = statics._direction,
                rotation = statics._rotation,
                rgb = statics._colorValues,
                world = params?.localToWorldTransform || statics._identity;

            // Carbon (row-vector): initialRotation * additionalRotation.
            quat.multiply(rotation, first.additionalRotation, first.initialRotation);
            vec3.transformQuat(direction, statics._up, rotation);
            // TriVectorRotateMatrix: the basis only, no translation.
            statics._TransformNormal(direction, direction, world);

            vec3.set(rgb, color[0], color[1], color[2]);

            const center = distribution.GetPlacementDataCenter?.() || statics._position;
            const strength = params?.activationStrength ?? 1;

            for (const attributeModifier of this.attributeModifiers)
            {
                attributeModifier?.ProcessAttributeModifier?.(rgb, first, center, direction, strength);
            }

            color[0] = rgb[0];
            color[1] = rgb[1];
            color[2] = rgb[2];
        }

        this.SetMeshColorParameter(color);

        this.UpdateGeometryResource(placements, count, params);
    }

    /**
     * Runs the attribute modifiers' own synchronous update.
     *
     * Carbon reaches these through `EveChildMesh::UpdateSyncronous` on the
     * shared base; ccpwgl's base is a stub, so the fan-out is here. The third
     * argument is Carbon's literal 1: modifiers take the activation strength
     * through `ProcessAttributeModifier`, not through this call.
     *
     * @param {Object} updateContext
     * @param {Object} params
     */
    _UpdateAttributeModifiers(updateContext, params)
    {
        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.UpdateSyncronous?.(updateContext, params, 1);
        }
    }

    /**
     * Configures the instance stream's layout
     * (EveChildInstanceMeshRenderer.cpp:334-352).
     *
     * The asset already carries a `Tw2DirectInstanceData` as the mesh's
     * instanceGeometryResource; Carbon replaces it wholesale here, so an asset
     * that carried none still ends up with one.
     *
     * Carbon declares the bone index as BYTE_4. It is a float4 here: WebGL is
     * handed the raw value either way, and a float carries the index without
     * the normalisation question a byte attribute raises.
     */
    ConfigureInstanceData()
    {
        const mesh = this.mesh;
        if (!mesh || !("instanceGeometryResource" in mesh)) return null;

        let data = mesh.instanceGeometryResource;
        if (!(data instanceof Tw2DirectInstanceData))
        {
            data = new Tw2DirectInstanceData();
            mesh.instanceGeometryResource = data;
        }

        if (!data.GetLayout())
        {
            data.SetLayout(Tw2VertexDeclaration.from(EveSmartLightMesh.instanceDeclarations));
        }

        return data;
    }

    /**
     * Packs one instance per placement and uploads it
     * (EveChildInstanceMeshRenderer.cpp:225-332).
     *
     * The transforms are OBJECT space - placements are authored against the
     * hull's locators - so the world transform arrives separately through the
     * per-object data, exactly as it does for a plain mesh. The world transform
     * is read here only for the billboard constraints, which need to know where
     * the camera is relative to the instance.
     *
     * @param {Array} placements
     * @param {Number} size - the live count, which may be smaller than the array
     * @param {Object} [params] - the update params, for the world transform
     */
    UpdateGeometryResource(placements, size, params)
    {
        const data = this.ConfigureInstanceData();
        if (!data) return;

        const count = Math.min(Number(size ?? 0), placements.length);
        if (!count || !this.display)
        {
            data.SetData(null, 0);
            return;
        }

        const
            statics = EveSmartLightMesh,
            stride = statics.INSTANCE_FLOATS,
            world = params?.localToWorldTransform || statics._identity,
            rotation = statics._rotation,
            position = statics._position,
            scaling = statics._scaling,
            m = statics._matrix,
            mLast = statics._matrixLast,
            lastPosition = statics._lastPosition;

        if (!this._instances || this._instances.length < count * stride)
        {
            this._instances = new Float32Array(count * stride);
        }

        const array = this._instances;

        for (let index = 0; index < count; index++)
        {
            const placement = placements[index];

            // Carbon (row-vector): additionalRotation * initialRotation.
            quat.multiply(rotation, placement.initialRotation, placement.additionalRotation);

            // The static offset is rotated to align with the placement before
            // being added, so it is an offset along the placement's own axes.
            vec3.transformQuat(position, this.staticOffsetTranslation, rotation);
            vec3.add(position, position, placement.initialTranslation);
            vec3.add(position, position, placement.additionalTranslation);

            vec3.set(
                scaling,
                placement.initialScale[0] * placement.additionalScale[0] * this.staticOffsetScale[0],
                placement.initialScale[1] * placement.additionalScale[1] * this.staticOffsetScale[1],
                placement.initialScale[2] * placement.additionalScale[2] * this.staticOffsetScale[2]
            );

            this._ApplyRotationConstraint(rotation, position, world);

            // Carbon (row-vector): m_staticOffsetRotation * rotation.
            quat.multiply(rotation, rotation, this.staticOffsetRotation);

            mat4.fromRotationTranslationScale(m, rotation, position, scaling);

            vec3.add(lastPosition, position, placement.translationFrameDelta);
            mat4.fromRotationTranslationScale(mLast, rotation, lastPosition, scaling);

            // Carbon transposes and takes rows X/Y/Z, which on the shared
            // D3D-row-major / GL-column-major byte layout is the column stride -
            // the same packing EveSmartLightQuad writes for its world matrix.
            const o = index * stride;

            array[o] = m[0]; array[o + 1] = m[4]; array[o + 2] = m[8]; array[o + 3] = m[12];
            array[o + 4] = m[1]; array[o + 5] = m[5]; array[o + 6] = m[9]; array[o + 7] = m[13];
            array[o + 8] = m[2]; array[o + 9] = m[6]; array[o + 10] = m[10]; array[o + 11] = m[14];

            array[o + 12] = mLast[0]; array[o + 13] = mLast[4]; array[o + 14] = mLast[8]; array[o + 15] = mLast[12];
            array[o + 16] = mLast[1]; array[o + 17] = mLast[5]; array[o + 18] = mLast[9]; array[o + 19] = mLast[13];
            array[o + 20] = mLast[2]; array[o + 21] = mLast[6]; array[o + 22] = mLast[10]; array[o + 23] = mLast[14];

            array[o + 24] = placement.boneIndex;
            array[o + 25] = 0;
            array[o + 26] = 0;
            array[o + 27] = 0;
        }

        data.SetData(count * stride === array.length ? array : array.subarray(0, count * stride), count);
    }

    /**
     * Applies the authored rotational constraint in place
     * (EveChildInstanceMeshRenderer.cpp:264-306).
     *
     * The unconstrained case is not "leave it alone": Carbon rotates up by the
     * placement rotation, negates it, and rebuilds the rotation as the arc from
     * forward to that direction - which is what points a beam back down its
     * locator rather than along it.
     *
     * @param {quat} rotation - modified in place
     * @param {vec3} position - object space
     * @param {mat4} world
     */
    _ApplyRotationConstraint(rotation, position, world)
    {
        const
            statics = EveSmartLightMesh,
            up = statics._up,
            direction = statics._direction;

        switch (this.rotationConstraint)
        {
            case EveSmartLightMesh.RotationalConstraint.BILLBOARD:
            {
                const
                    toCamera = statics._toCamera,
                    objectDirection = statics._objectDirection,
                    right = statics._right,
                    objectUp = statics._objectUp,
                    originRotation = statics._originRotation,
                    objectUpToCamera = statics._objectUpToCamera,
                    roll = statics._roll;

                device.GetEyePosition(toCamera);
                vec3.subtract(toCamera, toCamera, vec3.transformMat4(statics._worldPosition, position, world));
                vec3.normalize(toCamera, toCamera);

                mat4.getRotation(originRotation, world);
                quat.invert(originRotation, originRotation);
                vec3.transformQuat(objectDirection, up, originRotation);

                vec3.cross(right, up, objectDirection);
                if (right[0] === 0 && right[1] === 0 && right[2] === 0)
                {
                    vec3.set(objectUp, 0, 0, -objectDirection[1]);
                }
                else
                {
                    vec3.normalize(right, right);
                    vec3.cross(objectUp, objectDirection, right);
                }

                // Roll adjustment, so an orbiting camera moves the billboard less.
                const angle = Math.PI / 2 - Math.atan2(toCamera[0], toCamera[2]) * 0.5;
                quat.set(roll, 0, 0, Math.cos(angle), Math.sin(angle));

                statics._RotationArc(rotation, up, objectUp);
                statics._RotationArc(objectUpToCamera, toCamera, up);
                quat.invert(objectUpToCamera, objectUpToCamera);

                // Carbon (row-vector): rollAdjustment * rotation * inverse(objUpToCamera).
                quat.multiply(rotation, objectUpToCamera, rotation);
                quat.multiply(rotation, rotation, roll);
                return;
            }

            case EveSmartLightMesh.RotationalConstraint.BILLBOARD_WITH_Z_LOCKED:
            {
                const
                    toCamera = statics._toCamera,
                    rotationMatrix = statics._rotationMatrix,
                    modification = statics._modification;

                device.GetEyePosition(toCamera);
                vec3.subtract(toCamera, toCamera, vec3.transformMat4(statics._worldPosition, position, world));

                mat4.fromQuat(rotationMatrix, rotation);
                // Carbon (row-vector): RotationMatrix(rotation) * m_worldTransform.
                mat4.multiply(rotationMatrix, world, rotationMatrix);

                // A direction, so the translation column takes no part.
                //
                // Carbon's rotMatrix * Vector4(angleToCamera, 0), read as a
                // column multiply. Reading it against the rows instead was
                // measured, as were both quaternion composition orders, and
                // none of the four changed what rasterises - so this is the
                // reading Carbon's convention gives and nothing contradicts it.
                const
                    x = rotationMatrix[0] * toCamera[0] + rotationMatrix[4] * toCamera[1] + rotationMatrix[8] * toCamera[2],
                    z = rotationMatrix[2] * toCamera[0] + rotationMatrix[6] * toCamera[1] + rotationMatrix[10] * toCamera[2];

                quat.setAxisAngle(modification, up, Math.atan2(x, z));
                quat.multiply(rotation, rotation, modification);
                return;
            }

            default:
            {
                vec3.transformQuat(direction, up, rotation);
                vec3.normalize(direction, direction);
                vec3.scale(direction, direction, -1);
                statics._ArcFromForward(rotation, direction);
            }
        }
    }

    /**
     * Batch fan-out to the instanced mesh.
     *
     * The base renderer's `GetBatches` returns false unconditionally, so this
     * is what puts a beam in front of the accumulator at all. `Tw2InstancedMesh`
     * gates on its own `IsGood`, which now includes the instance data having
     * something in it, so an empty distribution accumulates nothing.
     *
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean}
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || !this.mesh) return false;
        return !!this.mesh.GetBatches?.(mode, accumulator, perObjectData);
    }

    /** Gets object resources. */
    GetResources(out = [])
    {
        if (this.mesh) this.mesh.GetResources?.(out);
        return out;
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
        //
        // SetParameterS, plural. There is no `SetParameter` on Tw2Effect, so the
        // optional call this used to make - `effect?.SetParameter?.(name, color)`
        // - resolved to undefined and did NOTHING, while the cache below still
        // recorded the colour as applied. Measured on ac2_t2a: _lastAreaColor
        // held the group blue 0.032/0.456/1 while DiffuseColor still held the
        // authored orange 0.918/0.678/0.439. Optional-calling a method that has
        // to exist turns a rename into silence.
        let applied = 0;

        for (const listName of EveSmartLightMesh.AREA_LISTS)
        {
            const areas = this.mesh[listName];
            if (!areas) continue;

            for (let i = 0; i < areas.length; i++)
            {
                const effect = areas[i] && areas[i].effect;
                if (effect && effect.SetParameters({ [this.shaderParamColorName]: color })) applied++;
            }
        }

        // Only cache once something took it; otherwise the first call latches
        // the cache and every later frame short-circuits on the equality test
        // above, so a tint that never applied can never be retried.
        if (applied) vec4.copy(this._lastAreaColor, color);
    }

    /** No asynchronous work of its own (EveSmartLightMesh.cpp:136-139). */
    UpdateAsyncronous(_updateContext, _params, _distribution)
    {
    }

    /**
     * TriQuaternionArcFromForward (TriMath.cpp:341-356), transcribed including
     * its degenerate branch: a direction already pointing along +z yields
     * (1,0,0,0), a half turn about x, rather than identity.
     *
     * @param {quat} out
     * @param {vec3} v
     * @returns {quat} out
     */
    static _ArcFromForward(out, v)
    {
        const n = vec3.normalize(EveSmartLightMesh._normalized, v);

        if (n[2] < 0.99999)
        {
            const
                z = Math.sqrt(1 - n[2]),
                div = 0.707106781187 / z;

            return quat.set(out, n[1] * div, -n[0] * div, 0, 0.707106781187 * z);
        }

        return quat.set(out, 1, 0, 0, 0);
    }

    /**
     * TriQuaternionRotationArc (TriMath.cpp:328-339) - the shortest rotation
     * taking v1 onto v2, which is what gl-matrix's rotationTo computes.
     *
     * @param {quat} out
     * @param {vec3} v1
     * @param {vec3} v2
     * @returns {quat} out
     */
    static _RotationArc(out, v1, v2)
    {
        return quat.rotationTo(out, v1, v2);
    }

    /** EveChildInstanceMeshRenderer::RotationalConstraints (h:35-40). */
    static RotationalConstraint = Object.freeze({
        NONE: 0,
        BILLBOARD: 1,
        BILLBOARD_WITH_Z_LOCKED: 2
    });

    /**
     * The per-instance stream, at TEXCOORD 8..14.
     *
     * NOT `EveChildInstanceMeshRenderer.cpp:338-345`, which declares TEXCOORD
     * 0..6. That layout does not match the shader: `ubershaderinstanced`'s
     * vertex input signature is POSITION0, TEXCOORD0, NORMAL0, TANGENT0,
     * BITANGENT0, TEXCOORD8, TEXCOORD9, TEXCOORD10 - measured off the pass
     * input on a loaded hull. Every OTHER Carbon instanced consumer agrees with
     * the shader rather than with that function: EveChildInstancedMeshes
     * (cpp:613-619), EveChildLineSet (cpp:348), BehaviorGroup (cpp:848) and
     * EvePlaneSet (cpp:166) all declare TEXCOORD 8 upwards on stream 1 with
     * step rate 1.
     *
     * Declaring 0..6 bound NOTHING the shader asked for, so every instance drew
     * with a zero transform - collapsed to a point, invisible, no error. It was
     * also actively harmful: the instance stream binds AFTER the geometry, so
     * TEXCOORD0 was overwriting the mesh's own uvs.
     *
     * Carbon's last element is BYTE_4/UINT32_1; a float4 here carries the same
     * value without the normalisation question.
     */
    static instanceDeclarations = [
        { usage: "TEXCOORD", usageIndex: 8, elements: 4 },  // transform0
        { usage: "TEXCOORD", usageIndex: 9, elements: 4 },  // transform1
        { usage: "TEXCOORD", usageIndex: 10, elements: 4 }, // transform2
        { usage: "TEXCOORD", usageIndex: 11, elements: 4 }, // lastTransform0
        { usage: "TEXCOORD", usageIndex: 12, elements: 4 }, // lastTransform1
        { usage: "TEXCOORD", usageIndex: 13, elements: 4 }, // lastTransform2
        { usage: "TEXCOORD", usageIndex: 14, elements: 4 }  // boneIndex in x
    ];

    /** Floats per instance - must agree with instanceDeclarations. */
    static INSTANCE_FLOATS = 28;

    static _identity = mat4.create();

    static _matrix = mat4.create();

    static _matrixLast = mat4.create();

    static _rotationMatrix = mat4.create();

    static _rotation = quat.create();

    static _originRotation = quat.create();

    static _objectUpToCamera = quat.create();

    static _modification = quat.create();

    static _roll = quat.create();

    static _position = vec3.create();

    static _lastPosition = vec3.create();

    static _worldPosition = vec3.create();

    static _scaling = vec3.create();

    static _direction = vec3.create();

    static _normalized = vec3.create();

    static _toCamera = vec3.create();

    static _objectDirection = vec3.create();

    static _objectUp = vec3.create();

    static _right = vec3.create();

    static _up = vec3.fromValues(0, 1, 0);

    static _colorValues = vec3.create();

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
