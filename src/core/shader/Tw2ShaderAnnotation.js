import { assignIfExists, meta } from "utils";

/*
export class Tw2ShaderAnnotationComponent
{

    @meta.string
    name = "";

    @meta.string
    description = "";

    @meta.uint
    index = -1;

    @meta.float
    default = 0.0;

    @meta.type
    type = 0;

}
 */


@meta.type("Tw2ShaderAnnotation")
export class Tw2ShaderAnnotation
{

    @meta.string
    name = "";

    @meta.string
    description = "";

    @meta.array
    components = null;

    @meta.boolean
    display = true;

    @meta.string
    group = "None";

    @meta.string
    widget = "";

    /**
     * Creates an annotation from json
     * TODO: Replace with util functions
     * @param {Object} json
     * @param {Tw2EffectRes} context
     * @param {String} [key]
     * @return {Tw2ShaderAnnotation}
     */
    static fromJSON(json, context, key)
    {
        const annotation = new Tw2ShaderAnnotation();
        assignIfExists(annotation, json, [ "name", "description", "display", "group", "widget" ]);

        const components = [];
        if (json.components)
        {
            for (let i = 0; i < json.components.length; i++)
            {
                components[i] = json.components[i];
            }
        }

        if (components.length) annotation.components = components;

        annotation.name = annotation.name || key;
        return annotation;
    }

    /**
     * Reads ccp shader annotations
     * @param {Tw2BinaryReader} reader
     * @param {Tw2EffectRes}  context
     * @return {Tw2ShaderAnnotation}
     */
    static fromCCPBinary(reader, context)
    {
        const annotation = new Tw2ShaderAnnotation();
        annotation.name = context.ReadString();

        const
            annotationCount = reader.ReadUInt8(),
            components = [];

        for (let annotationIx = 0; annotationIx < annotationCount; ++annotationIx)
        {
            let
                key = context.ReadString(),
                type = reader.ReadUInt8(),
                value;

            switch (type)
            {
                case 0:
                    value = reader.ReadUInt32() !== 0;
                    break;

                case 1:
                    value = reader.ReadInt32();
                    break;

                case 2:
                    value = reader.ReadFloat32();
                    break;

                default:
                    value = context.ReadString();
            }

            // Normalize the annotations
            switch (key.toUpperCase())
            {
                case "UIWIDGET":
                    annotation.widget = value.toUpperCase();
                    if (annotation.widget === "LINEARCOLOR")
                    {
                        components[0] = "Linear red";
                        components[1] = "Linear green";
                        components[2] = "Linear blue";
                        components[3] = "Linear alhpa";
                    }
                    break;

                case "SASUIVISIBLE":
                    annotation.display = value;
                    break;

                case "SASUIDESCRIPTION":
                    annotation.description = value;
                    break;

                case "GROUP":
                    annotation.group = value;
                    break;

                case "COMPONENT1":
                    components[0] = value;
                    break;

                case "COMPONENT2":
                    components[1] = value;
                    break;

                case "COMPONENT3":
                    components[2] = value;
                    break;

                case "COMPONENT4":
                    components[3] = value;
                    break;

                default:
                    key = key.charAt(0).toLowerCase() + key.substring(1);
                    annotation[key] = value;
            }
        }

        if (!annotation.widget && annotation.name.toUpperCase().includes("MAP"))
        {
            annotation.widget = "TEXTURE";
            annotation.group = "Textures";
        }

        if (components.length)
        {
            annotation.components = components;
        }

        return annotation;
    }

}
