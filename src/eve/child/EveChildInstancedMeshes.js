// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/EveChildInstancedMeshes.{h,cpp}
import { meta } from "utils";
import { box3, mat4, quat, sph3, vec3 } from "math";
import {
    Tw2DirectInstanceData,
    Tw2InstancedMesh,
    Tw2MeshArea,
    Tw2VertexDeclaration
} from "core";
import {
    RM_ADDITIVE,
    RM_DECAL,
    RM_DEPTH,
    RM_DISTORTION,
    RM_NORMAL,
    RM_OPAQUE,
    RM_PICKABLE,
    RM_TRANSPARENT
} from "constant";
import { EveChild } from "./EveChild";
import { EveChildMesh } from "./EveChildMesh";
import { EveChildUpdateParams } from "../EveChildUpdateParams";
import { EveDamageOverlay } from "../effect/EveDamageOverlay";


/**
 * Owns the shared, GPU-instanced hull meshes produced by SOF.
 *
 * Carbon routes these through EveInstancedMeshManager. ccpwgl already has the
 * equivalent draw path split between Tw2InstancedMesh and
 * Tw2DirectInstanceData, so this child owns those native objects directly.
 * No Carbon/runtime Trinity object enters the ccpwgl scene graph.
 */
@meta.define("EveChildInstancedMeshes", true)
export class EveChildInstancedMeshes extends EveChild
{

    @meta.string
    name = "";

    /** Carbon's meshes are runtime-built and are not BLACK-persisted. */
    meshes = [];

    _worldTransform = mat4.create();
    _worldBoundingBox = box3.create();
    _worldBoundingSphere = sph3.create();
    _boundsReady = false;
    _hasUpdated = false;
    _revision = 0;
    _partDamageOverlays = new Map();

    /** Sets a shader permutation on every owned area. */
    SetShaderOption(name, value)
    {
        for (const mesh of this.meshes)
        {
            mesh.renderer.SetShaderOption(name, value);
        }
        this._revision++;
    }

    /**
     * Adds instances to a compatible mesh, or creates a new native instanced
     * mesh when the geometry/material tuple differs.
     */
    AddMesh(
        geometryPath,
        castsShadow,
        reflectionMode,
        meshIndex,
        areas,
        instanceTransforms,
        sofHullName = "",
        sofLocatorSetName = "",
        partTag = EveChildInstancedMeshes.NO_PART_TAG,
        ownedLocatorSets = [],
        armorDamageShader = null)
    {
        if (!areas || !areas.length || !instanceTransforms || !instanceTransforms.length)
        {
            return -1;
        }

        let record = this.meshes.find(mesh =>
            mesh.geometryPath === geometryPath &&
            mesh.meshIndex === (Number(meshIndex) >>> 0) &&
            mesh.castsShadow === !!castsShadow &&
            mesh.reflectionMode === reflectionMode &&
            mesh.sofHullName === String(sofHullName || "") &&
            mesh.sofLocatorSetName === String(sofLocatorSetName || "") &&
            mesh.ownedLocatorSets.length === ownedLocatorSets.length &&
            EveChildInstancedMeshes.AreasEqual(mesh.areas, areas));

        if (!record)
        {
            record = this.CreateMeshRecord(
                geometryPath,
                castsShadow,
                reflectionMode,
                meshIndex,
                areas,
                sofHullName,
                sofLocatorSetName,
                ownedLocatorSets,
                armorDamageShader
            );
            this.meshes.push(record);
        }

        for (const value of instanceTransforms)
        {
            const transform = value && value.transform ? value.transform : value;
            record.instances.push(mat4.clone(transform));
            record.boneIndices.push(Number(value && value.transform ? value.boneIndex : 0) || 0);
            record.partTags.push(Number(partTag) >>> 0);
        }

        this.RebuildInstanceData(record);
        this._revision++;
        return this.meshes.indexOf(record);
    }

