import { Tw2VertexDeclaration, Tw2VertexElement } from "core/vertex";
import { GL_FLOAT } from "constant";
import { isString, isVector, isVector3, meta } from "utils";
import { Tw2Error } from "core/Tw2Error";


/**
 * Todo: Simplify this format
 */
@meta.type("Tw2CakeReader")
export class Tw2CakeReader
{

    @meta.string
    name = "";

    @meta.list()
    areas = [];

    @meta.struct("Tw2Declaration")
    declaration = null;

    @meta.vector
    indexData = null;

    @meta.vector
    bufferData = null;

    @meta.list()
    boneBindings = [];

    @meta.list()
    blendShapes = [];

    @meta.list()
    models = [];

    @meta.list()
    animations = [];

    /**
     * Constructor
     * @param {String} data
     */
    constructor(data)
    {
        Tw2CakeReader.validate(data);

        const
            lines = data.split(/\r?\n/),
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

            // Empty
            if (!line)
            {
                return { name: "EMPTY", value: undefined };
            }

            let split = line.split(":"),
                name = split[0].toUpperCase();

            if (name in Tw2CakeReader.ShortName)
            {
                name = Tw2CakeReader.ShortName[name];
            }

            let value = split[1] || "";

            // Comment
            if (name === "NOTE")
            {
                return { name, value };
            }

            if (!value)
            {
                throw new Tw2Error({
                    message: `Unexpected value on line ${currentLine + 1}: ${split[0]}`,
                    data: split[0]
                });
            }

            // Convert string vector to vector
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
            let { name, value } = parseLine();

            if (name in this.constructor.ShortName)
            {
                name = this.constructor.ShortName[name];
            }

            switch (name)
            {
                case "EMPTY":
                    currentLine++;
                    break;

                case "NOTE":
                    currentLine++;
                    // Ignore notes for now
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
                            if (!isVector3(face.value))
                            {
                                throw new ReferenceError(`Unexpected face value on line ${currentLine + 1}: ${face.value}`);
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
                        declaration = Tw2CakeReader.getDeclarationObjectByName(name);
                        declarations.push(declaration);
                    }

                    if (!isVector(value) || value.length !== declaration.elements)
                    {
                        throw new ReferenceError(`Invalid value for declaration "${name}" on line ${currentLine + 1}: ${value}`);
                    }

                    declaration.vertices.push(value);
                    currentLine++;
                    break;

                default:
                    throw new ReferenceError(`Unexpected value type on line ${currentLine + 1}: ${name}`);

            }
        }

        let vertexSize = 0,
            vertexCount = declarations.length ? declarations[0].vertices.length : 0;

        // Create declarations
        this.declaration = new Tw2VertexDeclaration();
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

    /**
     * Constructs geometry data from cake data
     * @param {String} data
     * @return {[]}
     */
    static construct(data)
    {
        this.validate(data);

        const
            meshesRaw = data.split("MESH"),
            result = [];

        for (let i = 0; i < meshesRaw.length; i++)
        {
            result.push(new Tw2CakeReader(meshesRaw[i]));
        }

        return result;
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

    static IndexArray = Uint32Array;

    /**
     * Gets a declaration object by name
     * @param {String} name
     * @return {{usageIndex: *, vertices: [], usage: *, elements: *, name: *}}
     */
    static getDeclarationObjectByName(name)
    {
        if (name in this.ShortName)
        {
            name = this.ShortName[name];
        }

        return {
            name,
            vertices: [],
            usageIndex: this.UsageIndex[name],
            usage: this.Usage[name],
            elements: this.Elements[name],
        };
    }

    /**
     * Provides support for newer cake version
     * @type {{P: string, A: string, BT: string, "#": string, T: string, T0: string, M: string, T1: string, N: string}}
     */
    static ShortName = {
        "#": "NOTE",
        A: "AREA",
        M: "NAME",
        P: "POSITION",
        N: "NORMAL",
        T: "TANGENT",
        BT: "BITANGENT",
        T0: "TEXCOORD0",
        T1: "TEXCOORD1",
        F: "FACE"
    };

    static Elements = {
        POSITION: 3,
        NORMAL: 3,
        TANGENT: 4,
        BITANGENT: 4,
        TEXCOORD0: 2,
        TEXCOORD1: 2
    };

    static UsageIndex = {
        POSITION: 0,
        NORMAL: 0,
        TANGENT: 0,
        BITANGENT: 0,
        TEXCOORD0: 0,
        TEXCOORD1: 1
    };

    static Usage = {
        POSITION: Tw2VertexElement.Type.POSITION,
        NORMAL: Tw2VertexElement.Type.NORMAL,
        TANGENT: Tw2VertexElement.Type.TANGENT,
        BITANGENT: Tw2VertexElement.Type.BINORMAL,
        TEXCOORD0: Tw2VertexElement.Type.TEXCOORD,
        TEXCOORD1: Tw2VertexElement.Type.TEXCOORD
    };

}
