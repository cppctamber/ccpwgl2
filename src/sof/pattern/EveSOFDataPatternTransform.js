import { quat, vec3 } from "global";


/**
 * EveSOFDataPatternTransform
 *
 * @property {Boolean} isMirrored -
 * @property {vec3} position      -
 * @property {quat} rotation      -
 * @property {vec3} scaling       -
 */
export class EveSOFDataPatternTransform
{

    isMirrored = false;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "isMirrored", r.boolean ],
            [ "position", r.vector3 ],
            [ "rotation", r.vector4 ],
            [ "scaling", r.vector3 ]
        ];
    }
}
