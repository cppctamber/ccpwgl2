import { meta } from "utils";
import { quat, vec3, vec4, mat4 } from "math";
import { Tw2Effect, Tw2RenderBatch, Tw2VertexDeclaration } from "core";
import { EveObjectSet, EveObjectSetItem } from "eve";
import { device } from "global/tw2";


@meta.notImplemented
export class EveHazeSetBatch extends Tw2RenderBatch
{

    hazeSet = null;

    /**
     * Commits the haze set for rendering
     * @param {String} technique - technique name
     */
    Commit(technique)
    {
        this.hazeSet.Render(technique);
    }

}


@meta.notImplemented
@meta.type("EveHazeSetItem")
export class EveHazeSetItem extends EveObjectSetItem
{

    @meta.boolean
    boosterGainInfluence = false;

    @meta.uint
    color = vec4.fromValues(0, 0, 0, 1);

    @meta.float
    hazeBrightness = 0;

    @meta.float
    hazeFalloff = 0;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.float
    sourceBrightness = 0;

    @meta.float
    sourceSize = 0;

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this._transform, this.rotation, this.position, this.scaling);
        this._dirty = true;
    }

}


@meta.notImplemented
@meta.type("EveHazeSet")
export class EveHazeSet extends EveObjectSet
{

    effect = Tw2Effect.from({
        effectFilePath: "cdn:/graphics/effect.gles2/managed/space/spaceobject/fx/hazespherical.fx"
    });

    _decl = Tw2VertexDeclaration.from(EveHazeSet.vertexDeclarations);
    _vertexBuffer = null;
    _indexBuffer = null;
    _indexOrder = [ 0, 2, 1, 0, 3, 2 ];

    /**
     * Alias for items
     * @return {[]}
     */
    get hazeItems()
    {
        return this.items;
    }

    /**
     * Alias for items
     * @param {[]} arr
     */
    set hazeItems(arr)
    {
        this.items = arr;
    }


    /**
     * Gets the haze set's resources
     * @param {Array} [out=[]]
     * @return {Array}
     */
    GetResources(out = [])
    {
        return this.effect ? this.effect.GetResources(out) : out;
    }

