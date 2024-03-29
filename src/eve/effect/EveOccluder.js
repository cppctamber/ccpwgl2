import { meta } from "utils";
import { device, tw2 } from "global";
import { vec4, mat4 } from "math";
import { Tw2Effect, Tw2VertexDeclaration, Tw2BatchAccumulator } from "core";


@meta.type("EveOccluder")
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

        g.effect.parameters.OccluderPosition.SetValue(center);
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

        if (!effect.effectRes || !effect.effectRes.IsGood()) return false;

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

        g.effect = Tw2Effect.from({
            name: "Occluder sampler",
            effectFilePath: "cdn:/graphics/effect/managed/space/specialfx/lensflares/collectsamples.fx",
            parameters: {
                "OccluderPosition": [ 1, 1, 1, 1 ],
                "OccluderIndex": [ 1, 1, 1 ],
                "BackBuffer": ""
            }
        });

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
