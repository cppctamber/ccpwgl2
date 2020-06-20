import { meta, mat4, util, Tw2BaseClass } from "global";
import { vec3 } from "global/index";


@meta.type("EveLocator2", true)
@meta.stage(1)
export class EveLocator2 extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.matrix4
    transform = mat4.create();

    @meta.uint
    @meta.todo("Move to EveLocator only?")
    atlasIndex0 = null;

    @meta.uint
    @meta.todo("Move to EveLocator only?")
    atlasIndex1 = null;

    @meta.objectOf("Tw2Bone")
    @meta.isPrivate
    bone = null;

    /**
     * Gets glow translation
     * @param {vec3} out
     * @param {Number} [offset=0]
     * @param {mat4} [worldTransform]
     * @returns {vec3}
     */
    GetGlowTranslation(out, offset, worldTransform)
    {
        this.GetDirection(out);
        if (offset) vec3.scale(out, out, offset);
        vec3.subtract(out, out, this.GetTranslation(EveLocator2.global.vec3_0));
        if (worldTransform) vec3.transformMat4(out, out, worldTransform);
        return out;
    }

    /**
     * Gets a weapon's rotation and translation
     * @param {quat} outRotation
     * @param {vec3} outTranslation
     * @param {mat4} [worldTransform]
     */
    GetWeaponRotationTranslation(outRotation, outTranslation, worldTransform)
    {
        const transform = mat4.copy(EveLocator2.global.mat4_0, this.transform);
        vec3.normalize(transform.subarray(0, 3), transform.subarray(0, 3));
        vec3.normalize(transform.subarray(4, 7), transform.subarray(4, 7));
        vec3.normalize(transform.subarray(8, 11), transform.subarray(8, 11));
        if (worldTransform) mat4.multiply(transform, worldTransform,  transform);
        mat4.getRotation(outRotation, transform);
        mat4.getTranslation(outTranslation, transform);
    }

    /**
     * Gets the item's position
     * @param {vec3} out
     * @param {mat4} [worldTransform]
     * @returns {vec3} out
     */
    GetTranslation(out, worldTransform)
    {
        mat4.getTranslation(out, this.transform);
        if (worldTransform) vec3.transformMat4(out, out, worldTransform);
        return out;
    }

    /**
     * Gets the item's direction
     * @param {vec3} out
     * @param {mat4} [worldTransform]
     * @returns {vec3} out
     */
    GetDirection(out, worldTransform)
    {
        vec3.set(out, this.transform[8], this.transform[9], this.transform[10]);
        if (worldTransform) vec3.transformMat4(out, out, worldTransform);
        vec3.normalize(out, out);
        const scale = this.GetScale();
        if (scale < 3) vec3.scale(out, out, scale / 3);
        return out;
    }

    /**
     * Gets the item's scale
     * @returns {Number}
     */
    GetScale()
    {
        const tr = this.transform;
        return Math.max(vec3.length([ tr[0], tr[1], tr[2] ]), vec3.length([ tr[4], tr[5], tr[6] ]));
    }


    /**
     * Gets the locator's bone from an animation controller
     * @param {Tw2AnimationController} animationController
     * @returns {null|Tw2Bone}
     */
    FindBone(animationController)
    {
        this.bone = animationController.FindBoneForMesh(this.name, 0);
        return this.bone;
    }

    /**
     * Global and static variables
     * @type {{vec3_0: vec3, mat4_0: mat4}}
     */
    static global = {
        vec3_0: vec3.create(),
        mat4_0: mat4.create()
    };

    /**
     * Creates a locator from options
     * @param {*} [values]
     * @param {*} [options]
     * @returns {EveLocator2}
     */
    static from(values, options)
    {
        const item = new EveLocator2();
        if (values)
        {
            util.assignIfExists(item, values, [ "transform", "name", "atlasIndex0", "atlasIndex1" ]);
        }
        return item;
    }

    /**
     * Locator types
     * @type {{AUDIO: string, ATTACH: string, BOOSTER: string, TURRET: string, XL_TURRET: string}}
     */
    static Type = {
        AUDIO: "locator_audio",
        ATTACH: "locator_attach",
        BOOSTER: "locator_booster",
        TURRET: "locator_turret",
        XL_TURRET: "locator_xl",
        CHAIN: "locator_chain",
        ATOMIC: "locator_atomic"
    };

}

@meta.type("EveLocator", true)
export class EveLocator extends EveLocator2
{

}
