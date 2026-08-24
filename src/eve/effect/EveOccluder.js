import { meta } from "utils";
import { device, tw2 } from "global";
import { vec4, mat4 } from "math";
import { Tw2VertexDeclaration, Tw2BatchAccumulator } from "core";


@meta.define("EveOccluder", true)
export class EveOccluder extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveTransform")
    sprites = [];


    /**
     * Constructor
     */
    constructor()
    {
        super();
        EveOccluder.init();
    }

    /**
     * UpdateValues
     * @param {mat4} parentTransform
     * @param {number} index
     */
    UpdateValue(parentTransform, index)
    {
        if (!device.alphaBlendBackBuffer) return;

        const
            d = device,
            g = EveOccluder.global,
            worldViewProj = g.mat4_0,
            center = g.vec4_0;

        g.accumulator.Clear();

        for (let i = 0; i < this.sprites.length; ++i)
        {
            this.sprites[i].UpdateViewDependentData(parentTransform);
            this.sprites[i].GetBatches(d.RM_DECAL, g.accumulator);
        }

        tw2.SetVariableValue("OccluderValue", [ (1 << (index * 2)) / 255.0, (2 << (index * 2)) / 255.0, 0, 0 ]);

        g.accumulator.Render();

        mat4.multiply(worldViewProj, d.viewProjection, this.sprites[0]._worldTransform);
        vec4.transformMat4(center, [ 0, 0, 0, 1 ], worldViewProj);

        const
            x0 = (center[0] / center[3] + 1) * 0.5,
            y0 = (center[1] / center[3] + 1) * 0.5;

        vec4.set(center, 0.5, 0.5, 0, 1);
        vec4.transformMat4(center, center, worldViewProj);

        const
            x1 = (center[0] / center[3] + 1) * 0.5,
            y1 = (center[1] / center[3] + 1) * 0.5;

        center[0] = x0;
        center[1] = y0;
        center[2] = x1 - x0;
        center[3] = y1 - y0;

        // Guarded because the sample collector's effect no longer exists - see
        // the note in `init()`. Everything above this line still runs: the
        // occluder sprites are drawn and their screen-space extent computed, so
        // a future collector has the same inputs waiting for it.
        if (g.effect && g.effect.parameters && g.effect.parameters.OccluderPosition)
        {
            g.effect.parameters.OccluderPosition.SetValue(center);
        }
    }

    /**
     * CollectSamples
     * @param {Tw2TextureRes} tex
     * @param {number} index
     * @param {number} total
     * @param {number} samples
     * @returns boolean
     */
    static CollectSamples(tex, index, total, samples)
    {
        const
            d = device,
            g = this.global,
            effect = g.effect,
            vertexBuffer = g.vertexBuffer,
            decl = g.decl;

        // `effect` is null now - the collector was removed, see `init()`. The
        // guard was already here in spirit: it tested `effectRes.IsGood()`,
        // which was never true, so this method has always returned false.
        if (!effect || !effect.effectRes || !effect.effectRes.IsGood()) return false;

        effect.parameters.BackBuffer.AttachTextureRes(tex);
        effect.parameters.OccluderIndex.SetValue([ index, total, samples ]);

        d.SetStandardStates(d.RM_ADDITIVE);
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, vertexBuffer);

        for (let pass = 0; pass < effect.GetPassCount("Main"); ++pass)
        {
            effect.ApplyPass("Main", pass);
            if (decl.SetDeclaration(d, effect.GetPassInput("Main", pass), 16)) return false;
            d.ApplyShadowState();
            d.gl.drawArrays(d.gl.TRIANGLES, 0, 255 * 6);
        }
        return true;
    }

    /**
     * Initializes class globals and scratch variables
     */
    static init()
    {
        if (EveOccluder.global) return;

        const
            d = device,
            g = EveOccluder.global = {};

        g.mat4_0 = mat4.create();
        g.vec4_0 = vec4.create();
        g.accumulator = new Tw2BatchAccumulator();

        // The sample collector's effect is GONE, deliberately.
        //
        // It asked for
        // `res:/graphics/effect/managed/space/specialfx/lensflares/collectsamples.fx`,
        // which is pre-gles2 ccpwgl code (operator, 2026-08-25). The path is
        // hardcoded HERE and appears in no `.black` in the shipped corpus - the
        // data names `lensflareoccludert.fx` and nothing else - and the file
        // exists in no profile: not effect.gles2, not effect.dx11, not
        // effect.dx12. So it has 404'd on every load for as long as the current
        // resource tree has existed.
        //
        // `init()` runs from the EveOccluder CONSTRUCTOR, so this fired the
        // moment any occluder was deserialised, whatever the flare wanted.
        //
        // Nothing downstream loses an answer: `CollectSamples` guarded on the
        // effect being good and returned false, so `occlusionIntensity` stayed
        // 1 - which is why `config.js` pins `FlareOcclusionBuffer` to white.
        // The two uses below now guard on the effect being absent instead.
        g.effect = null;

        g.vertexBuffer = null;
        g.decl = Tw2VertexDeclaration.from([
            { usage: "POSITION", usageIndex: 0, elements: 2 },
            { usage: "TEXCOORD", usageIndex: 0, elements: 2 }
        ]);
        g.decl.RebuildHash();

        const vb = new Float32Array(255 * 6 * 4);
        let index = 0;
        for (let i = 0; i < 16; ++i)
        {
            for (let j = 0; j < 16; ++j)
            {
                const
                    x = (i + Math.random()) / 16 * 2 - 1,
                    y = (j + Math.random()) / 16 * 2 - 1;

                vb[index++] = 1;
                vb[index++] = 1;
                vb[index++] = x;
                vb[index++] = y;
                vb[index++] = -1;
                vb[index++] = 1;
                vb[index++] = x;
                vb[index++] = y;
                vb[index++] = 1;
                vb[index++] = -1;
                vb[index++] = x;
                vb[index++] = y;

                vb[index++] = -1;
                vb[index++] = 1;
                vb[index++] = x;
                vb[index++] = y;
                vb[index++] = 1;
                vb[index++] = -1;
                vb[index++] = x;
                vb[index++] = y;
                vb[index++] = -1;
                vb[index++] = -1;
                vb[index++] = x;
                vb[index++] = y;
            }
        }

        g.vertexBuffer = d.gl.createBuffer();
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, g.vertexBuffer);
        d.gl.bufferData(d.gl.ARRAY_BUFFER, vb, d.gl.STATIC_DRAW);
        d.gl.bindBuffer(d.gl.ARRAY_BUFFER, null);
    }


    /**
     * Global and scratch variables
     * @type {*}
     */
    static global = null;

}
