import { meta } from "utils";
import { resMan, device } from "global";
import { box3, sph3, vec3, vertex } from "math";
import { Tw2BinaryReader, GsfReader, Gr2Reader, OBJReader, GR2JsonReader, GltfReader } from "../reader";
import { Tw2VertexElement } from "../vertex";
import { ErrResourceFormatUnsupported, Tw2Resource } from "./Tw2Resource";
import { Tw2Error } from "../Tw2Error";

import {
    Tw2GeometryAnimation,
    Tw2GeometryCurve,
    Tw2GeometryMesh,
    Tw2GeometryMeshArea,
    Tw2GeometryMeshBinding,
    Tw2GeometryModel,
} from "../geometry";


// Todo: Change to registration process
const readers = {
    [OBJReader.extension.toLowerCase()]: OBJReader,
    [Gr2Reader.extension.toLowerCase()]: Gr2Reader,
    [GR2JsonReader.extension.toLowerCase()]: GR2JsonReader,
    [GltfReader.extension.toLowerCase()]: GltfReader,
    [GsfReader.extension.toLowerCase()]: GsfReader
};

/**
 * Geometry resource
 *
 * @inheritDoc {Tw2Resource}
 * @property {Array<Tw2GeometryMesh>} meshes
 * @property {vec3} minBounds
 * @property {vec3} maxBounds
 * @property {vec3} boundsSpherePosition
 * @property {Number} boundsSphereRadius
 * @property {Array<Tw2GeometryModel>} models
 * @property {Array<Tw2GeometryAnimation>} animations
 * @property {Boolean} _boundsDirty
 */
@meta.define("Tw2GeometryRes", "TriGeometryRes")
export class Tw2GeometryRes extends Tw2Resource
{

    meshes = [];
    minBounds = vec3.fromValues(0, 0, 0);
    maxBounds = vec3.fromValues(0, 0, 0);
    boundsSpherePosition = vec3.create();
    boundsSphereRadius = 0;
    models = [];
    animations = [];

    _isCustom = false;
    _requiresSystemMirror = false;
    _requestResponseType = null;
    _extension = null;
    _boundsDirty = true;

    /**
     * Sets system mirror
     * @param {Boolean} enable
     * @returns {Promise<Boolean>} true if the resource was reloaded
     */
    async SetSystemMirror(enable)
    {
        let reloadRequired = false;

        for (let i = 0; i < this.meshes.length; i++)
        {
            if (!this.meshes[i].HasSystemMirror() && enable || this.meshes[i].IsSystemMirrorRequired())
            {
                reloadRequired = true;
                break;
            }
        }

        if (reloadRequired)
        {
            if (this._custom)
            {
                this.UpdateFromJSON(this._custom.factory(this._custom.options));
            }
            else
            {
                await new Promise((onResolved, onRejected) =>
                {
                    this.RegisterCallbacks(onResolved, onRejected);
                    resMan.LoadResource(this, {
                        name: "System Mirror",
                        message: "Rebuilding system mirror"
                    });
                });
            }
        }

        if (!enable)
        {
            this.ClearSystemMirrorIfNotRequired();
        }

        return reloadRequired;
    }

    /**
     * Forces system mirror
     * @param {Boolean} bool
     * @returns {Promise<boolean>} true if resource was reloaded
     */
    async ForceSystemMirror(bool)
    {
        this._requiresSystemMirror = !!bool;
        return this.SetSystemMirror(bool);
    }

    /**
     * Reloads the geometry
     * @param {*} log
     */
    Reload(log)
    {
        if (this._custom)
        {
            this.UpdateFromJSON(this._custom.factory(this._custom.options));
        }
        else
        {
            super.Reload(log);
        }
    }

    /**
     * Clears system mirror if not required
     */
    ClearSystemMirrorIfNotRequired()
    {
        if (!this._requiresSystemMirror && !this._isCustom)
        {
            for (let i = 0; i < this.meshes.length; i++)
            {
                this.meshes[i].ClearSystemMirrorIfNotRequired();
            }
        }
    }

