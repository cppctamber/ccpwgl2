import {Tw2StagingClass} from "../../class";

/**
 * Tw2TextureParameter
 * @ccp TriTextureParameter
 * @implements Parameter
 *
 * @parameter {String} resourcePath -
 */
export default class Tw2TextureParameter extends Tw2StagingClass
{

    resourcePath = "";

}

Tw2StagingClass.define(Tw2TextureParameter, Type =>
{
    return {
        type: "Tw2TextureParameter",
        category: "Parameter",
        props: {
            resourcePath: Type.PATH
        }
    };
});

