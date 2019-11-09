import { quat, vec3, Tw2BaseClass } from "global";

/**
 * EveChildModifierSRT
 *
 * @property {quat} rotation    -
 * @property {vec3} scaling     -
 * @property {vec3} translation -
 */
export class EveChildModifierSRT extends Tw2BaseClass
{

    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    translation = vec3.create();

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "rotation", r.vector4 ],
            [ "scaling", r.vector3 ],
            [ "translation", r.vector3 ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 2;

}
