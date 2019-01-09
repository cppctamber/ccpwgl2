import {Tw2BaseClass} from "../../class";

/**
 * Tr2BoneMatrixCurve
 * @implements Curve
 *
 */
export default class Tr2BoneMatrixCurve extends Tw2BaseClass
{


}

Tw2BaseClass.define(Tr2BoneMatrixCurve, Type =>
{
    return {
        isStaging: true,
        type: "Tr2BoneMatrixCurve",
        category: "Curve",
        props: {}
    };
});