    /**
     * Unloads the haze set
     * @param {Boolean} skipEvent
     */
    Unload(skipEvent)
    {
        if (this._vertexBuffer)
        {
            device.gl.deleteBuffer(this._vertexBuffer);
            this._vertexBuffer = null;
        }

        if (this._indexBuffer)
        {
            device.gl.deleteBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        super.Unload(skipEvent);
    }


    /**
     * Sets the order of the index buffer
     * @param {Number} a
     * @param {Number} b
     * @param {Number} c
     * @param {Number} d
     * @param {Number} e
     * @param {Number} f
     */
    SetIndexOrder(a, b,  c, d, e, f)
    {
        this._indexOrder[0] = a;
        this._indexOrder[1] = b;
        this._indexOrder[2] = c;
        this._indexOrder[3] = d;
        this._indexOrder[4] = e;
        this._indexOrder[5] = f;
        this._dirty = true;
    }

    Rebuild()
    {
        this.Unload(true);
        this.RebuildItems();
        this._dirty = false;

        const itemCount = this._visibleItems.length;
        if (!itemCount)
        {
            super.Rebuild();
            return;
        }

        const { mat4_0, vec3_0 } = EveObjectSet.global;

        const 
            vertexSize = 35,
            array = new Float32Array(itemCount * vertexSize * 4);

        for (let i = 0; i < itemCount; i++)
        {
            const
                item = this._visibleItems[i],
                offset = i * 4 * vertexSize;

            mat4.fromRotationTranslationScale(mat4_0, item.rotation, item.position, item.scaling);

            for (let j = 0; j < 4; j++)
            {
                let vo = offset + j * vertexSize;

                // Transform 1
                // attr0
                array[vo + 0] = mat4_0[0];
                array[vo + 1] = mat4_0[4];
                array[vo + 2] = mat4_0[8];
                array[vo + 3] = mat4_0[12];
                // attr1
                array[vo + 4] = mat4_0[1];
                array[vo + 5] = mat4_0[5];
                array[vo + 6] = mat4_0[9];
                array[vo + 7] = mat4_0[13];
                // attr2
                array[vo + 8] = mat4_0[2];
                array[vo + 9] = mat4_0[6];
                array[vo + 10] = mat4_0[10];
                array[vo + 11] = mat4_0[14];

                // Transform 2
                vec3.multiply(vec3_0, item.scaling, [ item.sourceSize, item.sourceSize, item.sourceSize ]);
                mat4.fromRotationTranslationScale(mat4_0, item.rotation, item.position, vec3_0);

                //attr3
                array[vo + 12] = mat4_0[0]; // Unknown mat4
                array[vo + 13] = mat4_0[4]; // Unknown mat4
                array[vo + 14] = mat4_0[8]; // Unknown mat4
                array[vo + 15] = mat4_0[12]; // Unknown mat4
                //attr4
                array[vo + 16] = mat4_0[1]; // unknown mat4
                array[vo + 17] = mat4_0[5]; // unknown mat4
                array[vo + 18] = mat4_0[9]; // unknown mat4
                array[vo + 19] = mat4_0[13]; // unknown mat4
                //attr5
                array[vo + 20] = mat4_0[2]; // unknown mat4
                array[vo + 21] = mat4_0[6]; // unknown mat4
                array[vo + 22] = mat4_0[10]; // unknown mat4
                array[vo + 23] = mat4_0[14]; // unknown mat4
                //attr6
                array[vo + 24] = item.hazeBrightness;  // Unknown
                array[vo + 25] = item.hazeFalloff;     // Unknown
                array[vo + 26] = item.sourceSize;      // Unknown
                array[vo + 27] = item.sourceBrightness; // Unknown Multiplied by unknown0.x  ?
                //attr7
                array[vo + 28] = item.color[0];
                array[vo + 29] = item.color[1];
                array[vo + 30] = item.color[2];
                array[vo + 31] = item.color[3];
                //attr8
                array[vo + 32] = 1; // changes constant vertex position?
                array[vo + 33] = 1; // -1;  // Unknown
                array[vo + 34] = 1; //item.boosterGainInfluence ? 255 : 0; // Unknown
            }
        }
        
        const { gl } = device;
        this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        const
            order = this._indexOrder,
            indexes = new Uint16Array(itemCount * 6);

        for (let i = 0; i < itemCount; ++i)
        {
            const
                offset = i * 6,
                vtxOffset = i * 4;

            indexes[offset] = vtxOffset + order[0];
            indexes[offset + 1] = vtxOffset + order[1];
            indexes[offset + 2] = vtxOffset + order[2];
            indexes[offset + 3] = vtxOffset + order[3];
            indexes[offset + 4] = vtxOffset + order[4];
            indexes[offset + 5] = vtxOffset + order[5];
        }

        this._indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexes, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        this._indexBuffer.count = itemCount * 6;

        super.Rebuild();
    }

    /**
     * Gets the haze set's render batch
     * @param {Number} mode
     * @param {Tw2BatchAccumulator}  accumulator
     * @param {Tw2PerObjectData}  perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (this.display && mode === device.RM_ADDITIVE && this._vertexBuffer && this._indexBuffer)
        {
            const batch = new EveHazeSetBatch();
            batch.renderMode = device.RM_ADDITIVE;
            batch.hazeSet = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
        }
    }

    /**
     * Renders the haze set
     * @param technique
     * @return {boolean}
     */
    Render(technique)
    {
        if (!this.effect || !this.effect.IsGood() || !this._vertexBuffer || !this._indexBuffer)
        {
            return false;
        }

        const { gl } = device;

        device.SetStandardStates(device.RM_ADDITIVE);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

        for (let pass = 0; pass < this.effect.GetPassCount(technique); ++pass)
        {
            this.effect.ApplyPass(technique, pass);
            if (!this._decl.SetDeclaration(device, this.effect.GetPassInput(technique, pass), 140)) return false;
            device.ApplyShadowState();
            gl.drawElements(gl.TRIANGLES, this._indexBuffer.count, gl.UNSIGNED_SHORT, 0);
        }
        return true;
    }

    /**
     * Haze set item constructor
     * @type {EveHazeSetItem}
     */
    static Item = EveHazeSetItem;

    /**
     * Vertex declaration
     * @type {{}}
     */
    static vertexDeclarations = [
        { usage: "TEXCOORD", usageIndex: 0, elements: 4, attr: "attr0" },
        { usage: "TEXCOORD", usageIndex: 1, elements: 4, attr: "attr1" },
        { usage: "TEXCOORD", usageIndex: 2, elements: 4, attr: "attr2" },
        { usage: "TEXCOORD", usageIndex: 3, elements: 4, attr: "attr3" },
        { usage: "TEXCOORD", usageIndex: 4, elements: 4, attr: "attr4" },
        { usage: "TEXCOORD", usageIndex: 5, elements: 4, attr: "attr5" },
        { usage: "TEXCOORD", usageIndex: 6, elements: 4, attr: "attr6" },
        { usage: "COLOR", usageIndex: 0, elements: 4, attr: "attr7" },
        { usage: "TEXCOORD", usageIndex: 7, elements: 3, attr: "attr8" },
    ];

}
