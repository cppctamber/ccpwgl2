import {vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveMissile
 *
 * @parameter {vec3} boundingSphereCenter                   -
 * @parameter {Number} boundingSphereRadius                 -
 * @parameter {Tw2TranslationAdapter} modelTranslationCurve -
 * @parameter {Array.<EveMissileWarhead>} warheads          -
 */
export default class EveMissile extends Tw2StagingClass
{

    boundingSphereCenter = vec3.create();
    boundingSphereRadius = 0;
    modelTranslationCurve = null;
    warheads = [];

}

Tw2StagingClass.define(EveMissile, Type =>
{
    return {
        type: "EveMissile",
        props: {
            boundingSphereCenter: Type.VECTOR3,
            boundingSphereRadius: Type.NUMBER,
            modelTranslationCurve: ["Tw2TranslationAdapter"],
            warheads: [["EveMissileWarhead"]]
        }
    };
});

