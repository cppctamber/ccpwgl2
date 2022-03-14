import { device } from "global/tw2";
import { Tw2BinaryReader } from "core/reader/Tw2BinaryReader";
import {
    Tw2BlendShapeData,
    Tw2GeometryAnimation,
    Tw2GeometryBone, Tw2GeometryCurve,
    Tw2GeometryMesh,
    Tw2GeometryMeshArea,
    Tw2GeometryModel,
    Tw2GeometrySkeleton,
    Tw2GeometryTrackGroup,
    Tw2GeometryTransformTrack
} from "core/geometry";

import { box3, mat3, mat4, quat, vec3 } from "math";
import { Tw2VertexElement } from "core/vertex";
import { ErrGeometryFileType } from "core/resource";


export class WBGReader
{

    /**
     * Prepares the resource data
     * @param {ArrayBuffer} data
     * @param {Tw2GeometryRes} res
     */
    Prepare(data, res)
    {
        const
            gl = device.gl,
            path = res.path,
            reader = new Tw2BinaryReader(new Uint8Array(data)),
            { ReadVertexBuffer, ReadIndexBuffer, ReadCurve } = this.constructor;

        /* let fileVersion = */
        reader.ReadUInt8();
        const meshCount = reader.ReadUInt8();
        for (let meshIx = 0; meshIx < meshCount; ++meshIx)
        {
            const mesh = new Tw2GeometryMesh();
            mesh.name = reader.ReadString();
            mesh.buffer = null;
            mesh.indexes = null;
            const buffer = ReadVertexBuffer(reader, mesh.declaration, path);

            if (buffer)
            {
                mesh.bufferLength = buffer.length;
                mesh.buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
                gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
            }

            const indexes = this.constructor.ReadIndexBuffer(reader);
            if (indexes)
            {
                mesh.indexes = gl.createBuffer();
                mesh.indexType = indexes.BYTES_PER_ELEMENT === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexes, gl.STATIC_DRAW);
            }

            const areaCount = reader.ReadUInt8();
            let boundsEmpty = false;

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
                    boundsEmpty = true;
                }
            }

            if (boundsEmpty && indexes && buffer)
            {
                mesh.RecalculateAreaBounds(buffer, indexes);
            }

            const boneBindingCount = reader.ReadUInt8();
            mesh.boneBindings = [];
            for (let i = 0; i < boneBindingCount; ++i)
            {
                mesh.boneBindings[i] = reader.ReadString();
            }

            const annotationSetCount = reader.ReadUInt16();
            if (annotationSetCount || res.systemMirror)
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
                    mesh.blendShapes[i].buffer = ReadVertexBuffer(reader, mesh.blendShapes[i].declaration, path);
                    mesh.blendShapes[i].indexes = ReadIndexBuffer(reader);
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

            res.meshes[meshIx] = mesh;
        }

        // Rebuilds all bounds
        res.RebuildBounds();

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
                model.skeleton.bones.push(bone);
            }

            for (let i = 0; i < model.skeleton.bones.length; ++i)
            {
                model.skeleton.bones[i].UpdateTransform();
                if (model.skeleton.bones[i].parentIndex !== -1)
                {
                    mat4.multiply(
                        model.skeleton.bones[i].worldTransform,
                        model.skeleton.bones[model.skeleton.bones[i].parentIndex].worldTransform,
                        model.skeleton.bones[i].localTransform
                    );
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
                if (mesh < res.meshes.length)
                {
                    res.constructor.BindMeshToModel(res.meshes[mesh], model, res);
                }
            }
            res.models.push(model);
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
                for (let m = 0; m < res.models.length; ++m)
                {
                    if (res.models[m].name === group.name)
                    {
                        group.model = res.models[m];
                        break;
                    }
                }

                const transformTrackCount = reader.ReadUInt8();
                for (let k = 0; k < transformTrackCount; ++k)
                {
                    const track = new Tw2GeometryTransformTrack();
                    track.name = reader.ReadString();
                    track.orientation = ReadCurve(reader);
                    track.position = ReadCurve(reader);
                    track.scaleShear = ReadCurve(reader);

                    if (track.orientation)
                    {
                        let lastX = 0,
                            lastY = 0,
                            lastZ = 0,
                            lastW = 0;

                        for (let n = 0; n < track.orientation.controls.length; n += 4)
                        {
                            let x = track.orientation.controls[n],
                                y = track.orientation.controls[n + 1],
                                z = track.orientation.controls[n + 2],
                                w = track.orientation.controls[n + 3];

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
                    group.transformTracks.push(track);
                }
                animation.trackGroups.push(group);
            }
            res.animations.push(animation);
        }

        res.RebuildBounds();
        res.OnPrepared();
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

    /**
     * Request response type
     * @type {string}
     */
    static requestResponseType = "arraybuffer";

    /**
     * File extension
     * @type {string}
     */
    static extension = "wbg";

}
