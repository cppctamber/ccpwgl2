import {Tw2BaseClass} from "../../global/index";

/**
 * Tr2KelvinColor
 * TODO: Do we need this class?
 * TODO: Implement (I don't think this class actually needs to do anything - T'amber)
 *
 * @property {Number} temperature -
 * @property {Number} tint        -
 */
export default class Tr2KelvinColor extends Tw2BaseClass
{

    temperature = 0;
    tint = 0;

}

Tw2BaseClass.define(Tr2KelvinColor, Type =>
{
    return {
        isStaging: true,
        type: "Tr2KelvinColor",
        props: {
            temperature: Type.NUMBER,
            tint: Type.NUMBER
        },
        notImplemented: [
            "temperature",
            "tint"
        ]
    };
});

