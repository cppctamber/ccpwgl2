import { meta } from "utils";
import { vec3, quat, mat4 } from "math";


/**
 * Carbon's standalone `Locator` struct (EveLocatorSets.h:10-17), as authored
 * INSIDE a distribution's own locator list rather than on a hull.
 *
 * It is not `EveLocatorSetItem`, despite carrying the same four values: the
 * two spell them differently - `direction`/`scale` here against
 * `rotation`/`scaling` there - and the black reader matches by NAME.
 *
 * Which is why the absence of this registration does not present as a naming
 * problem. Without it the reader builds an untyped bag, misreads the list, and
 * throws on whatever it reads next as a length:
 *
 *     Error reading binary (Argument is too big: remaining 258, got 3961897650)
 *
 * That reads as a corrupt asset rather than a missing class, which is how it
 * survived being reverted once (569c1fcf, reverting 273879d2) - the claim that
 * `EveLocatorSetItem` is the same wire shape holds for the VALUES and not for
 * the names, and only this generator reads the authored struct directly.
 * `EveDistributionPlacementGeneratorParentLocators` reads runtime items off
 * the parent instead, so it correctly uses the other spelling.
 */
@meta.define("Locator", true)
export class Locator extends meta.Model
{

    @meta.translation
    position = vec3.create();

    @meta.rotation
    direction = quat.create();

    @meta.scaling
    scale = vec3.fromValues(1, 1, 1);

    @meta.int32
    boneIndex = -1;

    /**
     * Reads one PACKED record out of a Blue structure list.
     *
     * This is not a list of objects, which is the whole reason the ordinary
     * reader could not cope. Carbon declares the layout by BYTE OFFSET
     * (EveDistributionPlacementGeneratorLocators.cpp:6-12):
     *
     *     { "position",  Be::FLOAT32_3,  0 }
     *     { "direction", Be::FLOAT32_4, 12 }
     *     { "scale",     Be::FLOAT32_3, 28 }
     *     { "boneIndex", Be::INT32_1,   40 }
     *
     * 44 bytes, fixed order, no names on the wire - so the reader must follow
     * that order exactly and the property names here are ours alone. Carbon's
     * `Locator` also carries a `partTag`, which is absent from the definition
     * and therefore runtime-only: reading one would consume four bytes that
     * belong to the next record.
     *
     * `structList` hands this a reader bounded to the record and then asserts
     * it was read to the end, so a wrong field width fails here rather than
     * corrupting everything after it.
     *
     * @param {Tw2BlackBinaryReader} r
     * @returns {Locator}
     */
    static blackStruct(r)
    {
        const item = new this();
        vec3.set(item.position, r.ReadF32(), r.ReadF32(), r.ReadF32());
        quat.set(item.direction, r.ReadF32(), r.ReadF32(), r.ReadF32(), r.ReadF32());
        vec3.set(item.scale, r.ReadF32(), r.ReadF32(), r.ReadF32());
        item.boneIndex = r.ReadI32();
        return item;
    }

}


@meta.define("EveLocatorSetItem", true)
@meta.stage(1)
export class EveLocatorSetItem extends meta.Model
{

    @meta.int32
    boneIndex = -1;

    @meta.translation
    position = vec3.create();

    @meta.rotation
    rotation = quat.create();

    @meta.scaling
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
        return mat4.copy(m, this._worldTransform);
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
            mat4.copy(this._worldTransform, this._localTransform);
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
        vec3.copy(item.position, r.ReadF32Array(3));
        quat.copy(item.rotation, r.ReadF32Array(4));
        vec3.copy(item.scaling, r.ReadF32Array(3));
        item.boneIndex = r.ReadI32();
        return item;
    }

}



@meta.define("EveLocatorSets", true)
export class EveLocatorSets extends meta.Model
{

    @meta.string
    @meta.ui({ desc: "The unique name of this set of locators" })
    name = "";

    @meta.list(EveLocatorSetItem)
    @meta.ui({ desc: "List of all the locators of this set" })
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
