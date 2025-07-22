import { meta } from "utils";
import { mat4, quat, vec2, vec3, vec4 } from "math";
import { EveChild } from "eve/child";
import { device, resMan } from "global/tw2";
import { Tw2ForwardingRenderBatch, Tw2PerObjectData, Tw2VertexDeclaration } from "core";


@meta.notImplemented
@meta.type("EveChildQuad")
export class EveChildQuad extends EveChild
{

    @meta.boolean
    display = true;

    @meta.string
    name = "";

    @meta.float
    brightness = 0;

    @meta.color
    color = vec4.create();

    @meta.struct()
    effect = null;

    @meta.matrix4
    localTransform = mat4.create();

    @meta.float
    minScreenSize = 0;

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.vector3
    translation = vec3.create();

    @meta.boolean
    useSRT = true;

    _decl = Tw2VertexDeclaration.from(EveChildQuad.vertexDeclarations);
    _perObjectData = Tw2PerObjectData.from(EveChildQuad.perObjectData);
    _vertices = null;
    _parentTransform = mat4.create();

    /**
     * Initializes the object
     */
    Initialize()
    {
        this._dirty = true;
    }

    /**
     * Checks if the quad is good
     * @return {Boolean}
     */
    IsGood()
    {
        return !!(
            this.effect &&
            this.effect.IsGood() &&
            this._vertices
        );
    }

    /**
     * Keeps the quad alive
     */
    KeepAlive()
    {
        if (this.effect) this.effect.KeepAlive();
    }

    /**
     * Unloads the gl buffers
     */
    Unload()
    {
        if (this._vertices)
        {
            device.gl.deleteBuffer(this._vertices);
            this._vertices = null;
        }
    }

    /**
     * Fires on value changes
     * @param {Object} [opt]
     */
    OnValueChanged(opt)
    {
        this._dirty = true;
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.effect) this.effect.GetResources(out);
        return out;
    }

    /**
     * Per frame update
     * @param {Number} dt
     * @param {mat4} parentTransform
     * @param {Tw2PerObjectData} perObjectData
     */
    Update(dt, parentTransform, perObjectData)
    {
        if (!this.display) return;

        if (this._dirty)
        {
            mat4.copy(this._parentTransform, parentTransform);
        }
        else if (!mat4.equals(this._parentTransform, parentTransform))
        {
            mat4.copy(this._parentTransform, parentTransform);
            this._dirty = true;
        }

        if (this.useSRT)
        {
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
            this._dirty = true;
        }

        if (this._dirty)
        {
            this.Rebuild();
        }
    }

    /**
     * Rebuilds the quad
     */
    Rebuild()
    {
        //this.Unload();

        const { gl } = device;
        let array = new Float32Array(4 * this.constructor.vertexSize);

        for (let i = 0; i < 4; i++)
        {
            let offset = i * this.constructor.vertexSize;

            // V0
            array[offset] = i;

            // V1
            array[offset + 1] = this._parentTransform[0];
            array[offset + 2] = this._parentTransform[4];
            array[offset + 3] = this._parentTransform[8];
            array[offset + 4] = this._parentTransform[12];

            // V2
            array[offset + 5] = this._parentTransform[1];
            array[offset + 6] = this._parentTransform[5];
            array[offset + 7] = this._parentTransform[9];
            array[offset + 8] = this._parentTransform[13];

            // V3
            array[offset + 9] = this._parentTransform[2];
            array[offset + 10] = this._parentTransform[6];
            array[offset + 11] = this._parentTransform[10];
            array[offset + 12] = this._parentTransform[14];

            // V4
            array[offset + 13] = this.localTransform[0];
            array[offset + 14] = this.localTransform[4];
            array[offset + 15] = this.localTransform[8];
            array[offset + 16] = this.localTransform[12];

            // V5
            array[offset + 17] = this.localTransform[1];
            array[offset + 18] = this.localTransform[5];
            array[offset + 19] = this.localTransform[9];
            array[offset + 20] = this.localTransform[13];

            // V6
            array[offset + 21] = this.localTransform[2];
            array[offset + 22] = this.localTransform[6];
            array[offset + 23] = this.localTransform[10];
            array[offset + 24] = this.localTransform[14];

            // V7
            array[offset + 25] = this.color[0];
            array[offset + 26] = this.color[1];
            array[offset + 27] = this.color[2];
            array[offset + 28] = this.color[3];

            // V8
            array[offset + 29] = this.brightness * this.constructor.alphaMultiplier;
            array[offset + 30] = 0;
        }

        this._vertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertices);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        if (!this._indexBuffer)
        {
            this._indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.constructor.indices), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            this._indexBuffer.count = 6;
            this._rebuildIndexBuffer = false;
        }

        this._dirty = false;
    }

    _indexBuffer = null;

    static indices = [ 0,1,2,2,3,0 ];

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || !this.IsGood() || mode !== device.RM_ADDITIVE) return false;
        const batch = new Tw2ForwardingRenderBatch();
        batch.geometryProvider = this;
        batch.perObjectData = this._perObjectData;
        batch.renderMode = mode;
        accumulator.Commit(batch);
        return true;
    }

    /**
     * Renders the object
     * @param {String} technique
     * @return {boolean} true if rendered
     */
    Render(technique)
    {
        if (!this.display || !this.IsGood()) return false;

        technique = "Main";

        const
            d = device,
            gl = d.gl,
            stride = this.constructor.vertexSize * 4;

        d.SetStandardStates(d.RM_ADDITIVE);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertices);
        //
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        let passCount = this.effect.GetPassCount(technique);
        for (let pass = 0; pass < passCount; ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            if (!this._decl.SetDeclaration(d, this.effect.GetPassInput(technique, pass), stride)) return false;
            d.ApplyShadowState();
            gl.drawElements(gl.TRIANGLES, this._indexBuffer.count, gl.UNSIGNED_SHORT, 0);
            //gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        return true;
    }

    static count = 4;
    static alphaMultiplier = 1;
    static vertexSize = 30;

    static perObjectData = {
        vs: [],
        ps: []
    };

    static vertexDeclarations = [
        { usage: "TEXCOORD", usageIndex: 5, elements: 1 }, // index
        { usage: "POSITION", usageIndex: 0, elements: 4 }, // parentTransform0
        { usage: "POSITION", usageIndex: 1, elements: 4 }, // parentTransform1
        { usage: "POSITION", usageIndex: 2, elements: 4 }, // parentTransform2
        { usage: "POSITION", usageIndex: 3, elements: 4 }, // localTransform0
        { usage: "POSITION", usageIndex: 4, elements: 4 }, // localTransform1
        { usage: "POSITION", usageIndex: 5, elements: 4 }, // localTransform2
        { usage: "TEXCOORD", usageIndex: 0, elements: 4 }, // color
        { usage: "TEXCOORD", usageIndex: 1, elements: 2 }, // Data
    ]
}
