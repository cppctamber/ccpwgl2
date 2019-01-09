import {Tw2BaseClass} from "../../class";

/**
 * TriTextureParameter
 * @implements Parameter
 *
 * @parameter {String} resourcePath -
 */
export default class TriTextureParameter extends Tw2BaseClass
{

    resourcePath = "";

}

Tw2BaseClass.define(TriTextureParameter, Type =>
{
    return {
        isStaging: true,
        type: "TriTextureParameter",
        category: "Parameter",
        props: {
            resourcePath: Type.PATH
        }
    };
});

