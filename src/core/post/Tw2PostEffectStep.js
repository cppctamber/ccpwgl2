import {assignIfExists} from "../../global/util";
import {Tw2Effect} from "../mesh/Tw2Effect";
import Tw2BaseClass from "../../global/class/Tw2BaseClass";

/**
 * Post effect step
 *
 * @property {String|number| _id                - A unique id
 * @property {String} name                      - the step's name
 * @property {Boolean} display                  - toggles rendering
 * @property {Number} [index=-1]                - the step's render order (defaults to the order it was added)
 * @property {Tw2Effect} effect                 - the step's effect
 * @property {?String} [target]                 - the step's render target name
 * @property {{string:string}} inputs           - the step's input render targets
 * @property {?Tw2RenderTarget} [_renderTarget] - the step's render target (if none is defined the current target is used)
 * @property {Boolean} _dirty                   - identifies if the post is pending a rebuild
 * @property {?Function} _onModified            - a function which is called when the step is modified
 */
export class Tw2PostEffectStep extends Tw2BaseClass
{

    index = -1;
    display = true;
    effect = null;
    target = null;
    inputs = {};

    _renderTarget = null;
    _dirty = true;
    _onModified = null;

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        this._dirty = true;
        if (this._onModified)
        {
            this._onModified(this);
        }
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
        assignIfExists(item, opt, ["name", "display", "target", "index"]);

        if (opt.inputs)
        {
            Object.assign(item.inputs, opt.inputs);
        }

        item.effect = Tw2Effect.create({
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