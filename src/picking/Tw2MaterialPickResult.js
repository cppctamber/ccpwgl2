import { DecodePicking } from "./pickingEncoding";


/**
 * One captured picking buffer, which can be picked as many times as you like.
 *
 * This is what `Tw2MaterialPicker.Pick` resolves with, and it exists
 * because a caller does not know the coordinates in advance - a drag starts
 * before the user has decided where to drop.
 *
 * ## It holds PIXELS, not a render target
 *
 * The whole buffer is read back once, at capture. Every pick after that is
 * array indexing: no GL call, no frame to wait for, no render target to keep
 * alive or to accidentally read after something else has drawn into it. A
 * capture is a value, and it stays true to the moment it was taken even if the
 * scene has moved on.
 *
 * The cost is the readback and the memory - `width * height * 4` bytes, so
 * about 8MB at 1920x1080. The caller chooses the size, and a picking buffer
 * does not need to match the canvas: half resolution is a quarter of the memory
 * and is usually still far finer than a mouse.
 */
export class Tw2MaterialPickResult
{

    /**
     * @param {Number} width
     * @param {Number} height
     * @param {Uint8Array} data - RGBA, bottom-left origin, as readPixels gives it
     */
    constructor(width, height, data)
    {
        this.width = width;
        this.height = height;
        this.data = data;
    }

    /**
     * Whether this capture still holds its pixels.
     * @returns {Boolean}
     */
    get isValid()
    {
        return !!this.data && this.data.length >= this.width * this.height * 4;
    }

    /**
     * Picks one coordinate.
     *
     * `x` and `y` are BUFFER pixels with a BOTTOM-LEFT origin, because that is
     * what `readPixels` produced. A mouse event is top-left origin - use
     * `vec2.pixelPositionFromEvent`, or {@link GetFromTop}.
     *
     * @param {Number} x
     * @param {Number} y
     * @returns {?Object} null outside the buffer, otherwise a decoded result
     */
    Get(x, y)
    {
        if (!this.isValid) return null;

        x = Math.floor(x);
        y = Math.floor(y);

        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;

        const offset = (y * this.width + x) * 4;
        return DecodePicking(this.data.subarray(offset, offset + 4));
    }

    /**
     * Picks one coordinate given in TOP-LEFT origin, which is what a mouse
     * event uses.
     *
     * Provided because getting this flip wrong produces a plausible answer from
     * the wrong part of the ship rather than an error, and that is a horrible
     * thing to debug.
     *
     * @param {Number} x
     * @param {Number} y
     * @returns {?Object}
     */
    GetFromTop(x, y)
    {
        return this.Get(x, this.height - Math.floor(y) - 1);
    }

    /**
     * Releases the pixels.
     *
     * Not required for correctness - a capture is an ordinary object and will
     * be collected - but a held capture is megabytes, so a caller keeping one
     * per drag should let it go at the end of the gesture.
     * @returns {Tw2MaterialPickResult}
     */
    Dispose()
    {
        this.data = null;
        return this;
    }

}
