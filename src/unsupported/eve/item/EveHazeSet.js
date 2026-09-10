import { meta } from "utils";
import { box3, quat, vec3, vec4, mat4 } from "math";
import { Tw2Effect, Tw2RenderBatch, Tw2VertexDeclaration } from "core";
import { EveObjectSet, EveObjectSetItem } from "eve";
import { device } from "global/tw2";

// Two, where EveObjectSet.global carries one: a haze vertex needs the item
// transform AND its inverse at the same time.
const HAZE_TRANSFORM = mat4.create();
const HAZE_INVERSE = mat4.create();


export class EveHazeSetBatch extends Tw2RenderBatch
{

    hazeSet = null;

    /**
     * Commits the haze set for rendering
     * @param {String} [technique] - technique name
     * @returns {Boolean} true if rendered
     */
    Commit(technique)
    {
        return this.hazeSet.Render(technique);
    }

    /**
     * Checks if the render batch supports a technique
     * @param {String} technique
     * @returns {boolean}
     */
    HasTechnique(technique)
    {
        return this.hazeSet && this.hazeSet.effect && this.hazeSet.effect.HasTechnique(technique);
    }

}


@meta.define("EveHazeSetItem", true)
export class EveHazeSetItem extends EveObjectSetItem
{

    @meta.boolean
    display = true;

    @meta.boolean
    boosterGainInfluence = false;

    @meta.color
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

    @meta.int32
    boneIndex = -1;

    /**
     * The item's own transform, rebuilt whenever its srt changes.
     *
     * Was USED by OnValueChanged and never declared, so the first value change
     * handed `mat4.fromRotationTranslationScale` an undefined output. Nothing
     * had hit it because the class is marked notImplemented and never runs.
     * @type {mat4}
     */
    _transform = mat4.create();

    /** @type {?Tw2Bone} */
    _bone = null;

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this._transform, this.rotation, this.position, this.scaling);
        this._dirty = true;
    }

    /**
     * Fires when rebuilt by the parent, and is where the bone is resolved.
     *
     * Carbon draws skinned haze with a skinned shader that looks the bone up
     * per vertex. This bakes the bone into the item transform at rebuild
     * instead, which is what every other set here does (see
     * EveSpotlightSetItem) and what keeps one effect for both cases. The cost
     * is the same as those: the set has to be rebuilt for the haze to follow
     * an animating bone.
     *
     * @param {EveHazeSet} parent
     */
    OnRebuiltByParent(parent)
    {
        this._parent = parent;
        this._bone = parent ? parent.GetBone(this.boneIndex) : null;
        this._dirty = false;
    }

    /**
     * Gets the item transform, with its bone applied.
     * @param {mat4} m
     * @returns {mat4} m
     */
    GetTransform(m)
    {
        mat4.copy(m, this._transform);
        if (this._bone) mat4.multiply(m, this._bone.offsetTransform, m);
        return m;
    }

    /**
     * Gets the item's bounding box.
     *
     * A box rather than a sphere: haze is placed with a full srt and is not
     * camera-facing, so rotating it covers different space - and a sphere big
     * enough to hold it in any orientation is mostly empty, which reads as
     * haze you can select from well outside it. Same reasoning as spotlights.
     *
     * @param {box3} box
     * @returns {box3} box
     */
    GetBoundingBox(box)
    {
        box3.fromTransform(box, this._transform);
        if (this._bone) box3.transformMat4(box, box, this._bone.offsetTransform);
        return box;
    }

}


@meta.define("EveHazeSet", true)
export class EveHazeSet extends EveObjectSet
{

    @meta.boolean
    display = true;

