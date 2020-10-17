import { meta } from "utils";
import { vec3, vec4 } from "math";


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
@meta.ctor("EveSpherePin", true)
export class EveSpherePin extends meta.Model
{

    @meta.string
    name = "";

    @meta.vector3
    centerNormal = vec3.create();

    @meta.color
    color = vec4.create();

    @meta.list()
    curveSets = [];

    @meta.boolean
    enablePicking = false;

    @meta.path
    geometryResPath = "";

    @meta.color
    pinColor = vec4.create();

    @meta.struct()
    pinEffect = null;

    @meta.float
    pinMaxRadius = 0;

    @meta.float
    pinRadius = 0;

    @meta.float
    pinRotation = 0;

    @meta.float
    sortValueMultiplier = 0;

}
