import {mat4, Tw2BaseClass} from "../../global";
import {assignIfExists} from "../../global/util";

/**
 * Contains transform information for T3 Attachments, Boosters, Turrets and XLTurrets
 * TODO: Make bone private and update all uses
 * TODO: Properties "atlasIndex0" and "atlasIndex1" may be for internal use only
 * @ccp EveLocator2
 *
 * @property {?number} atlasIndex0          - A booster locator's atlasIndex0
 * @property {?number} atlasIndex1          - A booster locator's atlasIndex1
 * @property {mat4} transform               - The locator's transform
 * @property {?Tw2Bone} _bone               - A turret locator's bone
 */
export class EveLocator2 extends Tw2BaseClass
{

    name = "";
    transform = mat4.create();

    // EveLocator only?
    atlasIndex0 = null;
    atlasIndex1 = null;

    // ccpwgl
    _bone = null;

    /**
     * Gets the locators bone
     * @returns {null|Tw2Bone}
     */
    get bone()
    {
        console.log("property 'bone' has migrated to '_bone'");
        return this._bone;
    }

    /**
     * Gets the locator's bone from an animation controller
     * @param {Tw2AnimationController} animationController
     * @returns {?Tw2Bone}
     */
    FindBone(animationController)
    {
        this._bone = null;
        const model = animationController.FindModelForMesh(0);
        if (model)
        {
            for (let i = 0; i < model.bones.length; ++i)
            {
                if (model.bones[i].boneRes.name === this.name)
                {
                    this._bone = model.bones[i];
                    break;
                }
            }
        }
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
            assignIfExists(item, values, ["transform", "name", "atlasIndex0", "atlasIndex1"]);
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["transform", r.matrix]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 1;

}

export {EveLocator2 as EveLocator};