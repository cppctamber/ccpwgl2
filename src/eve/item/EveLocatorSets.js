import {vec3, quat, Tw2BaseClass} from "../../global";

/**
 * Locator
 * @ccp N/A
 *
 * @property {vec3} position - Locator's position
 * @property {quat} rotation - Locator's rotation
 */
export class EveLocatorSetItem extends Tw2BaseClass
{

    position = vec3.create();
    rotation = quat.create();

}

Tw2BaseClass.define(EveLocatorSetItem, Type =>
{
    return {
        type: "EveLocatorSetItem",
        props: {
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION
        }
    };
});

/**
 * Locator sets
 * @ccp EveLocatorSets
 *
 * @property {Array<EveLocatorSetItem>} locators - Locator set items
 */
export class EveLocatorSets extends Tw2BaseClass
{

    locators = [];

}

Tw2BaseClass.define(EveLocatorSets, Type =>
{
    return {
        isStaging: true,
        type: "EveLocatorSets",
        props: {
            locators: [["EveLocatorSetItem"]]
        }
    };
});

