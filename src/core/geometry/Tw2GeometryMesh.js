import {box3, sph3, vec3} from "../../global";
import {Tw2VertexDeclaration} from "../vertex";
import {isNumber} from "../../global/util";
import {Tw2GeometryMeshArea} from "./Tw2GeometryMeshArea";

/**
 * Tw2GeometryMesh
 *
 * @property {String} name
 * @property {Tw2VertexDeclaration} declaration
 * @property {Array.<Tw2GeometryMeshArea>} areas
 * @property {WebGLBuffer} buffer
 * @property {Number} bufferLength
 * @property bufferData
 * @property {WebGLBuffer} indexes
 * @property indexData
 * @property {Number} indexType
 * @property {vec3} minBounds
 * @property {vec3} maxBounds
 * @property {vec3} boundsSpherePosition
 * @property {Number} boundsSphereRadius
 * @property {Array} bones
 * @property {Array.<string>} boneBindings
 */
export class Tw2GeometryMesh
{

    name = "";
    declaration = new Tw2VertexDeclaration();
    areas = [];
    buffer = null;
    bufferLength = 0;
    bufferData = null;
    indexes = null;
    indexData = null;
    indexType = 0;
    minBounds = vec3.fromValues(0, 0, 0);
    maxBounds = vec3.fromValues(0, 0, 0);
    boundsSpherePosition = vec3.create();
    boundsSphereRadius = 0;
    bones = [];
    boneBindings = [];

    _faces = 0;
    _vertices = 0;
    _areas = 0;

    /**
     * Gets the object's bounding box
     * @param {box3} out
     * @param {mat4} [parentTransform]
     * @returns {Boolean} True if bounds are valid
     */
    GetBoundingBox(out, parentTransform)
    {
        box3.fromBounds(out, this.minBounds, this.maxBounds);
        if (parentTransform) box3.transformMat4(out, out, parentTransform);
        return true;
    }

    /**
     * Gets the object's bounding sphere
     * @param {sph3} out
     * @param {mat4} [parentTransform]
     * @returns {Boolean} True if bounds are valid
     */
    GetBoundingSphere(out, parentTransform)
    {
        sph3.fromPositionRadius(out, this.boundsSpherePosition, this.boundsSphereRadius);
        if (parentTransform) sph3.transformMat4(out, out, parentTransform);
        return true;
    }

    /**
     * Rebuilds bounds
     * @param {Boolean} [fromVertex]
     */
    RebuildBounds(fromVertex)
    {
        const
            min = this.minBounds,
            max = this.maxBounds;

        box3.bounds.empty(min, max);
        for (let i = 0; i < this.areas.length; i++)
        {
            const area = this.areas[i];
            this.RebuildAreaBounds(area, this.bufferData, this.indexData, fromVertex);
            box3.bounds.union(min, max, min, max, area.minBounds, area.maxBounds);
        }

        this.boundsSphereRadius = box3.bounds.toPositionRadius(min, max, this.boundsSpherePosition);
    }

    /**
     * Rebuilds an area's bounds
     * @param {Tw2GeometryMeshArea} area
     * @param {*} bufferData
     * @param {*} indexData
     * @param {Boolean} [fromVertex]
     */
    RebuildAreaBounds(area, bufferData, indexData, fromVertex)
    {
        if (!fromVertex || !bufferData || !indexData) return false;

        const pDecl = this.declaration.FindUsage(0, 0);
        if (!pDecl) return false;

        const
            stride = this.declaration.stride / 4,
            pOffset = pDecl.offset;

        const box = Tw2GeometryMesh.GetBoundsFromVertices(
            box3.create(),
            area.start,
            area.count,
            stride,
            pOffset,
            bufferData,
            indexData
        );

        box3.toObjectBounds(box, area);
        box3.toObjectPositionRadius(box, area);
        return true;
    }

    /**
     * Gets a face's vertex indices
     * @param {vec3} out
     * @param {Number} index
     * @param {*} indexData
     * @returns {vec3}
     */
    static GetFaceVertexIndices(out, index, indexData)
    {
        if (index >= indexData.length / 3)
        {
            throw new Error("Invalid index: " + index);
        }

        for (let i = 0; i < 3; i++)
        {
            out[i] = indexData[index * 3 + i];
        }

        return out;
    }

    /**
     * Gets a vertices's position
     * @param {vec3} out
     * @param {Number} index
     * @param {Number} stride
     * @param {Number} offset
     * @param {*} bufferData
     * @returns {vec3}
     */
    static GetVertexPosition(out, index, stride, offset, bufferData)
    {
        if (!isNumber(index) || index > bufferData.length / stride)
        {
            throw new Error("Invalid vertex index: " + index);
        }

        const ix = index * stride;

        return vec3.set(out,
            bufferData[ix + offset],
            bufferData[ix + offset + 1],
            bufferData[ix + offset + 2]
        );
    }

    /**
     * Updates an area's bounds
     * @param {box3} out
     * @param {Number} start
     * @param {Number} count
     * @param {Number} stride
     * @param {Number} pOffset
     * @param {*} bufferData
     * @param {*} indexData
     */
    static GetBoundsFromVertices(out, start, count, stride, pOffset, bufferData, indexData)
    {
        count = count / 3;
        start = start / 2 / 3;

        const
            vertexIndices = [],
            indices = vec3.create(),
            position = vec3.create();

        box3.empty(out);

        for (let i = 0; i < count; i++)
        {
            this.GetFaceVertexIndices(indices, i + start, indexData);
            for (let x = 0; x < 3; x++)
            {
                if (!vertexIndices.includes(indices[x]))
                {
                    vertexIndices.push(indices[x]);
                    this.GetVertexPosition(position, indices[x], stride, pOffset, bufferData);
                    box3.addPoint(out, out, position);
                }
            }
        }

        return out;
    }

}