import { meta, vec3, quat } from "global";


@meta.ctor("EveLocatorSetItem")
@meta.stage(1)
export class EveLocatorSetItem extends meta.Model
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


@meta.ctor("EveLocatorSets", true)
export class EveLocatorSets extends meta.Model
{

    @meta.string
    name = "";

    @meta.list(EveLocatorSetItem)
    locators = [];

}
