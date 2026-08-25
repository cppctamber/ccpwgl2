import { meta } from "utils";
import { tw2, device } from "global";
import { vec4 } from "math";
import { Tw2RenderTarget } from "core/Tw2RenderTarget";
import { Tw2BatchAccumulator2 } from "core/batch";
import { RM_OPAQUE } from "constant";
import { PickingMaterial, DecodePicking } from "./pickingEncoding";


/**
 * Renders a ship's material layers as flat colours and answers "what is at this
 * pixel".
 *
 * For skindr: pick a material layer with the mouse. One ship at a time, the
 * caller states the size, and each query is a coordinate.
 *
 * Modelled on `Tw2Picker`'s harness - render target, own accumulator, read one
 * pixel back - but it decodes a different encoding and uses its own standalone
 * shaders rather than a technique on the shipped ones.
 *
 * ## The encoding
 *
 * Alpha is not available, so four quantities share three channels:
 *
 * ```
 *   R  low nibble  material     high nibble  area type
 *   G  quad kind   0 = UNKNOWN, which is a DEFECT not an answer
 *   B  area index
 * ```
 *
 * The background is solid green and the background test is `(R & 15) === 0` -
 * every real hit has a material of at least 1, so green reads as "nothing"
 * without needing alpha, and green stays a legal quad-kind value elsewhere in
 * the buffer.
 */
@meta.define("Tw2MaterialPicker")
export class Tw2MaterialPicker
{

    /**
     * The background. Solid green, as asked for - and safe, because nothing is
     * distinguished by colour alone: the material nibble decides.
     * @type {vec4}
     */
    @meta.color
    clearColor = vec4.fromValues(0, 1, 0, 1);

    /**
     * Where the boundary sits along a gradient, per quantity, 0.5 being the
     * even split. Materials blend by construction - the tents overlap - so
     * this is not optional tuning, it is how an ambiguous texel is decided.
     * @type {vec4}
     */
    @meta.vector4
    threshold = vec4.fromValues(0.5, 0.5, 0.5, 0);

    @meta.boolean
    enabled = true;

    _accumulator = new Tw2BatchAccumulator2();
    _renderTarget = new Tw2RenderTarget();
    _buffer = new Uint8Array(4);
    _width = 0;
    _height = 0;
    _object = null;


    /**
     * Sets the size of the picking buffer.
     *
     * The caller states this rather than it following the canvas: skindr asks
     * for a size, gets it back, and then sends coordinates in that space. A
     * buffer that silently resized would make an in-flight coordinate mean
     * something else.
     *
     * @param {Number} width
     * @param {Number} height
     * @returns {Tw2MaterialPicker}
     */
    SetSize(width, height)
    {
        width = Math.max(1, Math.floor(width));
        height = Math.max(1, Math.floor(height));

        if (width === this._width && height === this._height) return this;

        this._width = width;
        this._height = height;
        this._renderTarget.Create(width, height, true);
        return this;
    }

    /**
     * The size the buffer is currently at.
     * @returns {{width: Number, height: Number}}
     */
    GetSize()
    {
        return { width: this._width, height: this._height };
    }

    /**
     * Sets the one object being picked.
     * @param {*} object
     * @returns {Tw2MaterialPicker}
     */
    SetObject(object)
    {
        this._object = object || null;
        return this;
    }

    /**
     * Draws the picking buffer.
     *
     * Opaque only. A material layer belongs to a surface, and a transparent or
     * additive pass draws over one without being one - including them would let
     * a glow decide what a click landed on.
     *
     * @returns {Boolean} true if anything was drawn
     */
    Render()
    {
        if (!this.enabled || !this._object || !this._width) return false;

        const ac = this._accumulator;
        ac.Clear();

        if (this._object.GetBatches) this._object.GetBatches(RM_OPAQUE, ac);
        if (!ac.length) return false;

        this._renderTarget.Set();

        device.gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        tw2.ClearBufferBits(true, true, false);

        ac.Render();

        this._renderTarget.Unset();
        return true;
    }

    /**
     * Reads one pixel back and decodes it.
     *
     * @param {Number} x
     * @param {Number} y
     * @returns {?Object} null when the coordinate is outside the buffer
     */
    Pick(x, y)
    {
        if (!this._width) return null;

        x = Math.floor(x);
        y = Math.floor(y);

        if (x < 0 || y < 0 || x >= this._width || y >= this._height) return null;

        this._renderTarget.ReadPixels(this._buffer, x, y, 1, 1);
        return this.constructor.Decode(this._buffer);
    }

    /**
     * Decodes one RGB triple.
     *
     * Delegates to the encoding module so the format has ONE definition - a
     * renderer and a decoder that disagreed about the layout would be a very
     * quiet bug.
     *
     * @param {Uint8Array|Array} rgb
     * @returns {Object}
     */
    static Decode(rgb)
    {
        return DecodePicking(rgb);
    }

}