    /**
     * Does an intersection test on the geometry resource
     * @param {Tw2RayCaster} ray
     * @param {Array} intersects
     * @param {mat4} worldTransform
     * @param {Object} [cache={}]
     * @param {Number} meshIndex
     * @returns {Array}
     */
    Intersect(ray, intersects, worldTransform, cache = {}, meshIndex = 0)
    {
        //console.log("Intersecting geometry resource: " + this.path);

        this.RebuildBounds();
        const intersect = ray.IntersectBounds(this.minBounds, this.maxBounds, worldTransform);
        if (!intersect) return [];

        const internalIntersects = [];

        const mesh = this.meshes[meshIndex];
        if (mesh)
        {
            mesh.Intersect(ray, intersects, worldTransform, cache)
                .forEach(intersect =>
                {
                    intersect.geometryResource = this;
                    intersect.meshIndex = meshIndex;
                    intersect.mesh = mesh;
                    internalIntersects.push(intersect);

                    // The geometry levels, so a path reaches the ITEM that was hit.
                    //
                    // It stops at the mesh, which IS `intersect.item`. Area, face,
                    // edge and vertex are all DATA about where on that item the ray
                    // landed, not things a path can name - and pushing them into the
                    // path would break the invariant worth having, that
                    // `Resolve(root, path)` returns exactly the item that was hit.
                    // They are already on the record as `areaIndex`, `faceIndex`,
                    // `edgeStartIndex`/`edgeEndIndex` and `vertexIndex`.
                    if (ray.Trail)
                    {
                        ray.Trail(intersect, `meshes[${meshIndex}]`);
                        ray.Trail(intersect, "geometryResource");
                    }
                });
        }

        return internalIntersects.sort(ray._sortFunction);
    }

    /**
     * Rebuilds bounds
     */
    RebuildBounds(force)
    {
        if (!this._boundsDirty && !force)
        {
            for (let i = 0; i < this.meshes.length; i++)
            {
                if (this.meshes[i]._boundsDirty)
                {
                    this._boundsDirty = true;
                    break;
                }
            }
        }

        if (this._boundsDirty || force)
        {
            const
                min = this.minBounds,
                max = this.maxBounds;

            box3.bounds.empty(min, max);
            for (let i = 0; i < this.meshes.length; i++)
            {
                const mesh = this.meshes[i];
                mesh.RebuildBounds(force);
                box3.bounds.union(min, max, min, max, mesh.minBounds, mesh.maxBounds);
            }

            this.boundsSphereRadius = box3.bounds.toPositionRadius(min, max, this.boundsSpherePosition);
            this._boundsDirty = false;
        }
    }

    /**
     * Gets bounding box
     * @param {box3} out
     * @param {boolean} force
     * @return {null|box3}
     */
    GetBoundingBox(out, force)
    {
        this.RebuildBounds(force);
        return box3.fromBounds(out, this.minBounds, this.maxBounds);
    }

    /**
     * Gets bounding sphere
     * @param {sph3} out
     * @param {boolean} force
     * @return {null|sph3}
     */
    GetBoundingSphere(out, force)
    {
        this.RebuildBounds(force);
        return sph3.fromPositionRadius(out, this.boundsSpherePosition, this.boundsSphereRadius);
    }


    /**
     * GetInstanceBuffer
     * @param {Number} meshIndex
     * @returns {*}
     */
    GetInstanceBuffer(meshIndex)
    {
        return meshIndex < this.meshes.length ? this.meshes[meshIndex].buffer : undefined;
    }

    /**
     * GetInstanceDeclaration
     * @param {Number} meshIndex
     * @returns {Tw2VertexDeclaration}
     */
    GetInstanceDeclaration(meshIndex)
    {
        return this.meshes[meshIndex].declaration;
    }

