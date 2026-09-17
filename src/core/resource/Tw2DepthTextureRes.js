import { meta } from "utils";
import { device } from "global";
import { Tw2TextureRes } from "./Tw2TextureRes";


/**
 * A generated 1x1 depth texture that answers a comparison sampler.
 *
 * `dynamic:/depth/<value>` - the value is the stored depth, 0..1, and defaults
 * to 1, the far plane, which means "nothing is occluding here".
 *
 * Carbon does not need one. Its neutral for a shadow resource is an empty
 * handle - `Tr2DepthStencilPtr emptyTexture` for `ShadowMapAtlas`
 * (trinity/trinity/Tr2LightManager.cpp:188-189), an empty `Tr2TextureAL{}` for
 * `EveSpaceSceneDynamicShadowMap` (:166) - and D3D11 reads an unbound
 * comparison resource as "unshadowed". WebGL has no such state: a
 * `sampler2DShadow` with nothing bound, or with an ordinary colour texture
 * bound, fails the draw with "Mismatch between texture format and sampler type
 * (signed/unsigned/float/shadow)". So the platform forces a real texture where
 * Carbon needs none, and this is the smallest one that says the same thing.
 *
 * It is a DEPTH_COMPONENT with `TEXTURE_COMPARE_MODE` set to
 * `COMPARE_REF_TO_TEXTURE`, which is what makes it a legal partner for a shadow
 * sampler - the compare mode is part of the match, not just the format.
 *
 * Filtering is NEAREST and wrapping is CLAMP_TO_EDGE, as for the colour
 * neutrals beside it: one texel has nothing to interpolate and nothing to tile.
 */
@meta.define("Tw2DepthTextureRes")
export class Tw2DepthTextureRes extends Tw2TextureRes
{

    /**
     * The depth to store, 0..1. 1 is the far plane.
     * @type {Number}
     */
    depthValue = 1;

    /**
     * Parses a `dynamic:/depth/<value>` query.
     * @param {String} query
     * @returns {Number|null} the depth, or null when the query is not one
     */
    static ParseQuery(query)
    {
        const text = String(query ?? "").trim();

        if (!text) return 1;

        const value = Number(text.split(",")[0]);

        return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : null;
    }

    /**
     * Creates a depth resource from a `dynamic:/depth` query.
     * @param {String} query
     * @returns {Tw2DepthTextureRes|null}
     */
    static FromQuery(query)
    {
        const depthValue = Tw2DepthTextureRes.ParseQuery(query);

        if (depthValue === null) return null;

        const res = new Tw2DepthTextureRes();

        res.depthValue = depthValue;
        return res;
    }

    /**
     * Rasterizes one 1x1 comparable depth texture.
     * @param {WebGL2RenderingContext} gl
     * @param {Number} depthValue - 0..1
     * @returns {WebGLTexture}
     */
    static CreateTexture(gl, depthValue)
    {
        const texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, texture);
        // 24-bit, because DEPTH_COMPONENT16 is the one depth format some
        // drivers refuse to filter or compare against, and this texture exists
        // precisely to be compared against.
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.DEPTH_COMPONENT24,
            1,
            1,
            0,
            gl.DEPTH_COMPONENT,
            gl.UNSIGNED_INT,
            new Uint32Array([ Math.round(depthValue * 0xffffffff) ])
        );
        // THE COMPARE MODE IS THE POINT. Without it this is a depth texture a
        // shadow sampler still refuses; with it, the sampler's compare against
        // the far plane passes for every fragment and the result is "lit".
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return texture;
    }

    /**
     * Rasterizes the depth. Returning true tells the resource manager the
     * resource has handled its own loading and must not be fetched.
     * @returns {Boolean}
     */
    DoCustomLoad()
    {
        const { gl } = device;

        this.Attach(Tw2DepthTextureRes.CreateTexture(gl, this.depthValue), this.path);

        // After Attach, which clears metadata - the same ordering the colour
        // neutral beside this one documents.
        this._target = gl.TEXTURE_2D;
        this._isCube = false;
        this._width = 1;
        this._height = 1;

        return true;
    }

}
