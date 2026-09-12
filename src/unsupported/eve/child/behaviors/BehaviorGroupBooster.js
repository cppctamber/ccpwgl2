// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/BehaviorGroupBooster.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/BehaviorGroupBooster.cpp
import { meta } from "utils";
import { mat4, quat, vec3, vec4, noise } from "math";
import { device } from "global";
import { Tw2Effect, Tw2ForwardingRenderBatch, Tw2VertexDeclaration } from "core";
import { EveChildQuad } from "../EveChildQuad";
import { EveChildModifierHalo } from "../modifier/EveChildModifierHalo";
import { CreateLightRecord, LIGHT_FLAG_DEFAULT } from "eve/lights/lightConversion";


/** Hydration shape for the effects, flares, and light attached to a behavior group. */
@meta.define("BehaviorGroupBooster", true)
export class BehaviorGroupBooster extends meta.Model
{

    @meta.boolean
    display = true;

    @meta.uint
    flareCount = 0;

    @meta.vector3
    boosterOffset = vec3.create();

    @meta.uint
    atlasIndex0 = 0;

    @meta.uint
    atlasIndex1 = 0;

    @meta.struct("Tw2Effect")
    boosterEffect = null;

    @meta.struct("Tw2Effect")
    haloFlareEffect = null;

    @meta.vector3
    haloFlareOffset = vec3.create();

    @meta.vector3
    haloFlareScale = vec3.fromValues(1, 1, 1);

    @meta.float
    haloFlareBrightness = 0;

    @meta.color
    haloFlareColor = vec4.fromValues(1, 1, 1, 1);

    @meta.float
    haloFlareNoiseSpeed = 1;

    @meta.float
    haloFlareNoiseAmplitude = 0.2;

    @meta.uint
    haloFlareNoiseOctaves = 1;

    @meta.struct("Tw2Effect")
    ambientFlareEffect = null;

    @meta.vector3
    ambientFlareOffset = vec3.create();

    @meta.vector3
    ambientFlareScale = vec3.fromValues(1, 1, 1);

    @meta.float
    ambientFlareBrightness = 0;

    @meta.color
    ambientFlareColor = vec4.fromValues(1, 1, 1, 1);

    @meta.float
    ambientFlareNoiseSpeed = 1;

    @meta.float
    ambientFlareNoiseAmplitude = 0.2;

    @meta.uint
    ambientFlareNoiseOctaves = 1;

    @meta.float
    lightRadius = 3.5;

    @meta.color
    lightColor = vec4.fromValues(1, 1, 1, 1);

    @meta.boolean
    displayBoosters = true;

    @meta.boolean
    displayHazeFlare = true;

    @meta.boolean
    displayAmbientFlare = true;

    _halo = { data: new Float32Array(0), count: 0, buffer: null };
    _ambient = { data: new Float32Array(0), count: 0, buffer: null };
    _gl = null;
    _indices = null;
    _boxVertices = null;
    _boxIndices = null;
    _quadDeclaration = Tw2VertexDeclaration.from(EveChildQuad.vertexDeclarations);
    _boxDeclaration = Tw2VertexDeclaration.from([
        { usage: "POSITION", usageIndex: 0, elements: 3 },
        { usage: "TEXCOORD", usageIndex: 0, elements: 2 }
    ]);
    _instanceDeclaration = Tw2VertexDeclaration.from([ 1, 2, 3 ].map(usageIndex => ({ usage: "TEXCOORD", usageIndex, elements: 4 })));
    _parent = mat4.create();
    _haloParent = mat4.create();
    _haloModifier = new EveChildModifierHalo();
    _local = mat4.create();
    _offset = vec3.create();
    _scale = vec3.create();
    _light = CreateLightRecord();

    Initialize() { this.InitializeEffects(); }

    InitializeEffects()
    {
        if (!this.boosterEffect) this.boosterEffect = Tw2Effect.from({
            effectFilePath: "res:/graphics/effect.dx11/managed/space/booster/droneboostervolumetric.sm_hi",
            options: { BOOSTER_LOD: "BOOSTER_LOD_HIGH" },
            autoParameter: true,
            parameters: {
                NoiseSpeed0: 6, NoiseSpeed1: 6,
                NoiseAmplitudeStart0: [ -0.05, -0.05, -0.05, -0.05 ],
                NoiseAmplitudeStart1: [ -0.05, -0.05, -0.05, -0.05 ],
                NoiseAmplitudeEnd0: [ 0.1, 0.1, 0.1, 0.2 ],
                NoiseAmplitudeEnd1: [ 0.14, 0.7, 0.14, 0.14 ],
                NoiseFrequency0: [ 0.1, 0.1, 0, 0.1 ],
                Color0: [ 10, 13, 15, 0 ], Color1: [ 15, 13, 13, 0 ],
                ShapeAtlasSize: [ 256, 8, 0, 0 ], BoosterScale: [ 1, 1, 1, 1 ]
            },
            textures: {
                ShapeMap: "res:/dx9/model/booster/shape01.dds",
                GradientMap0: "res:/dx9/model/booster/gradient01.dds",
                GradientMap1: "res:/dx9/model/booster/gradient02.dds",
                NoiseMap: "res:/texture/global/noise32cube_volume.dds"
            }
        });
        for (const name of [ "haloFlareEffect", "ambientFlareEffect" ])
        {
            if (!this[name]) this[name] = Tw2Effect.from({ effectFilePath: "res:/graphics/effect/managed/space/specialfx/flarequad.fx", autoParameter: true });
        }
    }

