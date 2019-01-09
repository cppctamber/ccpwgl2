import {vec3, vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * Tr2InteriorLightSource
 *
 * @parameter {vec4} color                 -
 * @parameter {Number} coneAlphaInner      -
 * @parameter {Number} coneAlphaOuter      -
 * @parameter {vec3} coneDirection         -
 * @parameter {Number} falloff             -
 * @parameter {Number} importanceBias      -
 * @parameter {Number} importanceScale     -
 * @parameter {Tr2KelvinColor} kelvinColor -
 * @parameter {vec3} position              -
 * @parameter {Number} radius              -
 * @parameter {Boolean} useKelvinColor     -
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

