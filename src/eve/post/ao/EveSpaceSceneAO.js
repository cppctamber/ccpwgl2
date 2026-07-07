import { meta } from "utils";
import { device, tw2 } from "global";
import { RM_OPAQUE, RM_DECAL } from "constant";
import { DEFAULT_AO_POST_EFFECT } from "./ssaoPostEffect.js";

/**
 * EveSpaceSceneAO
 *
 * Screen-space ambient occlusion for the CEWG hull path, run as a small
 * config-driven multi-pass post-effect. Scene-owned, mirroring
 * {@link EveSpaceSceneShadowHandler}; gated by `scene.visible.ao`.
 *
 * Tunables live as decorated fields on this class (so they surface in the
 * inspector); the pass/shader structure lives in the config
 * (see {@link ./ssaoPostEffect.js}).
 *
 * Per frame:
 *   1. own depth prepass — render the whole ship's `Main` technique into a 32F
 *      depth texture via `scene.GetDepthContext()` (skinned bones resolve). We
 *      don't read the scene's depth pass: the CEWG `"Depth"` technique is a
 *      normal-prepass, and EVE's ~1e8 far plane makes 16-bit scene depth useless.
 *   2. run the config passes (AO → blur) into ping-friendly RGBA8 targets.
 *   3. bind the `output` target into `SSAOMap`.
 *
 * NOTE: `Tw2PostProcess` is a colour-frame chain (blit → ping-pong → screen), so
 * it can't run SSAO (depth-in / texture-out). Routing the passes through the
 * shader store / `Tw2Effect` is a later refinement.
 */
@meta.type("EveSpaceSceneAO")
export class EveSpaceSceneAO extends meta.Model
{

    @meta.boolean
    enabled = true;

    @meta.float
    radius = 60;              // world-space sample radius (metres)

    @meta.float
    strength = 3.0;

    @meta.float
    bias = 0.15;

    @meta.float
    maxPixelRadius = 64;      // clamp on the screen-space sample radius

    @meta.uint
    blurRadius = 2;           // box-blur radius in pixels (0-4)

    @meta.uint
    debugView = 0;            // 0=ao 1=depth 2=viewZ 3=normal

    scene = null;
    config = DEFAULT_AO_POST_EFFECT;

    _width = 0;
    _height = 0;
    _vao = null;
    _depth = null;         // { depthTex, colorTex, fbo }
    _targets = null;       // Map<name, { tex, fbo }>
    _passes = null;        // [{ name, program, loc, samplers, target }]
    _ssaoParams = null;

    _report = { ok: false, status: "not_run" };

    /**
     * @param {EveSpaceScene} [scene]
     * @param {Object} [config]
     */
    constructor(scene = null, config = DEFAULT_AO_POST_EFFECT)
    {
        super();
        this.scene = scene;
        this.config = config;
    }

    /**
     * @param {EveSpaceScene} [scene]
     * @returns {Boolean}
     */
    ShouldRender(scene = this.scene)
    {
        return !!(this.enabled && scene && scene.visible && scene.visible.ao);
    }

    /**
     * @returns {Object}
     */
    GetReport()
    {
        return this._report;
    }

