import {Tw2BaseClass} from "../../global";

/**
 * Tw2ScalarKey2
 * @ccp N/A
 *
 */
export class Tw2CurveScalarKey extends Tw2BaseClass
{

    endTangent = 0.0;
    extrapolation = 0;
    index = 0;
    interpolation = 1;
    startTangent = 0.0;
    time = 0.0;
    value = 0.0;


    /**
     * Black reader
     * @param {Tw2BlackBinaryReader} r
     * @returns {Tw2CurveScalarKey}
     */
    static blackReader(r)
    {
        const item = new this();
        item.time = r.ReadF32();
        item.value = r.ReadF32();
        item.startTangent = r.ReadF32();
        item.endTangent = r.ReadF32();
        item.index = r.ReadU16();
        item.interpolation = r.ReadU8();
        item.extrapolation = r.ReadU8();
        return item;
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}



/**
 * Tr2CurveScalar
 * @ccp Tr2CurveScalar
 *
 * @property {String} name                -
 * @property {Number} extrapolationAfter  -
 * @property {Number} extrapolationBefore -
 * @property {Array} keys                 -
 * @property {Number} timeOffset          -
 * @property {Number} timeScale           -
 */
export class Tr2CurveScalar extends Tw2BaseClass
{

    name = "";
    extrapolationAfter = 0;
    extrapolationBefore = 0;
    keys = [];
    timeOffset = 0;
    timeScale = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["timeOffset", r.float],
            ["timeScale", r.float],
            ["extrapolationAfter", r.uint],
            ["extrapolationBefore", r.uint],
            ["keys", r.structList(Tw2CurveScalarKey)]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}