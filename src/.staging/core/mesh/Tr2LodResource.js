import {Tw2BaseClass} from "../../class";

/**
 * Tr2LodResource
 *
 * @parameter {String} highDetailResPath   -
 * @parameter {String} lowDetailResPath    -
 * @parameter {String} mediumDetailResPath -
 */
export default class Tr2LodResource extends Tw2BaseClass
{

    highDetailResPath = "";
    lowDetailResPath = "";
    mediumDetailResPath = "";

}

Tw2BaseClass.define(Tr2LodResource, Type =>
{
    return {
        isStaging: true,
        type: "Tr2LodResource",
        props: {
            highDetailResPath: Type.PATH,
            lowDetailResPath: Type.PATH,
            mediumDetailResPath: Type.PATH
        }
    };
});

