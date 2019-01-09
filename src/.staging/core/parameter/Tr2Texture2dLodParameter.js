import {Tw2BaseClass} from "../../class";

/**
 * Tr2Texture2dLodParameter
 * @implements Parameter
 *
 * @parameter {Tr2LodResource} lodResource -
 */
export default class Tr2Texture2dLodParameter extends Tw2BaseClass
{

    lodResource = null;

}

Tw2BaseClass.define(Tr2Texture2dLodParameter, Type =>
{
    return {
        isStaging: true,
        type: "Tr2Texture2dLodParameter",
        category: "Parameter",
        props: {
            lodResource: ["Tr2LodResource"]
        }
    };
});

