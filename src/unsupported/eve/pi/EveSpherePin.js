import { meta, vec3, vec4, Tw2BaseClass } from "global";


/**
 * EveSpherePin
 *
 * @property {String} name                   -
 * @property {vec3} centerNormal             -
 * @property {vec4} color                    -
 * @property {Array.<Tw2CurveSet>} curveSets -
 * @property {Boolean} enablePicking         -
 * @property {String} geometryResPath        -
 * @property {vec4} pinColor                 -
 * @property {Tw2Effect} pinEffect           -
 * @property {Number} pinMaxRadius           -
 * @property {Number} pinRadius              -
 * @property {Number} pinRotation            -
 * @property {Number} sortValueMultiplier    -
 */
@meta.notImplemented
@meta.type("EveSpherePin", true)
export class EveSpherePin extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.vector3
    centerNormal = vec3.create();

    @meta.black.color
    color = vec4.create();

    @meta.black.list
    curveSets = [];

    @meta.black.boolean
    enablePicking = false;

    @meta.black.path
    geometryResPath = "";

    @meta.black.color
    pinColor = vec4.create();

    @meta.black.object
    pinEffect = null;

    @meta.black.float
    pinMaxRadius = 0;

    @meta.black.float
    pinRadius = 0;

    @meta.black.float
    pinRotation = 0;

    @meta.black.float
    sortValueMultiplier = 0;

}
