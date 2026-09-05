// Carbon Lights/Tr2PointLight.h/.cpp and Tr2PointLight_Blue.cpp.
// Authored fields remain flat; Tr2Light owns shared emitter behaviour.
import { meta } from "utils";
import { Tr2Light } from "../../eve/lights/Tr2Light";
import { vec3, vec4, quat } from "math";
import { device } from "global";
import { Tw2RenderBatch } from "core/batch";
import { PerLightShadowSetting, LIGHT_FLAG_DEFAULT } from "./Tw2CarbonLightMath";

export class EvePointLightBatch extends Tw2RenderBatch
{

    light = null;

    Commit(technique)
    {
        return this.light.Render(technique);
    }

    HasTechnique(technique)
    {
        return this.light && this.light._effect && this.light._effect.HasTechnique(technique);
    }

}

@meta.define("Tr2PointLight", true)
export class Tr2PointLight extends Tr2Light
{
    type = 1;

    @meta.string
    name = "";

    @meta.int32
    boneIndex = -1;

    @meta.float
    brightness = 1;

    @meta.int32
    castsShadows = PerLightShadowSetting.DISABLED;

    @meta.color
    color = vec4.fromValues(0, 0, 0, 1);

    @meta.ushort
    flags = LIGHT_FLAG_DEFAULT;

    @meta.float
    innerRadius = 0;

    @meta.boolean
    isVolumetric = false;

    @meta.path
    lightProfilePath = "";

    @meta.float
    noiseAmplitude = 0;

    @meta.float
    noiseFrequency = 1;

    @meta.uint
    noiseOctaves = 1;

    @meta.vector3
    position = vec3.create();

    @meta.float
    radius = 0;

    @meta.quaternion
    rotation = quat.create();

    _effect = null;

    _indexBuffer = null;

    Unload(skipEvent)
    {
        if (this._indexBuffer)
        {
            device.gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        super.Unload(skipEvent);
    }

    Rebuild()
    {

    }

    GetBatches(mode, accumulator, perObjectData)
    {
        if (this.display && mode === device.RM_ADDITIVE &&  this._indexBuffer && this._indexBuffer.count)
        {
            const batch = new EvePointLightBatch();
            batch.renderMode = device.RM_ADDITIVE;
            batch.light = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
            return true;
        }

        return false;
    }

    Render(technique)
    {
        if (!this._effect || !this._effect.IsGood() || !this.buffer) return false;

        const d = device,
            gl = d.gl,
            stride = 0 * 4;

        d.SetStandardStates(d.RM_ADDITIVE);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        for (let pass = 0; pass < this._effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            d.ApplyShadowState();
            d.gl.drawElements(gl.TRIANGLES, this.buffer["count"], gl.UNSIGNED_SHORT, 0);
        }
        return false;
    }

    static vertexDeclarations = [
        { usage: "POSITION", usageIndex: 0, elements: 3 },
        { usage: "POSITION", usageIndex: 1, elements: 3 },
        { usage: "POSITION", usageIndex: 2, elements: 3 },
        { usage: "POSITION", usageIndex: 3, elements: 3 },
        { usage: "POSITION", usageIndex: 4, elements: 3 },
        { usage: "POSITION", usageIndex: 5, elements: 3 },
        { usage: "TEXCOORD", usageIndex: 6, elements: 1 },
        { usage: "TEXCOORD", usageIndex: 7, elements: 1 },
        { usage: "TEXCOORD", usageIndex: 8, elements: 1 },
    ]
}
