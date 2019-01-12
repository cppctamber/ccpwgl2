import {Tw2BaseClass} from "../../../global";

/**
 * Tr2ExternalParameter
 * @implements Parameter
 *
 * @property {String} destinationAttribute -
 */
export default class Tr2ExternalParameter extends Tw2BaseClass
{

    destinationAttribute = "";

}

Tw2BaseClass.define(Tr2ExternalParameter, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ExternalParameter",
        category: "Parameter",
        props: {
            destinationAttribute: Type.STRING
        }
    };
});

