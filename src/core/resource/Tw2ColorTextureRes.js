import { meta } from "utils";
import { device } from "global";
import { Tw2TextureRes } from "./Tw2TextureRes";


/**
 * A 1x1 texture rasterized from its own path, so a constant colour never costs
 * a file. Carbon has the same resource (trinity Resources/Procedural/
 * SolidColorTexture) behind the same `dynamic:/color/r,g,b,a` path, and for
 * the same reason: it resolves through the resource manager, so every user of
 * a given colour shares one texture rather than each building its own.
 *
 * Components are floats, as in Carbon, which rasterizes them into a 1x1
 * RGBA16F bitmap. This replaces the older `rgba:/` syntax, which
 * Tw2TextureParameter handled itself with byte components, building a texture
 * per parameter that was shared with nobody.
 *
 * The texture is created when the resource loads rather than when it is
 * constructed: construction can happen during registration, long before there
 * is a device to create anything on.
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
     * Parses a `dynamic:/color/` query into a colour
     * @param {String} query - "r,g,b,a", floats
     * @returns {Array<Number>|null} null when the query is malformed
     */
    static ParseQuery(query)
    {
        const parts = String(query).split(",");
        if (parts.length !== 4) return null;

        const color = [];
        for (let i = 0; i < 4; i++)
        {
            const value = parseFloat(parts[i]);
            if (!isFinite(value)) return null;
            color[i] = value;
        }
        return color;
    }

    /**
     * Creates a colour resource from a `dynamic:/color/` query
     * @param {String} query
     * @returns {Tw2ColorTextureRes|null}
     */
    static FromQuery(query)
    {
        const color = Tw2ColorTextureRes.ParseQuery(query);
        if (!color) return null;

        const res = new Tw2ColorTextureRes();
        res.color = color;
        return res;
    }

    /**
     * Rasterizes the colour. Returning true tells the resource manager the
     * resource has handled its own loading and must not be fetched.
     * @returns {Boolean}
     */
    DoCustomLoad()
    {
        // CreateSolidTexture takes bytes; the path carries floats.
        const bytes = this.color.map(v => Math.max(0, Math.min(255, Math.round(v * 255))));
        this.Attach(device.CreateSolidTexture(bytes), this.path);
        return true;
    }

}
