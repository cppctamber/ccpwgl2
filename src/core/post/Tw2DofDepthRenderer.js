import { device } from "global";
import { RS_ZENABLE, RS_ZWRITEENABLE, RS_ZFUNC, RS_ALPHABLENDENABLE, RS_COLORWRITEENABLE, RS_SRCBLEND, RS_DESTBLEND, BLEND_ONE, BLEND_INVSRCALPHA, BLEND_SRCALPHA, CMP_LEQUAL } from "constant";
import { Tw2DepthRenderTarget } from "../Tw2DepthRenderTarget";
import { Tw2RenderBatchContext } from "../batch/Tw2RenderBatchContext";
import { Tw2ShaderProgram } from "../shader/Tw2ShaderProgram";
import { DofCoverageSource } from "./dofCoverage";

/** Experimental nearest-contributing-surface depth, consumed ONLY by DOF. */
export class Tw2DofDepthRenderer 
{
    _programs = new WeakMap();
    _context = null;
    target = null;
    report = null;

    GetProgram(pass, additive, alphaWeighted) 
    {
        const { gl } = device, original = pass.shaderProgram;
        let variants = this._programs.get(original);
        if (!variants) this._programs.set(original, variants = new Map());
        const key = `${additive}:${alphaWeighted}`;
        if (variants.has(key)) return variants.get(key);
        const shaders = gl.getAttachedShaders(original.program) || [];
        const vertex = shaders.find(s => gl.getShaderParameter(s, gl.SHADER_TYPE) === gl.VERTEX_SHADER);
        const fragment = shaders.find(s => gl.getShaderParameter(s, gl.SHADER_TYPE) === gl.FRAGMENT_SHADER);
        const source = fragment && DofCoverageSource(gl.getShaderSource(fragment), additive, alphaWeighted);
        if (!vertex || !source) { variants.set(key, null); return null; }
        const shader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
        {
            this.report.error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader); variants.set(key, null); return null;
        }
        const program = Tw2ShaderProgram.create(vertex, shader, pass, { path: "DOF coverage" }, true);
        gl.deleteShader(shader);
        variants.set(key, program);
        return program;
    }

    DrawBatch(batch, accumulator) 
    {
        const effect = batch.effect, technique = batch._techniqueOverride || "Main";
        if (!effect?.IsGood?.() || !effect.shader?.techniques?.[technique]) { this.report.skipped++; return; }
        const passes = effect.shader.techniques[technique].passes;
        const programs = passes.map((pass, i) => 
        {
            const state = effect.techniques[technique][i].state;
            const authored = [ ...(pass.authoredStates || pass.states), ...(Array.isArray(state) ? state : Object.entries(state || {}).map(([ state,value ]) => ({ state:Number(state),value }))) ];
            const sourceBlend = authored.filter(x => x.state === RS_SRCBLEND).pop()?.value;
            const destinationBlend = authored.filter(x => x.state === RS_DESTBLEND).pop()?.value
                ?? (batch.renderMode === device.RM_ADDITIVE ? BLEND_ONE : BLEND_INVSRCALPHA);
            // An additive batch may carry a premultiplied-alpha material (e.g.
            // 2LayerMask). Its RGB alone is not a coverage mask.
            return this.GetProgram(pass, destinationBlend === BLEND_ONE, sourceBlend === BLEND_SRCALPHA);
        });
        if (programs.some(p => !p)) { this.report.skipped++; return; }
        const saved = passes.map((pass, i) => [ pass.shaderProgram, pass.shadowShaderProgram, effect.techniques[technique][i].state ]);
        try 
        {
            for (let i = 0; i < passes.length; i++) 
            {
                passes[i].shaderProgram = passes[i].shadowShaderProgram = programs[i];
                const states = saved[i][2];
                const overrides = Array.isArray(states) ? states.slice() : Object.entries(states || {}).map(([ state,value ])=>({ state:Number(state),value }));
                overrides.push({ state:RS_ZENABLE,value:1 }, { state:RS_ZWRITEENABLE,value:1 },
                    { state:RS_ZFUNC,value:CMP_LEQUAL }, { state:RS_ALPHABLENDENABLE,value:0 }, { state:RS_COLORWRITEENABLE,value:0 });
                effect.techniques[technique][i].state = overrides;
            }
            device.InvalidateStandardStates();
            device.SetStandardStates(batch.renderMode);
            device.perObjectData = this._context.ResolvePerObjectData(batch, { accumulator, technique, renderMode:batch.renderMode });
            if (batch.Commit(technique) !== false) this.report.rendered++;
        }
        finally 
        {
            for (let i = 0; i < passes.length; i++) 
            {
                [ passes[i].shaderProgram, passes[i].shadowShaderProgram, effect.techniques[technique][i].state ] = saved[i];
            }
        }
    }

    Render(scene, depthHandler) 
    {
        const { gl } = device, source = depthHandler?._target;
        this.report = { rendered:0, skipped:0, error:null };
        if (!gl.blitFramebuffer || !depthHandler?.rendered || !source?.IsGood()) return null;
        this.target ??= new Tw2DepthRenderTarget("DofSurfaceDepth");
        if (this.target.width !== source.width || this.target.height !== source.height || !this.target.IsGood())
            this.target.Create(source.width, source.height, source.precision);
        if (!this.target.IsGood()) return null;
        this._context ??= new Tw2RenderBatchContext();
        this._context.Clear();
        // Context writers preserve Carbon per-object constants for child batches.
        if (!this._writer) { this._writer = scene.GetBatchContextWriter(); this._context.AddWriter(this._writer); }
        const objects = [ ...(scene.visible.objects ? scene.objects : []), ...(scene.visible.backgroundObjects ? scene.backgroundObjects : []) ];
        for (const mode of [ device.RM_TRANSPARENT, device.RM_ADDITIVE ])
            this._context.CollectObjectArrayBatches(objects, mode, { renderReason:"DofSurfaceDepth" });
        const read = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING), draw = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING);
        const viewport = gl.getParameter(gl.VIEWPORT), scissor = gl.isEnabled(gl.SCISSOR_TEST);
        const colorMask = gl.getParameter(gl.COLOR_WRITEMASK), depthMask = gl.getParameter(gl.DEPTH_WRITEMASK);
        const perObjectData = device.perObjectData;
        try 
        {
            gl.disable(gl.SCISSOR_TEST);
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, source._frameBuffer);
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.target._frameBuffer);
            gl.blitFramebuffer(0,0,source.width,source.height,0,0,source.width,source.height,gl.DEPTH_BUFFER_BIT,gl.NEAREST);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.target._frameBuffer);
            gl.viewport(0,0,source.width,source.height);
            for (const accumulator of this._context.accumulators.values())
                for (const batch of accumulator.batches) this.DrawBatch(batch, accumulator);
            return this.target.depthTexture;
        }
        finally 
        {
            device.perObjectData = perObjectData;
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, read); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, draw);
            gl.viewport(...viewport); gl.colorMask(...colorMask); gl.depthMask(depthMask);
            if (scissor) gl.enable(gl.SCISSOR_TEST);
            device.InvalidateStandardStates();
        }
    }
}
