import { quat, vec3 } from "../../global";


/**
 * EveSOFDataTransform
 *
 * @property {Number} boneIndex -
 * @property {vec3} position    -
 * @property {quat} rotation    -
 */
export class EveSOFDataTransform
{

    boneIndex = -1;
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
            [ "boneIndex", r.uint ],
            [ "position", r.vector3 ],
            [ "rotation", r.vector4 ],
            [ "scaling", r.vector3 ],
        ];
    }
}
