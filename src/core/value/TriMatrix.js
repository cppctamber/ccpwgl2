import { Tw2BaseClass } from "../../global";

/**
 * TriMatrix
 * TODO: Implement
 * TODO: Identify if this defaults to an identity matrix
 *
 * @property {Number} _11 -
 * @property {Number} _12 -
 * @property {Number} _13 -
 * @property {Number} _14 -
 * @property {Number} _21 -
 * @property {Number} _22 -
 * @property {Number} _23 -
 * @property {Number} _24 -
 * @property {Number} _31 -
 * @property {Number} _32 -
 * @property {Number} _33 -
 * @property {Number} _34 -
 * @property {Number} _41 -
 * @property {Number} _42 -
 * @property {Number} _43 -
 * @property {Number} _44 -
 */
export class TriMatrix extends Tw2BaseClass
{

    _11 = 0;
    _12 = 0;
    _13 = 0;
    _14 = 0;
    _21 = 0;
    _22 = 0;
    _23 = 0;
    _24 = 0;
    _31 = 0;
    _32 = 0;
    _33 = 0;
    _34 = 0;
    _41 = 0;
    _42 = 0;
    _43 = 0;
    _44 = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "_11", r.float ],
            [ "_12", r.float ],
            [ "_13", r.float ],
            [ "_14", r.float ],
            [ "_21", r.float ],
            [ "_22", r.float ],
            [ "_23", r.float ],
            [ "_24", r.float ],
            [ "_31", r.float ],
            [ "_32", r.float ],
            [ "_33", r.float ],
            [ "_34", r.float ],
            [ "_41", r.float ],
            [ "_42", r.float ],
            [ "_43", r.float ],
            [ "_44", r.float ]
        ];
    }

}
