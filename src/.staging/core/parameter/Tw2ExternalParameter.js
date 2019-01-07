import {Tw2StagingClass} from "../../class";

/**
 * Tw2ExternalParameter
 * @ccp Tr2ExternalParameter
 * @implements Parameter
 *
 * @parameter {String} destinationAttribute -
 */
export default class Tw2ExternalParameter extends Tw2StagingClass
{

    destinationAttribute = "";

}

Tw2StagingClass.define(Tw2ExternalParameter, Type =>
{
    return {
        type: "Tw2ExternalParameter",
        category: "Parameter",
        props: {
            destinationAttribute: Type.STRING
        }
    };
});

