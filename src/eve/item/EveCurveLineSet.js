import { device } from "global";
import { meta } from "utils";
import { vec3, vec4, quat, mat4 } from "math";
import { Tw2Effect, Tw2PerObjectData, Tw2VertexDeclaration, Tw2ForwardingRenderBatch } from "core";
import { EveObjectSet, EveObjectSetItem } from "./EveObjectSet";


const LineType = {
    INVALID: 0,
    STRAIGHT: 1,
    SPHERED: 2,
    CURVED: 3
};


@meta.type("EveCurveLineSetItem")
export class EveCurveLineSetItem extends EveObjectSetItem
{

    @meta.float
    animationSpeed = 0;

    @meta.float
    animationScale = 1;

    @meta.color
    color1 = vec4.fromValues(1, 1, 1, 1);

    @meta.color
    color2 = vec4.fromValues(1, 1, 1, 1);

    @meta.vector3
    intermediatePosition = vec3.create();

    @meta.color
    multiColor = vec4.fromValues(0, 0, 0, 1);

    @meta.float
    multiColorBorder = -1;

    @meta.uint
    numOfSegments = 1;

    @meta.color
    overlayColor = vec4.fromValues(0, 0, 0, 1);

    @meta.vector3
    position1 = vec3.create();

    @meta.vector3
    position2 = vec3.create();

    @meta.float
    width = 1;

    @meta.enums(LineType)
    @meta.isPrivate
    type = LineType.INVALID;


    /**
     * Changes the lines position from a ray3
     * @param {vec3} origin
     * @param {vec3} direction
     * @param {Number} [length=EveCurveLineSetItem.DEFAULT_RAY_LENGTH]
     */
    ChangePositionFromRay(origin, direction, length = EveCurveLineSetItem.DEFAULT_RAY_LENGTH)
    {
        vec3.copy(this.position1, origin);
        vec3.scaleAndAdd(this.position2, origin, direction, length);
        this.UpdateValues();
    }

    /**
     * Changes the line's colors
     * @param {vec3} startColor
     * @param {vec3} endColor
     */
    ChangeColor(startColor, endColor)
    {
        vec3.copy(this.color1, startColor);
        vec3.copy(this.color2, endColor);
        this.UpdateValues();
    }

    /**
     * Changes the line's width
     * @param {Number} width
     */
    ChangeWidth(width)
    {
        this.width = width;
        this.UpdateValues();
    }

    /**
     * Changes positions from cartesian coordinates
     * @param {vec3} startPosition
     * @param {vec3} endPosition
     * @param {vec3} middle
     */
    ChangeCartesian(startPosition, endPosition, middle)
    {
        vec3.copy(this.position1, startPosition);
        vec3.copy(this.position2, endPosition);
        vec3.copy(this.intermediatePosition, middle);
        this.UpdateValues();
    }

    /**
     * Changes cartesian position
     * @param {vec3} startPosition
     * @param {vec3} endPosition
     */
    ChangePositionCartesian(startPosition, endPosition)
    {
        vec3.copy(this.position1, startPosition);
        vec3.copy(this.position2, endPosition);
        this.UpdateValues();
    }

    /**
     * Changes cartesian intermediate position
     * @param {vec3} intermediatePosition
     */
    ChangeIntermediateCartesian(intermediatePosition)
    {
        vec3.copy(this.intermediatePosition, intermediatePosition);
        this.UpdateValues();
    }

    /**
     * Changes positions from spherical
     * @param {vec3} startPosition
     * @param {vec3} endPosition
     * @param {vec3} middle
     * @param {vec3} center
     */
    ChangeSpherical(startPosition, endPosition, middle, center)
    {
        vec3.fromSpherical(this.position1, startPosition, center);
        vec3.fromSpherical(this.position2, endPosition, center);
        vec3.fromSpherical(this.intermediatePosition, middle, center);
        this.UpdateValues();
    }

