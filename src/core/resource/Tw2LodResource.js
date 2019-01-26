import {Tw2BaseClass} from "../../global/index";

/**
 * Tr2LodResource
 * @ccp Tr2LodResource
 *
 * @property {String} highDetailResPath   -
 * @property {String} lowDetailResPath    -
 * @property {String} mediumDetailResPath -
 */
export class Tw2LodResource extends Tw2BaseClass
{

    highDetailResPath = "";
    lowDetailResPath = "";
    mediumDetailResPath = "";

}

Tw2BaseClass.define(Tw2LodResource, Type =>
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

