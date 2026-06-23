import * as math from "math";
import { Tw2RenderTarget } from "core/Tw2RenderTarget";

class WrappedCustomRenderOptions
{
    bufferColor = true;
    bufferDepth = true;
    bufferStencil = true;

    width = 0;
    height = 0;
    view = null;

    skipSceneUpdate = true;

    clearColor = math.vec4.fromValues(1, 1, 1, 1);
    colorMask = math.vec4.fromValues(0, 0, 0, 1);

    update = false;
    render = false;

    IsGood()
    {
        return !!(this.width && this.height || this.view);
    }
}

export class WrappedCustomRender
{

    options = new WrappedCustomRenderOptions();
    scene = null;
    camera = null;
    target = null;

    constructor()
    {
        this.target = new Tw2RenderTarget("custom");
    }

    /**
     * Checks if the custom render is good
     * @returns {Boolean}
     */
    IsGood()
    {
        return !!(this.options && this.options.IsGood() && this.target);
    }

    /**
     * Per frame render
     * @param {Number} dt
     * @param {WrappedClient} renderer
     * @returns {*|boolean} True if something was rendered
     */
    Render(dt, renderer)
    {
        if (!this.IsGood()) return false;

        return renderer.CustomRender(dt,
            this.options,
            this.scene,
            this.camera,
            this.target,
            this);
    }


}