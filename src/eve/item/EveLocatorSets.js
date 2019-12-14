import { meta, vec3, quat, Tw2BaseClass } from "global";

/**
 * Locator
 * TODO: Is the black definition correct? Where are "boneIndex" and "scaling"
 *
 * @property {vec3} position - Locator's position
 * @property {quat} rotation - Locator's rotation
 */
@meta.type("EveLocatorSetItem")
@meta.stage(1)
export class EveLocatorSetItem extends Tw2BaseClass
{

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    // boneIndex = -1`;
    // scaling = vec3.fromValues(1,1,1);

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

}

/**
 * Locator sets
 *
 * @property {String} name                       - Locator set name
 * @property {Array<EveLocatorSetItem>} locators - Locator sets
 */
@meta.type("EveLocatorSets", true)
@meta.stage(1)
export class EveLocatorSets extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.struct([EveLocatorSetItem])
    locators = [];

}
