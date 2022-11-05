import { Tw2VertexDeclaration, Tw2VertexElement } from "core/vertex";
import { ErrFeatureNotImplemented } from "core/Tw2Error";
import { Gr2CurveReader } from "core/reader/granny";
import { vec3, quat, mat4, box3, mat3 } from "math";
import { GL_FLOAT } from "constant/gl";
import { device } from "global/tw2";

import * as geo from "geo-ambient-occlusion";

import {
    //Tw2BlendShapeData,
    Tw2GeometryAnimation,
    Tw2GeometryBone,
    Tw2GeometryMesh,
    Tw2GeometryMeshArea,
    Tw2GeometryModel,
    Tw2GeometrySkeleton,
    Tw2GeometryTrackGroup,
    Tw2GeometryTransformTrack
} from "core/geometry";


const VertexTypes = {
    POSITION: { elements: 3, usage: Tw2VertexElement.Type.POSITION, usageIndex: 0 },
    COLOR: { elements: 4, usage: Tw2VertexElement.Type.COLOR, usageIndex: 0 },
    NORMAL: { elements: 3, usage: Tw2VertexElement.Type.NORMAL, usageIndex: 0 },
    TANGENT: { elements: 4, usage: Tw2VertexElement.Type.TANGENT, usageIndex: 0 },
    BITANGENT: { elements: 4, usage: Tw2VertexElement.Type.BITANGENT, usageIndex: 0 },
    BINORMAL: { elements: 4, usage: Tw2VertexElement.Type.BINORMAL, usageIndex: 0 },
    TEXCOORD0: { elements: 2, usage: Tw2VertexElement.Type.TEXCOORD, usageIndex: 0 },
    TEXCOORD1: { elements: 2, usage: Tw2VertexElement.Type.TEXCOORD, usageIndex: 1 },
    // BLEND INDICES & BLEND WEIGHT FLIPPED FOR SOME REASON
    BLENDWEIGHT: { elements: 4, usage: Tw2VertexElement.Type.BLENDINDICES, usageIndex: 0 },
    BLENDINDICE: { elements: 4, usage: Tw2VertexElement.Type.BLENDWEIGHT, usageIndex: 0 },

    // Temporary
    AMBIENT_OCCLUSION: { elements: 1, usage: Tw2VertexElement.Type.TEXCOORD, usageIndex: 20 }
};


/**
 *
 */
export class GR2JsonReader
{

    static DEFAULT_OPTIONS = {
        firstMeshOnly : true,
        aoGenerate : true,
        aoResolution: 2048,
        aoBias: 0.001,
        aoSamples: 2048,
        aoIndexed: false
    }