    /**
     * Produces the AO map for the current frame and binds it to `SSAOMap`.
     * @param {Number} dt
     * @param {EveSpaceScene} [scene]
     * @returns {Boolean}
     */
    Render(dt, scene = this.scene)
    {
        this.scene = scene || this.scene;
        this._report.ok = false;

        if (!this.ShouldRender(this.scene)) { this._report.status = "disabled"; return false; }

        this._EnsureResources();

        const { gl } = device;
        const prevFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        const prevViewport = gl.getParameter(gl.VIEWPORT);
        const prevVao = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
        const prevDepth = gl.getParameter(gl.DEPTH_TEST);
        const prevBlend = gl.getParameter(gl.BLEND);

        gl.bindVertexArray(this._vao);
        this._RenderDepth(dt);
        this._RunPasses();
        this._BindOutput();

        gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
        gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);
        gl.bindVertexArray(prevVao);
        if (prevDepth) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);
        if (prevBlend) gl.enable(gl.BLEND); else gl.disable(gl.BLEND);

        this._report.ok = true;
        this._report.status = "rendered";
        return true;
    }

    /**
     * Own `Main`-technique depth prepass of the whole scene into the 32F target.
     * @param {Number} dt
     * @private
     */
    _RenderDepth(dt)
    {
        const { gl } = device;
        const scene = this.scene;
        const ctx = scene.GetDepthContext();
        const objs = scene.objectsByDistance || scene.objects || [];
        const opt = { techniqueFilter: "Main", techniqueOverride: "Main" };

        ctx.Clear();
        if (objs.length) { ctx.CollectObjectArrayBatches(objs, RM_OPAQUE, opt); ctx.CollectObjectArrayBatches(objs, RM_DECAL, opt); }
        if (scene.backgroundObjects && scene.backgroundObjects.length) ctx.CollectObjectArrayBatches(scene.backgroundObjects, RM_OPAQUE, opt);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._depth.fbo);
        gl.viewport(0, 0, this._width, this._height);
        gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
        gl.clearColor(0, 0, 0, 1); gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        ctx.Render("Main");
        gl.bindVertexArray(this._vao);
    }

    /**
     * Runs each configured pass into its target.
     * @private
     */
    _RunPasses()
    {
        const { gl } = device;
        const P = device.projection;

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);

        for (const pass of this._passes)
        {
            const target = this._targets.get(pass.target);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
            gl.viewport(0, 0, this._width, this._height);
            gl.useProgram(pass.program);

            // samplers
            let unit = 0;
            for (const uniformName in pass.samplers)
            {
                const src = pass.samplers[uniformName];
                const tex = src === "depth" ? this._depth.depthTex : (this._targets.get(src) || {}).tex;
                const loc = pass.loc(uniformName);
                if (loc && tex)
                {
                    gl.activeTexture(gl.TEXTURE0 + unit);
                    gl.bindTexture(gl.TEXTURE_2D, tex);
                    gl.uniform1i(loc, unit);
                    unit++;
                }
            }

            // camera / viewport uniforms
            EveSpaceSceneAO.setF2(pass, "uRes", this._width, this._height);
            EveSpaceSceneAO.setF2(pass, "uAB", P[10], P[14]);
            EveSpaceSceneAO.setF2(pass, "uTan", 1 / P[0], 1 / P[5]);
            EveSpaceSceneAO.setF1(pass, "uFocalPx", 0.5 * this._height * P[5]);

            // tunables
            EveSpaceSceneAO.setF1(pass, "uRadius", this.radius);
            EveSpaceSceneAO.setF1(pass, "uStrength", this.strength);
            EveSpaceSceneAO.setF1(pass, "uBias", this.bias);
            EveSpaceSceneAO.setF1(pass, "uMaxPx", this.maxPixelRadius);
            EveSpaceSceneAO.setF1(pass, "uBlurPx", this.blurRadius);
            const viewLoc = pass.loc("uView");
            if (viewLoc) gl.uniform1i(viewLoc, this.debugView | 0);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
    }

    /**
     * Binds the output target into every `SSAOMap` parameter.
     * @private
     */
    _BindOutput()
    {
        const { gl } = device;
        const out = this._targets.get(this.config.output);
        if (!out) return;

        // global variable
        try
        {
            const p = tw2.GetVariable && tw2.GetVariable("SSAOMap");
            if (p && p.textureRes) { p.textureRes.texture = out.tex; p.textureRes._target = gl.TEXTURE_2D; }
        }
        catch (err) { /* ignore */ }

        // per-effect params on the scene's objects (scanned lazily)
        if (!this._ssaoParams || !this._ssaoParams.length) this._ssaoParams = this._FindSsaoParams();
        for (const p of this._ssaoParams)
        {
            if (p && p.textureRes) { p.textureRes.texture = out.tex; p.textureRes._target = gl.TEXTURE_2D; }
        }
    }

    /**
     * Walks the scene's objects for SSAOMap texture parameters.
     * @returns {Array}
     * @private
     */
    _FindSsaoParams()
    {
        const roots = [].concat(this.scene.objects || [], this.scene.backgroundObjects || []);
        const seen = new Set(), out = [], q = roots.map((r) => [ r, 0 ]);
        while (q.length && seen.size < 8000)
        {
            const [ o, d ] = q.shift();
            if (!o || typeof o !== "object" || seen.has(o) || d > 7) continue;
            seen.add(o);
            if (o.parameters && o.parameters.SSAOMap) out.push(o.parameters.SSAOMap);
            for (const k in o)
            {
                const v = o[k];
                if (v && typeof v === "object" && !ArrayBuffer.isView(v)) q.push([ v, d + 1 ]);
            }
        }
        return out;
    }

    /**
     * Allocates targets and compiles passes for the current viewport size.
     * @private
     */
    _EnsureResources()
    {
        const { gl } = device;
        const w = tw2.width, h = tw2.height;
        if (this._passes && this._width === w && this._height === h) return;

        this.Destroy();
        this._width = w;
        this._height = h;
        this._vao = gl.createVertexArray();

        // depth prepass target (32F depth + throwaway colour)
        const depthTex = EveSpaceSceneAO.tex(gl.DEPTH_COMPONENT32F, w, h, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, depthTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
        const colorTex = EveSpaceSceneAO.tex(gl.RGBA8, w, h, gl.NEAREST);
        const dFbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, dFbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTex, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this._depth = { depthTex, colorTex, fbo: dFbo };

        // one RGBA8 target per distinct pass output
        this._targets = new Map();
        for (const pass of this.config.passes)
        {
            if (this._targets.has(pass.target)) continue;
            const tex = EveSpaceSceneAO.tex(gl.RGBA8, w, h, gl.LINEAR);
            const fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            this._targets.set(pass.target, { tex, fbo });
        }

        // compile passes
        this._passes = this.config.passes.map((pass) =>
        {
            const program = EveSpaceSceneAO.program(this.config.vertexShader, pass.fragmentShader, pass.name);
            const cache = new Map();
            return {
                name: pass.name,
                program,
                samplers: pass.samplers || {},
                target: pass.target,
                loc: (n) => { if (!cache.has(n)) cache.set(n, gl.getUniformLocation(program, n)); return cache.get(n); }
            };
        });

        this._ssaoParams = null;
    }

    /**
     * Releases GL resources.
     */
    Destroy()
    {
        const { gl } = device;
        if (this._depth) { gl.deleteTexture(this._depth.depthTex); gl.deleteTexture(this._depth.colorTex); gl.deleteFramebuffer(this._depth.fbo); this._depth = null; }
        if (this._targets) { this._targets.forEach((t) => { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); }); this._targets = null; }
        if (this._passes) { this._passes.forEach((p) => gl.deleteProgram(p.program)); this._passes = null; }
        if (this._vao) { gl.deleteVertexArray(this._vao); this._vao = null; }
        this._ssaoParams = null;
        this._width = 0;
        this._height = 0;
    }

    /**
     * Sets a float uniform if present on the pass program.
     * @param {Object} pass
     * @param {String} name
     * @param {Number} x
     */
    static setF1(pass, name, x)
    {
        const l = pass.loc(name);
        if (l) device.gl.uniform1f(l, x);
    }

    /**
     * Sets a vec2 uniform if present on the pass program.
     * @param {Object} pass
     * @param {String} name
     * @param {Number} x
     * @param {Number} y
     */
    static setF2(pass, name, x, y)
    {
        const l = pass.loc(name);
        if (l) device.gl.uniform2f(l, x, y);
    }

    /**
     * Creates an immutable 2D texture.
     * @param {GLenum} fmt
     * @param {Number} w
     * @param {Number} h
     * @param {GLenum} filt
     * @returns {WebGLTexture}
     */
    static tex(fmt, w, h, filt)
    {
        const { gl } = device;
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texStorage2D(gl.TEXTURE_2D, 1, fmt, w, h);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filt);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filt);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return t;
    }

    /**
     * Compiles + links a fullscreen program.
     * @param {String} vs
     * @param {String} fs
     * @param {String} name - for error messages
     * @returns {WebGLProgram}
     */
    static program(vs, fs, name)
    {
        const { gl } = device;
        const p = gl.createProgram();
        const compile = (type, src) =>
        {
            const sh = gl.createShader(type);
            gl.shaderSource(sh, src); gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(`AO compile ${name}: ${gl.getShaderInfoLog(sh)}`);
            return sh;
        };
        gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
        gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`AO link ${name}: ${gl.getProgramInfoLog(p)}`);
        return p;
    }

}
