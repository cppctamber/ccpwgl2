import {vec3, vec4} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * Tr2InteriorLightSource
 *
 * @property {vec4} color                 -
 * @property {Number} coneAlphaInner      -
 * @property {Number} coneAlphaOuter      -
 * @property {vec3} coneDirection         -
 * @property {Number} falloff             -
 * @property {Number} importanceBias      -
 * @property {Number} importanceScale     -
 * @property {Tr2KelvinColor} kelvinColor -
 * @property {vec3} position              -
 * @property {Number} radius              -
 * @property {Boolean} useKelvinColor     -
 */
export default class Tr2InteriorLightSource extends Tw2BaseClass
{

    color = vec4.create();
    coneAlphaInner = 0;
    coneAlphaOuter = 0;
    coneDirection = vec3.create();
    falloff = 0;
    importanceBias = 0;
    importanceScale = 0;
    kelvinColor = null;
    position = vec3.create();
    radius = 0;
    useKelvinColor = false;

}

Tw2BaseClass.define(Tr2InteriorLightSource, Type =>
{
    return {
        isStaging: true,
        type: "Tr2InteriorLightSource",
        props: {
            color: Type.RGBA_LINEAR,
            coneAlphaInner: Type.NUMBER,
            coneAlphaOuter: Type.NUMBER,
            coneDirection: Type.VECTOR3,
            falloff: Type.NUMBER,
            importanceBias: Type.NUMBER,
            importanceScale: Type.NUMBER,
            kelvinColor: ["Tr2KelvinColor"],
            position: Type.TR_TRANSLATION,
            radius: Type.NUMBER,
            useKelvinColor: Type.BOOLEAN
        }
    };
});

