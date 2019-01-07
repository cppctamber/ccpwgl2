import {Tw2StagingClass} from "../../class";

/**
 * Tw2LodResource
 * @ccp Tr2LodResource
 *
 * @parameter {String} highDetailResPath   -
 * @parameter {String} lowDetailResPath    -
 * @parameter {String} mediumDetailResPath -
 */
export default class Tw2LodResource extends Tw2StagingClass
{

    highDetailResPath = "";
    lowDetailResPath = "";
    mediumDetailResPath = "";

}

Tw2StagingClass.define(Tw2LodResource, Type =>
{
    return {
        type: "Tw2LodResource",
        props: {
            highDetailResPath: Type.PATH,
            lowDetailResPath: Type.PATH,
            mediumDetailResPath: Type.PATH
        }
    };
});