    GetDisplay() { return this.display; }
    GetLightSize() { return this.display ? this.lightRadius : 0; }
    GetOffset() { return this.boosterOffset; }
    GetAtlasIndex0() { return this.atlasIndex0; }
    GetAtlasIndex1() { return this.atlasIndex1; }

    RebuildFlareBuffer(count)
    {
        this.flareCount = count;
        for (const stream of [ this._halo, this._ambient ])
        {
            if (stream.data.length !== count * 124) stream.data = new Float32Array(count * 124);
        }
    }

    BeginFrame() { this._halo.count = this._ambient.count = 0; }

    _Noise(kind, index)
    {
        const amplitude = this[kind + "FlareNoiseAmplitude"];
        if (!amplitude) return 1;
        const time = (device.currentTime + index * 0.01) * this[kind + "FlareNoiseSpeed"];
        return (noise.carbonPerlin1D(time, 2, 2, this[kind + "FlareNoiseOctaves"]) + 1) * 0.5 * amplitude;
    }

    /** Carbon AddFlare: independent halo and ambient LOD envelopes. */
    AddFlare(agentWorld, lod, intensity, index, radius, groupScale)
    {
        if (!this.display || !this.flareCount) return;
        if (this.haloFlareEffect && this.displayHazeFlare)
        {
            const factor = Math.max(0, (1 + lod) ** 2 * (lod - 1) ** 2);
            vec3.set(this._scale, groupScale, groupScale, groupScale);
            mat4.scale(this._parent, agentWorld, this._scale);
            vec3.scale(this._offset, this.haloFlareOffset, factor);
            mat4.translate(this._parent, this._parent, this._offset);
            mat4.rotateY(this._parent, this._parent, Math.PI);
            this._haloModifier.ApplyTransform(this._parent, this._haloParent);
            mat4.fromScaling(this._local, this.haloFlareScale);
            this._PackQuad(this._halo, this._haloParent, this._local, this.haloFlareColor,
                (0.1 + 0.9 * intensity * this.haloFlareBrightness * factor) * this._Noise("halo", index));
        }
        if (this.ambientFlareEffect && this.displayAmbientFlare)
        {
            const factor = (1 - lod) * (1 + lod) * (lod - 1) ** 2;
            vec3.scale(this._scale, this.ambientFlareScale, factor * groupScale);
            const far = (1 - factor) * radius * groupScale * 2;
            for (let i = 0; i < 3; i++) this._scale[i] += far;
            vec3.scale(this._offset, this.ambientFlareOffset, factor * groupScale);
            mat4.fromRotationTranslationScale(this._local, IDENTITY_QUAT, this._offset, this._scale);
            this._PackQuad(this._ambient, agentWorld, this._local, this.ambientFlareColor,
                (0.25 + 0.25 * intensity + 0.5 * factor * intensity) * this.ambientFlareBrightness * this._Noise("ambient", index));
        }
    }

    _PackQuad(stream, parent, local, color, brightness)
    {
        let offset = stream.count++ * 124;
        for (let vertex = 0; vertex < 4; vertex++)
        {
            stream.data[offset++] = vertex;
            for (const matrix of [ parent, local ])
            {
                for (let row = 0; row < 3; row++)
                {
                    for (let col = 0; col < 4; col++) stream.data[offset++] = matrix[col * 4 + row];
                }
            }
            stream.data.set(color, offset); offset += 4;
            stream.data[offset++] = brightness;
            stream.data[offset++] = 0;
        }
    }

    AddLight(collector, position, radiusModifier, index, parentTransform)
    {
        if (!this.display || radiusModifier <= 0) return;
        const record = this._light;
        record.owner = this;
        // Browser correction: these positions are system-local. Carbon's donor
        // ignores parentTransform here, which displaces moving-parent lights.
        vec3.transformMat4(record.position, position, parentTransform);
        vec3.scale(record.color, this.lightColor, this._Noise("ambient", index));
        record.radius = radiusModifier * this.lightRadius;
        record.flags = LIGHT_FLAG_DEFAULT;
        collector.AddLight(record);
    }

