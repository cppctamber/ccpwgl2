import { Mesh as ObjLoader } from "webgl-obj-loader";
import { CAKEReader } from "./CAKEReader";
import { isString } from "utils";
import { Tw2VertexDeclaration, Tw2VertexElement } from "core/vertex";
import { GL_FLOAT } from "constant/gl";
import { tw2 } from "global/tw2";
import { calculateNormals, calculateTangents } from "math/vertex";
import { GR2JsonReader } from "core";
import * as geo from "geo-ambient-occlusion";


/**
 * Todo: Convert to new geometry type
 */
export class OBJReader
{

    name = "";
    areas = [];
    declaration = null;
    indexData = null;
    bufferData = null;
    boneBindings = [];
    blendShapes = [];
    models = [];
    animations = [];

    constructor(data, options={})
    {

        options = Object.assign({}, GR2JsonReader.DEFAULT_OPTIONS, options);

        const result = new ObjLoader(data);
        console.dir(result);

        function toElements(source, stride, pad)
        {
            let out = [];
            let index = 0;
            for (let i = 0; i < source.length; i+=stride)
            {
                const el = [];
                for (let x = 0; x < stride; x++)
                {
                    el[x] = source[index];
                    index += 1;
                }

                if (pad)
                {
                    el.push(0);
                }

                out.push(el);
            }
            return out;
        }

        let indexData = [];
        for (let i = 0; i < result.materialNames.length; i++)
        {

            this.areas.push({
                name: result.materialNames[i],
                start: indexData.length * Uint32Array.BYTES_PER_ELEMENT,
                count: result.indicesPerMaterial[i].length
            });

            for (let x = 0; x < result.indicesPerMaterial[i].length; x++)
            {
                indexData.push(result.indicesPerMaterial[i][x]);
            }
        }

        // Create declarations
        this.declaration = new Tw2VertexDeclaration();
        const declarations = [];

        const positions = result.vertices;
        const position = CAKEReader.getDeclarationObjectByName("POSITION");
        position.vertices = toElements(positions, 3);
        declarations.push(position);

        const texcoords0 = result.textures;
        const tex0 = CAKEReader.getDeclarationObjectByName("TEXCOORD0");
        tex0.vertices = toElements(texcoords0, 2);
        declarations.push(tex0);

        // Calculate normals if required - if normals missing we'll get batman
        const normals = result.vertexNormals && !isNaN(result.vertexNormals[0]) ? result.vertexNormals : calculateNormals(indexData, positions);

        // Calculate tangents
        const tangents = calculateTangents(indexData, positions, texcoords0, [], normals);
        declarations.push({
            usage: Tw2VertexElement.Type.TANGENT,
            usageIndex: 0,
            elements: 4,
            vertices: toElements(tangents, 4, true)
        });


        /*---- Calculate Ambient Occlusion ----*/

        if (options["aoGenerate"])
        {
            const { aoBias, aoSamples, aoResolution } = options;
            if (positions)
            {
                //console.log("Calculating ambient occlusion for", mesh.name);
                const aoSampler = geo(positions, {
                    cells: indexData,
                    bias: aoBias,
                    resolution: aoResolution,
                    normals,
                });

                for (let i = 0; i < aoSamples; i++) aoSampler.sample();
                const data = aoSampler.report();

                // Flip colours
                for (let i = 0; i < data.length; i++)
                {
                    data[i] = 1.0 - data[i];
                }

                declarations.push({
                    usage: Tw2VertexElement.Type.TEXCOORD,
                    usageIndex: 20,
                    elements: 1,
                    vertices: toElements(data, 1, true)
                });

                aoSampler.dispose();
            }
        }

        /*---- Temporary Ambient Occlusion ----*/


        let vertexSize = 0,
            vertexCount = declarations.length ? declarations[0].vertices.length : 0;

        for (let i = 0; i < declarations.length; i++)
        {
            const { vertices, usageIndex, usage, elements, name } = declarations[i];

            // Validate vertex counts
            if (vertices.length !== vertexCount)
            {
                throw new ReferenceError(`Unexpected vertex count: ${name}`);
            }

            // Create vertex element
            this.declaration.elements.push(Tw2VertexElement.from({
                usage,
                usageIndex,
                elements,
                type: GL_FLOAT,
                offset: vertexSize * 4
            }));
            vertexSize += elements;
        }
        this.declaration.RebuildHash();
        this.declaration.stride = vertexSize * 4;

        // Create buffer data
        const bufferSize = vertexCount * vertexSize;
        if (bufferSize)
        {
            this.bufferData = new Float32Array(bufferSize);
            let offset = 0;
            for (let vIx = 0; vIx < vertexCount; vIx++)
            {
                for (let dIx = 0; dIx < declarations.length; dIx++)
                {
                    for (let i = 0; i < declarations[dIx].elements; i++)
                    {
                        this.bufferData[offset++] = declarations[dIx].vertices[vIx][i];
                    }
                }
            }
        }

        // Create index data
        this.indexData = new CAKEReader.IndexArray(indexData);

        // TODO: Models
        // TODO: Animations
        // TODO: Blend shapes
        // TODO: Bones
    }

    /**
     * Constructs the object's meshes
     * @param {*} data
     * @returns {OBJReader[]}
     */
    static construct(data)
    {
        this.validate(data);
        const result = new this(data);
        return [ result ];
    }

    /**
     * Basic data validation
     * @param {String} data
     */
    static validate(data)
    {
        if (!isString(data))
        {
            throw new ReferenceError("Invalid format, expected string");
        }
    }

    /**
     * Request response type
     * @type {string}
     */
    static requestResponseType = "text";

    /**
     * File extension
     * @type {string}
     */
    static extension = "obj";

    /**
     * Identifies that the format needs to handle meshes one by one
     * @type {boolean}
     */
    static byMesh = true;

}

