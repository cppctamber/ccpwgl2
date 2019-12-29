import { Tw2VertexDeclaration, Tw2VertexElement } from "core/vertex";
import { util, GL_FLOAT } from "global";


export class Tw2CakeReader
{

    name = "";
    areas = [];
    declaration = null;
    indexData = null;
    bufferData = null;

    boneBindings = null;
    blendShapes = null;
    models = null;
    animations = null;


    /**
     * Constructor
     * @param {String} data
     */
    constructor(data)
    {
        if (!util.isString(data))
        {
            throw new ReferenceError("Invalid format, expected string");
        }

        const
            lines = data.split("\n"),
            indexData = [],
            declarations = [];

        let currentLine = 0;

        /**
         * Parses the current line
         * @returns {{name: string, value: *}}
         */
        function parseLine()
        {
            const line = lines[currentLine];
            if (!line) return { name: "EMPTY", value: undefined };

            const
                split = line.split(":"),
                name = split[0].toUpperCase();

            // Convert string vector to vector
            let value = split[1];
            if (value.includes(",") || value.includes("["))
            {
                value = value.replace("[", "").replace("]", "");
                value = value.split(",");

                for (let i = 0; i < value.length; i++)
                {
                    value[i] = Number(value[i]);
                }
            }

            return { name, value };
        }


        while (currentLine < lines.length)
        {
            const { name, value } = parseLine();

            switch (name)
            {
                case "EMPTY":
                    currentLine++;
                    break;

                case "NAME":
                    this.name = value || "";
                    currentLine++;
                    break;

                case "AREA":
                    const area = {
                        name: value,
                        start: indexData.length * Tw2CakeReader.IndexArray.BYTES_PER_ELEMENT,
                        count: 0
                    };
                    this.areas.push(area);
                    currentLine++;
                    // Get faces
                    while (currentLine < lines.length)
                    {
                        const face = parseLine();
                        if (face.name === "FACE")
                        {
                            if (!util.isVector3(face.value))
                            {
                                throw new ReferenceError("Unexpected face value: " + face.value);
                            }
                            area.count += 3;
                            indexData.push(face.value[0]);
                            indexData.push(face.value[1]);
                            indexData.push(face.value[2]);
                            currentLine++;
                        }
                        else break;
                    }
                    break;

                case "POSITION":
                case "NORMAL":
                case "TANGENT":
                case "BITANGENT":
                case "TEXCOORD0":
                case "TEXCOORD1":
                    let declaration;
                    for (let i = 0; i < declarations.length; i++)
                    {
                        if (declarations[i].name === name)
                        {
                            declaration = declarations[i];
                        }
                    }

                    if (!declaration)
                    {
                        declaration = {
                            name,
                            usageIndex: Tw2CakeReader.UsageIndex[name],
                            usage: Tw2CakeReader.Usage[name],
                            elements: Tw2CakeReader.Elements[name],
                            vertices: []
                        };
                        declarations.push(declaration);
                    }

                    if (!util.isVector(value) || value.length !== declaration.elements)
                    {
                        throw new ReferenceError(`Invalid value for declaration "${name}": ${value}`);
                    }

                    declaration.vertices.push(value);
                    currentLine++;
                    break;

                default:
                    throw new ReferenceError(`Unexpected value type: "${name}"`);

            }
        }

        let vertexSize = 0,
            vertexCount = 0;

        // Create declarations
        this.declaration = new Tw2VertexDeclaration();
        for (let i = 0; i < declarations.length; i++)
        {
            const { vertices, usageIndex, usage, elements, name } = declarations[i];

            // Validate vertex counts
            if (i === 0)
            {
                vertexCount = vertices.length;
            }
            else if (vertices.length !== vertexCount)
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

    static IndexArray = Uint32Array;

    static UsageIndex = {
        POSITION: 0,
        NORMAL: 0,
        TANGENT: 0,
        BITANGENT: 0,
        TEXCOORD0: 0,
        TEXCOORD1: 1
    };

    static Elements = {
        POSITION: 3,
        NORMAL: 3,
        TANGENT: 4,
        BITANGENT: 4,
        TEXCOORD0: 2,
        TEXCOORD1: 2
    };

    static Usage = {
        POSITION: Tw2VertexElement.Type.POSITION,
        NORMAL: Tw2VertexElement.Type.NORMAL,
        TANGENT: Tw2VertexElement.Type.TANGENT,
        BITANGENT: Tw2VertexElement.Type.BITANGENT,
        TEXCOORD0: Tw2VertexElement.Type.TEXCOORD,
        TEXCOORD1: Tw2VertexElement.Type.TEXCOORD
    };
}