    /**
     * GetInstanceStride
     * @param {Number} meshIndex
     * @returns {Number}
     */
    GetInstanceStride(meshIndex)
    {
        return this.meshes[meshIndex].declaration.stride;
    }

    /**
     * GetInstanceCount
     * @param {Number} meshIndex
     * @returns {Number}
     */
    GetInstanceCount(meshIndex)
    {
        return this.meshes[meshIndex].bufferLength * 4 / this.meshes[meshIndex].declaration.stride;
    }

    /**
     * Handles different geometry formats
     * @param {String} url
     * @param {String} extension
     */
    DoCustomLoad(url, extension)
    {
        this._extension = null;
        this._requestResponseType = null;

        const reader = readers[extension.toLowerCase()];
        if (!reader) throw new ErrResourceFormatUnsupported({ format: extension });

        this._extension = extension;
        this._requestResponseType = reader.requestResponseType;
    }

    /**
     * Clears the geometry data
     */
    Clear()
    {
        for (let i = 0; i < this.meshes.length; i++) this.meshes[i].Clear();
        this.meshes.splice(0);
        this.models.splice(0);
        this.animations.splice(0);
        vec3.set(this.minBounds, 0, 0, 0);
        vec3.set(this.maxBounds, 0, 0, 0);
        vec3.set(this.boundsSpherePosition, 0, 0, 0);
        this.boundsSphereRadius = 0;
    }

    /**
     * Prepares the object
     * TODO: Normalize geometry readers
     * @param {*} data
     * @param {Object} [options]
     */
    Prepare(data, options)
    {
        this.Clear();

        const Reader = readers[this._extension];
        if (!Reader) throw new ErrResourceFormatUnsupported({ format: this._extension });

        // TODO: Remove this option
        if (Reader.byMesh)
        {
            this.PrepareFromMeshes(Reader.construct(data));
        }
        else
        {
            Reader.Prepare(data, this, options);
        }

        this.RebuildBounds();
        this._custom = null;

        if (!resMan.IsSystemMirrorEnabled()) this.ClearSystemMirrorIfNotRequired();
        this.OnPrepared();
    }

