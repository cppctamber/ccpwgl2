import { meta } from "utils";
import { tw2 } from "global/tw2";
import { Tw2TextureParameter, Tw2Vector4Parameter } from "../parameter";
import { Tw2TextureRes } from "../resource/Tw2TextureRes";
import { Tw2RenderTarget } from "../Tw2RenderTarget";


@meta.type("Tw2PostProcess", "Tr2PostProcess")
export class Tw2PostProcess extends meta.Model
{

    @meta.list("Tw2Effect")
    stages = [];

    // CCPWGL only

    @meta.boolean
    display = true;

    @meta.string
    name = "";

    @meta.float
    quality = 1;

    @meta.boolean
    autoRebuild = true;

    /**
     * Identifies if the post requires a rebuild
     * @type {boolean}
     * @private
     */
    _dirty = true;

    /**
     * Effective width
     * @type {number}
     * @private
     */
    _effectiveWidth = 0;

    /**
     * Effective height
     * @type {number}
     * @private
     */
    _effectiveHeight = 0;

    /**
     *
     * @type {null|Tw2TextureRes}
     * @private
     */
    _blitOriginal = null;

    /**
     *
     * @type {null|Tw2RenderTarget}
     * @private
     */
    _quadRT0 = null;

    /**
     *
     * @type {null|Tw2RenderTarget}
     * @private
     */
    _quadRT1 = null;

    /**
     * Visible stages
     * @type {Object}
     * @private
     */
    _visibleStages = [];

    /**
     * Constructor
     * @param {String} name
     */
    constructor(name="")
    {
        super();
        this.name = name;
    }

    /**
     * Checks if the post process is good
     * @return {boolean}
     */
    IsGood()
    {
        // Is good check must keep resources alive so have to check each
        let isGood = true;
        for (let i = 0; i < this.stages.length; i++)
        {
            if (!this.stages[i].IsGood()) isGood = false;
        }
        if (this._blitOriginal && !this._blitOriginal.IsGood()) isGood = false;
        if (this._quadRT0 && !this._quadRT0.IsGood()) isGood = false;
        if (this._quadRT1 && !this._quadRT1.IsGood()) isGood = false;

        return isGood;
    }

