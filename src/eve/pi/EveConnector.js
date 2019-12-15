import { meta, vec3, vec4, Tw2BaseClass } from "global";


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
@meta.type("EveConnector", true)
export class EveConnector extends Tw2BaseClass
{

    @meta.black.color
    animationColor = vec4.create();

    @meta.black.float
    animationScale = 0;

    @meta.black.float
    animationSpeed = 0;

    @meta.black.color
    color = vec4.create();

    @meta.black.object
    destObject = null;

    @meta.black.vector3
    destPosition = vec3.create();

    @meta.black.boolean
    isAnimated = false;

    @meta.black.float
    lineWidth = 0;

    @meta.black.object
    sourceObject = null;

    @meta.black.uint
    type = 0;

}