    /**
     * Changes position from spherical coordinates
     * @param {vec3} startPosition
     * @param {vec3} endPosition
     * @param {vec3} center
     */
    ChangePositionSpherical(startPosition, endPosition, center)
    {
        vec3.fromSpherical(this.position1, startPosition, center);
        vec3.fromSpherical(this.position2, endPosition, center);
        this.UpdateValues();
    }

    /**
     * Changes spherical intermediate position
     * @param {vec3} intermediatePosition
     * @param {vec3} center
     */
    ChangeIntermediateSpherical(intermediatePosition, center)
    {
        vec3.fromSpherical(this.intermediatePosition, intermediatePosition, center);
        this.UpdateValues();
    }

    /**
     * Changes multi line color
     * @param {vec4} color
     * @param {Number} border
     */
    ChangeMultiColor(color, border)
    {
        vec4.copy(this.multiColor, color);
        this.multiColorBorder = border;
        this.UpdateValues();
    }

    /**
     * Changes animated color settings
     * @param {vec4} color
     * @param {Number} speed
     * @param {Number} scale
     */
    ChangeAnimation(color, speed, scale)
    {
        vec4.copy(this.overlayColor, color);
        this.animationSpeed = speed;
        this.animationScale = scale;
        this.UpdateValues();
    }

    /**
     * Changes line segmentation
     * @param {Number} numOfSegments
     */
    ChangeSegmentation(numOfSegments)
    {
        if (this.type !== EveCurveLineSetItem.Type.STRAIGHT)
        {
            this.numOfSegments = numOfSegments;
            this.UpdateValues();
        }
    }

    /**
     * Curve line types
     * @type {{INVALID: number, STRAIGHT: number, SPHERED: number, CURVED: number}}
     */
    static Type = LineType;

    /**
     * Default length of a line created from a ray
     * @type {number}
     */
    static DEFAULT_RAY_LENGTH = 1000;

    /**
     * Default curved line segmentation
     * @type {Number}
     */
    static DEFAULT_CURVED_SEGMENTS = 20;

    /**
     * Default sphered line segmentation
     * @type {Number}
     */
    static DEFAULT_SPHERED_SEGMENTS = 20;

}


@meta.type("EveCurveLineSet")
export class EveCurveLineSet extends EveObjectSet
{

    @meta.boolean
    additive = false;

    @meta.struct("Tw2Effect")
    lineEffect = Tw2Effect.from({
        effectFilePath: "res:/Graphics/Effect/Managed/Space/SpecialFX/Lines3D.fx",
        textures: {
            "TexMap": "res:/texture/global/white.dds.0.png",
            "OverlayTexMap": "res:/texture/global/white.dds.0.png"
        }
    });

    @meta.struct("Tw2Effect")
    pickEffect = null;

    @meta.notImplemented
    @meta.float
    scrollSpeed = 1;

    // CCPWGL only?

    @meta.float
    lineWidthFactor = 1;

    @meta.notImplemented
    @meta.float
    depthOffset = 0;

    @meta.boolean
    pickable = true;

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.vector3
    translation = vec3.create();

    @meta.matrix4
    transform = mat4.create();


    _worldTransform = mat4.create();
    _vertexSize = 26;
    _vbSize = 0;
    _vb = null;
    _perObjectData = Tw2PerObjectData.from(EveCurveLineSet.perObjectData);
    _decl = Tw2VertexDeclaration.from(EveCurveLineSet.vertexDeclarations).SetStride(26 * 4);


    /**
     * Constructor
     */
    constructor()
    {
        super();
        EveCurveLineSet.init();
    }

    /**
     * Alias for this.items
     * @returns {Array}
     */
    get lines()
    {
        return this.items;
    }

    /**
     * Alias for this.items
     * @param {Array} arr
     */
    set lines(arr)
    {
        this.items = arr;
    }

    /**
     * Gets the current line count
     * @returns {Number}
     */
    get lineCount()
    {
        let count = 0;
        for (let i = 0; i < this.items.length; i++)
        {
            if (this.items[i].type !== EveCurveLineSetItem.Type.INVALID)
            {
                count += this.items[i].numOfSegments;
            }
        }
        return count;
    }

