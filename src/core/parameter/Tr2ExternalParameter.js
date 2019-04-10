import {Tw2Parameter} from "./Tw2Parameter";

/**
 * Tr2ExternalParameter
 * TODO: Implement
 * @ccp Tr2ExternalParameter
 *
 * @property {String} name                 -
 * @property {String} destinationAttribute -
 * @property {*} destinationObject         -
 */
export class Tr2ExternalParameter extends Tw2Parameter
{

    name = "";
    destinationAttribute = "";
    destinationObject = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["destinationObject", r.object],
            ["destinationAttribute", r.string],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