    @meta.struct()
    effect = Tw2Effect.from({
        effectFilePath: "res:/graphics/effect/managed/space/spaceobject/fx/hazespherical.fx"
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
     * @param {Object} [opt]]
     */
    Unload(opt)
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

        super.Unload(opt);
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
    SetIndexOrder(a, b, c, d, e, f)
    {
        this._indexOrder[0] = a;
        this._indexOrder[1] = b;
        this._indexOrder[2] = c;
        this._indexOrder[3] = d;
        this._indexOrder[4] = e;
        this._indexOrder[5] = f;
        this._dirty = true;
    }

    /**
     * The six faces of a box, as corner indices.
     *
     * Carbon's own table (EveHazeSet.cpp), kept in its order. The shader reads
     * the corner index from attr8.x and fetches the corner's position out of a
     * constant buffer of eight, so these ARE the geometry - the vertex buffer
     * carries no positions at all.
     */
    static boxIndices = [
        [ 0, 1, 2, 3 ],
        [ 7, 6, 5, 4 ],
        [ 0, 4, 5, 1 ],
        [ 3, 2, 6, 7 ],
        [ 1, 5, 6, 2 ],
        [ 4, 0, 3, 7 ]
    ];

    /**
     * Rebuilds the vertex and index buffers.
     *
     * A BOX per haze, six faces of four corners - twenty four vertices, where
     * this drew four. Haze is a volume: the shader takes the eye ray into the
     * item's own space and integrates through a sphere, so the geometry it
     * rasterises has to enclose that sphere from any angle. One quad cannot,
     * and the version this replaces could not have worked at any camera
     * position - see docs/research/haze-sets.md in the organization docs for
     * the Carbon source and the shader decode that establish it.
     *
     * Every vertex carries the whole item, because there is no per-instance
     * data here: the transform, its INVERSE (which is what takes the ray into
     * item space), the packed haze data, the colour, and which corner of the
     * box this vertex is.
     */
    Rebuild(opt)
    {
        this.Unload(true);
        this.RebuildItems();
        this._dirty = false;

        const itemCount = this._visibleItems.length;
        if (!itemCount)
        {
            super.Rebuild(opt);
            return;
        }

        const
            faces = EveHazeSet.boxIndices,
            vertexSize = 35,
            perItem = 24,
            array = new Float32Array(itemCount * perItem * vertexSize);

        for (let i = 0; i < itemCount; i++)
        {
            const item = this._visibleItems[i];

            // The bone is baked here rather than looked up per vertex, so the
            // transform is the finished one.
            item.GetTransform(HAZE_TRANSFORM);
            mat4.invert(HAZE_INVERSE, HAZE_TRANSFORM);

            for (let face = 0; face < 6; face++)
            {
                for (let corner = 0; corner < 4; corner++)
                {
                    const vo = (i * perItem + face * 4 + corner) * vertexSize;

                    // The item transform, by rows - which is the column of the
                    // row-vector matrix Carbon writes here.
                    array[vo] = HAZE_TRANSFORM[0];
                    array[vo + 1] = HAZE_TRANSFORM[4];
                    array[vo + 2] = HAZE_TRANSFORM[8];
                    array[vo + 3] = HAZE_TRANSFORM[12];
                    array[vo + 4] = HAZE_TRANSFORM[1];
                    array[vo + 5] = HAZE_TRANSFORM[5];
                    array[vo + 6] = HAZE_TRANSFORM[9];
                    array[vo + 7] = HAZE_TRANSFORM[13];
                    array[vo + 8] = HAZE_TRANSFORM[2];
                    array[vo + 9] = HAZE_TRANSFORM[6];
                    array[vo + 10] = HAZE_TRANSFORM[10];
                    array[vo + 11] = HAZE_TRANSFORM[14];

                    // And its inverse. The shader runs these three through the
                    // view matrix to bring the eye ray into the haze's space.
                    array[vo + 12] = HAZE_INVERSE[0];
                    array[vo + 13] = HAZE_INVERSE[4];
                    array[vo + 14] = HAZE_INVERSE[8];
                    array[vo + 15] = HAZE_INVERSE[12];
                    array[vo + 16] = HAZE_INVERSE[1];
                    array[vo + 17] = HAZE_INVERSE[5];
                    array[vo + 18] = HAZE_INVERSE[9];
                    array[vo + 19] = HAZE_INVERSE[13];
                    array[vo + 20] = HAZE_INVERSE[2];
                    array[vo + 21] = HAZE_INVERSE[6];
                    array[vo + 22] = HAZE_INVERSE[10];
                    array[vo + 23] = HAZE_INVERSE[14];

                    // hazeData. Brightness is NOT in here - it is folded into
                    // the colour when the set is built, the way Carbon does it -
                    // and the fourth slot is the booster gain influence, which
                    // the shader multiplies the colour by.
                    array[vo + 24] = item.hazeFalloff;
                    array[vo + 25] = item.sourceSize;
                    array[vo + 26] = item.sourceBrightness;
                    array[vo + 27] = item.boosterGainInfluence ? 1 : 0;

                    array[vo + 28] = item.color[0];
                    array[vo + 29] = item.color[1];
                    array[vo + 30] = item.color[2];
                    array[vo + 31] = item.color[3];

                    // Which corner, which bone, and one spare. The corner is
                    // the whole of the geometry.
                    array[vo + 32] = faces[face][corner];
                    array[vo + 33] = item.boneIndex;
                    array[vo + 34] = 0;
                }
            }
        }

        const { gl } = device;
        this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // Six indices a face, six faces an item.
        const
            order = this._indexOrder,
            quads = itemCount * 6,
            indexes = new Uint16Array(quads * 6);

        for (let quad = 0; quad < quads; quad++)
        {
            const
                offset = quad * 6,
                vtxOffset = quad * 4;

            for (let n = 0; n < 6; n++) indexes[offset + n] = vtxOffset + order[n];
        }

        this._indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexes, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        this._indexBuffer.count = quads * 6;

        super.Rebuild(opt);
    }

    /**
     * Gets the haze set's render batch
     * @param {Number} mode
     * @param {Tw2BatchAccumulator}  accumulator
     * @param {Tw2PerObjectData}  perObjectData
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        perObjectData = perObjectData || accumulator.GetCurrentPerObjectData?.();
        if (this.display && mode === device.RM_ADDITIVE && this._vertexBuffer && this._indexBuffer)
        {
            const batch = new EveHazeSetBatch();
            batch.renderMode = device.RM_ADDITIVE;
            batch.hazeSet = this;
            batch.perObjectData = perObjectData;
            accumulator.Commit(batch);
            return true;
        }
        return false;
    }

    /**
     * Renders the haze set
     * @param technique
     * @return {boolean}
     */
    Render(technique)
    {
        if (!this.display || !this.effect || !this.effect.IsGood() || !this._vertexBuffer || !this._indexBuffer)
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
