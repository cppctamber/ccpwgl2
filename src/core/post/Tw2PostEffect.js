import { meta, device, Tw2BaseClass } from "global";
import { Tw2RenderTarget } from "../Tw2RenderTarget";
import { Tw2TextureRes } from "../resource/Tw2TextureRes";
import { Tw2TextureParameter, Tw2Vector4Parameter } from "../parameter";
import { Tw2PostEffectStep } from "./Tw2PostEffectStep";
import { assignIfExists } from "global/util";


@meta.type("Tw2PostEffect")
export class Tw2PostEffect extends Tw2BaseClass
{

    @meta.boolean
    display = true;

    @meta.uint
    @meta.isPrivate
    index = -1;

    @meta.objectOf("Tw2CurveSet")
    curveSet = null;

    @meta.listOf("Tw2PostEffectStep")
    steps = [];


    _width = 0;
    _height = 0;
    _targets = {};
    _texture = null;
    _visibleSteps = [];
    _dirty = true;
    _onChildModified = item => this.UpdateValues({ controller: item });

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        this._dirty = true;
    }

    /**
     * Checks if the post effect is good
     * @returns {Boolean}
     */
    IsGood()
    {
        let IsGood = 0;
        for (let i = 0; i < this.steps.length; i++)
        {
            if (this.steps[i].IsGood())
            {
                IsGood++;
            }
        }
        return IsGood === this.steps.length;
    }

    /**
     * Keeps the post effect alive
     */
    KeepAlive()
    {
        for (let i = 0; i < this.steps.length; i++)
        {
            this.steps[i].KeepAlive();
        }
    }

    /**
     * Gets resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.steps.length; i++)
        {
            this.steps[i].GetResources(out);
        }
        return out;
    }

    /**
     * Creates an item
     * @param {*} [opt={}]
     * @returns {Tw2PostEffectStep}
     */
    CreateItem(opt = {})
    {
        const item = Tw2PostEffectStep.from(opt);
        this.AddItem(item);
        return item;
    }

    /**
     * Adds an item
     * @param {Tw2PostEffectStep} item
     */
    AddItem(item)
    {
        if (!this.steps.includes(item))
        {
            if (item.index === -1)
            {
                item.index = this.steps.length;
            }

            item._onModified = this._onChildModified;
            this.steps.push(item);
            this.UpdateValues();
        }
    }

    /**
     * Removes an item
     * @param {Tw2PostEffectStep} item
     */
    RemoveItem(item)
    {
        const index = this.steps.indexOf(item);
        if (index !== -1)
        {
            item._onModified = null;
            this.steps.splice(index, 1);
            this.UpdateValues();
        }
    }

    /**
     * Clears all items
     */
    ClearItems()
    {
        for (let i = 0; i < this.steps.length; i++)
        {
            this.steps[i]._onModified = null;
        }
        this.steps = [];
        this.UpdateValues();
    }

    /**
     * Gets a render target by it's name
     * @param {?String} name
     * @returns {?Tw2RenderTarget}
     */
    GetTarget(name)
    {
        return name && name in this._targets ? this._targets[name] : null;
    }

    /**
     * Checks if a render target exists
     * @param {String} name
     * @returns {Boolean}
     * @constructor
     */
    HasTarget(name)
    {
        return !!(name && this._targets[name]);
    }

    /**
     * Creates a render target
     * - If the render target doesn't exist it will be created
     * @param {String} name
     * @param {Number} [width=device.viewportWidth]
     * @param {Number} [height=device.viewportHeight]
     * @returns {Tw2RenderTarget}
     */
    CreateTarget(name, width = device.viewportWidth, height = device.viewportHeight)
    {
        if (!this._targets[name])
        {
            this._targets[name] = new Tw2RenderTarget();
            this._targets[name].name = name;
        }

        this._targets[name].Create(width, height, false);
        return this._targets[name];
    }

    /**
     * Per frame update
     * @param {Number} dt
     */
    Update(dt)
    {
        if (this.curveSet)
        {
            this.curveSet.Update(dt);
        }
    }

    /**
     * Per frame update
     * @returns {Boolean}
     */
    Render()
    {
        const
            d = device,
            gl = d.gl,
            width = d.viewportWidth,
            height = d.viewportHeight;

        if (!this.IsGood() || !this.display || width <= 0 || height <= 0)
        {
            return false;
        }

        if (width !== this._width || height !== this._height || this._dirty || !this._texture)
        {
            if (!this._texture)
            {
                this._texture = new Tw2TextureRes();
                this._texture.Attach(gl.createTexture());
            }

            gl.bindTexture(gl.TEXTURE_2D, this._texture.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.bindTexture(gl.TEXTURE_2D, null);

            this._width = width;
            this._height = height;

            // Rebuild items
            this._visibleSteps = [];
            for (let i = 0; i < this.steps.length; ++i)
            {
                const
                    item = this.steps[i],
                    inputs = item.inputs,
                    effect = item.effect,
                    shader = effect.shader,
                    parameters = effect.parameters;

                // Auto create current blit
                if (shader.HasTexture("BlitCurrent") && !parameters.BlitCurrent)
                {
                    parameters["BlitCurrent"] = new Tw2TextureParameter("BlitCurrent", "rgba:/0,0,0,255");
                }

                // Auto create original blit
                if (shader.HasTexture("BlitOriginal") && !parameters.BlitOriginal)
                {
                    parameters["BlitOriginal"] = new Tw2TextureParameter("BlitOriginal", "rgba:/0,0,0,255");
                }

                // Setup step render target
                if (item.target)
                {
                    item._renderTarget = this.CreateTarget(item.target, width, height);
                }
                else
                {
                    item._renderTarget = null;
                }

                // Assign render targets to textures
                for (let texture in inputs)
                {
                    if (inputs.hasOwnProperty(texture))
                    {
                        // Ensure input is supported
                        if (!shader.HasTexture(texture))
                        {
                            console.warn(`Invalid input parameter ${texture}`);
                            delete inputs[texture];
                        }
                        else
                        {
                            // Ensure step texture exists
                            if (!parameters[texture])
                            {
                                parameters[texture] = new Tw2TextureParameter(texture);
                            }

                            const
                                parameter = parameters[texture],
                                target = inputs[texture];

                            if (target)
                            {
                                parameter.SetTextureRes(this.CreateTarget(target, width, height).texture);
                            }
                            else
                            {
                                parameter.SetTextureRes(this._texture);
                            }
                        }
                    }
                }

                // Update texel size if required
                if ("BlitCurrent" in inputs && shader.HasConstant("g_texelSize"))
                {
                    // Auto create parameter if required
                    if (!parameters["g_texelSize"])
                    {
                        parameters["g_texelSize"] = new Tw2Vector4Parameter("g_texelSize", [ 1, 1, 1, 1 ]);
                    }

                    const
                        size = parameters["g_texelSize"],
                        renderTarget = this.GetTarget(inputs.BlitCurrent);

                    if (renderTarget)
                    {
                        size.value[0] = 1.0 / renderTarget.width;
                        size.value[1] = 1.0 / renderTarget.width;
                    }
                    else
                    {
                        size.value[0] = 1.0 / width;
                        size.value[1] = 1.0 / width;
                    }

                    size.UpdateValues(this);
                }

                if (item.display)
                {
                    this._visibleSteps.push(item);
                }

                item._dirty = false;
            }

            // Update item sort order
            this._visibleSteps.sort((a, b) =>
            {
                return a.index - b.index;
            });

            this._dirty = false;
        }

        gl.bindTexture(gl.TEXTURE_2D, this._texture.texture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, d.alphaBlendBackBuffer ? gl.RGBA : gl.RGB, 0, 0, width, height, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        d.SetStandardStates(device.RM_OPAQUE);

        let didPost = 0;
        for (let i = 0; i < this._visibleSteps.length; ++i)
        {
            const item = this._visibleSteps[i];
            if (item.display)
            {
                if (item._renderTarget)
                {
                    item._renderTarget.Set();
                }
                else
                {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    gl.viewport(0, 0, width, height);
                }
                d.RenderFullScreenQuad(item.effect);
                didPost++;
            }
        }

        return !!didPost;
    }

    /**
     * Creates a post effect from an object
     * @param {*} [opt={}]
     * @returns {Tw2PostEffect}
     */
    static from(opt = {})
    {
        const postEffect = new this();

        assignIfExists(postEffect, opt, [ "name", "display", "index" ]);

        if (opt.steps)
        {
            for (let i = 0; i < opt.steps.length; i++)
            {
                postEffect.CreateItem(opt.steps[i]);
            }
        }

        return postEffect;
    }

    /**
     * Child constructor
     * @type {Tw2PostEffectStep}
     */
    static Item = Tw2PostEffectStep;

}
