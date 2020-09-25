import { meta, box3, sph3, vec3 } from "global";
import { Tw2VertexDeclaration } from "../vertex";
import { isNumber } from "global/util";
import { Tw2GeometryMeshArea } from "./Tw2GeometryMeshArea";


@meta.ctor("Tw2GeometryMesh")
export class Tw2GeometryMesh
{

    @meta.string
    name = "";

    @meta.struct("Tw2VertexDeclaration")
    declaration = new Tw2VertexDeclaration();

    @meta.list("Tw2GeometryMeshArea")
    areas = [];

    @meta.vector
    buffer = null;

    @meta.uint
    bufferLength = 0;

    @meta.struct("WebGLBuffer")
    bufferData = null;

    @meta.struct("WebGLBuffer")
    indexes = null;

    @meta.vector
    indexData = null;

    @meta.uint
    indexType = 0;

    @meta.vector3
    minBounds = vec3.fromValues(0, 0, 0);

    @meta.vector3
    maxBounds = vec3.fromValues(0, 0, 0);

    @meta.vector3
    boundsSpherePosition = vec3.create();

    @meta.float
    boundsSphereRadius = 0;

    @meta.list("Tw2GeometryBone")
    bones = [];

    @meta.list("String")
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

        box3.toBounds(box, area.minBounds, area.maxBounds);
        area.boundsSphereRadius = box3.toPositionRadius(box, area.boundsSpherePosition);
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
        start = start / 3 / indexData.BYTES_PER_ELEMENT;

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
