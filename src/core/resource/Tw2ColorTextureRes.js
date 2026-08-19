import { meta } from "utils";
import { device } from "global";
import { Tw2TextureRes } from "./Tw2TextureRes";


/**
 * A generated solid-colour texture, rasterized from its own path so a constant
 * colour never costs a file. Carbon has the same resource (trinity Resources/
 * Procedural/SolidColorTexture) behind the same `dynamic:/color/r,g,b,a` path,
 * and for the same reason: it resolves through the resource manager, so every
 * user of a given colour shares one texture rather than each building its own.
 *
 * Four targets, one grammar:
 *
 *     dynamic:/color/r,g,b,a               a 1x1 TEXTURE_2D
 *     dynamic:/colorcube/r,g,b,a           a 1x1 TEXTURE_CUBE_MAP
 *     dynamic:/colorarray/r,g,b,a[,layers] a 1x1xN TEXTURE_2D_ARRAY
 *     dynamic:/colorvolume/r,g,b,a[,depth] a 1x1xN TEXTURE_3D
 *
 * Components are floats, as in Carbon, which rasterizes them into a 1x1 RGBA16F
 * bitmap. This replaces the older `rgba:/` syntax, which Tw2TextureParameter
 * handled itself with byte components, building a texture per parameter that
 * was shared with nobody.
 *
 * The texture is created when the resource loads rather than when it is
 * constructed: construction can happen during registration, long before there
 * is a device to create anything on.
 *
 * **The target is pinned, and that is the point of the separate paths.**
 * Tw2TextureRes.Bind adopts the first sampler's type when `_target` is null, so
 * an unpinned generated texture would take the shape of whichever consumer
 * bound it first - and because dynamic resources are SHARED, every later
 * consumer would inherit that first guess. Binding a 1x1 2D texture to a
 * `sampler2DArray` is an INVALID_OPERATION rather than a wrong picture, so a
 * scene global like `EveSceneFogVolumeMap` needs `colorarray`, not `color`.
 */
@meta.type("Tw2ColorTextureRes")
export class Tw2ColorTextureRes extends Tw2TextureRes
{

    /**
     * The colour to rasterize, normalized floats
     * @type {Array<Number>}
     */
    color = [ 0, 0, 0, 0 ];

    /**
     * Which texture target to rasterize into
     * @type {String} one of "2d", "cube", "2darray", "3d"
     */
    dimension = "2d";

    /**
     * Layer count for "2darray", depth for "3d"; always 1 for "2d" and "cube"
     * @type {Number}
     */
    depth = 1;

    /**
     * Whether a dimension takes a layer/depth count
     * @param {String} dimension
     * @returns {Boolean}
     */
    static IsLayered(dimension)
    {
        return dimension === "2darray" || dimension === "3d";
    }

    /**
     * Parses a `dynamic:/color*` query into a colour and layer count
     *
     * A count on a target that has no layers is rejected rather than ignored:
     * `dynamic:/color/1,1,1,1,8` asks for something the 2D path cannot give,
     * and answering it with a silent 1x1 is how a caller ends up debugging the
     * consumer instead of the path.
     * @param {String} query - "r,g,b,a" or "r,g,b,a,count", floats
     * @param {String} [dimension="2d"]
     * @returns {{color: Array<Number>, depth: Number}|null} null when malformed
     */
    static ParseQuery(query, dimension = "2d")
    {
        const parts = String(query).split(",");
        const layered = Tw2ColorTextureRes.IsLayered(dimension);

        if (parts.length !== 4 && !(layered && parts.length === 5)) return null;

        const color = [];
        for (let i = 0; i < 4; i++)
        {
            const value = parseFloat(parts[i]);
            if (!isFinite(value)) return null;
            color[i] = value;
        }

        let depth = 1;
        if (parts.length === 5)
        {
            depth = parseInt(parts[4], 10);
            if (!isFinite(depth) || depth < 1) return null;
        }

        return { color, depth };
    }

