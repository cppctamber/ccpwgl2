import {Tw2StagingClass} from "../../class";

/**
 * Tw2Texture2dLodParameter
 * @ccp Tr2Texture2dLodParameter
 * @implements Parameter
 *
 * @parameter {Tw2LodResource} lodResource -
 */
export default class Tw2Texture2dLodParameter extends Tw2StagingClass
{

    lodResource = null;

}

Tw2StagingClass.define(Tw2Texture2dLodParameter, Type =>
{
    return {
        type: "Tw2Texture2dLodParameter",
        category: "Parameter",
        props: {
            lodResource: ["Tw2LodResource"]
        }
    };
});

