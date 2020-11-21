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
    components = [];

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

        if (json.components)
        {
            for (let i = 0; i < json.components.length; i++)
            {
                annotation.components[i] = json.components[i];
            }
        }

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

        const annotationCount = reader.ReadUInt8();
        let components = [];

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
                        annotation.components = [ "Linear red", "Linear green", "Linear blue", "Linear Alpha" ];
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
                    annotation.components[0] = value;
                    break;

                case "COMPONENT2":
                    annotation.components[1] = value;
                    break;

                case "COMPONENT3":
                    annotation.components[2] = value;
                    break;

                case "COMPONENT4":
                    annotation.components[3] = value;
                    break;

                default:
                    key = key.charAt(0).toLowerCase() + key.substring(1);
                    annotation[key] = value;
            }
        }

        return annotation;
    }

}
