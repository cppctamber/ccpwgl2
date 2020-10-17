import { meta } from "utils";
import { vec3, vec4 } from "math";


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
@meta.notImplemented
@meta.ctor("EveConnector", true)
export class EveConnector extends meta.Model
{

    @meta.color
    animationColor = vec4.create();

    @meta.float
    animationScale = 0;

    @meta.float
    animationSpeed = 0;

    @meta.color
    color = vec4.create();

    @meta.struct()
    destObject = null;

    @meta.vector3
    destPosition = vec3.create();

    @meta.boolean
    isAnimated = false;

    @meta.float
    lineWidth = 0;

    @meta.struct()
    sourceObject = null;

    @meta.uint
    type = 0;

}
