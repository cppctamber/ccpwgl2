import {vec3, vec4, Tw2BaseClass} from "../../global";

/**
 * EveConnector
 *
 * @property {vec4} animationColor                -
 * @property {Number} animationScale              -
 * @property {Number} animationSpeed              -
 * @property {vec4} color                         -
 * @property {EveLocalPositionCurve} destObject   -
 * @property {vec3} destPosition                  -
 * @property {Boolean} isAnimated                 -
 * @property {Number} lineWidth                   -
 * @property {EveLocalPositionCurve} sourceObject -
 * @property {Number} type                        -
 */
export class EveConnector extends Tw2BaseClass
{

    animationColor = vec4.create();
    animationScale = 0;
    animationSpeed = 0;
    color = vec4.create();
    destObject = null;
    destPosition = vec3.create();
    isAnimated = false;
    lineWidth = 0;
    sourceObject = null;
    type = 0;

}

Tw2BaseClass.define(EveConnector, Type =>
{
    return {
        isStaging: true,
        type: "EveConnector",
        props: {
            animationColor: Type.RGBA_LINEAR,
            animationScale: Type.NUMBER,
            animationSpeed: Type.NUMBER,
            color: Type.RGBA_LINEAR,
            destObject: ["EveLocalPositionCurve"],
            destPosition: Type.TR_TRANSLATION,
            isAnimated: Type.BOOLEAN,
            lineWidth: Type.NUMBER,
            sourceObject: ["EveLocalPositionCurve"],
            type: Type.NUMBER
        }
    };
});

