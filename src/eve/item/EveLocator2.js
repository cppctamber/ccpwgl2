import { meta, mat4, util, Tw2BaseClass } from "global";

/**
 * Contains transform information for T3 Attachments, Boosters, Turrets and XLTurrets
 *
 * @property {?number} atlasIndex0          - A booster locator's atlasIndex0
 * @property {?number} atlasIndex1          - A booster locator's atlasIndex1
 * @property {mat4} transform               - The locator's transform
 * @property {?Tw2Bone} _bone               - A turret locator's bone
 */
@meta.stage(1)
@meta.type("EveLocator2", true)
export class EveLocator2 extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.matrix4
    transform = mat4.create();

    @meta.uint
    @meta.isNullable
    @meta.todo("Move to EveLocator only?")
    atlasIndex0 = null;

    @meta.uint
    @meta.isNullable
    @meta.todo("Move to EveLocator only?")
    atlasIndex1 = null;

    @meta.isPrivate
    @meta.todo("Replace all usages with private property")
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
