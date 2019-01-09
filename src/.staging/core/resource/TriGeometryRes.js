import {Tw2BaseClass} from "../../class";

/**
 * TriGeometryRes
 * @implements Resource
 *
 */
export default class TriGeometryRes extends Tw2BaseClass
{


}

Tw2BaseClass.define(TriGeometryRes, Type =>
{
    return {
        isStaging: true,
        type: "TriGeometryRes",
        category: "Resource",
        props: {}
    };
});

