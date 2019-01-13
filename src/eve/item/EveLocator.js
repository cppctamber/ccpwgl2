import {mat4, Tw2BaseClass} from "../../global";

/**
 * Contains transform information for T3 Attachments, Boosters, Turrets and XLTurrets
 * TODO: Make bone private and update all uses
 *
 * @property {?number} atlasIndex0          - A booster locator's atlasIndex0
 * @property {?number} atlasIndex1          - A booster locator's atlasIndex1
 * @property {?Tw2Bone} bone                - A turret locator's bone
 * @property {mat4} transform               - The locator's transform
 */
export class EveLocator extends Tw2BaseClass
{

    atlasIndex0 = null;
    atlasIndex1 = null;
    bone = null;
    transform = mat4.create();


    /**
     * Gets the locator's bone from an animation controller
     * @param {Tw2AnimationController} animationController
     * @returns {?Tw2Bone}
     */
    FindBone(animationController)
    {
        this.bone = null;
        const model = animationController.FindModelForMesh(0);
        if (model)
        {
            for (let i = 0; i < model.bones.length; ++i)
            {
                if (model.bones[i].boneRes.name === this.name)
                {
                    this.bone = model.bones[i];
                    break;
                }
            }
        }
        return this.bone;
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

Tw2BaseClass.define(EveLocator, Type =>
{
    return {
        type: "EveLocator",
        category: "Locator",
        props: {
            atlasIndex0: Type.NUMBER,
            atlasIndex1: Type.NUMBER,
            bone: Type.REF,
            transform: Type.TR_LOCAL
        }
    };
});

/**
 * EveLocator2
 * TODO: Is there any difference between this and EveLocator ?
 *
 * @property {mat4} transform - The locators transform
 */
export class EveLocator2 extends Tw2BaseClass
{

    transform = mat4.create();

}

Tw2BaseClass.define(EveLocator2, Type =>
{
    return {
        type: "EveLocator2",
        category: "Locator",
        isStaging: true,
        props: {
            transform: Type.TR_LOCAL
        }
    };
});

/**
 * EveLocatorSets
 *
 * @property {Array<{position: vec4, direction: vec3}>} locators -
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
            locators: Type.ARRAY
        }
    };
});