    /**
     * Initializes the curve line set
     */
    Initialize()
    {
        this.UpdateValues();
        this.Rebuild();
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.lineEffect) this.lineEffect.GetResources(out);
        return out;
    }

    /**
     * Creates a straight line from a ray
     * @param {vec3} origin
     * @param {vec3} direction
     * @param {Number} length
     * @param {Number} width
     * @param {vec4} startColor
     * @param {vec4} endColor
     * @returns {EveCurveLineSetItem}
     */
    AddStraightLineFromRay(origin, direction, length, width, startColor, endColor)
    {
        const line = this.AddStraightLine([ 0, 0, 0 ], [ 0, 0, 0 ], width, startColor, endColor);
        line.ChangePositionFromRay(origin, direction, length);
        return line;
    }

    /**
     * Creates a straight line
     * @param {vec3} start
     * @param {vec3} end
     * @param {Number} [width]
     * @param {vec4} [startColor]
     * @param {vec4} [endColor]
     * @returns {EveCurveLineSetItem}
     */
    AddStraightLine(start, end, width, startColor, endColor)
    {
        return this.CreateItem({
            type: EveCurveLineSetItem.Type.STRAIGHT,
            position1: start,
            position2: end,
            color1: startColor,
            color2: endColor,
            width: width
        });
    }

    /**
     * Creates and adds a curved line from cartesian coordinates
     * @param {vec3} start
     * @param {vec3} end
     * @param {vec3} center
     * @param {Number} [width]
     * @param {vec4} [startColor]
     * @param {vec4} [endColor]
     * @returns {EveCurveLineSetItem}
     */
    AddCurvedLineCrt(start, end, center, width, startColor, endColor)
    {
        return this.CreateItem({
            type: EveCurveLineSetItem.Type.CURVED,
            position1: start,
            position2: end,
            intermediatePosition: center,
            color1: startColor,
            color2: endColor,
            width: width,
            numOfSegments: EveCurveLineSetItem.DEFAULT_CURVED_SEGMENTS
        });
    }

    /**
     * Creates and adds a curved line from spherical coordinates
     * @param {vec3} start
     * @param {vec3} end
     * @param {vec3} center
     * @param {vec3} middle
     * @param {Number} [width]
     * @param {vec4} [startColor]
     * @param {vec4} [endColor]
     * @returns {EveCurveLineSetItem}
     */
    AddCurvedLineSph(start, end, center, middle, width, startColor, endColor)
    {
        const g = EveCurveLineSet.global;
        return this.CreateItem({
            type: EveCurveLineSetItem.Type.CURVED,
            position1: vec3.fromSpherical(g.vec3_0, start, center),
            position2: vec3.fromSpherical(g.vec3_1, end, center),
            intermediatePosition: vec3.fromSpherical(g.vec3_2, middle, center),
            color1: startColor,
            color2: endColor,
            width: width,
            numOfSegments: EveCurveLineSetItem.DEFAULT_CURVED_SEGMENTS
        });
    }

    /**
     * Creates and adds a sphered line from cartesian coordinates
     * @param {vec3} start
     * @param {vec3} end
     * @param {vec3} center
     * @param {Number} [width]
     * @param {vec4} [startColor]
     * @param {vec4} [endColor]
     * @returns {EveCurveLineSetItem}
     */
    AddSpheredLineCrt(start, end, center, width, startColor, endColor)
    {
        return this.CreateItem({
            type: EveCurveLineSetItem.Type.SPHERED,
            position1: start,
            position2: end,
            intermediatePosition: center,
            color1: startColor,
            color2: endColor,
            width: width,
            numOfSegments: EveCurveLineSetItem.DEFAULT_SPHERED_SEGMENTS
        });
    }

    /**
     * Creates and adds a sphered line from spherical coordinates
     * @param {vec3} start
     * @param {vec3} end
     * @param {vec3} center
     * @param {vec3} middle
     * @param {Number} [width]
     * @param {vec4} [startColor]
     * @param {vec4} [endColor]
     * @returns {EveCurveLineSetItem}
     */
    AddSpheredLineSph(start, end, center, middle, width, startColor, endColor)
    {
        const g = EveCurveLineSet.global;
        return this.CreateItem({
            type: EveCurveLineSetItem.Type.SPHERED,
            position1: vec3.fromSpherical(g.vec3_0, start, center),
            position2: vec3.fromSpherical(g.vec3_1, end, center),
            intermediatePosition: vec3.fromSpherical(g.vec3_2, middle, center),
            color1: startColor,
            color2: endColor,
            width: width,
            numOfSegments: EveCurveLineSetItem.DEFAULT_SPHERED_SEGMENTS
        });
    }

    /**
     * Fire on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this.transform, this.rotation, this.translation, this.scaling);
        this._dirty = true;
    }

    /**
     * Per frame update
     * @param {mat4} parentTransform
     */
    UpdateViewDependentData(parentTransform)
    {
        if (parentTransform)
        {
            mat4.multiply(this._worldTransform, parentTransform, this.transform);
        }
        else
        {
            mat4.copy(this._worldTransform, this.transform);
        }
    }

    /**
     * Unloads the line set's buffers
     * @param  {Object} [opt]
     */
    Unload(opt)
    {
        if (this._vb)
        {
            device.gl.deleteBuffer(this._vb);
            this._vb = null;
        }
        super.Unload(opt);
    }

    /**
     * Rebuilds the line set
     * @param  {Object} [opt]
     */
    Rebuild(opt)
    {
        //this.Unload(true);
        this.RebuildItems(opt);
        this._vbSize = this.lineCount;
        this._dirty = false;
        const visibleItems = this._visibleItems.length;
        if (!visibleItems)
        {
            super.Rebuild(opt);
            return;
        }

        const
            g = EveCurveLineSet.global,
            data = new Float32Array(this._vbSize * 6 * this._vertexSize),
            startDir = g.vec3_0,
            endDir = g.vec3_1,
            startDirNrm = g.vec3_2,
            endDirNrm = g.vec3_3,
            rotationAxis = g.vec3_4,
            tangent1 = g.vec3_5,
            tangent2 = g.vec3_6,
            rotationMatrix = g.mat4_0;

        let dir1 = g.vec3_7,
            dir2 = g.vec3_8,
            pos1 = g.vec3_9,
            pos2 = g.vec3_10,
            col1 = g.vec4_0,
            col2 = g.vec4_1,
            offset = 0,
            tmp;

        for (let i = 0; i < visibleItems; ++i)
        {
            const item = this._visibleItems[i];
            switch (item.type)
            {
                case EveCurveLineSetItem.Type.INVALID:
                    break;

                case EveCurveLineSetItem.Type.STRAIGHT:
                    EveCurveLineSet.WriteLineVerticesToBuffer(this, item.position1, item.color1, 0, item.position2, item.color2, 1, i, data, offset);
                    offset += 6 * this._vertexSize;
                    break;

                case EveCurveLineSetItem.Type.SPHERED:
                    vec3.subtract(startDir, item.position1, item.intermediatePosition);
                    vec3.subtract(endDir, item.position2, item.intermediatePosition);
                    vec3.normalize(startDirNrm, startDir);
                    vec3.normalize(endDirNrm, endDir);
                    vec3.cross(rotationAxis, startDir, endDir);

                    const
                        fullAngle = Math.acos(vec3.dot(startDirNrm, endDirNrm)),
                        segmentAngle = fullAngle / item.numOfSegments;

                    mat4.identity(rotationMatrix);
                    mat4.rotate(rotationMatrix, rotationMatrix, segmentAngle, rotationAxis);
                    vec3.copy(dir1, startDir);
                    vec4.copy(col1, item.color1);

                    for (let j = 0; j < this.lines[i].numOfSegments; ++j)
                    {
                        const segmentFactor = (j + 1) / item.numOfSegments;
                        vec3.transformMat4(dir2, dir1, rotationMatrix);
                        col2[0] = item.color1[0] * (1 - segmentFactor) + item.color2[0] * segmentFactor;
                        col2[1] = item.color1[1] * (1 - segmentFactor) + item.color2[1] * segmentFactor;
                        col2[2] = item.color1[2] * (1 - segmentFactor) + item.color2[2] * segmentFactor;
                        col2[3] = item.color1[3] * (1 - segmentFactor) + item.color2[3] * segmentFactor;
                        vec3.add(pos1, dir1, item.intermediatePosition);
                        vec3.add(pos2, dir2, item.intermediatePosition);
                        EveCurveLineSet.WriteLineVerticesToBuffer(this, pos1, col1, j / item.numOfSegments, pos2, col2, segmentFactor, i, data, offset);
                        offset += 6 * this._vertexSize;

                        tmp = dir1;
                        dir1 = dir2;
                        dir2 = tmp;
                        tmp = col1;
                        col1 = col2;
                        col2 = tmp;
                    }
                    break;

                case EveCurveLineSetItem.Type.CURVED:
                    vec3.subtract(tangent1, item.intermediatePosition, item.position1);
                    vec3.subtract(tangent2, item.position2, item.intermediatePosition);
                    vec3.copy(pos1, item.position1);
                    vec3.copy(col1, item.color1);

                    for (let j = 0; j < item.numOfSegments; ++j)
                    {
                        const segmentFactor = (j + 1) / item.numOfSegments;
                        vec3.hermite(pos2, item.position1, tangent1, item.position2, tangent2, segmentFactor);
                        col2[0] = item.color1[0] * (1 - segmentFactor) + item.color2[0] * segmentFactor;
                        col2[1] = item.color1[1] * (1 - segmentFactor) + item.color2[1] * segmentFactor;
                        col2[2] = item.color1[2] * (1 - segmentFactor) + item.color2[2] * segmentFactor;
                        col2[3] = item.color1[3] * (1 - segmentFactor) + item.color2[3] * segmentFactor;
                        EveCurveLineSet.WriteLineVerticesToBuffer(this, pos1, col1, j / item.numOfSegments, pos2, col2, segmentFactor, i, data, offset);
                        offset += 6 * this._vertexSize;

                        tmp = pos1;
                        pos1 = pos2;
                        pos2 = tmp;
                        tmp = col1;
                        col1 = col2;
                        col2 = tmp;
                    }
            }
        }

        //if (this._vb) device.gl.deleteBuffer(this._vb);
        this._vb = device.gl.createBuffer();
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, this._vb);
        device.gl.bufferData(device.gl.ARRAY_BUFFER, data, device.gl.STATIC_DRAW);
        device.gl.bindBuffer(device.gl.ARRAY_BUFFER, null);

        super.Rebuild(opt);
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display || !this._vb) return;

        let effect;
        switch (mode)
        {
            case device.RM_TRANSPARENT:
                if (this.additive || !this.lineEffect) return;
                effect = this.lineEffect;
                break;

            case device.RM_ADDITIVE:
                if (!this.additive || !this.lineEffect) return;
                effect = this.lineEffect;
                break;

            case device.RM_PICKABLE:
                if (!this.pickable || !this.pickEffect) return;
                effect = this.pickEffect;
        }

        const
            batch = new Tw2ForwardingRenderBatch(),
            worldTransformTranspose = mat4.transpose(EveCurveLineSet.global.mat4_0, this._worldTransform);

        this._perObjectData.vs.Set("WorldMat", worldTransformTranspose);
        this._perObjectData.ps.Set("WorldMat", worldTransformTranspose);
        batch.perObjectData = this._perObjectData;
        batch.geometryProvider = this;
        batch.renderMode = mode;
        batch.effect = effect;
        accumulator.Commit(batch);
    }

    /**
     * Per frame update
     * @param {Tw2ForwardingRenderBatch} batch
     * @param {String} technique - technique name
     * @returns {Boolean}
     */
    Render(batch, technique)
    {
        if (!batch.effect || !batch.effect.IsGood() || !this._vb) return false;

        const
            d = device,
            gl = d.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vb);

        let passCount = batch.effect.GetPassCount(technique);
        for (let pass = 0; pass < passCount; ++pass)
        {
            batch.effect.ApplyPass(technique, pass);
            let passInput = batch.effect.GetPassInput(technique, pass);
            if (!this._decl.SetDeclaration(d, passInput, this._decl.stride)) return false;
            d.ApplyShadowState();
            gl.drawArrays(gl.TRIANGLES, 0, this._vbSize * 6);
        }
        return true;
    }

    /**
     * Fills color vertices
     * @param {EveCurveLineSetItem} item
     * @param buffer
     * @param {Number} offset
     * @returns {Number}
     */
    static FillColorVertices(item, buffer, offset)
    {
        buffer[offset++] = item.multiColor[0];
        buffer[offset++] = item.multiColor[1];
        buffer[offset++] = item.multiColor[2];
        buffer[offset++] = item.multiColor[3];
        buffer[offset++] = item.overlayColor[0];
        buffer[offset++] = item.overlayColor[1];
        buffer[offset++] = item.overlayColor[2];
        buffer[offset++] = item.overlayColor[3];
        return offset;
    }

    /**
     * Writes line vertices to the vertex buffer
     * @param {EveCurveLineSet} lineSet
     * @param {vec3} start
     * @param {quat} startColor
     * @param length1
     * @param {vec3} end
     * @param {quat} endColor
     * @param length2
     * @param {Number} lineID
     * @param buffer
     * @param {Number} offset
     */
    static WriteLineVerticesToBuffer(lineSet, start, startColor, length1, end, endColor, length2, lineID, buffer, offset)
    {
        const item = lineSet.items[lineID];

        buffer[offset++] = start[0];
        buffer[offset++] = start[1];
        buffer[offset++] = start[2];
        buffer[offset++] = end[0] - start[0];
        buffer[offset++] = end[1] - start[1];
        buffer[offset++] = end[2] - start[2];
        buffer[offset++] = -lineSet.lineWidthFactor * item.width;
        buffer[offset++] = 0;
        buffer[offset++] = length1;
        buffer[offset++] = item.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = item.animationSpeed;
        buffer[offset++] = item.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = startColor[0];
        buffer[offset++] = startColor[1];
        buffer[offset++] = startColor[2];
        buffer[offset++] = startColor[3];
        offset = EveCurveLineSet.FillColorVertices(item, buffer, offset);

        buffer[offset++] = start[0];
        buffer[offset++] = start[1];
        buffer[offset++] = start[2];
        buffer[offset++] = end[0] - start[0];
        buffer[offset++] = end[1] - start[1];
        buffer[offset++] = end[2] - start[2];
        buffer[offset++] = lineSet.lineWidthFactor * item.width;
        buffer[offset++] = 0;
        buffer[offset++] = length1;
        buffer[offset++] = item.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = item.animationSpeed;
        buffer[offset++] = item.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = startColor[0];
        buffer[offset++] = startColor[1];
        buffer[offset++] = startColor[2];
        buffer[offset++] = startColor[3];
        offset = EveCurveLineSet.FillColorVertices(item, buffer, offset);

        buffer[offset++] = end[0];
        buffer[offset++] = end[1];
        buffer[offset++] = end[2];
        buffer[offset++] = start[0] - end[0];
        buffer[offset++] = start[1] - end[1];
        buffer[offset++] = start[2] - end[2];
        buffer[offset++] = -lineSet.lineWidthFactor * item.width;
        buffer[offset++] = 1;
        buffer[offset++] = length2;
        buffer[offset++] = item.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = item.animationSpeed;
        buffer[offset++] = item.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = endColor[0];
        buffer[offset++] = endColor[1];
        buffer[offset++] = endColor[2];
        buffer[offset++] = endColor[3];
        offset = EveCurveLineSet.FillColorVertices(item, buffer, offset);

        buffer[offset++] = start[0];
        buffer[offset++] = start[1];
        buffer[offset++] = start[2];
        buffer[offset++] = end[0] - start[0];
        buffer[offset++] = end[1] - start[1];
        buffer[offset++] = end[2] - start[2];
        buffer[offset++] = lineSet.lineWidthFactor * item.width;
        buffer[offset++] = 0;
        buffer[offset++] = length1;
        buffer[offset++] = item.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = item.animationSpeed;
        buffer[offset++] = item.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = startColor[0];
        buffer[offset++] = startColor[1];
        buffer[offset++] = startColor[2];
        buffer[offset++] = startColor[3];
        offset = EveCurveLineSet.FillColorVertices(item, buffer, offset);

        buffer[offset++] = end[0];
        buffer[offset++] = end[1];
        buffer[offset++] = end[2];
        buffer[offset++] = start[0] - end[0];
        buffer[offset++] = start[1] - end[1];
        buffer[offset++] = start[2] - end[2];
        buffer[offset++] = lineSet.lineWidthFactor * item.width;
        buffer[offset++] = 1;
        buffer[offset++] = length2;
        buffer[offset++] = item.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = item.animationSpeed;
        buffer[offset++] = item.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = endColor[0];
        buffer[offset++] = endColor[1];
        buffer[offset++] = endColor[2];
        buffer[offset++] = endColor[3];
        offset = EveCurveLineSet.FillColorVertices(item, buffer, offset);

        buffer[offset++] = end[0];
        buffer[offset++] = end[1];
        buffer[offset++] = end[2];
        buffer[offset++] = start[0] - end[0];
        buffer[offset++] = start[1] - end[1];
        buffer[offset++] = start[2] - end[2];
        buffer[offset++] = -lineSet.lineWidthFactor * item.width;
        buffer[offset++] = 1;
        buffer[offset++] = length2;
        buffer[offset++] = item.multiColorBorder;
        buffer[offset++] = length2 - length1;
        buffer[offset++] = item.animationSpeed;
        buffer[offset++] = item.animationScale;
        buffer[offset++] = lineID;
        buffer[offset++] = endColor[0];
        buffer[offset++] = endColor[1];
        buffer[offset++] = endColor[2];
        buffer[offset++] = endColor[3];
        EveCurveLineSet.FillColorVertices(item, buffer, offset);
    }

    /**
     * Initializes class global variables and scratch
     */
    static init()
    {
        if (!EveCurveLineSet.global)
        {
            EveCurveLineSet.global = {
                vec3_0: vec3.create(), // start direction
                vec3_1: vec3.create(), // end direction
                vec3_2: vec3.create(), // start direction normalized
                vec3_3: vec3.create(), // end direction normalized
                vec3_4: vec3.create(), // rotationAxis
                vec3_5: vec3.create(), // direction1
                vec3_6: vec3.create(), // direction2
                vec3_7: vec3.create(), // position 1
                vec3_8: vec3.create(), // position 2
                vec3_9: vec3.create(), // tangent1
                vec3_10: vec3.create(),// tangent2
                vec4_0: vec4.create(), // color 1
                vec4_1: vec4.create(), // color 2
                mat4_0: mat4.create(),  // rotationMatrix
            };
        }
    }

    /**
     * Line set item constructor
     * @type {EveCurveLineSetItem}
     */
    static Item = EveCurveLineSetItem;

    /**
     * Global and scratch variables
     */
    static global = null;

    /**
     * Per object data
     * @type {*}
     */
    static perObjectData = {
        vs: [ [ "WorldMat", 16 ] ],
        ps: [ [ "WorldMat", 16 ] ]
    };

    /**
     * Vertex declarations
     * @type {*[]}
     */
    static vertexDeclarations = [
        { usage: "POSITION", usageIndex: 0, elements: 3 },
        { usage: "TEXCOORD", usageIndex: 0, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 1, elements: 4 },
        { usage: "TEXCOORD", usageIndex: 2, elements: 3 },
        { usage: "COLOR", usageIndex: 0, elements: 4 },
        { usage: "COLOR", usageIndex: 1, elements: 4 },
        { usage: "COLOR", usageIndex: 2, elements: 4 }
    ];

}
