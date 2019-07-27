import {Tw2BaseClass} from "../../global";
import {ErrFeatureNotImplemented} from "../Tw2Error";
import {Tw2Vector4Parameter} from "../parameter";


class Tw2ConstantParameter
{

    /**
     * Black reader
     * @param {Tw2BlackBinaryReader} r
     * @returns {Tw2Vector4Parameter}
     */
    static blackStruct(r)
    {
        const item = new Tw2Vector4Parameter();
        item.name = r.ReadStringU16();
        r.ExpectU16(0, "unknown content");
        r.ExpectU16(0, "unknown content");
        r.ExpectU16(0, "unknown content");
        item.SetValue(new Float32Array([r.ReadF32(), r.ReadF32(), r.ReadF32(), r.ReadF32()]));
        return item;
    }
}

/**
 * Tr2Effect
 * TODO: Implement
 * TODO: Replace constant parameter with Tw2Vector4Parameter?
 *
 * @property {Array<Parameter>} constParameters -
 * @property {String} effectFilePath            -
 * @property {Array} options                    -
 * @property {Array.<Parameter>} parameters     -
 * @property {Array.<Parameter>} resources      -
 * @property {Array} samplerOverrides           -
 */
export class Tr2Effect extends Tw2BaseClass
{

    constParameters = [];
    effectFilePath = "";
    options = [];
    parameters = [];
    resources = [];
    samplerOverrides = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["effectFilePath", r.path],
            ["name", r.string],
            ["parameters", r.array],
            ["resources", r.array],
            ["constParameters", r.structList(Tw2ConstantParameter)],
            ["options", (reader) =>
            {
                throw ErrFeatureNotImplemented({feature: "Tr2Effect options"});
            }],
            ["samplerOverrides", (reader) =>
            {
                throw ErrFeatureNotImplemented({feature: "Tr2Effect samplerOverrides"});
            }]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
