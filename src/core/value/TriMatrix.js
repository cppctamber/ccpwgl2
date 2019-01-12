import {Tw2BaseClass} from "../../global";

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
export default class TriMatrix extends Tw2BaseClass
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

}

Tw2BaseClass.define(TriMatrix, Type =>
{
    return {
        isStaging: true,
        type: "TriMatrix",
        props: {
            _11: Type.NUMBER,
            _12: Type.NUMBER,
            _13: Type.NUMBER,
            _14: Type.NUMBER,
            _21: Type.NUMBER,
            _22: Type.NUMBER,
            _23: Type.NUMBER,
            _24: Type.NUMBER,
            _31: Type.NUMBER,
            _32: Type.NUMBER,
            _33: Type.NUMBER,
            _34: Type.NUMBER,
            _41: Type.NUMBER,
            _42: Type.NUMBER,
            _43: Type.NUMBER,
            _44: Type.NUMBER
        }
    };
});


