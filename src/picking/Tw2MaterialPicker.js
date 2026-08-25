import { meta } from "utils";
import { tw2, device } from "global";
import { vec4 } from "math";
import { Tw2RenderTarget } from "core/Tw2RenderTarget";
import { Tw2BatchAccumulator2 } from "core/batch";
import { Tw2Effect } from "core/mesh";
import { Tw2EffectRes } from "core/resource";
import { RM_DECAL, RM_OPAQUE } from "constant";
import { Tw2MaterialPickResult } from "./Tw2MaterialPickResult";
import { GetPickingShaderForPath, PICKING_TEXTURES } from "./pickingShaderMap";


/**
 * Renders objects' material layers as flat colours, so a caller can ask what is
 * at a pixel.
 *
 * For skindr: a user drags an icon over a ship and, on drop, we say which
 * material layer and which mesh area they hit.
 *
 * ```js
 * picker.scene = scene;
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
 * ## It draws the ship with OUR shaders, without touching the ship
 *
 * The objects' batches are collected the ordinary way, so visibility, LOD and
 * per-object data are whatever the frame said they were. Then each batch is
 * drawn HERE, through a picking effect matched to the shipped one - rather than
 * by assigning over `batch.effect`, which would hand a mutated batch back to
 * whatever else holds it.
 *
 * One picking effect per SOURCE EFFECT, cached. Not one shared effect: the
 * textures a picking shader samples belong to the mesh area, so a shared effect
 * would give every area the last area's maps. The per-draw values that are
 * genuinely per-area - the area type and index - are constants, and a bound
 * parameter writes straight into the stage's buffer, so those are set
 * immediately before each draw.
 *
 * ## What it will not draw
 *
 * A shipped shader with no picking equivalent is REPORTED, not approximated,
 * because a mesh drawn through the wrong vertex stage lands where the ship is
 * not and still decodes to legal ids - a plausible wrong answer rather than a
 * visible failure. `unsupported` on the render report names what was skipped
 * and `defects` counts the areas it cost, so a consumer can see that a hull has
 * regions it cannot pick instead of reading them as background.
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
 *
 * The area type IS the render mode (`RM_OPAQUE`, `RM_DECAL`, ...) and the area
 * index IS the mesh area's own `index`, so both are the numbers ccpwgl already
 * uses rather than a private numbering a consumer would have to translate.
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

    /**
     * The SKINR blend mode in use, as the Carbon permutation option's index.
     *
     * It changes which pattern layer owns a texel, so it changes the answer and
     * not just the look. Set it with {@link SetBlendMode}, which takes the
     * `BLEND_MODE_*` token rather than a UI name.
     * @type {Number}
     */
    @meta.float
    blendMode = 0;

    @meta.boolean
    enabled = true;

    /**
     * How many frames `Pick` will wait for the picking shaders to compile
     * before giving up. They are compiled once per session, so only the first
     * pick of a session ever waits at all.
     * @type {Number}
     */
    @meta.uint
    maxWaitFrames = 120;

    _accumulator = new Tw2BatchAccumulator2();
    _renderTarget = new Tw2RenderTarget();
    _objects = [];
    _width = 0;
    _height = 0;
    _effects = new Map();
    _unsupported = new Map();

    /**
     * What the last render reported, kept whether or not it drew anything.
     *
     * `Pick()` resolves with null when nothing drew, which is the right answer
     * but a silent one - and "nothing drew" has several causes that look
     * identical from outside. This is where a consumer looks to tell them
     * apart.
     * @type {?Object}
     */
    lastReport = null;


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
     * The ASPECT should match the canvas, though. The picking pass reuses the
     * frame's own view and projection - which is what makes a pick agree with
     * what the user is looking at - and those carry the canvas's aspect, so a
     * buffer of a different shape shows the same image squashed and every
     * coordinate is off. A mismatch is warned about rather than corrected,
     * because correcting it silently would hide a caller's sizing bug.
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
            this._WarnOnAspectMismatch();
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
     * Sets the pattern blend mode from a Carbon permutation option.
     *
     * Takes the whole `BLEND_MODE_*` token. The bare words - `OVERLAY`,
     * `SUBTRACT` - are UI names for the same modes and are NOT the same thing;
     * accepting them is a known defect elsewhere in ccpwgl and is not repeated
     * here. A number is passed through, so a caller that already holds the
     * option index can hand it over directly.
     *
     * @param {String|Number} mode
     * @returns {Tw2MaterialPicker}
     */
    SetBlendMode(mode)
    {
        if (typeof mode === "number")
        {
            this.blendMode = mode;
            return this;
        }

        const value = Tw2MaterialPicker.BLEND_MODES.indexOf(mode);

        if (value === -1)
        {
            throw new ReferenceError(
                `Unknown pattern blend mode "${mode}" - expected one of ${Tw2MaterialPicker.BLEND_MODES.join(", ")}`
            );
        }

        this.blendMode = value;
        return this;
    }

    /**
     * The scene the picker will actually queue onto.
     *
     * A consumer usually holds a WRAPPER rather than the scene itself - the
     * demo studio's `tny.scene` is one, and so is skindr's - and the wrapper
     * has no task queue. Unwrapping here rather than making every caller
     * remember `.wrapped` is the difference between the API being usable and
     * being correct-but-annoying.
     *
     * @returns {?EveSpaceScene} null if nothing found can queue a task
     */
    GetScene()
    {
        const scene = this.scene;
        if (!scene) return null;

        if (typeof scene.EnqueueTask === "function") return scene;

        const wrapped = scene.wrapped;
        if (wrapped && typeof wrapped.EnqueueTask === "function") return wrapped;

        return null;
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
     * If a picking shader is still compiling, the pick waits for the next frame
     * rather than capturing a buffer with holes in it. That is only ever the
     * first pick of a session.
     *
     * @returns {Promise<?Tw2MaterialPickResult>} null when nothing was drawn
     */
    Pick()
    {
        const scene = this.GetScene();

        if (!scene)
        {
            return Promise.reject(new TypeError("Material picking requires a scene that can queue tasks"));
        }

        return new Promise((resolve, reject) =>
        {
            let waited = 0;

            const attempt = () =>
            {
                try
                {
                    const result = this.Render();

                    // Waiting rather than capturing: a buffer missing the areas
                    // whose shaders have not compiled yet would answer "nothing
                    // there" for part of the hull, which is a wrong answer and
                    // not a visibly broken one.
                    if (result.pending && waited < this.maxWaitFrames)
                    {
                        waited++;
                        scene.EnqueueTask(attempt);
                        return;
                    }

                    if (result.pending)
                    {
                        tw2.Warning({
                            name: "Material picking",
                            description: `Gave up waiting for ${result.pending} picking shader(s) after ${waited} frames`
                        });
                    }

                    resolve(result.drawn ? this.Capture(result) : null);
                }
                catch (err)
                {
                    reject(err);
                }
            };

            scene.EnqueueTask(attempt);
        });
    }

    /**
     * Draws the picking buffer.
     *
     * Opaque and decal areas. A material layer belongs to a surface, and a
     * transparent or additive pass draws over one without being one - including
     * them would let a glow decide what a pick landed on. Decals are in because
     * a decal is a thing a user can drop onto, and they report their own id.
     *
     * @returns {{drawn: Number, pending: Number, defects: Number, unsupported: Array<String>}}
     */
    Render()
    {
        const report = { drawn: 0, pending: 0, defects: 0, collected: 0, unsupported: [], refused: [], skipped: null };
        this.lastReport = report;

        if (!this.enabled) return (report.skipped = "disabled", report);
        if (!this._objects.length) return (report.skipped = "no objects", report);
        if (!this._width) return (report.skipped = "no size - call SetSize", report);
        if (!this._renderTarget.IsGood()) return (report.skipped = "render target not created", report);

        const ac = this._accumulator;
        ac.Clear();

        // Through GetObjectBatches, NOT object.GetBatches(mode, ac) - the
        // accumulator refuses a direct Commit unless it set `_reroute` itself,
        // so calling an object directly throws on its first mesh area.
        for (let i = 0; i < this._objects.length; i++)
        {
            ac.GetObjectBatches(this._objects[i], RM_OPAQUE);
            ac.GetObjectBatches(this._objects[i], RM_DECAL);
        }

        report.collected = ac.length;
        if (!ac.length) return (report.skipped = "the objects committed no opaque or decal batches", report);

        // Resolved BEFORE the target is set, so a frame spent waiting for a
        // shader to compile does not also clear a buffer nobody reads.
        const draws = [];

        for (let i = 0; i < ac.batches.length; i++)
        {
            const prepared = this._PrepareBatch(ac.batches[i], report);
            if (prepared) draws.push(prepared);
        }

        if (report.pending) return report;
        if (!draws.length) return (report.skipped = "every collected batch was refused - see unsupported", report);

        const colorMask = tw2.GetColorMask([ 1, 1, 1, 1 ]);
        const clearColor = tw2.GetClearColor([]);

        this._renderTarget.Set();

        // Every channel, forced. A channel the scene left masked would be
        // dropped silently, and the material nibble lives in red - a masked
        // channel is a wrong answer, not a visibly broken one.
        tw2.SetColorMask([ 1, 1, 1, 1 ]);
        tw2.SetClearColor(this.clearColor);
        tw2.ClearBufferBits(true, true, false);

        for (let i = 0; i < draws.length; i++)
        {
            const { batch, effect, areaType, areaIndex, forwarding } = draws[i];

            // The standard states for the mode FIRST, then the effect's own
            // over them when ApplyPass runs. A decal's depth bias lives here
            // and nowhere else - without it a decal z-fights the hull it sits
            // on, and the picking buffer speckles between the two ids.
            device.SetStandardStates(batch.renderMode);

            // Set per draw rather than per effect: a bound parameter writes
            // straight into the stage's constant buffer, so this is the value
            // the very next draw uses and nothing accumulates between them.
            Tw2MaterialPicker.SetParameter(effect, "PickingArea", [ areaType, areaIndex, 0, 0 ]);
            Tw2MaterialPicker.SetParameter(effect, "PickingThreshold", this.threshold);
            Tw2MaterialPicker.SetParameter(effect, "PickingInclude", this.include);
            Tw2MaterialPicker.SetParameter(effect, "PatternBlendMode", [ this.blendMode, 0, 0, 0 ]);

            device.perObjectData = batch.perObjectData;

            if (!forwarding)
            {
                if (batch.geometryRes.RenderAreas(batch.meshIx, batch.start, batch.count, effect, "Main"))
                {
                    report.drawn++;
                }

                continue;
            }

            // A forwarding batch draws itself and reads its effect off the
            // batch, so this is the one place the picker does mutate one. Put
            // back in a finally: the batch belongs to the object, the frame is
            // not over, and leaving a picking effect on a decal would draw the
            // ship's decals as flat ids in the visible frame.
            const original = batch.effect;
            batch.effect = effect;

            try
            {
                if (batch.Commit("Main")) report.drawn++;
            }
            finally
            {
                batch.effect = original;
            }
        }

        this._renderTarget.Unset();

        tw2.SetColorMask(colorMask);
        tw2.SetClearColor(clearColor);

        return report;
    }

    /**
     * Reads the WHOLE buffer back into a capture.
     *
     * Once, at capture time, rather than a GL call per pick. That is what lets
     * a result outlive the frame: the render target is reused by the next
     * capture, but the pixels a caller holds are their own.
     *
     * @param {Object} [report] - what {@link Render} reported, carried onto the result
     * @returns {?Tw2MaterialPickResult}
     */
    Capture(report)
    {
        if (!this._width || !this._renderTarget.IsGood()) return null;

        const data = new Uint8Array(this._width * this._height * 4);
        this._renderTarget.ReadPixels(data, 0, 0, this._width, this._height);

        const result = new Tw2MaterialPickResult(this._width, this._height, data);
        if (report) result.report = report;
        return result;
    }

    /**
     * Releases the picking effects.
     *
     * They hold the source effects' textures, so a picker kept alive across a
     * hull change would keep the old hull's maps resident.
     * @returns {Tw2MaterialPicker}
     */
    Dispose()
    {
        this._effects.clear();
        this._unsupported.clear();
        return this;
    }

    /**
     * Works out what to draw for one batch, and with which effect.
     * @param {Tw2RenderBatch} batch
     * @param {Object} report
     * @returns {?Object}
     * @private
     */
    _PrepareBatch(batch, report)
    {
        // Only geometry batches. An instanced batch carries its own vertex
        // stream and would need an instanced picking vertex stage; drawing it
        // through this one would draw one instance at the origin.
        if (!batch || !batch.effect)
        {
            report.defects++;
            this._Refuse(report, batch ? batch.constructor.name : "null", "no effect to match");
            return null;
        }

        // Two shapes reach here. A geometry batch names its own mesh area and
        // is drawn directly. A FORWARDING batch belongs to something that draws
        // itself - every decal on a hull is one, nine of the twelve batches on
        // af4_t1 - and is drawn by handing it back its own Commit with our
        // effect swapped in and then put back.
        const forwarding = !batch.geometryRes || typeof batch.count !== "number";

        if (forwarding && typeof batch.Commit !== "function")
        {
            report.defects++;
            this._Refuse(report, batch.constructor.name, "cannot be committed");
            return null;
        }

        const effect = this._GetPickingEffect(batch.effect, report);
        if (!effect) return null;

        if (!effect.IsGood())
        {
            report.pending++;
            return null;
        }

        return {
            batch,
            effect,
            forwarding,

            // The render mode IS the area type, and for a geometry batch the
            // start IS the mesh area's own index - see Tw2Mesh.GetAreaBatches,
            // which copies `area.index` into `batch.start`. A decal names
            // itself with `meshAreaIndex`. Both are ccpwgl's own numbering, so
            // a consumer can look the area back up rather than translate.
            areaType: batch.renderMode & 15,
            areaIndex: (forwarding ? (batch.meshAreaIndex || 0) : batch.start) & 255
        };
    }

    /**
     * Records why a batch was not drawn, once per reason.
     *
     * Counting refusals is not enough to act on: "nine areas were skipped" and
     * "nine areas were skipped because they are forwarding batches" are the
     * same number and different problems.
     *
     * @param {Object} report
     * @param {String} what
     * @param {String} why
     * @private
     */
    _Refuse(report, what, why)
    {
        const line = `${what}: ${why}`;
        if (report.refused.indexOf(line) === -1) report.refused.push(line);
    }

    /**
     * Gets or builds the picking effect standing in for a shipped one.
     * @param {Tw2Effect} source
     * @param {Object} report
     * @returns {?Tw2Effect}
     * @private
     */
    _GetPickingEffect(source, report)
    {
        if (this._effects.has(source)) return this._effects.get(source);

        const match = GetPickingShaderForPath(source.effectFilePath);

        if (match.unsupported)
        {
            // Cached as null so a hull's every area does not re-resolve, and
            // named once so a caller learns WHICH shader we cannot draw.
            this._effects.set(source, null);

            if (!this._unsupported.has(match.name))
            {
                this._unsupported.set(match.name, match.unsupported);

                tw2.Warning({
                    name: "Material picking",
                    description: `No picking shader for "${match.name}" (${match.unsupported}) - those areas are not picked`
                });
            }

            report.defects++;
            this._Refuse(report, match.name, match.unsupported);
            if (report.unsupported.indexOf(match.name) === -1) report.unsupported.push(match.name);
            return null;
        }

        const wanted = PICKING_TEXTURES[match.shader] || [];
        const sourceTextures = source.GetTextures();
        const textures = {};

        for (let i = 0; i < wanted.length; i++)
        {
            const name = wanted[i];

            // A name missing from the source is not an error - a quad with its
            // pattern permutation off genuinely has no pattern masks. It is
            // still declared on our effect, because an undeclared sampler falls
            // back to unit zero and would read the material map; but what makes
            // the answer deterministic is the presence flag below, not the
            // declaration. An unbound sampler reads whatever was left in the
            // unit, and on an unpatterned hull that read as full coverage.
            if (name in sourceTextures) textures[name] = sourceTextures[name];
        }

        // What this source can ACTUALLY resolve, from its own texture list.
        const presence = [
            "PatternMask1Map" in textures && "PatternMask2Map" in textures ? 1 : 0,
            "PaintMaskMap" in textures ? 1 : 0,
            "DecalTransparencyMap" in textures ? 1 : 0,
            0
        ];

        const effectFilePath = Tw2MaterialPicker.EnsureShaderResource(match.shader);

        const effect = Tw2Effect.from({
            name: `picking: ${match.name}`,
            effectFilePath,
            autoParameter: true,
            textures,
            parameters: {
                PickingThreshold: Array.from(this.threshold),
                PickingInclude: Array.from(this.include),
                PatternBlendMode: [ this.blendMode, 0, 0, 0 ],
                PickingArea: [ 0, 0, 0, 0 ],
                PickingPresence: presence
            }
        });

        // The address modes are NOT copied across, and deliberately.
        //
        // A pattern mask's wrap mode is authored per layer, and ccpwgl already
        // forwards the part WebGL cannot do to the shader through the per-object
        // constants: `EveCustomMask.GetPerObjectDataBagOfStuff` turns address
        // mode 4 into the clamp-to-border flags in CustomMaskMaterialID.yzw and
        // mode 3 into CustomMaskClamps. The picking shaders read both, from the
        // same buffer the shipped ones read.
        //
        // So there is nothing to plumb here. Copying sampler overrides as well
        // would be a second mechanism for one fact, and the two could disagree.
        this._effects.set(source, effect);
        return effect;
    }

    /**
     * @private
     */
    _WarnOnAspectMismatch()
    {
        if (!tw2.width || !tw2.height) return;

        const
            canvas = tw2.width / tw2.height,
            buffer = this._width / this._height;

        // A percent of slop, so an odd pixel count from a rounded CSS size does
        // not nag.
        if (Math.abs(canvas - buffer) / canvas > 0.01)
        {
            tw2.Warning({
                name: "Material picking",
                description: `Buffer aspect ${buffer.toFixed(3)} does not match the canvas's ${canvas.toFixed(3)}`
                    + " - the pass reuses the frame's projection, so picked coordinates will not line up"
            });
        }
    }

    /**
     * Writes one picking constant, if the effect has it.
     *
     * Guarded because an effect is not guaranteed to carry them: a shader that
     * failed to compile has no parameters at all, and a caller experimenting
     * with a substitute effect would otherwise take the whole frame down from
     * inside the scene's task queue - where the throw is a long way from the
     * cause.
     *
     * @param {Tw2Effect} effect
     * @param {String} name
     * @param {Array|Float32Array} value
     * @returns {Boolean} true if it was written
     */
    static SetParameter(effect, name, value)
    {
        const parameter = effect.parameters[name];
        if (!parameter || typeof parameter.SetValue !== "function") return false;

        parameter.SetValue(value);
        return true;
    }

    /**
     * Makes sure a picking shader has a RESOURCE, and returns its path.
     *
     * Registering a shader definition puts it in the shader store; it does not
     * create a resource. The store's own route to one is
     * `Tw2Effect.getOverriddenShaderPath`, which only fires for a definition
     * that `replaces` a shipped path - and ours deliberately replace nothing,
     * so nothing would ever build them. Asking the resource manager for a
     * `manual:/` path it has never seen throws outright rather than resolving
     * it, which is what happened the first time this ran.
     *
     * So the resource is built here, once per shader name, and the second
     * caller finds it in the motherLode.
     *
     * @param {String} name - the picking shader's registered name
     * @returns {String} the `manual:/` path an effect can load
     */
    static EnsureShaderResource(name)
    {
        const path = `manual:/${name}.sm_json`;

        if (!tw2.resMan.motherLode.Has(path))
        {
            Tw2EffectRes.fromManual(name);
        }

        return path;
    }

    /**
     * The Carbon permutation options, in the order the shaders read them.
     * @type {Array<String>}
     */
    static BLEND_MODES = [
        "BLEND_MODE_OVERLAY",
        "BLEND_MODE_SUBTRACT",
        "BLEND_MODE_EXCLUSION",
        "BLEND_MODE_NESTED",
        "BLEND_MODE_NESTED_INVERTED"
    ];

}
