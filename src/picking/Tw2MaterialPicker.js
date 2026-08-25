import { meta } from "utils";
import { tw2, device } from "global";
import { vec4 } from "math";
import { Tw2RenderTarget } from "core/Tw2RenderTarget";
import { Tw2BatchAccumulator2 } from "core/batch";
import { RM_OPAQUE } from "constant";
import { Tw2MaterialPickResult } from "./Tw2MaterialPickResult";


/**
 * Renders objects' material layers as flat colours, so a caller can ask what is
 * at a pixel.
 *
 * For skindr: a user drags an icon over a ship and, on drop, we say which
 * material layer and which mesh area they hit.
 *
 * ```js
 * picker.SetSize(width, height, [ ship ]);
 * const pick = await picker.Pick();
 * const hit = pick.Get(x, y);
 * ```
 *
 * `Pick()` renders once, on the frame the scene next finishes, and resolves
 * with a CAPTURE. The capture holds the pixels, so `Get` is array indexing -
 * no GL, no frame to wait for, and a caller does not need to know the
 * coordinates in advance, which is the whole point during a drag.
 *
 * ## NOT FUNCTIONAL YET - do not ship a consumer against this
 *
 * The encoding and the shaders are done and tested. THIS CLASS IS NOT: it
 * collects the objects' own effects and never substitutes a picking shader, so
 * it draws an ordinary picture of a ship and `Get` decodes nonsense out of it.
 *
 * What is still missing, found by review rather than by running it:
 *
 *   1. **Effect substitution.** The batch pipeline forwards a technique
 *      override but has no EFFECT override, and a technique override is gated
 *      on the area's own effect declaring that technique - which a standalone
 *      shader never will. The route is to build a parallel `Tw2Effect` with
 *      `effectFilePath = "manual:/<name>.sm_json"` and swap it onto the batch,
 *      as `EveSpaceSceneShadowHandler` does for its own substitute.
 *   2. **One effect PER AREA.** `PickingArea` differs per mesh area, and
 *      parameters bind at Commit time, so a single shared effect would give
 *      every area the last-written value.
 *   3. **Camera setup.** At a caller-chosen size this needs its own view and
 *      projection; otherwise the aspect is the canvas's and the coordinates the
 *      caller sends do not correspond to what was drawn.
 *   4. **Colour mask.** `Tw2Picker` forces and restores `SetColorMask` around
 *      its pass. Without that, a channel the scene left masked is silently
 *      dropped - and the material nibble lives in red, so that is a wrong
 *      answer rather than a visibly broken one.
 *   5. **Clear colour is left dirty** on the context after `Unset()`.
 *
 * ## The encoding
 *
 * Alpha is not available, so four quantities share three channels:
 *
 * ```
 *   R  low nibble  material     high nibble  area type
 *   G  shader kind 0 = UNKNOWN, which is a DEFECT not an answer
 *   B  area index
 * ```
 *
 * The background is solid green and the background test is `(R & 15) === 0` -
 * every real hit has a material of at least 1, so green reads as "nothing"
 * without needing alpha, and green stays a legal shader-kind value elsewhere in
 * the buffer.
 */
@meta.define("Tw2MaterialPicker")
export class Tw2MaterialPicker
{

    /**
     * The scene whose frame the picker rides.
     *
     * Held rather than passed per call, so `Pick()` takes no arguments and
     * cannot be handed a different scene than the objects belong to.
     * @type {?EveSpaceScene}
     */
    scene = null;

    /**
     * The background. Solid green, and safe because nothing is distinguished by
     * colour alone: the material nibble decides.
     * @type {vec4}
     */
    @meta.color
    clearColor = vec4.fromValues(0, 1, 0, 1);

    /**
     * Where the boundary sits along a gradient, per quantity, 0.5 being the
     * even split. Materials blend by construction - the tents overlap across
     * 94% of the interval between anchors - so this is not optional tuning, it
     * is how an ambiguous texel is decided.
     * @type {vec4}
     */
    @meta.vector4
    threshold = vec4.fromValues(0.5, 0.5, 0.5, 0);

    /**
     * Which layer types participate: `(patterns, paint, details, decals)`, each
     * 0 or 1.
     *
     * An excluded type is not merely hidden - the resolution falls THROUGH it,
     * so a pick reaches whatever is underneath. That is the point rather than a
     * side effect: detail layers are composite textures full of small greebles,
     * and a user dragging an icon at that scale would otherwise keep landing on
     * a rivet instead of on the hull.
     * @type {vec4}
     */
    @meta.vector4
    include = vec4.fromValues(1, 1, 1, 1);

