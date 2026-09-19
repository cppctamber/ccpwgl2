import { device } from "global";
import { RM_FULLSCREEN, RS_ZWRITEENABLE, RS_SEPARATEALPHABLENDENABLE, RS_SRCBLENDALPHA, RS_DESTBLENDALPHA, BLEND_ONE, BLEND_INVSRCALPHA } from "constant";
import { Tw2DofDepthRenderer } from "./Tw2DofDepthRenderer";
import { Tw2DepthOfFieldRenderer } from "./Tw2DepthOfFieldRenderer";
import { Tw2DepthRenderTarget } from "../Tw2DepthRenderTarget";
import { Tw2RenderTarget } from "../Tw2RenderTarget";
import { Tw2RenderBatchContext } from "../batch/Tw2RenderBatchContext";

/** Experimental separated colour/coverage DOF. The opaque depth is never modified. */
export class Tw2DofLayerRenderer extends Tw2DofDepthRenderer
{
    layers = [];
    batches = [];

    Extract(scene, root)
    {
        this.batches = [];
        this.report = { rendered: 0, skipped: 0, error: null };
        this._context ??= new Tw2RenderBatchContext();
        this._context.Clear();
        if (!this._writer) { this._writer = scene.GetBatchContextWriter(); this._context.AddWriter(this._writer); }
        const removed = [];
        const walk = accumulator =>
        {
            if (accumulator.accumulators) { for (const a of accumulator.accumulators.values()) walk(a); return; }
            const kept = [];
            for (const batch of accumulator.batches)
            {
                if (batch.batches) { walk(batch); kept.push(batch); continue; }
                const passes = batch.effect?.shader?.techniques?.Main?.passes;
                if ((batch.renderMode === device.RM_ADDITIVE || batch.renderMode === device.RM_TRANSPARENT)
                    && batch.effect?.IsGood() && passes?.length
                    && passes.every(pass => this.GetProgram(pass, batch.renderMode === device.RM_ADDITIVE, false)))
                {
                    this.batches.push({ batch, accumulator });
                }
                else kept.push(batch);
            }
            removed.push([ accumulator, accumulator.batches ]);
            accumulator.batches = kept;
        };
        walk(root);
        return () => { for (const [ accumulator, batches ] of removed) accumulator.batches = batches; };
    }

