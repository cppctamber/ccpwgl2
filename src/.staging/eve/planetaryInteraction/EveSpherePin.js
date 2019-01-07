import {vec3, vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSpherePin
 * @implements EveObject
 *
 * @parameter {vec3} centerNormal             -
 * @parameter {vec4} color                    -
 * @parameter {Array.<Tw2CurveSet>} curveSets -
 * @parameter {Boolean} enablePicking         -
 * @parameter {String} geometryResPath        -
 * @parameter {vec4} pinColor                 -
 * @parameter {Tw2Effect} pinEffect           -
 * @parameter {Number} pinMaxRadius           -
 * @parameter {Number} pinRadius              -
 * @parameter {Number} pinRotation            -
 * @parameter {Number} sortValueMultiplier    -
 */
export default class EveSpherePin extends Tw2StagingClass
{

    centerNormal = vec3.create();
    color = vec4.create();
    curveSets = [];
    enablePicking = false;
    geometryResPath = "";
    pinColor = vec4.create();
    pinEffect = null;
    pinMaxRadius = 0;
    pinRadius = 0;
    pinRotation = 0;
    sortValueMultiplier = 0;

}

Tw2StagingClass.define(EveSpherePin, Type =>
{
    return {
        type: "EveSpherePin",
        category: "EveObject",
        props: {
            centerNormal: Type.VECTOR3,
            color: Type.RGBA_LINEAR,
            curveSets: [["Tw2CurveSet"]],
            enablePicking: Type.BOOLEAN,
            geometryResPath: Type.PATH,
            pinColor: Type.RGBA_LINEAR,
            pinEffect: ["Tw2Effect"],
            pinMaxRadius: Type.NUMBER,
            pinRadius: Type.NUMBER,
            pinRotation: Type.NUMBER,
            sortValueMultiplier: Type.NUMBER
        }
    };
});

