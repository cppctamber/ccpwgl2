import { Mesh } from "webgl-obj-loader";
import { Tw2CakeReader } from "core/resource/Tw2CakeReader";
import { isString } from "utils";
import { Tw2VertexDeclaration, Tw2VertexElement } from "core/vertex";
import { GL_FLOAT } from "constant/gl";


export class Tw2WaveFrontReader
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

    constructor(data)
    {
        const result = new Mesh(data);

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

        // Create declarations
        this.declaration = new Tw2VertexDeclaration();

        const declarations = [];

        const position = Tw2CakeReader.getDeclarationObjectByName("POSITION");
        position.vertices = toElements(result.vertices, 3);
        declarations.push(position);

        const normal = Tw2CakeReader.getDeclarationObjectByName("NORMAL");
        normal.vertices = toElements(result.vertexNormals, 3);
        declarations.push(normal);

        const tex0 = Tw2CakeReader.getDeclarationObjectByName("TEXCOORD0");
        tex0.vertices = toElements(result.textures, 2);
        declarations.push(tex0);

        try
        {
            result.calculateTangentsAndBitangents();
            const tangent = Tw2CakeReader.getDeclarationObjectByName("TANGENT");
            tangent.vertices = toElements(result.tangents, 3, true);
            declarations.push(tangent);

            const biTangent = Tw2CakeReader.getDeclarationObjectByName("BITANGENT");
            biTangent.vertices = toElements(result.bitangents, 3, true);
            declarations.push(biTangent);
        }
        catch(err)
        {
            console.debug("Could not generate tangents and bitangents...");
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

        let vertexSize = 0,
            vertexCount = declarations.length ? declarations[0].vertices.length : 0;

        console.debug({
            vertexCount,
            declarations,
            areas: this.areas
        });

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
        this.indexData = new Tw2CakeReader.IndexArray(indexData);

        // TODO: Models
        // TODO: Animations
        // TODO: Blend shapes
        // TODO: Bones
    }

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

}