    /**
     * Prepares custom formats
     * @param {Array<Object>}meshes
     */
    PrepareFromMeshes(meshes)
    {
        const gl = device.gl;

        for (let i = 0; i < meshes.length; i++)
        {
            const { bufferData, indexData, declaration, areas, name = `${this.path}_model_${i}` } = meshes[i];

            const mesh = new Tw2GeometryMesh();
            this.meshes[i] = mesh;

            mesh.name = name;
            mesh.declaration = declaration;

            mesh.bufferLength = bufferData.length;
            mesh.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);

            mesh.indexes = gl.createBuffer();
            mesh.indexType = indexData.BYTES_PER_ELEMENT === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

            for (let i = 0; i < areas.length; ++i)
            {
                const { name, start, count } = areas[i];
                const area = new Tw2GeometryMeshArea();
                area.name = name;
                area.start = start;
                area.count = count;
                mesh.areas.push(area);
            }

            mesh.RecalculateAreaBounds(bufferData, indexData);

            mesh._areas = areas.length;
            mesh._faces = indexData.length / 3;
            mesh._vertices = bufferData.length / (mesh.declaration.stride / 4);
            mesh.bufferData = bufferData;
            mesh.indexData = indexData;

            // Temporary
            this.models[i] = new Tw2GeometryModel();
        }
    }

    /**
     * BindMeshToModel
     * @param {Tw2GeometryMesh} mesh
     * @param {Tw2GeometryModel} model
     * @param {Tw2GeometryRes} res
     */
    static BindMeshToModel(mesh, model, res, opt = {})
    {
        const binding = new Tw2GeometryMeshBinding();
        binding.mesh = mesh;
        const fallbackBone = model.FindBoneByName("Root") || model.skeleton?.bones?.[0] || null;
        for (let b = 0; b < binding.mesh.boneBindings.length; ++b)
        {
            const
                name = binding.mesh.boneBindings[b],
                bone = model.FindBoneByName(name);

            if (!bone)
            {
                if (opt.skipInvalidBoneBindings)
                {
                    if (!fallbackBone)
                    {
                        console.warn(
                            `CCPWGL2 Resource manager: Skipping geometry mesh '${binding.mesh.name}' ` +
                            `bone binding '${name}' for model '${model.name}' because no fallback bone exists`,
                            res.path
                        );
                        return null;
                    }

                    console.warn(
                        `CCPWGL2 Resource manager: Binding geometry mesh '${binding.mesh.name}' ` +
                        `invalid bone name '${name}' for model '${model.name}' to fallback bone`,
                        res.path
                    );
                    binding.bones.push(fallbackBone);
                    continue;
                }

                throw new ErrGeometryMeshBoneNameInvalid({
                    path: res.path,
                    mesh: binding.mesh.name,
                    bone: name,
                    model: model.name
                });
            }
            else
            {
                binding.bones.push(bone);
                bone.boundingBox = mesh.FindBoneBoundsByName(name);
            }
        }
        model.meshBindings.push(binding);
        return binding;
    }

    /**
     * RenderAreasInstanced
     * @param {Number} meshIx
     * @param {Number} start
     * @param {Number} count
     * @param {Tw2Effect} effect
     * @param {String} technique
     * @param instanceVB
     * @param {Tw2VertexDeclaration} instanceDecl
     * @param {Number} instanceStride
     * @param {Number} instanceCount
     * @returns {Boolean}
     */
    RenderAreasInstanced(meshIx, start, count, effect, technique = effect.defaultTechnique, instanceVB, instanceDecl, instanceStride, instanceCount, usageOffset = 0)
    {
        this.KeepAlive();
        const passCount = effect.GetPassCount(technique);
        if (!passCount || !this.IsGood() || meshIx >= this.meshes.length) return false;

        const
            d = device,
            gl = d.gl,
            mesh = this.meshes[meshIx];

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);

        for (let pass = 0; pass < passCount; ++pass)
        {
            effect.ApplyPass(technique, pass);
            const passInput = effect.GetPassInput(technique, pass);
            if (passInput.elements.length === 0) continue;

            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
            mesh.declaration.SetPartialDeclaration(d, passInput, mesh.declaration.stride);

            gl.bindBuffer(gl.ARRAY_BUFFER, instanceVB);
            const resetData = instanceDecl.SetPartialDeclaration(d, passInput, instanceStride, usageOffset, 1);

            d.ApplyShadowState();

            for (let i = 0; i < count; ++i)
            {
                if (i + start < mesh.areas.length)
                {
                    let area = mesh.areas[i + start],
                        areaStart = area.start,
                        areaCount = area.count;

                    while (i + 1 < count)
                    {
                        area = mesh.areas[i + 1 + start];

                        if (!area)
                        {
                            this.OnError(new ErrGeometryMeshAreaMissing({
                                path: this.path,
                                areaIndex: i + 1 + start
                            }));
                            return false;
                        }

                        if (area.start !== areaStart + areaCount * 2) break;
                        areaCount += area.count;
                        ++i;
                    }
                    gl.drawElementsInstanced(gl.TRIANGLES, areaCount, mesh.indexType, areaStart, instanceCount);
                }
            }
            instanceDecl.ResetInstanceDivisors(d, resetData);
        }
        return true;
    }

    /**
     * RenderAreas
     * @param {Number} meshIx
     * @param {Number} start
     * @param {Number} count
     * @param {Tw2Effect} effect
     * @param {String} technique
     * @returns {Boolean}
     */
    RenderAreas(meshIx, start, count, effect, technique = effect.defaultTechnique, instanceCount)
    {
        this.KeepAlive();
        const passCount = effect.GetPassCount(technique);
        if (!passCount || !this.IsGood() || meshIx >= this.meshes.length) return false;

        const
            d = device,
            gl = d.gl,
            mesh = this.meshes[meshIx] || this.meshes[0];

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);

        for (let pass = 0; pass < passCount; ++pass)
        {
            effect.ApplyPass(technique, pass);
            const passInput = effect.GetPassInput(technique, pass);
            if (!mesh.declaration.SetDeclaration(d, passInput, mesh.declaration.stride))
            {
                this.OnError(new ErrGeometryMeshEffectBinding({
                    path: this.path,
                    pass: pass,
                    passInput: passInput,
                    meshStride: mesh.declaration.stride
                }));
                return false;
            }

            d.ApplyShadowState();

            for (let i = 0; i < count; ++i)
            {
                if (i + start < mesh.areas.length)
                {
                    let area = mesh.areas[i + start],
                        areaStart = area.start,
                        areaCount = area.count;

                    while (i + 1 < count)
                    {
                        area = mesh.areas[i + 1 + start];

                        if (!area)
                        {
                            this.OnError(new ErrGeometryMeshAreaMissing({
                                path: this.path,
                                areaIndex: i + 1 + start
                            }));
                            return false;
                        }

                        if (area.start !== areaStart + areaCount * 2) break;
                        areaCount += area.count;
                        ++i;
                    }
                    // `instanceCount` draws the same geometry N times with a
                    // varying gl_InstanceID and NO instance vertex stream - for
                    // a shader that selects per-instance data from a constant
                    // array by instance id, which is how Carbon draws a turret
                    // set. Distinct from RenderAreasInstanced below, which binds
                    // an instance buffer.
                    if (instanceCount > 0)
                    {
                        gl.drawElementsInstanced(gl.TRIANGLES, areaCount, mesh.indexType, areaStart, instanceCount);
                    }
                    else
                    {
                        gl.drawElements(gl.TRIANGLES, areaCount, mesh.indexType, areaStart);
                    }
                }
            }
        }
        return true;
    }

    /**
     * RenderLines
     * @param {Number} meshIx
     * @param {Number} start
     * @param {Number} count
     * @param {Tw2Effect} effect
     * @param {String} technique
     * @returns {Boolean}
     */
    RenderLines(meshIx, start, count, effect, technique = effect.defaultTechnique)
    {
        this.KeepAlive();
        const passCount = effect.GetPassCount(technique);
        if (!passCount || !this.IsGood() || meshIx >= this.meshes.length) return false;

        const
            d = device,
            gl = d.gl,
            mesh = this.meshes[meshIx];

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);

        for (let pass = 0; pass < passCount; ++pass)
        {
            effect.ApplyPass(technique, pass);
            const passInput = effect.GetPassInput(technique, pass);
            if (!mesh.declaration.SetDeclaration(d, passInput, mesh.declaration.stride))
            {
                this.OnError(new ErrGeometryMeshEffectBinding({
                    path: this.path,
                    pass: pass,
                    passInput: passInput,
                    meshStride: mesh.declaration.stride
                }));
                return false;
            }

            d.ApplyShadowState();

            for (let i = 0; i < count; ++i)
            {
                if (i + start < mesh.areas.length)
                {
                    let area = mesh.areas[i + start],
                        areaStart = area.start,
                        areaCount = area.count;

                    while (i + 1 < count)
                    {
                        area = mesh.areas[i + 1 + start];

                        if (!area)
                        {
                            this.OnError(new ErrGeometryMeshAreaMissing({
                                path: this.path,
                                areaIndex: i + 1 + start
                            }));
                            return false;
                        }

                        if (area.start !== areaStart + areaCount * 2) break;
                        areaCount += area.count;
                        ++i;
                    }
                    gl.drawElements(gl.LINES, areaCount, mesh.indexType, areaStart);
                }
            }
        }
        return true;
    }

    /**
     * RenderDebugInfo
     * @param {function} debugHelper
     * @returns {Boolean}
     */
    RenderDebugInfo(debugHelper)
    {
        if (!this.IsGood()) return false;

        for (let i = 0; i < this.models.length; ++i)
        {
            if (this.models[i].skeleton)
            {
                for (let j = 0; j < this.models[i].skeleton.bones.length; ++j)
                {
                    const b0 = this.models[i].skeleton.bones[j];
                    if (b0.parentIndex >= 0)
                    {
                        const b1 = this.models[i].skeleton.bones[b0.parentIndex];
                        debugHelper["AddLine"](
                            [ b0.worldTransform[12], b0.worldTransform[13], b0.worldTransform[14] ],
                            [ b1.worldTransform[12], b1.worldTransform[13], b1.worldTransform[14] ],
                            [ 0, 0.7, 0, 1 ], [ 0, 0.7, 0, 1 ]);
                    }
                }
            }
        }
    }

    /**
     * Unloads webgl and javascript resources
     * @param {eventLog} eventLog
     * @returns {Boolean}
     */
    Unload(eventLog)
    {
        for (let i = 0; i < this.meshes.length; ++i)
        {
            const gl = device.gl;

            if (this.meshes[i].buffer)
            {
                gl.deleteBuffer(this.meshes[i].buffer);
                this.meshes[i].buffer = null;
            }

            if (this.meshes[i].indexes)
            {
                gl.deleteBuffer(this.meshes[i].indexes);
                this.meshes[i].indexes = null;
            }
        }
        this.OnUnloaded(eventLog);
        return true;
    }

    /**
     * Updates the geometry res from json
     * @param {Object} json
     * @param {Object} [extensionOptions] - options for the geometry reader
     */
    UpdateFromJSON(json, extensionOptions)
    {
        this.Clear();

        this._extension = "gr2_json";
        this._isCustom = true;
        const Reader = readers[this._extension];
        if (!Reader) throw new ErrResourceFormatUnsupported({ format: this._extension });
        Reader.Prepare(json, this, extensionOptions);
        this.RebuildBounds();

        if (json.factory)
        {
            this._custom = this._custom || {};
            this._custom.factory = json.factory;
            this._custom.options = json.options;
        }
    }


    /**
     * Creates a geometry resource from json data
     * @param {Array<Object>|Object} json
     * @param {Object} [options]
     * @param {Tw2GeometryRes} [res]
     * @returns {Tw2GeometryRes}
     */
    static from(json, options)
    {
        const res = new Tw2GeometryRes();
        res.UpdateFromJSON(json, options);
        return res;
    }

}


