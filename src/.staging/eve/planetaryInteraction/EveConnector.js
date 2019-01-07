import {vec3, vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveConnector
 *
 * @parameter {vec4} animationColor                -
 * @parameter {Number} animationScale              -
 * @parameter {Number} animationSpeed              -
 * @parameter {vec4} color                         -
 * @parameter {EveLocalPositionCurve} destObject   -
 * @parameter {vec3} destPosition                  -
 * @parameter {Boolean} isAnimated                 -
 * @parameter {Number} lineWidth                   -
 * @parameter {EveLocalPositionCurve} sourceObject -
 * @parameter {Number} type                        -
 */
export default class EveConnector extends Tw2StagingClass
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

Tw2StagingClass.define(EveConnector, Type =>
{
    return {
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

