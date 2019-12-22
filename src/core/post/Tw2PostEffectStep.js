import { meta, util, Tw2BaseClass } from "global";
import { Tw2Effect } from "../mesh/Tw2Effect";


@meta.type("Tw2PostEffectStep")
export class Tw2PostEffectStep extends Tw2BaseClass
{

    @meta.uint
    @meta.isPrivate
    index = -1;

    @meta.boolean
    display = true;

    @meta.objectOf("Tw2Effect")
    effect = null;

    @meta.string
    target = null;

    @meta.plainOf("String")
    inputs = {};


    _renderTarget = null;
    _dirty = true;

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        this._dirty = true;
    }

    /**
     * Checks if the step is good
     * @returns {Boolean}
     */
    IsGood()
    {
        return this.effect ? this.effect.IsGood() : false;
    }

    /**
     * Keeps the step alive
     */
    KeepAlive()
    {
        if (this.effect)
        {
            this.effect.KeepAlive();
        }
    }

    /**
     * Gets resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        if (this.effect)
        {
            this.effect.GetResources(out);
        }
        return out;
    }

    /**
     * Creates a post effect step from an object
     * @param {*} [opt={}]
     * @returns {Tw2PostEffectStep}
     */
    static from(opt = {})
    {
        const item = new this();
        util.assignIfExists(item, opt, [ "name", "display", "target", "index" ]);

        if (opt.inputs)
        {
            Object.assign(item.inputs, opt.inputs);
        }

        item.effect = Tw2Effect.from({
            name: opt.name,
            autoParameter: true,
            effectFilePath: opt.effectFilePath,
            parameters: opt.parameters,
            textures: opt.textures,
            overrides: opt.overrides
        });

        return item;
    }

}