    /** Creates ccpwgl's native renderer and instance buffer for one group. */
    CreateMeshRecord(
        geometryPath,
        castsShadow,
        reflectionMode,
        meshIndex,
        areas,
        sofHullName,
        sofLocatorSetName,
        ownedLocatorSets,
        armorDamageShader)
    {
        const instanceData = new Tw2DirectInstanceData();
        instanceData.SetLayout(Tw2VertexDeclaration.from(EveChildInstancedMeshes.INSTANCE_DECLARATION));

        const nativeMesh = new Tw2InstancedMesh();
        nativeMesh.geometryResPath = String(geometryPath || "");
        nativeMesh.instanceGeometryResource = instanceData;
        nativeMesh.instanceMeshIndex = 0;
        nativeMesh.Initialize();

        const nativeAreas = [];
        for (const source of areas)
        {
            const area = new Tw2MeshArea();
            area.name = source.name || "instance";
            area.effect = source.effect || null;
            area.meshIndex = Number(meshIndex) >>> 0;
            area.index = Number(source.areaIndex ?? source.index) >>> 0;
            area.count = source.areaCount === undefined
                ? (source.count === undefined ? 1 : Number(source.count) >>> 0)
                : Number(source.areaCount) >>> 0;
            area.reversed = !!source.reversed;
            area._batchType = Number(source.batchType) >>> 0;
            nativeAreas.push(area);
            EveChildInstancedMeshes.GetAreaList(nativeMesh, area._batchType).push(area);

            if (area.effect && area.effect.SetOption)
            {
                // ccpwgl draws this class through Tw2InstancedMesh. The
                // manager-backed SOIA_SHARED contract requires Carbon's data
                // texture manager, so the native fallback uses the supported
                // explicit instance stream.
                area.effect.SetOption("SPACE_OBJECT_INSTANCED_ATTACHMENT", "SOIA_ENABLED");
            }
        }

        const renderer = new EveChildMesh();
        renderer.name = String(sofHullName || geometryPath || "Instanced mesh");
        renderer.useSRT = false;
        renderer.useSpaceObjectData = true;
        renderer.castShadow = !!castsShadow;
        renderer.reflectionMode = reflectionMode;
        renderer.mesh = nativeMesh;

        return {
            geometryPath: nativeMesh.geometryResPath,
            geometry: nativeMesh.geometryResource,
            meshIndex: Number(meshIndex) >>> 0,
            castsShadow: !!castsShadow,
            reflectionMode,
            areas: nativeAreas,
            instances: [],
            boneIndices: [],
            partTags: [],
            sofHullName: String(sofHullName || ""),
            sofLocatorSetName: String(sofLocatorSetName || ""),
            ownedLocatorSets: Array.from(ownedLocatorSets || []),
            armorDamageShader,
            ownOverlayEffects: [],
            inheritOverlayEffects: true,
            display: true,
            instanceData,
            nativeMesh,
            renderer
        };
    }

    /** Re-packs current/previous transforms and the stable sphere index. */
    RebuildInstanceData(mesh)
    {
        const count = mesh.instances.length;
        const data = new Float32Array(count * EveChildInstancedMeshes.INSTANCE_FLOATS);

        for (let index = 0; index < count; index++)
        {
            const transform = mesh.instances[index];
            const offset = index * EveChildInstancedMeshes.INSTANCE_FLOATS;

            data[offset] = transform[0];
            data[offset + 1] = transform[4];
            data[offset + 2] = transform[8];
            data[offset + 3] = transform[12];
            data[offset + 4] = transform[1];
            data[offset + 5] = transform[5];
            data[offset + 6] = transform[9];
            data[offset + 7] = transform[13];
            data[offset + 8] = transform[2];
            data[offset + 9] = transform[6];
            data[offset + 10] = transform[10];
            data[offset + 11] = transform[14];

            data.set(data.subarray(offset, offset + 12), offset + 12);
            data[offset + 24] = mesh.boneIndices[index] || 0;
        }

        mesh.instanceData.SetData(data, count);
    }

    /** Removes every placement carrying the given modular-object part tag. */
    RemoveInstancesByPartTag(partTag)
    {
        const tag = Number(partTag) >>> 0;
        for (let meshIndex = this.meshes.length - 1; meshIndex >= 0; meshIndex--)
        {
            const mesh = this.meshes[meshIndex];
            const instances = [];
            const boneIndices = [];
            const partTags = [];
            for (let index = 0; index < mesh.instances.length; index++)
            {
                if (mesh.partTags[index] === tag) continue;
                instances.push(mesh.instances[index]);
                boneIndices.push(mesh.boneIndices[index]);
                partTags.push(mesh.partTags[index]);
            }

            if (instances.length === mesh.instances.length) continue;
            mesh.instances = instances;
            mesh.boneIndices = boneIndices;
            mesh.partTags = partTags;

            if (!instances.length)
            {
                mesh.instanceData.Unload();
                this.meshes.splice(meshIndex, 1);
            }
            else
            {
                this.RebuildInstanceData(mesh);
            }
            this._revision++;
        }
        this._partDamageOverlays.delete(tag);
    }