    /**
     * Prepares a geometry resource
     * @param {Object} data
     * @param {Tw2GeometryRes} res
     * @param {Object} [options]
     */
    static Prepare(data, res, options)
    {
        const { models = [], meshes = [], animations = [] } = data;
        const { gl } = device;

        options = Object.assign({}, GR2JsonReader.DEFAULT_OPTIONS, options);

        const count = options && options.firstMeshOnly ? 1 : meshes.length;
        for (let iMesh = 0; iMesh < count; iMesh++)
        {
            const
                srcM = meshes[iMesh],
                mesh = new Tw2GeometryMesh();

            mesh.name = srcM.name;
            if (srcM.minBounds) vec3.copy(mesh.minBounds, srcM.minBounds);
            if (srcM.maxBounds) vec3.copy(mesh.maxBounds, srcM.maxBounds);

            let vertexCount = 0,
                vertexSize = 0,
                vertexElements = [];

            if (srcM.vertex)
            {
                for (const key in srcM.vertex)
                {
                    if (srcM.vertex.hasOwnProperty(key) && srcM.vertex[key].length)
                    {
                        const type = VertexTypes[key.toUpperCase()];
                        if (!type) throw new Error(`Unsupported vertex type: ${key}`);

                        const count = srcM.vertex[key].length / type.elements;
                        if (!vertexCount) vertexCount = count;
                        else if (vertexCount !== count) throw new Error(`Invalid vertex count: ${key}`);

                        vertexElements.push({
                            usage: type.usage,
                            usageIndex: type.usageIndex,
                            offset: vertexSize * 4,
                            type: GL_FLOAT,
                            elements: type.elements,
                            data: srcM.vertex[key]
                        });

                        vertexSize += type.elements;
                    }
                }
            }

            // Index buffer
            let indexLength = 0;

            for (let i = 0; i < srcM.indices.length; i++)
            {
                const { faces = [] } = srcM.indices[i];
                indexLength += faces.length;
            }

            let ArrayType = Uint32Array, // bytes === 2 ? Uint16Array : Uint32Array,
                indexData = new ArrayType(indexLength),
                boundsEmpty = false;

            if (indexData.length)
            {
                let index = 0;
                let startCount = 0;
                for (let iArea = 0; iArea < srcM.indices.length; iArea++)
                {
                    const srcA = srcM.indices[iArea];
                    const { faces = [] } = srcA;
                    const area = new Tw2GeometryMeshArea();
                    area.name = srcA.name;
                    area.start = startCount * indexData.constructor.BYTES_PER_ELEMENT;
                    area.count = faces.length;
                    if (srcA.minBounds) vec3.copy(area.minBounds, srcA.minBounds);
                    if (srcA.maxBounds) vec3.copy(area.maxBounds, srcA.maxBounds);
                    for (let ix = 0; ix < faces.length; ix++) indexData[index++] = faces[ix];
                    mesh.areas.push(area);
                    if (box3.bounds.isEmpty(area.minBounds, area.maxBounds)) boundsEmpty = true;

                    startCount += faces.length;
                }
            }

            mesh.indexes = gl.createBuffer();
            mesh.indexType = indexData.BYTES_PER_ELEMENT === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

            let faces = [];
            for (let i = 0; i < indexData.length; i+=3)
            {
                faces.push([ indexData[i], indexData[i+1], indexData[i+2] ]);
            }

            /*---- Calculate Ambient Occlusion ----*/

            if (options["aoGenerate"])
            {
                const { aoBias=0.01, aoSamples=256, aoResolution=1024, aoIndexed=false } = options;

                const
                    positions = vertexElements.find(x=> x.usage === Tw2VertexElement.Type.POSITION && x.usageIndex === 0),
                    normals = vertexElements.find(x => x.usage === Tw2VertexElement.Type.NORMAL && x.usageIndex === 0);

                if (positions)
                {
                    //console.log("Calculating ambient occlusion for", mesh.name);

                    const aoSampler = geo(positions.data, {
                        cells: faces,
                        bias: aoBias,
                        resolution: aoResolution,
                        normals: normals ? normals.data : undefined,
                    });

                    for (let i = 0; i < aoSamples; i++) aoSampler.sample();
                    const data = aoSampler.report();

                    // Flip colours
                    for (let i = 0; i < data.length; i++)
                    {
                        data[i] = 1.0 - data[i];
                    }

                    vertexElements.push({
                        usage: Tw2VertexElement.Type.TEXCOORD,
                        usageIndex: 20,
                        offset: vertexSize * 4,
                        type: GL_FLOAT,
                        elements: 1,
                        data
                    });

                    aoSampler.dispose();
                    vertexSize += 1;
                }
            }

            /*---- Temporary Ambient Occlusion ----*/

            // Declarations
            const declaration = new Tw2VertexDeclaration();
            for (let iv = 0; iv < vertexElements.length; iv++)
            {
                declaration.elements.push(Tw2VertexElement.from(vertexElements[iv]));
            }
            declaration.RebuildHash();
            declaration.stride = vertexSize * 4;
            mesh.declaration = declaration;

            // Buffer data
            let bufferData = new Float32Array(vertexSize * vertexCount);
            if (bufferData.length)
            {
                let index = 0;
                for (let vs = 0; vs < vertexCount; vs++)
                {
                    for (let v = 0; v < vertexElements.length; v++)
                    {
                        const { elements, data } = vertexElements[v];
                        for (let e = 0; e < elements; e++)
                        {
                            bufferData[index++] = data[vs * elements + e];
                        }
                    }
                }
            }

            mesh.bufferLength = bufferData.length;
            mesh.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);




            // Bone bindings
            const { boneBindings = [] } = srcM;
            for (let i = 0; i < boneBindings.length; i++)
            {
                const { name, minBounds, maxBounds } = boneBindings[i];

                mesh.boneBindings.push(name);
                if (!minBounds || !maxBounds)
                {
                    mesh.boneBounds.push(box3.create());
                }
                else
                {
                    mesh.boneBounds.push(box3.fromBounds(box3.create(), minBounds, maxBounds));
                }
            }

            // Blend shapes
            if (srcM.blendShapes && srcM.blendShapes.length)
            {
                throw new ErrFeatureNotImplemented({ feature: "Geometry blend shapes" });
            }

            // Test data
            mesh._areas = mesh.areas.length;
            mesh._faces = indexData.length / 3;
            mesh._vertices = bufferData.length / vertexSize;

            // System mirror
            mesh.bufferData = bufferData;
            mesh.indexData = indexData;

            // Bounds
            if (boundsEmpty) mesh.RecalculateAreaBounds(bufferData, indexData);
            mesh.RebuildBounds();

            res.meshes.push(mesh);
        }

