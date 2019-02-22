import {Tw2Parameter} from "./Tw2Parameter";

/**
 * Tr2ExternalParameter
 * TODO: Implement
 * @ccp Tr2ExternalParameter
 *
 * @property {String} destinationAttribute -
 * @property {*} destinationObject         -
 */
export class Tr2ExternalParameter extends Tw2Parameter
{

    destinationAttribute = "";
    destinationObject = null;
}

Tw2Parameter.define(Tr2ExternalParameter, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ExternalParameter",
        props: {
            destinationAttribute: Type.STRING,
            destinationObject: Type.REF
        },
        notImplemented: ["*"]
    };
});

