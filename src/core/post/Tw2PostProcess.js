import { meta } from "utils";
import { tw2 } from "global/tw2";
import { Tw2TextureParameter, Tw2Vector4Parameter } from "../parameter";
import { Tw2TextureRes } from "../resource/Tw2TextureRes";
import { Tw2RenderTarget } from "../Tw2RenderTarget";
import { RM_OPAQUE } from "constant";


@meta.define("Tw2PostProcess", "Tr2PostProcess")
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

    @meta.uint
    depthMode = 0;

    @meta.uint
    renderMode = RM_OPAQUE;

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

        // A post process with no size is not good: nothing can be built at zero
        // and building anyway makes a 0x0 texture whose framebuffer is
        // INCOMPLETE_ATTACHMENT. Saying so HERE rather than guarding inside
        // Rebuild means both callers already handle it - Rebuild bails and stays
        // dirty, Render returns false instead of drawing with no targets.
        if (!this._effectiveWidth || !this._effectiveHeight) isGood = false;

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

        if (this._RefreshEffectiveSize())
        {
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
     * Recomputes the effective render size from the current viewport and quality.
     * @returns {Boolean} true if it changed
     * @private
     */
    _RefreshEffectiveSize()
    {
        const
            effectiveHeight = tw2.height * this.quality,
            effectiveWidth = tw2.width * this.quality;

        if (this._effectiveWidth === effectiveWidth && this._effectiveHeight === effectiveHeight)
        {
            return false;
        }

        this._effectiveHeight = effectiveHeight;
        this._effectiveWidth = effectiveWidth;
        return true;
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
     * Copies the canvas into `_blitOriginal`, the image stage 0 samples.
     *
     * A canvas copy is stored bottom-up (GL row order). Under `device.clipYFlip`
     * every render target is top-down and every full-screen quad uses D3D texture
     * coordinates, so a raw copy would be sampled upside down - which turned the
     * whole dx11 frame over, and made distortion move mirrored against the ship.
     * So in that mode the copy is taken into a scratch texture and blitted into
     * `_blitOriginal` with its rows reversed. Two steps because reading the
     * (possibly multisampled) default framebuffer resolves it, but a flipped
     * `blitFramebuffer` straight from a multisampled source is not allowed.
     * @param {Number} width
     * @param {Number} height
     * @private
     */
    _CopyFrame(width, height)
    {
        const { gl, device } = tw2;
        const format = device.alphaBlendBackBuffer ? gl.RGBA : gl.RGB;

        if (!device.clipYFlip)
        {
            gl.bindTexture(gl.TEXTURE_2D, this._blitOriginal.texture);
            gl.copyTexImage2D(gl.TEXTURE_2D, 0, format, 0, 0, width, height, 0);
            gl.bindTexture(gl.TEXTURE_2D, null);
            return;
        }

        if (!this._frameCopy) this._frameCopy = gl.createTexture();
        if (!this._frameCopyRead) this._frameCopyRead = gl.createFramebuffer();
        if (!this._frameCopyDraw) this._frameCopyDraw = gl.createFramebuffer();

        // Resolved, bottom-up copy of the canvas.
        gl.bindTexture(gl.TEXTURE_2D, this._frameCopy);
        gl.copyTexImage2D(gl.TEXTURE_2D, 0, format, 0, 0, width, height, 0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Same-size storage for the flipped destination.
        gl.bindTexture(gl.TEXTURE_2D, this._blitOriginal.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, gl.UNSIGNED_BYTE, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this._frameCopyRead);
        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._frameCopy, 0);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this._frameCopyDraw);
        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._blitOriginal.texture, 0);

        // Destination rows reversed: bottom-up canvas -> top-down target.
        gl.blitFramebuffer(0, 0, width, height, 0, height, width, 0, gl.COLOR_BUFFER_BIT, gl.NEAREST);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /**
     * Renders the post processing
     * @returns {Boolean}
     */
    Render()
    {
        const { width, height, gl, device } = tw2;

        // Resize itself rather than relying on Update having run: the scene only
        // calls Update on `this.postprocess` (EveSpaceScene.js:838), so a post
        // process reached solely through Render - the distortion pass is one -
        // otherwise keeps a zero size forever and can never be good.
        if (this._RefreshEffectiveSize()) this._dirty = true;

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
        this._CopyFrame(width, height);
        device.SetStandardStates(this.renderMode);

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
                // texel width
                g_texelSize.value[0] = renderTarget ? 1 / renderTarget.width: 1 / width;
                // texel height
                g_texelSize.value[1] = renderTarget ? 1 / renderTarget.height : 1 / height;
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
                    cameraCache[3] = this.depthMode;
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
