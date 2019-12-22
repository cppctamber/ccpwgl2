import { meta, mat4, util, Tw2BaseClass } from "global";


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
     * Locator name prefixes
     * @type {{AUDIO: string, ATTACH: string, BOOSTER: string, TURRET: string, XL_TURRET: string}}
     */
    static Prefix = {
        AUDIO: "locator_audio",
        ATTACH: "locator_attach",
        BOOSTER: "locator_booster",
        TURRET: "locator_turret",
        XL_TURRET: "locator_xl"
    };

}

@meta.type("EveLocator", true)
export class EveLocator extends EveLocator2
{

}
