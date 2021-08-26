import { meta } from "utils";
import { resMan, device } from "global";
import { box3, sph3, vec3, quat, mat3, mat4 } from "math";
import { Tw2BinaryReader } from "../reader";
import { Tw2VertexElement } from "../vertex";
import { ErrResourceFormatUnsupported, Tw2Resource } from "./Tw2Resource";
import { Tw2Error } from "../Tw2Error";
import { Tw2CakeReader } from "./Tw2CakeReader";
import { Tw2WaveFrontReader } from "./Tw2WavefrontReader";

import {
    Tw2BlendShapeData,
    Tw2GeometryAnimation,
    Tw2GeometryBone,
    Tw2GeometryCurve,
    Tw2GeometryMesh,
    Tw2GeometryMeshArea,
    Tw2GeometryMeshBinding,
    Tw2GeometryModel,
    Tw2GeometrySkeleton,
    Tw2GeometryTrackGroup,
    Tw2GeometryTransformTrack
} from "../geometry";

@meta.type("Tw2GeometryRes", "TriGeometryRes")
export class Tw2GeometryRes extends Tw2Resource
{

    meshes = [];
    minBounds = vec3.fromValues(0, 0, 0);
    maxBounds = vec3.fromValues(0, 0, 0);
    boundsSpherePosition = vec3.create();
    boundsSphereRadius = 0;
    models = [];
    animations = [];
    systemMirror = resMan.systemMirror;


    _requestResponseType = null;
    _extension = null;


    /**
     * Gets the object's bounding box
     * @param {box3} out
     * @param {mat4} [parentTransform]
     * @returns {Boolean} True if bounds are valid
     */
    GetBoundingBox(out, parentTransform)
    {
        box3.fromBounds(out, this.minBounds, this.maxBounds);
        if (parentTransform) box3.transformMat4(out, out, parentTransform);
        return true;
    }

    /**
     * Gets the object's bounding sphere
     * @param {sph3} out
     * @param {mat4} [parentTransform]
     * @returns {Boolean} True if bounds are valid
     */
    GetBoundingSphere(out, parentTransform)
    {
        sph3.fromPositionRadius(out, this.boundsSpherePosition, this.boundsSphereRadius);
        if (parentTransform) sph3.transformMat4(out, out, parentTransform);
        return true;
    }

    /**
     * Rebuilds bounds
     * @returns {Boolean} [fromVertex]
     */
    RebuildBounds(fromVertex)
    {
        const
            min = this.minBounds,
            max = this.maxBounds;

        box3.bounds.empty(min, max);
        for (let i = 0; i < this.meshes.length; i++)
        {
            const mesh = this.meshes[i];
            mesh.RebuildBounds(fromVertex);
            box3.bounds.union(min, max, min, max, mesh.minBounds, mesh.maxBounds);
        }

        this.boundsSphereRadius = box3.bounds.toPositionRadius(min, max, this.boundsSpherePosition);
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

        switch (extension)
        {
            case "wbg":
                this._extension = extension;
                this._requestResponseType = "arraybuffer";
                break;

            case "cake":
            case "obj":
                this._extension = extension;
                this._requestResponseType = "text";
                break;

            default:
                throw new ErrResourceFormatUnsupported({ format: extension });
        }
    }

    /**
     * Prepares the object
     * @param {*} data
     */
    Prepare(data)
    {
        // Clear current geometry
        this.meshes.splice(0);
        this.models.splice(0);
        this.animations.splice(0);
        vec3.set(this.minBounds, 0, 0, 0);
        vec3.set(this.maxBounds, 0, 0, 0);
        vec3.set(this.boundsSpherePosition, 0, 0, 0);
        this.boundsSphereRadius = 0;

        switch (this._extension)
        {
            case "wbg":
                this.PrepareWBG(data);
                break;

            case "cake":
                this.PrepareCustom(Tw2CakeReader.construct(data));
                break;

            case "obj":
                this.PrepareCustom(Tw2WaveFrontReader.construct(data));
                break;

            default:
                throw new ErrResourceFormatUnsupported({ format: this._extension });
        }
    }