    GetResources(out = [])
    {
        for (const effect of [ this.boosterEffect, this.haloFlareEffect, this.ambientFlareEffect ]) if (effect) effect.GetResources(out);
        return out;
    }

    _PrepareBuffers()
    {
        const gl = device.gl;
        if (this._gl !== gl)
        {
            this._gl = gl;
            this._indices = this._boxVertices = this._boxIndices = null;
            this._indexCount = -1;
            this._halo.buffer = this._ambient.buffer = null;
        }
        if (!this._boxVertices)
        {
            const vertices = new Float32Array(24 * 5);
            for (let i = 0; i < 24; i++) vertices.set(BOX_POSITIONS.slice(i * 3, i * 3 + 3), i * 5);
            this._boxVertices = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this._boxVertices);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
            this._boxIndices = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._boxIndices);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, MakeIndices(6), gl.STATIC_DRAW);
        }
        if (!this._indices) this._indices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indices);
        if (this._indexCount !== this.flareCount)
        {
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, MakeIndices(this.flareCount), gl.STATIC_DRAW);
            this._indexCount = this.flareCount;
        }
        for (const stream of [ this._halo, this._ambient ])
        {
            if (!stream.buffer) stream.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, stream.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, stream.data.subarray(0, stream.count * 124), gl.DYNAMIC_DRAW);
        }
    }

    GetBatches(mode, accumulator, perObjectData, group)
    {
        if (!this.display || mode !== device.RM_ADDITIVE) return false;
        this._PrepareBuffers();
        let added = false;
        for (const [ effect, stream, enabled ] of [
            [ this.boosterEffect, null, this.displayBoosters ],
            [ this.haloFlareEffect, this._halo, this.displayHazeFlare ],
            [ this.ambientFlareEffect, this._ambient, this.displayAmbientFlare ]
        ])
        {
            if (!enabled || !effect || !effect.IsGood() || (stream && !stream.count)) continue;
            const batch = new Tw2ForwardingRenderBatch();
            batch.effect = effect;
            batch.geometryProvider = this;
            batch.perObjectData = perObjectData;
            batch.renderMode = mode;
            batch.stream = stream;
            batch.group = group;
            accumulator.Commit(batch);
            added = true;
        }
        return added;
    }

    Render(batch, technique)
    {
        const gl = device.gl, effect = batch.effect, stream = batch.stream;
        device.SetStandardStates(device.RM_ADDITIVE);
        for (let pass = 0; pass < effect.GetPassCount(technique); pass++)
        {
            effect.ApplyPass(technique, pass);
            const input = effect.GetPassInput(technique, pass);
            let reset;
            if (stream)
            {
                gl.bindBuffer(gl.ARRAY_BUFFER, stream.buffer);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indices);
                if (!this._quadDeclaration.SetDeclaration(device, input, 124)) return false;
            }
            else
            {
                gl.bindBuffer(gl.ARRAY_BUFFER, this._boxVertices);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._boxIndices);
                this._boxDeclaration.SetPartialDeclaration(device, input, 20, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, batch.group._system._boosterBuffer);
                for (let i = 0; i < 3; i++) this._instanceDeclaration.elements[i].offset = batch.group._instanceStart * 48 + i * 16;
                reset = this._instanceDeclaration.SetPartialDeclaration(device, input, 48, 0, 1);
            }
            device.ApplyShadowState();
            if (stream) gl.drawElements(gl.TRIANGLES, stream.count * 6, gl.UNSIGNED_INT, 0);
            else gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_INT, 0, batch.group.GetSize());
            this._instanceDeclaration.ResetInstanceDivisors(device, reset);
        }
        return true;
    }

    OnDestroy() { this.Unload(); }

    Unload()
    {
        if (this._gl)
        {
            for (const buffer of [ this._indices, this._boxVertices, this._boxIndices, this._halo.buffer, this._ambient.buffer ]) if (buffer) this._gl.deleteBuffer(buffer);
        }
        this._gl = null;
        this._indexCount = -1;
    }
}

const IDENTITY_QUAT = quat.create();
const BOX_POSITIONS = [
    -1,-1,0, 1,-1,0, 1,1,0, -1,1,0,
    -1,-1,-1, -1,1,-1, 1,1,-1, 1,-1,-1,
    -1,-1,0, -1,1,0, -1,1,-1, -1,-1,-1,
    1,-1,0, 1,-1,-1, 1,1,-1, 1,1,0,
    -1,-1,0, -1,-1,-1, 1,-1,-1, 1,-1,0,
    -1,1,0, 1,1,0, 1,1,-1, -1,1,-1
];

function MakeIndices(count)
{
    const data = new Uint32Array(count * 6);
    for (let i = 0; i < count; i++) for (let j = 0; j < 6; j++) data[i * 6 + j] = i * 4 + EveChildQuad.indices[j];
    return data;
}