    @meta.boolean
    enabled = true;

    _accumulator = new Tw2BatchAccumulator2();
    _renderTarget = new Tw2RenderTarget();
    _objects = [];
    _width = 0;
    _height = 0;


    /**
     * @param {EveSpaceScene} [scene]
     */
    constructor(scene)
    {
        if (scene) this.scene = scene;
    }

    /**
     * Sets the buffer size and what to draw into it.
     *
     * The caller states the size rather than it following the canvas, and it
     * does not have to match: a picking buffer at half resolution is a quarter
     * of the memory and still far finer than a mouse. Whatever is chosen here
     * is the space `Get` coordinates are in.
     *
     * @param {Number} width
     * @param {Number} height
     * @param {Array|*} [objects] - what to draw; a single object is accepted
     * @returns {Tw2MaterialPicker}
     */
    SetSize(width, height, objects)
    {
        width = Math.max(1, Math.floor(width));
        height = Math.max(1, Math.floor(height));

        if (width !== this._width || height !== this._height)
        {
            this._width = width;
            this._height = height;
            this._renderTarget.Create(width, height, true);
        }

        if (objects !== undefined) this.SetObjects(objects);
        return this;
    }

    /**
     * Sets what to draw.
     * @param {Array|*} objects - a single object is accepted
     * @returns {Tw2MaterialPicker}
     */
    SetObjects(objects)
    {
        this._objects = !objects ? [] : (Array.isArray(objects) ? objects.slice() : [ objects ]);
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
     * Renders and captures, on the frame the scene next finishes.
     *
     * Settles only once the buffer has actually been drawn and read, so there
     * is no "render now" for a caller to call at the wrong moment and no way to
     * read a buffer from a frame that never happened.
     *
     * Queued onto the SCENE rather than a raw animation frame, and run after
     * the scene has finished drawing (`EveSpaceScene.RunPendingTasks`). An
     * offscreen pass that reads its own result needs the frame's state settled
     * and must leave no trace; that hook gives it both.
     *
     * @returns {Promise<?Tw2MaterialPickResult>} null when nothing was drawn
     */
    Pick()
    {
        const scene = this.scene;

        if (!scene || typeof scene.EnqueueTask !== "function")
        {
            return Promise.reject(new TypeError("Material picking requires a scene that can queue tasks"));
        }

        return new Promise((resolve, reject) =>
        {
            scene.EnqueueTask(() =>
            {
                try
                {
                    resolve(this.Render() ? this.Capture() : null);
                }
                catch (err)
                {
                    reject(err);
                }
            });
        });
    }

    /**
     * Draws the picking buffer.
     *
     * Opaque only. A material layer belongs to a surface, and a transparent or
     * additive pass draws over one without being one - including them would let
     * a glow decide what a pick landed on.
     *
     * @returns {Boolean} true if anything was drawn
     */
    Render()
    {
        if (!this.enabled || !this._objects.length || !this._width) return false;
        if (!this._renderTarget.IsGood()) return false;

        // NOT FUNCTIONAL YET - see the class header. This collects the objects'
        // OWN effects, so what it draws is a picture of a ship rather than a
        // picking buffer. Left in place because the collection, the render
        // target and the readback are right; the substitute effect is what is
        // missing.
        const ac = this._accumulator;
        ac.Clear();

        // Through GetObjectBatches, NOT object.GetBatches(mode, ac) - the
        // accumulator refuses a direct Commit unless it set `_reroute` itself,
        // so calling an object directly throws on its first mesh area.
        for (let i = 0; i < this._objects.length; i++)
        {
            ac.GetObjectBatches(this._objects[i], RM_OPAQUE);
        }

        if (!ac.length) return false;

        this._renderTarget.Set();

        device.gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        tw2.ClearBufferBits(true, true, false);

        ac.Render();

        this._renderTarget.Unset();
        return true;
    }

    /**
     * Reads the WHOLE buffer back into a capture.
     *
     * Once, at capture time, rather than a GL call per pick. That is what lets
     * a result outlive the frame: the render target is reused by the next
     * capture, but the pixels a caller holds are their own.
     *
     * @returns {?Tw2MaterialPickResult}
     */
    Capture()
    {
        if (!this._width || !this._renderTarget.IsGood()) return null;

        const data = new Uint8Array(this._width * this._height * 4);
        this._renderTarget.ReadPixels(data, 0, 0, this._width, this._height);

        return new Tw2MaterialPickResult(this._width, this._height, data);
    }

}
