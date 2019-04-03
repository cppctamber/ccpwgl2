import {vec3, quat, Tw2BaseClass} from "../../global";

/**
 * Locator
 * TODO: Is the black definition correct? Where are "boneIndex" and "scaling"
 * @ccp N/A
 *
 * @property {vec3} position - Locator's position
 * @property {quat} rotation - Locator's rotation
 */
export class EveLocatorSetItem extends Tw2BaseClass
{
    // boneIndex = -1`;
    position = vec3.create();
    rotation = quat.create();
    //scaling = vec3.fromValues(1,1,1);

    /**
     * Black reader
     * @param {Tw2BlackBinaryReader} r
     */
    static blackStruct(r)
    {
        const item = new EveLocatorSetItem();
        vec3.copy(item.position, r.vector4()); // why is this a vector4?
        r.vector4(item.rotation);
        return item;
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 3;

}

/**
 * Locator sets
 * @ccp EveLocatorSets
 *
 * @property {String} name                       - Locator set name
 * @property {Array<EveLocatorSetItem>} locators - Locator sets
 */
export class EveLocatorSets extends Tw2BaseClass
{

    name = "";
    locators = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["locators", r.structList(EveLocatorSetItem)],
            ["name", r.string]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 1;

}