    Fullscreen(target, texture, mask = texture, mode = 0, additive = false)
    {
        const { gl } = device;
        if (!this._composite)
        {
            const shader = (type, source) =>
            {
                const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
                return s;
            };
            const v = shader(gl.VERTEX_SHADER, `#version 300 es
out vec2 uv; void main(){ uv=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2)); gl_Position=vec4(uv*2.0-1.0,0,1); }`);
            const f = shader(gl.FRAGMENT_SHADER, `#version 300 es
precision highp float; in vec2 uv; uniform sampler2D colour; uniform sampler2D coverage; uniform int mode; out vec4 result;
void main(){vec4 c=texture(colour,uv);result=mode==0?vec4(c.aaa,1):vec4(c.rgb,clamp(texture(coverage,uv).r,0.0,1.0));}`);
            const p = gl.createProgram(); gl.attachShader(p,v); gl.attachShader(p,f); gl.linkProgram(p);
            gl.deleteShader(v); gl.deleteShader(f);
            if (!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
            this._composite = p;
            this._vao = gl.createVertexArray();
        }
        target.SetCallUnset(() =>
        {
            device.InvalidateStandardStates(); device.SetStandardStates(RM_FULLSCREEN);
            gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.colorMask(true,true,true,true);
            if (mode === 1) { gl.enable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.ONE,additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA); }
            else gl.disable(gl.BLEND);
            const vao = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
            gl.bindVertexArray(this._vao); gl.useProgram(this._composite);
            gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,texture.texture);
            gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,mask.texture);
            gl.uniform1i(gl.getUniformLocation(this._composite,"colour"),0);
            gl.uniform1i(gl.getUniformLocation(this._composite,"coverage"),1);
            gl.uniform1i(gl.getUniformLocation(this._composite,"mode"),mode);
            gl.drawArrays(gl.TRIANGLES,0,3); gl.bindVertexArray(vao);
            device.InvalidateStandardStates();
        });
    }

    RenderLayers(scene, depthHandler, effect, destination)
    {
        const { gl } = device, source = depthHandler._target;
        const perObjectData = device.perObjectData;
        const framebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING), viewport = gl.getParameter(gl.VIEWPORT);
        try
        {
            for (let index = 0; index < 2; index++)
            {
                const additive = index === 1;
                const batches = this.batches.filter(({ batch }) => (batch.renderMode === device.RM_ADDITIVE) === additive);
                if (!batches.length) continue;
                const layer = this.layers[index] ??= { target: new Tw2DepthRenderTarget("DofEffectLayer"), dof: new Tw2DepthOfFieldRenderer(), maskDof: new Tw2DepthOfFieldRenderer() };
                const target = layer.target;
                target.Update(source.width,source.height,source.precision,destination.colorFormat);
                // Copy occluders, but clear colour to transparent black.
                gl.bindFramebuffer(gl.READ_FRAMEBUFFER,source._frameBuffer);
                gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,target._frameBuffer);
                gl.disable(gl.SCISSOR_TEST);
                gl.blitFramebuffer(0,0,source.width,source.height,0,0,source.width,source.height,gl.DEPTH_BUFFER_BIT,gl.NEAREST);
                gl.bindFramebuffer(gl.FRAMEBUFFER,target._frameBuffer); gl.viewport(0,0,source.width,source.height);
                gl.colorMask(true,true,true,true); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
                for (const { batch, accumulator } of batches)
                {
                    const overrides = batch.effect.techniques.Main.map(pass => pass.state);
                    try
                    {
                        batch.effect.techniques.Main.forEach((pass,i) =>
                        {
                            const s=overrides[i];
                            pass.state = [ ...(Array.isArray(s) ? s : Object.entries(s || {}).map(([ state,value ])=>({ state:Number(state),value }))),
                                { state:RS_ZWRITEENABLE,value:0 }, { state:RS_SEPARATEALPHABLENDENABLE,value:1 },
                                { state:RS_SRCBLENDALPHA,value:BLEND_ONE }, { state:RS_DESTBLENDALPHA,value:BLEND_INVSRCALPHA } ];
                        });
                        device.InvalidateStandardStates(); device.SetStandardStates(batch.renderMode);
                        device.perObjectData=this._context.ResolvePerObjectData(batch,{ accumulator,technique:"Main",renderMode:batch.renderMode });
                        batch.Commit("Main");
                    }
                    finally { batch.effect.techniques.Main.forEach((pass,i)=>{pass.state=overrides[i];}); }
                }
                // Same geometry, depth only. The background colour is absent here.
                for (const { batch,accumulator } of batches) this.DrawBatch(batch,accumulator);
                gl.colorMask(true,true,true,true); device.InvalidateStandardStates();
                if (!additive)
                {
                    layer.mask ??= new Tw2RenderTarget("DofEffectCoverage",source.width,source.height,false,destination.colorFormat);
                    layer.mask.Update(source.width,source.height,false,destination.colorFormat);
                    this.Fullscreen(layer.mask,target.texture);
                    layer.maskDof.Render(effect,target.depthTexture,layer.mask);
                }
                layer.dof.Render(effect,target.depthTexture,target);
                this.Fullscreen(destination,target.texture,additive ? target.texture : layer.mask.texture,1,additive);
            }
        }
        finally
        {
            device.perObjectData=perObjectData;
            gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer); gl.viewport(...viewport);
            gl.colorMask(true,true,true,true); gl.depthMask(true); gl.enable(gl.DEPTH_TEST);
            device.InvalidateStandardStates();
        }
    }
}