    /** Moves every instance belonging to a modular-object part. */
    SetInstanceTransformByPartTag(partTag, translation, rotation, scale)
    {
        const tag = Number(partTag) >>> 0;
        let changed = false;
        for (const mesh of this.meshes)
        {
            let changedMesh = false;
            for (let index = 0; index < mesh.instances.length; index++)
            {
                if (mesh.partTags[index] !== tag) continue;
                mat4.fromRotationTranslationScale(mesh.instances[index], rotation, translation, scale);
                changed = changedMesh = true;
            }
            if (changedMesh) this.RebuildInstanceData(mesh);
        }
        if (changed) this._revision++;
    }

    Update(dt, params = EveChildUpdateParams.DEFAULT)
    {
        mat4.copy(this._worldTransform, params.localToWorldTransform);
        for (const mesh of this.meshes) mesh.renderer.Update(dt, params);
        this.RebuildBounds();
        this._hasUpdated = true;
    }

    PrepareLod(parentTransform)
    {
        if (parentTransform) mat4.copy(this._worldTransform, parentTransform);
        this.RebuildBounds();
    }

    UpdateLod(updateContext, parentLodLevel, parentTransform)
    {
        super.UpdateLod(updateContext, parentLodLevel, parentTransform);
        for (const mesh of this.meshes)
        {
            mesh.renderer.UpdateLod(updateContext, parentLodLevel, parentTransform);
        }
    }

    ChangeLOD(lodLevel)
    {
        super.ChangeLOD(lodLevel);
        for (const mesh of this.meshes) mesh.renderer.ChangeLOD(lodLevel);
    }

    ResetLod()
    {
        super.ResetLod();
        for (const mesh of this.meshes) mesh.renderer.ResetLod();
    }

    /** Aggregates ccpwgl's native instance bounds for parent LOD selection. */
    RebuildBounds()
    {
        const local = EveChildInstancedMeshes.global.box3_0;
        const world = EveChildInstancedMeshes.global.box3_1;
        this._boundsReady = false;

        for (const mesh of this.meshes)
        {
            if (!mesh.display || !mesh.nativeMesh.GetBoundingBox(local)) continue;
            box3.transformMat4(world, local, this._worldTransform);
            if (this._boundsReady)
            {
                box3.union(this._worldBoundingBox, this._worldBoundingBox, world);
            }
            else
            {
                box3.copy(this._worldBoundingBox, world);
                this._boundsReady = true;
            }
        }

        if (this._boundsReady) sph3.fromBox3(this._worldBoundingSphere, this._worldBoundingBox);
        return this._boundsReady;
    }