    /**
     * Prepares custom formats
     * @param {Array<Tw2GeometryReader>}meshes
     */
    PrepareCustom(meshes)
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
                mesh.RebuildAreaBounds(area, bufferData, indexData, true);
            }

            mesh._areas = areas.length;
            mesh._faces = indexData.length / 3;
            mesh._vertices = bufferData.length / (mesh.declaration.stride / 4);

            if (this.systemMirror)
            {
                mesh.bufferData = bufferData;
                mesh.indexData = indexData;
            }

            /*
            const { models, animations, boneBindings, blendShapes } = result;

            for (let i = 0; i < boneBindings.length; i++)
            {
                // TODO: Bone bindings
            }

            for (let i = 0; i < blendShapes.length; i++)
            {
                //TODO: Blend shapes
            }

            for (let i = 0; i < models; i++)
            {
                //TODO: Models
            }

            for (let i = 0; i < animations; i++)
            {
                //TODO: Animations
            }
             */

            // Temporary
            this.models[i] = new Tw2GeometryModel();
        }

        this.RebuildBounds();
        this.OnPrepared();
    }

    /**
     * Prepares a wbg file
     * @param {ArrayBuffer} data
     */
    PrepareWBG(data)
    {
        const
            gl = device.gl,
            reader = new Tw2BinaryReader(new Uint8Array(data));

        /* let fileVersion = */
        reader.ReadUInt8();
        const meshCount = reader.ReadUInt8();
        for (let meshIx = 0; meshIx < meshCount; ++meshIx)
        {
            const mesh = new Tw2GeometryMesh();
            mesh.name = reader.ReadString();
            const buffer = Tw2GeometryRes.ReadVertexBuffer(reader, mesh.declaration, this.path);

            if (buffer)
            {
                mesh.bufferLength = buffer.length;
                mesh.buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
                gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
            }
            else
            {
                mesh.buffer = null;
            }

            const indexes = Tw2GeometryRes.ReadIndexBuffer(reader);
            if (indexes)
            {
                mesh.indexes = gl.createBuffer();
                mesh.indexType = indexes.BYTES_PER_ELEMENT === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexes, gl.STATIC_DRAW);
            }
            else
            {
                mesh.indexes = null;
            }

            const areaCount = reader.ReadUInt8();
            for (let i = 0; i < areaCount; ++i)
            {
                const area = new Tw2GeometryMeshArea();
                mesh.areas.push(area);

                area.name = reader.ReadString();
                area.start = reader.ReadUInt32() * indexes.BYTES_PER_ELEMENT;
                area.count = reader.ReadUInt32() * 3;

                vec3.set(area.minBounds, reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32());
                vec3.set(area.maxBounds, reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32());

                area.boundsSphereRadius = box3.bounds.toPositionRadius(
                    area.minBounds,
                    area.maxBounds,
                    area.boundsSpherePosition
                );

                // Recalculate bounds if missing
                if (box3.bounds.isEmpty(area.minBounds, area.maxBounds))
                {
                    if (!mesh.RebuildAreaBounds(area, buffer, indexes, true))
                    {
                        console.log("Could not generate bounds for area: " + area.name || "unknown");
                    }
                }
            }

            const boneBindingCount = reader.ReadUInt8();
            mesh.boneBindings = [];
            for (let i = 0; i < boneBindingCount; ++i)
            {
                mesh.boneBindings[i] = reader.ReadString();
            }

            const annotationSetCount = reader.ReadUInt16();
            if (annotationSetCount || this.systemMirror)
            {
                mesh.bufferData = buffer;
                mesh.indexData = indexes;
            }

            if (annotationSetCount)
            {
                mesh.blendShapes = [];
                for (let i = 0; i < annotationSetCount; ++i)
                {
                    mesh.blendShapes[i] = new Tw2BlendShapeData();
                    mesh.blendShapes[i].name = reader.ReadString();
                    mesh.blendShapes[i].buffer = Tw2GeometryRes.ReadVertexBuffer(reader, mesh.blendShapes[i].declaration, this.path);
                    mesh.blendShapes[i].indexes = Tw2GeometryRes.ReadIndexBuffer(reader);
                }
            }

            mesh._areas = areaCount;
            mesh._faces = indexes.length / 3;
            mesh._vertices = buffer.length / (mesh.declaration.stride / 4);

            /*

            // Reduce memory footprint of vertices

            const stride = mesh.declaration.stride / 4;
            const vertCount = buffer.length / stride;
            const position = mesh.declaration.FindUsage(0, 0);

            mesh._vertices = new Float32Array(vertCount * 3);
            for (let i = 0; i < mesh._vertices.length; i+=3)
            {
                const index = i * stride + position.offset;
                for (let x = 0; x < 3; x ++)
                {
                    mesh._vertices[i + x] = buffer[index + x];
                }
            }

            */

            this.meshes[meshIx] = mesh;
        }

        // Rebuilds all bounds
        this.RebuildBounds();

        const modelCount = reader.ReadUInt8();
        for (let modelIx = 0; modelIx < modelCount; ++modelIx)
        {
            const model = new Tw2GeometryModel();
            model.name = reader.ReadString();
            model.skeleton = new Tw2GeometrySkeleton();
            const boneCount = reader.ReadUInt8();

            for (let i = 0; i < boneCount; ++i)
            {
                const bone = new Tw2GeometryBone();
                bone.name = reader.ReadString();
                const flags = reader.ReadUInt8();
                bone.parentIndex = reader.ReadUInt8();
                if (bone.parentIndex === 255) bone.parentIndex = -1;

                if ((flags & 1) !== 0)
                {
                    vec3.set(bone.position, reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32());
                }
                else
                {
                    vec3.set(bone.position, 0, 0, 0);
                }

                if ((flags & 2) !== 0)
                {
                    quat.set(bone.orientation, reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32(), reader.ReadFloat32());
                }
                else
                {
                    quat.identity(bone.orientation);
                }

                if ((flags & 4) !== 0)
                {
                    for (let k = 0; k < 9; ++k)
                    {
                        bone.scaleShear[k] = reader.ReadFloat32();
                    }
                }
                else
                {
                    mat3.identity(bone.scaleShear);
                }
                model.skeleton.bones[i] = bone;
            }

            for (let i = 0; i < model.skeleton.bones.length; ++i)
            {
                model.skeleton.bones[i].UpdateTransform();
                if (model.skeleton.bones[i].parentIndex !== -1)
                {
                    mat4.multiply(model.skeleton.bones[i].worldTransform, model.skeleton.bones[model.skeleton.bones[i].parentIndex].worldTransform, model.skeleton.bones[i].localTransform);
                }
                else
                {
                    mat4.copy(model.skeleton.bones[i].worldTransform, model.skeleton.bones[i].localTransform);
                }
                mat4.invert(model.skeleton.bones[i].worldTransformInv, model.skeleton.bones[i].worldTransform);
            }

            const meshBindingCount = reader.ReadUInt8();
            for (let i = 0; i < meshBindingCount; ++i)
            {
                const mesh = reader.ReadUInt8();
                if (mesh < this.meshes.length)
                {
                    Tw2GeometryRes.BindMeshToModel(this.meshes[mesh], model, this);
                }
            }
            this.models[this.models.length] = model;
        }

        const animationCount = reader.ReadUInt8();
        for (let i = 0; i < animationCount; ++i)
        {
            const animation = new Tw2GeometryAnimation();
            animation.name = reader.ReadString();
            animation.duration = reader.ReadFloat32();
            const groupCount = reader.ReadUInt8();
            for (let j = 0; j < groupCount; ++j)
            {
                const group = new Tw2GeometryTrackGroup();
                group.name = reader.ReadString();
                for (let m = 0; m < this.models.length; ++m)
                {
                    if (this.models[m].name === group.name)
                    {
                        group.model = this.models[m];
                        break;
                    }
                }

                const transformTrackCount = reader.ReadUInt8();
                for (let k = 0; k < transformTrackCount; ++k)
                {
                    const track = new Tw2GeometryTransformTrack();
                    track.name = reader.ReadString();
                    track.orientation = Tw2GeometryRes.ReadCurve(reader);
                    track.position = Tw2GeometryRes.ReadCurve(reader);
                    track.scaleShear = Tw2GeometryRes.ReadCurve(reader);

                    if (track.orientation)
                    {
                        let lastX = 0;
                        let lastY = 0;
                        let lastZ = 0;
                        let lastW = 0;
                        for (let n = 0; n < track.orientation.controls.length; n += 4)
                        {
                            let x = track.orientation.controls[n];
                            let y = track.orientation.controls[n + 1];
                            let z = track.orientation.controls[n + 2];
                            let w = track.orientation.controls[n + 3];
                            if (lastX * x + lastY * y + lastZ * z + lastW * w < 0)
                            {
                                track.orientation.controls[n] = -x;
                                track.orientation.controls[n + 1] = -y;
                                track.orientation.controls[n + 2] = -z;
                                track.orientation.controls[n + 3] = -w;
                            }
                            lastX = x;
                            lastY = y;
                            lastZ = z;
                            lastW = w;
                        }
                    }
                    group.transformTracks[group.transformTracks.length] = track;
                }
                animation.trackGroups[animation.trackGroups.length] = group;
            }
            this.animations[this.animations.length] = animation;
        }

        this.OnPrepared();
    }

    /**
     * BindMeshToModel
     * @param {Tw2GeometryMesh} mesh
     * @param {Tw2GeometryModel} model
     * @param {Tw2GeometryRes} res
     */
    static BindMeshToModel(mesh, model, res)
    {
        const binding = new Tw2GeometryMeshBinding();
        binding.mesh = mesh;
        for (let b = 0; b < binding.mesh.boneBindings.length; ++b)
        {
            const
                name = binding.mesh.boneBindings[b],
                bone = model.FindBoneByName(name);

            if (!bone)
            {
                throw new ErrGeometryMeshBoneNameInvalid({
                    path: res.path,
                    mesh: binding.mesh.name,
                    bone: name,
                    model: model.name
                });
            }
            else
            {
                binding.bones[binding.bones.length] = bone;
            }
        }
        model.meshBindings[model.meshBindings.length] = binding;
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
    RenderAreasInstanced(meshIx, start, count, effect, technique, instanceVB, instanceDecl, instanceStride, instanceCount)
    {
        this.KeepAlive();
        if (!this.IsGood() || !effect.IsGood() || meshIx >= this.meshes.length) return false;

        const
            d = device,
            gl = d.gl,
            mesh = this.meshes[meshIx],
            passCount = effect.GetPassCount(technique);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);

        for (let pass = 0; pass < passCount; ++pass)
        {
            effect.ApplyPass(technique, pass);
            const passInput = effect.GetPassInput(technique, pass);
            if (passInput.elements.length === 0) continue;

            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
            mesh.declaration.SetPartialDeclaration(d, passInput, mesh.declaration.stride);

            gl.bindBuffer(gl.ARRAY_BUFFER, instanceVB);
            const resetData = instanceDecl.SetPartialDeclaration(d, passInput, instanceStride, 0, 1);

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
    RenderAreas(meshIx, start, count, effect, technique)
    {
        this.KeepAlive();
        if (!this.IsGood() || !effect.IsGood() || meshIx >= this.meshes.length) return false;

        const
            d = device,
            gl = d.gl,
            mesh = this.meshes[meshIx] || this.meshes[0],
            passCount = effect.GetPassCount(technique);

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
                    gl.drawElements(gl.TRIANGLES, areaCount, mesh.indexType, areaStart);
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
    RenderLines(meshIx, start, count, effect, technique)
    {
        this.KeepAlive();
        if (!this.IsGood() || !effect.IsGood() || meshIx >= this.meshes.length) return false;

        const
            d = device,
            gl = d.gl,
            mesh = this.meshes[meshIx],
            passCount = effect.GetPassCount(technique);

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
     * ReadVertexBuffer
     * @param {Tw2BinaryReader} reader
     * @param {Tw2VertexDeclaration} declaration
     * @param {String} path
     * @returns {?Float32Array}
     */
    static ReadVertexBuffer(reader, declaration, path)
    {
        const declCount = reader.ReadUInt8();
        let vertexSize = 0;

        for (let declIx = 0; declIx < declCount; ++declIx)
        {
            let element = new Tw2VertexElement();
            element.usage = reader.ReadUInt8();
            element.usageIndex = reader.ReadUInt8();
            element.fileType = reader.ReadUInt8();
            element.type = device.gl.FLOAT;
            element.elements = (element.fileType >> 5) + 1;
            element.offset = vertexSize * 4;
            declaration.elements[declIx] = element;
            vertexSize += element.elements;
        }
        declaration.RebuildHash();
        declaration.stride = vertexSize * 4;

        const vertexCount = reader.ReadUInt32();
        if (vertexCount === 0) return null;

        const buffer = new Float32Array(vertexSize * vertexCount);
        let index = 0;
        for (let vtxIx = 0; vtxIx < vertexCount; ++vtxIx)
        {
            for (let declIx = 0; declIx < declCount; ++declIx)
            {
                let el = declaration.elements[declIx];
                switch (el.fileType & 0xf)
                {
                    case 0:
                        if ((el.fileType & 0x10) !== 0)
                        {
                            for (let i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadInt8() / 127.0;
                            }
                        }
                        else
                        {
                            for (let i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadInt8();
                            }
                        }
                        break;

                    case 1:
                        if ((el.fileType & 0x10) !== 0)
                        {
                            for (let i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadInt8() / 32767.0;
                            }
                        }
                        else
                        {
                            for (let i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadInt16();
                            }
                        }
                        break;

                    case 2:
                        for (let i = 0; i < el.elements; ++i)
                        {
                            buffer[index++] = reader.ReadInt32();
                        }
                        break;

                    case 3:
                        for (let i = 0; i < el.elements; ++i)
                        {
                            buffer[index++] = reader.ReadFloat16();
                        }
                        break;

                    case 4:
                        for (let i = 0; i < el.elements; ++i)
                        {
                            buffer[index++] = reader.ReadFloat32();
                        }
                        break;

                    case 8:
                        if ((el.fileType & 0x10) !== 0)
                        {
                            for (let i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadUInt8() / 255.0;
                            }
                        }
                        else
                        {
                            for (let i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadUInt8();
                            }
                        }
                        break;

                    case 9:
                        if ((el.fileType & 0x10) !== 0)
                        {
                            for (let i = 0; i < declaration.elements[declIx].elements; ++i)
                            {
                                buffer[index++] = reader.ReadUInt8() / 65535.0;
                            }
                        }
                        else
                        {
                            for (let i = 0; i < el.elements; ++i)
                            {
                                buffer[index++] = reader.ReadUInt16();
                            }
                        }
                        break;

                    case 10:
                        for (let i = 0; i < el.elements; ++i)
                        {
                            buffer[index++] = reader.ReadUInt32();
                        }
                        break;

                    default:
                        throw new ErrGeometryFileType({ path: path, key: "fileType", value: el.fileType & 0xf });
                }
            }
        }
        return buffer;
    }

    /**
     * ReadIndexBuffer
     * @property {Tw2BinaryReader}
     * @returns {Uint16Array|Uint32Array}
     * @private
     */
    static ReadIndexBuffer(reader)
    {
        const
            ibType = reader.ReadUInt8(),
            indexCount = reader.ReadUInt32();

        if (ibType === 0)
        {
            const indexes = new Uint16Array(indexCount);
            for (let i = 0; i < indexCount; ++i)
            {
                indexes[i] = reader.ReadUInt16();
            }
            return indexes;
        }
        else
        {
            const indexes = new Uint32Array(indexCount);
            for (let i = 0; i < indexCount; ++i)
            {
                indexes[i] = reader.ReadUInt32();
            }
            return indexes;
        }
    }

    /**
     * ReadCurve
     * @returns {Tw2GeometryCurve}
     */
    static ReadCurve(reader)
    {
        const type = reader.ReadUInt8();
        if (type === 0) return null;

        const curve = new Tw2GeometryCurve();
        curve.dimension = reader.ReadUInt8();
        curve.degree = reader.ReadUInt8();
        const knotCount = reader.ReadUInt32();
        curve.knots = new Float32Array(knotCount);
        for (let i = 0; i < knotCount; ++i)
        {
            curve.knots[i] = reader.ReadFloat32();
        }
        const controlCount = reader.ReadUInt32();
        curve.controls = new Float32Array(controlCount);
        for (let i = 0; i < controlCount; ++i)
        {
            curve.controls[i] = reader.ReadFloat32();
        }
        return curve;
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
        super(data, "Geometry mesh has invalid bone name for model");
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