    /**
     * Creates a colour resource from a `dynamic:/color*` query
     * @param {String} query
     * @param {String} [dimension="2d"]
     * @returns {Tw2ColorTextureRes|null}
     */
    static FromQuery(query, dimension = "2d")
    {
        const parsed = Tw2ColorTextureRes.ParseQuery(query, dimension);
        if (!parsed) return null;

        const res = new Tw2ColorTextureRes();
        res.color = parsed.color;
        res.dimension = dimension;
        res.depth = parsed.depth;
        return res;
    }

    /**
     * Resolves a dimension to its GL target
     * @param {WebGL2RenderingContext} gl
     * @param {String} dimension
     * @returns {GLenum}
     */
    static GetTarget(gl, dimension)
    {
        switch (dimension)
        {
            case "cube": return gl.TEXTURE_CUBE_MAP;
            case "2darray": return gl.TEXTURE_2D_ARRAY;
            case "3d": return gl.TEXTURE_3D;
            default: return gl.TEXTURE_2D;
        }
    }

    /**
     * Keeps legacy WebGL1 clients on the ordinary 2D neutral fallback. Their
     * translated shaders cannot sample array or volume targets, and attempting
     * to allocate one would fail before any scene or character can initialize.
     * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
     * @param {String} dimension
     * @returns {String}
     */
    static GetSupportedDimension(gl, dimension)
    {
        return Tw2ColorTextureRes.IsLayered(dimension) && typeof gl.texImage3D !== "function"
            ? "2d"
            : dimension;
    }

    /**
     * Rasterizes one 1x1(xN) solid texture of the given target.
     *
     * The GL lives here rather than on the device because this is the resource
     * that owns the path: a `dynamic:/` name is resolved and cached by the
     * resource manager, so what it builds belongs with the resource, not with
     * the context. The device keeps its own `CreateSolid*` for the immediate
     * fallbacks Tw2TextureRes.Bind reaches for when a texture is missing, which
     * are not resources and cannot wait on a load.
     * @param {WebGL2RenderingContext} gl
     * @param {Array<Number>} bytes - RGBA, 0..255
     * @param {String} dimension
     * @param {Number} [depth=1]
     * @returns {WebGLTexture}
     */
    static CreateTexture(gl, bytes, dimension, depth = 1)
    {
        dimension = Tw2ColorTextureRes.GetSupportedDimension(gl, dimension);
        const
            target = Tw2ColorTextureRes.GetTarget(gl, dimension),
            texture = gl.createTexture();

        gl.bindTexture(target, texture);

        if (dimension === "cube")
        {
            const texel = new Uint8Array(bytes);
            for (let face = 0; face < 6; face++)
            {
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, texel);
            }
        }
        else if (dimension === "2darray" || dimension === "3d")
        {
            // One texel per layer, so a layered default is uniform rather than
            // one coloured slice over an undefined rest.
            const data = new Uint8Array(4 * depth);
            for (let i = 0; i < depth; i++) data.set(bytes, i * 4);
            gl.texImage3D(target, 0, gl.RGBA, 1, 1, depth, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
            gl.texParameteri(target, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        }
        else
        {
            gl.texImage2D(target, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(bytes));
        }

        gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(target, null);

        return texture;
    }

    /**
     * Rasterizes the colour. Returning true tells the resource manager the
     * resource has handled its own loading and must not be fetched.
     * @returns {Boolean}
     */
    DoCustomLoad()
    {
        const { gl } = device;
        const dimension = Tw2ColorTextureRes.GetSupportedDimension(gl, this.dimension);

        // The path carries floats; GL takes bytes.
        const bytes = this.color.map(v => Math.max(0, Math.min(255, Math.round(v * 255))));

        this.Attach(Tw2ColorTextureRes.CreateTexture(gl, bytes, dimension, this.depth), this.path);

        // Attach clears the metadata, so the target is pinned after it rather
        // than before. See the class note: an unpinned generated texture takes
        // the shape of its first consumer and hands that guess to every other.
        this._target = Tw2ColorTextureRes.GetTarget(gl, dimension);
        this._isCube = dimension === "cube";
        this._width = 1;
        this._height = 1;

        return true;
    }

}