    /**
     * Gets all resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out=[])
    {
        for (let i = 0; i < this.stages.length; i++)
        {
            this.stages[i].GetResources(out);
        }
        return out;
    }

    /**
     * Keeps the post processing alive
     */
    KeepAlive()
    {
        for (let i = 0; i < this.stages.length; i++) this.stages[i].KeepAlive();
        if (this._blitOriginal) this._blitOriginal.KeepAlive();
        if (this._quadRT0) this._quadRT0.KeepAlive();
        if (this._quadRT1) this._quadRT1.KeepAlive();
    }

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        this._dirty = true;
    }

    /**
     * Populates stage parameters
     */
    PopulateParameters()
    {
        for (let i = 0; i < this.stages.length; i++)
        {
            this.stages[i].PopulateParameters();
        }
    }

    /**
     * Purges unused parameters
     */
    PurgeUnusedParameters()
    {
        for (let i = 0; i < this.stages.length; i++)
        {
            this.stages[i].PurgeUnusedParameters();
        }
    }

    /**
     * Per frame update
     * TODO: Consider moving the rebuild method call here rather than in "Render"
     * @param dt
     * @param scene
     */
    Update(dt, scene)
    {

        // Todo: Put this in the OnValueChanged method?
        let effectiveHeight = tw2.height * this.quality,
            effectiveWidth = tw2.width * this.quality;

        if (this._effectiveWidth !== effectiveWidth || this._effectiveHeight !== effectiveHeight)
        {
            this._effectiveHeight = effectiveHeight;
            this._effectiveWidth = effectiveWidth;
            // - Do we really need to trigger a "modified" event when this changes
            this.UpdateValues();
        }

        if (!this._dirty && this.autoRebuild)
        {
            for (let i = 0; i < this.stages.length; i++)
            {
                const found = this._visibleStages.indexOf(this.stages[i]) !== -1;

                // Not supported by current effects
                if (found && "display" in this.stages[i] && !this.stages[i].display)
                {
                    this._dirty = true;
                    break;
                }

                if (!found)
                {
                    this._dirty = true;
                    break;
                }
            }
        }
    }

    /**
     * Rebuilds the post process
     * @param {Object} [opt]
     */
    Rebuild(opt)
    {
        if (!this.IsGood())
        {
            this._dirty = true;
            return;
        }

        const { gl, width, height } = tw2;

        this.PopulateParameters();

        if (!this._quadRT0) this._quadRT0 = new Tw2RenderTarget("RT0");
        this._quadRT0.Create(this._effectiveWidth, this._effectiveHeight, false);

        if (!this._quadRT1) this._quadRT1 = new Tw2RenderTarget("RT1");
        this._quadRT1.Create(this._effectiveWidth, this._effectiveHeight, false);

        gl.bindTexture(gl.TEXTURE_2D, this._blitOriginal.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        for (let i = 0; i < this.stages.length; i++)
        {
            const { shader, parameters } = this.stages[i];
            let updated;

            if (shader.HasTexture("BlitOriginal"))
            {
                if (!parameters.BlitOriginal)
                {
                    parameters.BlitOriginal = new Tw2TextureParameter("BlitOriginal");
                    updated = true;
                }
                parameters.BlitOriginal.AttachTextureRes(this._blitOriginal);
            }

            if (shader.HasTexture("BlitCurrent") && !parameters.BlitCurrent)
            {
                parameters.BlitCurrent = new Tw2TextureParameter("BlitCurrent");
                updated = true;
            }

            if (shader.HasConstant("g_texelSize") && !parameters.g_texelSize)
            {
                parameters.g_texelSize = new Tw2Vector4Parameter("g_texelSize", [ 1, 1, 1, 1 ]);
                updated = true;
            }

            if (shader.HasConstant("g_camera") && !parameters.g_camera)
            {
                parameters.g_camera = new Tw2Vector4Parameter("g_camera", [ 1, 1, 1, 1 ]);
            }

            if (updated) this.stages[i].BindParameters();
        }

        this._dirty = false;

        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("rebuilt", this, opt);
        }
    }

    /**
     * Renders the post processing
     * @returns {Boolean}
     */
    Render()
    {
        const { width, height, gl, device } = tw2;

        if (!this.display || width < 0 || height < 0 || !this.IsGood())
        {
            return false;
        }

        if (!this._blitOriginal || !this._blitOriginal.texture)
        {
            if (!this._blitOriginal) this._blitOriginal = new Tw2TextureRes();
            this._blitOriginal.Attach(gl.createTexture());
            this._dirty = true;
        }

        if (this._dirty)
        {
            this.Rebuild();
        }

        // Check if there is anything to render
        this._visibleStages.splice(0);
        for (let i = 0; i < this.stages.length; i++)
        {
            if ("display" in this.stages[i] && !this.stages[i].display) continue;
            this._visibleStages.push(this.stages[i]);
        }
        if (!this._visibleStages.length) return false;

        // Copy current frame
        gl.bindTexture(gl.TEXTURE_2D, this._blitOriginal.texture);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, device.alphaBlendBackBuffer ? gl.RGBA : gl.RGB, 0, 0, width, height, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        device.SetStandardStates(device.RM_OPAQUE);

        let cameraCache;

        for (let blitCount = 0, i = 0; i < this._visibleStages.length; i++)
        {
            const { BlitCurrent, g_texelSize, g_camera } = this._visibleStages[i].parameters;
            let renderTarget = null;

            if (BlitCurrent)
            {
                let isOdd = blitCount % 2;
                if (!isOdd) BlitCurrent.AttachTextureRes(blitCount === 0 ? this._blitOriginal : this._quadRT0.texture);
                else BlitCurrent.AttachTextureRes(this._quadRT1.texture);
                if (i !== this._visibleStages.length - 1) renderTarget = isOdd ? this._quadRT0 : this._quadRT1;
                blitCount++;
            }

            if (g_texelSize)
            {
                let tex = renderTarget ? 1 / renderTarget.width : 1 / width;
                // texel width
                g_texelSize.value[0] = tex;
                // texel height
                g_texelSize.value[1] = tex;
                // width
                g_texelSize.value[2] = renderTarget ? renderTarget.width : width;
                // height
                g_texelSize.value[3] = renderTarget ? renderTarget.height : height;

                g_texelSize.UpdateValues({ controller: this });
            }

            if (g_camera)
            {
                if (!cameraCache)
                {
                    cameraCache = [ 0, 0, 0, 0 ];
                    const p = device.projection;
                    // near plane
                    cameraCache[0] = p[14] / (p[10] - 1.0);
                    // far plane
                    cameraCache[1] = p[14] / (p[10] + 1.0);
                    // fov
                    cameraCache[2] = 2 * Math.atan(1/p[5]) * 180 / Math.PI;
                    // unused
                    cameraCache[3] = 0;
                }

                g_camera.SetValue(cameraCache);
            }

            if (renderTarget)
            {
                renderTarget.Set();
            }
            else
            {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, width, height);
            }

            tw2.device.RenderFullScreenQuad(this._visibleStages[i]);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);

        return true;
    }

}
