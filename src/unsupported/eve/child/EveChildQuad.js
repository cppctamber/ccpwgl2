import { meta } from "utils";
import { mat4, quat, vec3, vec4 } from "math";
import { EveChild } from "eve/child";
import { device } from "global/tw2";
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

    @meta.float32Array
    //This might not be correct
    viewRotation = mat4.create();

    _worldTransform = mat4.create();
    _worldTransformLast = mat4.create();

    _vertexSize = 35;
    _decl = Tw2VertexDeclaration.from(EveChildQuad.vertexDeclarations);
    _perObjectData = Tw2PerObjectData.from(EveChildQuad.perObjectData);
    _vertices = null;
    //_indices = null;

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
        return !!(this.effect && this.effect.IsGood() && this._vertices);
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

    _temp = mat4.create();

    /**
     * Per frame update
     * @param {Number} dt
     * @param {mat4} parentTransform
     * @param {Tw2PerObjectData} perObjectData
     */
    Update(dt, parentTransform, perObjectData)
    {
        if (!this.display) return;
        
        mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);

        this._parentTransform = parentTransform;

        // Not used
        mat4.copy(this._worldTransformLast, this._worldTransform);
        mat4.transpose(this._perObjectData.vs.Get("WorldMatLast"), this._worldTransform);  // Not used

        mat4.multiply(this._worldTransform, parentTransform, this.localTransform);
        mat4.transpose(this._perObjectData.vs.Get("WorldMat"), this._worldTransform);

        // Figure out what this is
        const m = mat4.copy(this._temp, this._sourceMat2);
        if (this._sourceMat2Transpose) mat4.transpose(m, m);
        mat4.copy(this._perObjectData.vs.Get("UnknownMat"), m);

        // Temp make brightness high
        this.brightness = 10;

        this._perObjectData.vs.data[48] = this._sourceFloat;

        if (this._dirty) this.Rebuild();
    }

    _sourceMat0 = mat4.create();
    _sourceMat0Transpose = true;

    _sourceMat1 = this.viewRotation;
    _sourceMat1Transpose = true;
    
    _sourceMat2 = this.localTransform;
    _sourceMat2Transpose = true;

    _sourceFloat = 10;

    _setVertexValues = this._setVertexValues2;

    _setVertexValues1(data, index, vertexSize)
    {
        let offset = index * vertexSize;

        // Unknown matrix
        const m = mat4.copy(this._temp, this._sourceMat0);
        if (this._sourceMat0Transpose) mat4.transpose(m, m);

        // V0, TEX0 vec4
        data[offset] = m[0];
        data[offset + 1] = m[4];
        data[offset + 2] = m[8];
        data[offset + 3] = m[12];

        // V1, TEX1 vec4
        data[offset + 4] = m[1];
        data[offset + 5] = m[5];
        data[offset + 6] = m[9];
        data[offset + 7] = m[13];

        // V2, TEX2 vec4
        data[offset + 8] = m[2];
        data[offset + 9] = m[6];
        data[offset + 10] = m[10];
        data[offset + 11] = m[14];

        // Unknown matrix
        mat4.copy(m, this._sourceMat1);
        if (this._sourceMat1Transpose) mat4.transpose(m, m);

        // V3, TEX3 vec4
        data[offset + 12] = m[0];
        data[offset + 13] = m[4];
        data[offset + 14] = m[8];
        data[offset + 15] = m[12];

        // V4 TEX4 vec4
        data[offset + 16] = m[1];
        data[offset + 17] = m[5];
        data[offset + 18] = m[9];
        data[offset + 19] = m[13];

        // V5 TEX5 vec4
        data[offset + 20] = m[2];
        data[offset + 21] = m[6];
        data[offset + 22] = m[10];
        data[offset + 23] = m[14];

        // V6 TEX 6 vec4                        - Maybe not?
        data[offset + 24] = this.scaling[0];
        data[offset + 25] = this.scaling[1];
        data[offset + 26] = this.scaling[2];
        data[offset + 27] = this.brightness;

        // V7 COLOR 0
        data[offset + 28] = this.color[0];
        data[offset + 29] = this.color[1];
        data[offset + 30] = this.color[2];
        data[offset + 31] = this.color[3];

        // V8 TEX7 - BoxCornerOffset: the corner we are rendering from??
        data[offset + 32] = this.constructor.thing[index];
    }

    _setVertexValues2(data, index, vertexSize)
    {
        let offset = index * vertexSize;

        // Unknown matrix
        const m = mat4.copy(this._temp, this._sourceMat0);
        if (this._sourceMat0Transpose) mat4.transpose(m, m);

        // V0
        data[offset] = EveChildQuad.thing[index];
        data[offset + 1] = 0;
        data[offset + 2] = 0;
        data[offset + 3] = 0;

        // V1
        data[offset + 4] = m[0];
        data[offset + 5] = m[4];
        data[offset + 6] = m[8];
        data[offset + 7] = m[12];

        // V2
        data[offset + 8] = m[1];
        data[offset + 9] = m[5];
        data[offset + 10] = m[9];
        data[offset + 11] = m[13];

        // V3
        data[offset + 12] = m[2];
        data[offset + 13] = m[6];
        data[offset + 14] = m[10];
        data[offset + 15] = m[14];

        // Unknown matrix
        mat4.copy(m, this._sourceMat1);
        if (this._sourceMat1Transpose) mat4.transpose(m, m);

        // V4
        data[offset + 16] = m[0];
        data[offset + 17] = m[4];
        data[offset + 18] = m[8];
        data[offset + 19] = m[12];

        // V5
        data[offset + 20] = m[1];
        data[offset + 21] = m[5];
        data[offset + 22] = m[9];
        data[offset + 23] = m[13];

        // V6
        data[offset + 24] = m[2];
        data[offset + 25] = m[6];
        data[offset + 26] = m[10];
        data[offset + 27] = m[14];

        // V7
        data[offset + 28] = this.color[0];
        data[offset + 29] = this.color[1];
        data[offset + 30] = this.color[2];
        data[offset + 31] = this.color[3];

        // V8
        data[offset + 32] = this.brightness;
    }

    Rebuild()
    {
        this.Unload();

        const { gl } = device;

        let vertexSize = this._vertexSize;
        let count = 6;
        let array = new Float32Array(count * vertexSize);

        for (let i = 0; i < count; i++)
        {
            this._setVertexValues(array, i, vertexSize);
        }

        this._vertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertices);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this._vertices.count = count;

        this._dirty = false;
    }

    static thing = [
        0.5,
        1.5,
        2.5,
        3.5,
        4.5,
        5.5
    ];

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || !this.IsGood() || mode !== device.RM_ADDITIVE || !this._vertices.count) return false;
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

        const
            d = device,
            gl = d.gl,
            stride = this._vertexSize * 4;

        d.SetStandardStates(d.RM_ADDITIVE);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertices);
        for (let pass = 0; pass < this.effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            if (!this._decl.SetDeclaration(d, this.effect.GetPassInput(technique, pass), stride)) return false;
            d.ApplyShadowState();
            gl.drawArrays(gl.TRIANGLES, 0, this._vertices.count);
        }

        return true;
    }

    static perObjectData = {
        vs: [
            [ "WorldMat", 16 ],
            [ "WorldMatLast", 16 ],
            [ "UnknownMat", 16 ],
            [ "WorldBrightness", 1 ]
        ]
    };

    static vertices0 = [
        { usage: "TEXCOORD", usageIndex: 0, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 1, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 2, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 3, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 4, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 5, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 6, elements: 4 },
        { usage: "COLOR",    usageIndex: 0, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 7, elements: 1 }
    ];

    static vertexDeclarations = [
        { usage: "TEXCOORD", usageIndex: 5, elements: 4 }, // SCALE ?
        { usage: "POSITION", usageIndex: 0, elements: 4 }, // M0 ROW A
        { usage: "POSITION", usageIndex: 1, elements: 4 }, // M0 ROW B
        { usage: "POSITION", usageIndex: 2, elements: 4 }, // M0 ROW C
        { usage: "POSITION", usageIndex: 3, elements: 4 }, // M1 ROW A
        { usage: "POSITION", usageIndex: 4, elements: 4 }, // M1 ROW B
        { usage: "POSITION", usageIndex: 5, elements: 4 }, // M1 ROW C
        { usage: "TEXCOORD", usageIndex: 0, elements: 4 }, // COLOR ?
        { usage: "TEXCOORD", usageIndex: 1, elements: 1 }, // BRIGHTNESS ?
    ]
}
