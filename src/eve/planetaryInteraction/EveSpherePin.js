import {vec3, vec4, Tw2BaseClass} from "../../global";

/**
 * EveSpherePin
 * @ccp EveSpherePin
 * TODO: Implement
 *
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
export class EveSpherePin extends Tw2BaseClass
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

Tw2BaseClass.define(EveSpherePin, Type =>
{
    return {
        isStaging: true,
        type: "EveSpherePin",
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
        },
        notImplemented: ["*"]
    };
});

