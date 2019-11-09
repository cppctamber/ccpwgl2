import { mat4 } from "global";


/**
 * EveSOFDataHullLocator
 *
 * @property {String} name    -
 * @property {mat4} transform -
 */
export class EveSOFDataHullLocator
{

    name = "";
    transform = mat4.create();

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ],
            [ "transform", r.matrix ]
        ];
    }
}
