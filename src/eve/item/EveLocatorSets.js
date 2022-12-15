import { meta } from "utils";
import { vec3, quat, vec4, mat4 } from "math";


@meta.type("EveLocatorSetItem")
@meta.stage(1)
export class EveLocatorSetItem extends meta.Model
{

    @meta.uint
    boneIndex = -1;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1,1,1);

    _bone = null;
    _localTransform = mat4.create();
    _worldTransform = mat4.create();

    /**
     * Checks if the locator set item is skinned
     * @returns {boolean}
     */
    get isSkinned()
    {
        return this._bone !== null;
    }

    /**
     * Gets the locator's local transform
     * @param {mat4} m
     * @returns {mat4} m
     */
    GetTransform(m)
    {
        mat4.copy(m, this._localTransform);
        if (this._bone) mat4.multiply(m, this._bone.offsetTransform, m);
        return m;
    }

    /**
     * Gets the locator's world transform
     * @param {mat4} m
     */
    GetWorldTransform(m)
    {
        mat4.copy(m, this._worldTransform);
    }

    /**
     * Per frame update
     * @param {mat4} parentTransform
     * @param {Array<Tw2Bone>} bones
     */
    UpdateViewDependentData(parentTransform, bones)
    {
        mat4.fromRotationTranslationScale(this._localTransform, this.rotation, this.position, this.scaling);

        if (this.boneIndex > -1 && bones && bones[this.boneIndex])
        {
            this._bone = bones[this.boneIndex];
            mat4.multiply(this._worldTransform, this._bone.offsetTransform, this._localTransform);
        }
        else
        {
            this._bone = null;
        }

        mat4.multiply(this._worldTransform, parentTransform, this._worldTransform);
    }

    /**
     * Black reader
     * TODO: Confirm if this is correct
     * @param {Tw2BlackBinaryReader} r
     */
    static blackStruct(r)
    {
        const item = new EveLocatorSetItem();
        vec3.copy(item.position,r.ReadF32Array(3));
        vec4.copy(item.rotation, r.ReadF32Array(4));
        item.boneIndex = r.ReadF32Array(1) * 255 - 1;
        return item;
    }

}



@meta.type("EveLocatorSets")
export class EveLocatorSets extends meta.Model
{

    @meta.string
    name = "";

    @meta.list(EveLocatorSetItem)
    locators = [];

    /**
     * Per frame update
     * @param {mat4} parentTransform
     * @param {Array<Tw2Bone>} bones
     */
    UpdateViewDependentData(parentTransform, bones)
    {
        for (let i = 0; i < this.locators.length; i++)
        {
            this.locators[i].UpdateViewDependentData(parentTransform, bones);
        }
    }

}
