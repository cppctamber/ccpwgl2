import { meta } from "utils";
import { mat4, vec3, vec4, quat } from "math";
import { device } from "global";
import { Tw2RenderBatch } from "core/batch";


export class EvePointLightBatch extends Tw2RenderBatch
{

    light = null;

    /**
     * Commits the light for rendering
     * @param {String} [technique] - technique name
     * @returns {Boolean} true if rendered
     */
    Commit(technique)
    {
        return this.light.Render(technique);
    }

    /**
     * Checks if the render batch supports a technique
     * @param {String} technique
     * @returns {boolean}
     */
    HasTechnique(technique)
    {
        return this.light && this.light._effect && this.light._effect.HasTechnique(technique);
    }

}


@meta.notImplemented
@meta.type("Tr2PointLight")
export class Tr2PointLight extends meta.Model
{

    @meta.string
    name = "";

    @meta.uint
    boneIndex = -1;

    @meta.float
    brightness = 0;

    @meta.color
    color = vec4.create();

    @meta.float
    innerRadius = 0;

    @meta.path
    lightProfilePath = "";

    @meta.string
    flags = "";

    @meta.float
    noiseAmplitude = 0;

    @meta.float
    noiseFrequency = 0;

    @meta.float
    noiseOctaves = 0;

    @meta.vector3
    position = vec3.create();

    @meta.float
    radius = 0;

    @meta.quaternion
    rotation = quat.create();

    /**
     * Light effect
     * @type {Tw2Effect}
     * @private
     */
    _effect = null;

    _worldPosition = vec3.create();
    _indexBuffer = null;

    /**
     * Unloads the light's buffers
     * @param {Boolean} skipEvent
     */
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

    Update(dt, parentMatrix)
    {
        vec3.transformMat4(this._worldPosition, this.position, parentMatrix);
        if (this._dirty) this.Rebuild();
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