    UpdateViewDependentData(parentTransform, dt)
    {
        for (const mesh of this.meshes)
        {
            mesh.renderer.UpdateViewDependentData(parentTransform, dt);
        }
    }

    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this._hasUpdated) return false;
        let committed = false;
        for (const mesh of this.meshes)
        {
            if (mesh.display)
            {
                committed = mesh.renderer.GetBatches(mode, accumulator, perObjectData) || committed;
            }
        }
        return committed;
    }

    GetResources(out = [])
    {
        for (const mesh of this.meshes)
        {
            mesh.renderer.GetResources(out);
            for (const overlay of mesh.ownOverlayEffects)
            {
                if (overlay.GetResources) overlay.GetResources(out);
            }
        }
        return out;
    }

    Intersect(ray, intersects, worldTransform, cache)
    {
        const before = intersects.length;
        for (const mesh of this.meshes)
        {
            if (mesh.display) mesh.renderer.Intersect(ray, intersects, worldTransform, cache);
        }
        for (let index = before; index < intersects.length; index++)
        {
            intersects[index].item = this;
            if (!intersects[index].name) intersects[index].name = this.name || "";
        }
        return intersects.length > before ? intersects[before] : null;
    }

    GetLocalToWorldTransform(out = mat4.create())
    {
        return mat4.copy(out, this._worldTransform);
    }

    GetBoundingSphere(out)
    {
        out = out || sph3.create();
        return this._boundsReady ? sph3.copy(out, this._worldBoundingSphere) : null;
    }

    GetSofSourceLocator(areaId)
    {
        const value = Number(areaId) >>> 0;
        const mesh = this.meshes[value >>> 16];
        if (!mesh || !mesh.sofHullName || !mesh.sofLocatorSetName) return null;
        return [ mesh.sofHullName, mesh.sofLocatorSetName, value & 0xffff ];
    }

    GetMeshCount()
    {
        return this.meshes.length;
    }

    GetInstancesTransforms(meshId)
    {
        return this.GetMesh(meshId).instances.map(transform => [
            Array.from(mat4.getTranslation(vec3.create(), transform)),
            Array.from(mat4.getRotation(quat.create(), transform)),
            Array.from(mat4.getScaling(vec3.create(), transform))
        ]);
    }

    GetMeshInfo(meshId)
    {
        const mesh = this.GetMesh(meshId);
        return [
            mesh.geometryPath,
            mesh.nativeMesh.geometryResource,
            mesh.meshIndex,
            mesh.castsShadow,
            mesh.reflectionMode,
            mesh.areas.length,
            mesh.instances.length
        ];
    }

    GetAreaInfo(meshId, areaId)
    {
        const mesh = this.GetMesh(meshId);
        const area = mesh.areas[Number(areaId) >>> 0];
        if (!area) throw new RangeError(`EveChildInstancedMeshes area index ${areaId} is out of range`);
        return [ area.effect, EveChildInstancedMeshes.GetAreaMode(mesh.nativeMesh, area), area.index, area.count ];
    }

    GetMeshDisplay(meshId)
    {
        return this.GetMesh(meshId).display;
    }

    SetMeshDisplay(meshId, display)
    {
        const mesh = this.GetMesh(meshId);
        const next = !!display;
        if (mesh.display === next) return;
        mesh.display = mesh.nativeMesh.display = mesh.renderer.display = next;
        this._boundsReady = false;
        this._revision++;
    }

    GetMeshInheritOverlayEffects(meshId)
    {
        return this.GetMesh(meshId).inheritOverlayEffects;
    }

    SetMeshInheritOverlayEffects(meshId, inherit)
    {
        const mesh = this.GetMesh(meshId);
        const next = !!inherit;
        if (mesh.inheritOverlayEffects === next) return;
        mesh.inheritOverlayEffects = mesh.renderer.inheritOverlayEffects = next;
        this._revision++;
    }

    AddMeshOverlayEffect(meshId, overlayEffect)
    {
        if (!overlayEffect) throw new TypeError("overlayEffect must not be null");
        this.GetMesh(meshId).ownOverlayEffects.push(overlayEffect);
    }

    RemoveMeshOverlayEffect(meshId, overlayEffect)
    {
        const overlays = this.GetMesh(meshId).ownOverlayEffects;
        const index = overlays.indexOf(overlayEffect);
        if (index !== -1) overlays.splice(index, 1);
    }

    ClearMeshOverlayEffects(meshId)
    {
        this.GetMesh(meshId).ownOverlayEffects.length = 0;
    }

    GetMeshOverlayEffectCount(meshId)
    {
        return this.GetMesh(meshId).ownOverlayEffects.length;
    }

    CollectOwnedLocatorSets(parentTransform, out = [])
    {
        for (const mesh of this.meshes)
        {
            if (!mesh.ownedLocatorSets.length) continue;
            for (let index = 0; index < mesh.instances.length; index++)
            {
                const childToObject = mat4.create();
                mat4.multiply(childToObject, parentTransform, mesh.instances[index]);
                for (const sets of mesh.ownedLocatorSets)
                {
                    out.push({
                        childToObject: mat4.clone(childToObject),
                        owner: this,
                        partTag: mesh.partTags[index],
                        sets
                    });
                }
            }
        }
        return out;
    }

    GetPartDamageOverlay(partTag)
    {
        return this._partDamageOverlays.get(Number(partTag) >>> 0) || null;
    }

    CreatePartDamageOverlay(partTag)
    {
        const tag = Number(partTag) >>> 0;
        if (!this._partDamageOverlays.has(tag))
        {
            const overlay = new EveDamageOverlay();
            overlay.SetArmorDamageShaderEffect(this.GetPartArmorDamageShaderEffect(tag));
            const found = this.FindMeshByPartTag(tag);
            overlay.SetDamageLocatorCount(this.GetDamageLocators(found?.mesh).length);
            this._partDamageOverlays.set(tag, overlay);
        }
    }

    GetPartArmorDamageShaderEffect(partTag)
    {
        return this.FindMeshByPartTag(Number(partTag) >>> 0)?.mesh.armorDamageShader || null;
    }

    GetPartDamageLocatorAnimatedLocal(partTag, index, outPosition, outDirection)
    {
        const found = this.FindMeshByPartTag(Number(partTag) >>> 0);
        if (!found) return false;
        const locators = this.GetDamageLocators(found.mesh);
        const locatorIndex = Number(index) | 0;
        if (locatorIndex < 0 || locatorIndex >= locators.length) return false;

        const locator = locators[locatorIndex];
        vec3.transformMat4(outPosition, locator.position, found.mesh.instances[found.instanceIndex]);
        vec3.set(outDirection, 0, 0, 1);
        vec3.transformQuat(outDirection, outDirection, locator.rotation);
        const transform = found.mesh.instances[found.instanceIndex];
        const x = outDirection[0], y = outDirection[1], z = outDirection[2];
        outDirection[0] = transform[0] * x + transform[4] * y + transform[8] * z;
        outDirection[1] = transform[1] * x + transform[5] * y + transform[9] * z;
        outDirection[2] = transform[2] * x + transform[6] * y + transform[10] * z;
        vec3.normalize(outDirection, outDirection);
        return true;
    }

    GetRevision()
    {
        return this._revision;
    }

    Destroy()
    {
        for (const mesh of this.meshes) mesh.instanceData.Unload();
        this.meshes.length = 0;
    }

    GetMesh(meshId)
    {
        const index = Number(meshId) >>> 0;
        if (index >= this.meshes.length)
        {
            throw new RangeError(`EveChildInstancedMeshes mesh index ${index} is out of range`);
        }
        return this.meshes[index];
    }

    FindMeshByPartTag(partTag)
    {
        for (const mesh of this.meshes)
        {
            const instanceIndex = mesh.partTags.indexOf(partTag);
            if (instanceIndex !== -1) return { mesh, instanceIndex };
        }
        return null;
    }

    GetDamageLocators(mesh)
    {
        if (!mesh) return [];
        for (const set of mesh.ownedLocatorSets)
        {
            if (set.HasName?.("damage") || set.name === "damage") return set.GetLocators?.() || set.locators;
        }
        return [];
    }

    static AreasEqual(existing, incoming)
    {
        if (existing.length !== incoming.length) return false;
        for (let index = 0; index < existing.length; index++)
        {
            const a = existing[index];
            const b = incoming[index];
            if (a.effect !== b.effect ||
                EveChildInstancedMeshes.GetAreaModeFromValue(b) !== EveChildInstancedMeshes.GetAreaModeFromValue(a) ||
                a.index !== (Number(b.areaIndex ?? b.index) >>> 0) ||
                a.count !== (b.areaCount === undefined
                    ? (b.count === undefined ? 1 : Number(b.count) >>> 0)
                    : Number(b.areaCount) >>> 0))
            {
                return false;
            }
        }
        return true;
    }

    static GetAreaModeFromValue(area)
    {
        return Number(area.batchType ?? area._batchType) >>> 0;
    }

    static GetAreaMode(mesh, area)
    {
        for (const [ mode, name ] of EveChildInstancedMeshes.AREA_LISTS)
        {
            if (mesh[name].includes(area)) return mode;
        }
        return RM_OPAQUE;
    }

    static GetAreaList(mesh, mode)
    {
        for (const [ value, name ] of EveChildInstancedMeshes.AREA_LISTS)
        {
            if (value === mode) return mesh[name];
        }
        return mesh.opaqueAreas;
    }

    static NO_PART_TAG = 0;

    static INSTANCE_FLOATS = 28;

    static INSTANCE_DECLARATION = [
        { usage: "TEXCOORD", usageIndex: 0, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 1, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 2, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 3, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 4, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 5, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 6, elements: 4 }
    ];

    static AREA_LISTS = [
        [ RM_OPAQUE, "opaqueAreas" ],
        [ RM_DECAL, "decalAreas" ],
        [ RM_TRANSPARENT, "transparentAreas" ],
        [ RM_ADDITIVE, "additiveAreas" ],
        [ RM_DEPTH, "depthAreas" ],
        [ RM_PICKABLE, "pickableAreas" ],
        [ RM_DISTORTION, "distortionAreas" ],
        [ RM_NORMAL, "depthNormalAreas" ]
    ];

    static global = {
        box3_0: box3.create(),
        box3_1: box3.create()
    };

    static __isEffectChild = true;
}