/**
 * Throws when a geometry mesh lacks an element required for a particle system
 */
export class ErrGeometryMeshMissingParticleElement extends Tw2Error
{
    constructor(data)
    {
        super(data, "Input geometry mesh lacks element required by particle system");
    }
}


/**
 * Throws when a geometry mesh element doesn't have the required number of components
 */
export class ErrGeometryMeshElementComponentsMissing extends Tw2Error
{
    constructor(data)
    {
        super(data, "Input geometry mesh elements do not have the required number of components");
    }
}

/**
 * Throws when a geometry mesh area is missing
 */
export class ErrGeometryMeshAreaMissing extends Tw2Error
{
    constructor(data)
    {
        super(data, "Geometry mesh missing expected area at index %areaIndex%");
    }
}

/**
 * Throws when a geometry mesh has an invalid bone name for a model
 */
export class ErrGeometryMeshBoneNameInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "Geometry mesh '%mesh%' has invalid bone name '%bone%' for model '%model%'");
    }
}


/**
 * Throws when there is an error binding a geometry mesh to an effect
 */
export class ErrGeometryMeshEffectBinding extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error binding geometry mesh to effect");
    }
}

/**
 * Throws when a geometry mesh has an invalid file type
 */
export class ErrGeometryFileType extends Tw2Error
{
    constructor(data)
    {
        super(data, "Invalid geometry file type (%fileType%)");
    }
}
