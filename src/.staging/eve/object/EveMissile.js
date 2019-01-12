import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveMissile
 *
 * @property {vec3} boundingSphereCenter                   -
 * @property {Number} boundingSphereRadius                 -
 * @property {Tr2TranslationAdapter} modelTranslationCurve -
 * @property {Array.<EveMissileWarhead>} warheads          -
 */
export default class EveMissile extends Tw2BaseClass
{

    boundingSphereCenter = vec3.create();
    boundingSphereRadius = 0;
    modelTranslationCurve = null;
    warheads = [];

}

Tw2BaseClass.define(EveMissile, Type =>
{
    return {
        isStaging: true,
        type: "EveMissile",
        props: {
            boundingSphereCenter: Type.VECTOR3,
            boundingSphereRadius: Type.NUMBER,
            modelTranslationCurve: ["Tr2TranslationAdapter"],
            warheads: [["EveMissileWarhead"]]
        }
    };
});