        for (let iModel = 0; iModel < models.length; iModel++)
        {
            const srcM = models[iModel];
            const model = new Tw2GeometryModel();

            model.name = srcM.name;

            if (srcM.skeleton)
            {
                const skeleton = new Tw2GeometrySkeleton();
                model.skeleton = skeleton;
                skeleton.name = srcM.skeleton.name;

                const { bones = [] } = srcM.skeleton;
                for (let iB = 0; iB < bones.length; iB++)
                {
                    const srcB = bones[iB];
                    const bone = new Tw2GeometryBone();
                    skeleton.bones.push(bone);

                    bone.name = srcB.name || srcB.bone;

                    bone.parentIndex = srcB.parentIndex !== 255 ? srcB.parentIndex : -1;
                    if (srcB.position) vec3.copy(bone.position, srcB.position);
                    //if ((srcB.flags & 1) !== 0) vec3.copy(bone.position, srcB.position);
                    if (srcB.orientation) quat.copy(bone.orientation, srcB.orientation);
                    //if ((srcB.flags & 2) !== 0) quat.copy(bone.orientation, srcB.orientation);
                    if (srcB.scaleShear) mat3.copy(bone.scaleShear, srcB.scaleShear);
                    //if ((srcB.flags & 4) !== 0) mat3.copy(bone.scaleShear, srcB.scaleShear);
                }

                for (let iB = 0; iB < skeleton.bones.length; iB++)
                {
                    const bone = skeleton.bones[iB];
                    bone.UpdateTransform();
                    if (bone.parentIndex !== -1)
                    {
                        mat4.multiply(
                            bone.worldTransform,
                            skeleton.bones[bone.parentIndex].worldTransform,
                            bone.localTransform
                        );
                    }
                    else
                    {
                        mat4.copy(bone.worldTransform, bone.localTransform);
                    }
                    mat4.invert(bone.worldTransformInv, bone.worldTransform);
                }

                res.models.push(model);
            }

            const { meshBindings = [] } = srcM;
            for (let iMB = 0; iMB < meshBindings.length; iMB++)
            {
                res.constructor.BindMeshToModel(res.meshes[meshBindings[iMB]], model, res);
            }
        }

        const curveReader = new Gr2CurveReader();

        for (let iA = 0; iA < animations.length; iA++)
        {
            const srcA = animations[iA];
            const animation = new Tw2GeometryAnimation();
            animation.name = srcA.name;
            animation.duration = srcA.duration;

            const { trackGroups = [] } = srcA;
            for (let iTG = 0; iTG < trackGroups.length; iTG++)
            {
                const trackGroup = new Tw2GeometryTrackGroup();
                trackGroup.name = trackGroups[iTG].name;

                for (let iM = 0; iM < res.models.length; iM++)
                {
                    if (res.models[iM].name === trackGroup.name)
                    {
                        trackGroup.model = res.models[iM];
                        break;
                    }
                }

                const { transformTracks = [] } = trackGroups[iTG];

                for (let iTT = 0; iTT < transformTracks.length; iTT++)
                {
                    const track = new Tw2GeometryTransformTrack();
                    track.name = transformTracks[iTT].name;
                    track.orientation = curveReader.CreateTw2GeometryCurveFromJSON(transformTracks[iTT].orientation, 4);
                    track.position = curveReader.CreateTw2GeometryCurveFromJSON(transformTracks[iTT].position, 3);
                    track.scaleShear = curveReader.CreateTw2GeometryCurveFromJSON(transformTracks[iTT].scaleShear, 9);
                    // TODO: Why do some root objects have non-identity scaleshears
                    if (track.name.toUpperCase() === "ROOT") mat3.identity(track.scaleShear.controls);

                    if (track.orientation)
                    {
                        let lastX = 0,
                            lastY = 0,
                            lastZ = 0,
                            lastW = 0;

                        const { controls } = track.orientation;

                        for (let n = 0; n < controls.length; n += 4)
                        {
                            let x = controls[n],
                                y = controls[n + 1],
                                z = controls[n + 2],
                                w = controls[n + 3];

                            if (lastX * x + lastY * y + lastZ * z + lastW * w < 0)
                            {
                                controls[n] = -x;
                                controls[n + 1] = -y;
                                controls[n + 2] = -z;
                                controls[n + 3] = -w;
                            }

                            lastX = x;
                            lastY = y;
                            lastZ = z;
                            lastW = w;
                        }
                    }
                    trackGroup.transformTracks.push(track);
                }
                animation.trackGroups.push(trackGroup);
            }
            res.animations.push(animation);
        }
    }

    /**
     * Request response type
     * @type {string}
     */
    static requestResponseType = "json";

    /**
     * File extension
     * @type {string}
     */
    static extension = "gr2_json";

}
