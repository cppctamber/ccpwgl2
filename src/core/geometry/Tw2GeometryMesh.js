import { meta } from "utils";
import { mat4, box3, sph3, tri3, vec3, ray3, lne3 } from "math";
import { Tw2VertexDeclaration, Tw2VertexElement } from "../vertex";
import { Tw2GeometryMeshArea } from "./Tw2GeometryMeshArea";
import { ErrIndexBounds, Tw2Error } from "core/Tw2Error";
import { tw2 } from "global";


@meta.type("Tw2GeometryMesh")
export class Tw2GeometryMesh
{

    @meta.string
    name = "";

    @meta.struct("Tw2VertexDeclaration")
    declaration = new Tw2VertexDeclaration();

    @meta.list("Tw2GeometryMeshArea")
    areas = [];

    @meta.struct("WebGLBuffer")
    @meta.isPrivate
    buffer = null;

    @meta.uint
    @meta.isPrivate
    bufferLength = 0;

    @meta.isPrivate
    @meta.vector
    @meta.todo("Make private")
    bufferData = null;

    @meta.struct("WebGLBuffer")
    @meta.isPrivate
    indexes = null;

    @meta.vector
    @meta.isPrivate
    @meta.todo("Make private")
    indexData = null;

    @meta.uint
    @meta.isPrivate
    indexType = 0;

    @meta.vector3
    minBounds = vec3.fromValues(0, 0, 0);

    @meta.vector3
    maxBounds = vec3.fromValues(0, 0, 0);

    @meta.vector3
    boundsSpherePosition = vec3.create();

    @meta.float
    boundsSphereRadius = 0;

    //@meta.list("Tw2GeometryBone")
    //bones = [];

    @meta.list("String")
    boneBindings = [];

    @meta.list()
    boneBounds = [];

    @meta.list("Tw2BlendShapeData")
    blendShapes = [];

    _faces = 0;
    _vertices = 0;
    _areas = 0;
    _boundsDirty = true;

    /**
     * Clears the mesh data
     */
    Clear()
    {
        this.declaration.Clear();
        this.areas.splice(0);
        this.boneBindings.splice(0);
        this.boneBounds.splice(0);
        this.blendShapes.splice(0);
        vec3.set(this.minBounds, 0,0,0);
        vec3.set(this.maxBounds, 0,0,0);
        vec3.set(this.boundsSpherePosition, 0, 0, 0);
        this.boundsSphereRadius = 0;

        this.bufferLength = 0;
        this.bufferData = null;
        this.indexData = null;

        const { gl } = tw2;

        if (this.buffer)
        {
            gl.deleteBuffer(this.buffer);
            this.buffer = null;
        }

        if (this.indexes)
        {
            gl.deleteBuffer(this.indexes);
            this.indexes = null;
        }

        this._faces = 0;
        this._vertices = 0;
        this._areas = 0;
        this._boundsDirty = true;
    }

    /**
     * Checks if there is a system mirror of the buffer and index data
     * @returns {boolean}
     */
    HasSystemMirror()
    {
        return !!(this.bufferData && this.indexData);
    }

    /**
     * Checks if the mesh requires system mirror
     * @returns {boolean}
     */
    IsSystemMirrorRequired()
    {
        return !!this.blendShapes.length;
    }

    /**
     * Clears system mirror if not required
     * @returns {boolean}
     */
    ClearSystemMirrorIfNotRequired()
    {
        if (!this.IsSystemMirrorRequired())
        {
            this.bufferData = null;
            this.indexData = null;
        }
    }

    /**
     * Finds bone bounds by name
     * @param {String} name
     * @return {null|Float32Array}
     */
    FindBoneBoundsByName(name)
    {
        name = name.toLowerCase();

        let index = -1;
        for (let i = 0; i < this.boneBindings.length; i++)
        {
            if (this.boneBindings[i].toLowerCase() === name)
            {
                index = i;
                break;
            }
        }

        if (index === -1)
        {
            throw new Error(`Bone not found ${name}`);
        }

        if (!this.boneBounds[index])
        {
            this.boneBounds[index] = box3.create();
        }

        return this.boneBounds[index];
    }

    /**
     * Intersects the mesh
     * @param {Tw2RayCaster} ray
     * @param {Array} intersects
     * @param {mat4} worldTransform
     * @param {Object} [cache={}]
     */
    Intersect(ray, intersects, worldTransform, cache = {})
    {
        if (ray.IsMasked(this)) return;

        this.RebuildBounds();
        const intersect = ray.IntersectBounds(this.minBounds, this.maxBounds, worldTransform);
        if (!intersect) return;

        const internalIntersects = [];
        for (let i = 0; i < this.areas.length; i++)
        {
            const intersectedAreas = this.IntersectAreas(this.areas[i], ray, intersects, worldTransform, cache);
            if (intersectedAreas)
            {
                for (let x = 0; x < intersectedAreas.length; x++)
                {
                    internalIntersects.push(intersectedAreas[x]);
                }
            }
        }

        internalIntersects.sort(ray._sortFunction);
        return internalIntersects;
    }

    /**
     *
     * @param {Tw2GeometryMeshArea} area
     * @param {Tw2RayCaster} ray
     * @param {Array} intersects
     * @param {mat4} worldTransform
     * @param {*} cache
     * @return {Array}
     */
    IntersectAreas(area, ray, intersects, worldTransform, cache = {})
    {
        // If not position decl then how was it intersected?
        const pDecl = this.declaration.FindUsage(0, 0);
        if (!pDecl) return [];

        const areaIndex = this.areas.indexOf(area);
        //console.log("Intersecting geometryArea " + areaIndex);

        this.RebuildBounds();
        const intersect = ray.IntersectBounds(area.minBounds, area.maxBounds, worldTransform);
        if (!intersect) return [];

        if (!ray.DoFaceIntersection())
        {
            intersect.name = this.name;
            intersect.isGeometryArea = true;
            intersect.areaIndex = areaIndex;
            intersects.push(intersect);
            return [ intersect ];
        }

        if (!cache.inverseWorldTransform)
        {
            cache.inverseWorldTransform = mat4.invert(mat4.create(), worldTransform);
        }

        if (!cache.rayLocal)
        {
            cache.rayLocal = ray3.transformMat4(ray3.create(), ray.ray, cache.inverseWorldTransform);
        }

        const
            count = area.count / 3,
            start = area.start / 3 / this.indexData.BYTES_PER_ELEMENT;

        const { pointLocal, tri3_0, vec3_0, vec3_1, vec3_2, lne3_0 } = Tw2GeometryMesh.global;

        //console.log("Intersecting area faces...");

        const internalIntersects = [];
        for (let i = 0; i < count; i++)
        {
            const
                index = i + start,
                debug = this.GetFaceVertexPositions(
                    vec3_0,
                    vec3_1,
                    vec3_2,
                    index
                );

            tri3.fromVertices(tri3_0, vec3_0, vec3_1, vec3_2);
            if (ray3.getIntersectTri3(pointLocal, cache.rayLocal, tri3_0, ray.DoBackfaceCulling()))
            {
                vec3.transformMat4(vec3_0, pointLocal, worldTransform);

                const distance = vec3.squaredDistance(ray.ray, vec3_0);

                console.log("Intersected area face " + index + " at distance " + distance + " at point " + Array.from(vec3_0));

                if (distance > ray.nearSquared && distance < ray.farSquared)
                {
                    if (ray.DoFindClosestEdge()) tri3.getClosestEdgeToPoint(lne3_0, tri3_0, vec3_0, debug);
                    if (ray.DoFindClosestVertex()) tri3.getClosestVertexToPoint(vec3_1, tri3_0, vec3_0, debug);

                    const faceIntersect = {
                        name: area.name,
                        distance: distance,
                        point: vec3.clone(vec3_0),
                        item: this,
                        areaIndex,
                        faceIndex: index,
                        positionIndices: this.GetFaceVertexIndices(index),
                        edgeStartIndex: debug.vertexIndices[debug.edgeStart],
                        edgeEndIndex: debug.vertexIndices[debug.edgeEnd],
                        vertexIndex: debug.vertexIndices[debug.closest],
                        isGeometryFace: true,
                    };

                    intersects.push(faceIntersect);
                    internalIntersects.push(faceIntersect);
                }
            }
        }

        return internalIntersects.sort(ray._sortFunction);
    }

    /**
     * Gets a usage declaration
     * @param {Number} usage
     * @param {Number} usageIndex
     * @return {?Tw2VertexElement}
     */
    GetUsageDeclaration(usage, usageIndex)
    {
        if (this.declaration)
        {
            const decl = this.declaration.FindUsage(usage, usageIndex);
            if (decl) return decl;
        }
        
        return null;
    }

    /**
     * Rebuilds bounds
     * @param {Boolean} [force]
     */
    RebuildBounds(force)
    {
        if (this._boundsDirty || force)
        {
            const
                min = this.minBounds,
                max = this.maxBounds;

            box3.bounds.empty(min, max);

            if (force && this.bufferData && this.indexData)
            {
                this.RecalculateAreaBounds(this.bufferData, this.indexData);
            }

            for (let i = 0; i < this.areas.length; i++)
            {
                const area = this.areas[i];
                box3.bounds.union(min, max, min, max, area.minBounds, area.maxBounds);
            }

            this.boundsSphereRadius = box3.bounds.toPositionRadius(min, max, this.boundsSpherePosition);
            this._boundsDirty = false;
        }
    }

    /**
     * Recalculates area bounds from vertices if possible
     * @param {Array|TypedArray} bufferData=[this.bufferData]
     * @param {Array|TypedArray} indexData=[this.indexData]
     * @return {boolean} true if rebuilt from vertices
     */
    RecalculateAreaBounds(bufferData = this.bufferData, indexData = this.indexData)
    {
        if (!bufferData || !indexData) return false;

        const pDecl = this.GetUsageDeclaration(0, 0);
        if (!pDecl) return false;

        const { box3_0 } = Tw2GeometryMesh.global;
        for (let i = 0; i < this.areas.length; i++)
        {
            const area = this.areas[i];

            Tw2GeometryMesh.GetBoundsFromVertices(
                box3_0,
                area.start / 3 / indexData.BYTES_PER_ELEMENT,
                area.count / 3,
                this.declaration.stride / 4,
                pDecl.offset,
                bufferData,
                indexData
            );

            box3.toBounds(box3_0, area.minBounds, area.maxBounds);
            area.boundsSphereRadius = box3.toPositionRadius(box3_0, area.boundsSpherePosition);
        }

        return true;
    }

    /**
     * Gets the geometries bounding box
     * @param {box3} out
     * @param {Boolean} [force]
     * @return {box3} out
     */
    GetBoundingBox(out, force)
    {
        this.RebuildBounds(force);
        return box3.fromBounds(out, this.minBounds, this.maxBounds);
    }

    /**
     * Gets the meshes bounding sphere
     * @param {sph3} out
     * @param {Boolean} force
     * @return {sph3}
     */
    GetBoundingSphere(out, force)
    {
        this.RebuildBounds(force);
        return sph3.fromPositionRadius(out, this.boundsSpherePosition, this.boundsSphereRadius);
    }

    /**
     * Gets face vertex elements
     * @param {Array|Float32Array} v1
     * @param {Array|Float32Array} v2
     * @param {Array|Float32Array} v3
     * @param {Number} index
     * @param {Number} usage
     * @param {Number} usageIndex
     * @return {{faceIndex: Number, vertexIndices: [Number, Number, Number]}} - debug data
     */
    GetFaceVertexElements(v1, v2, v3, index, usage, usageIndex)
    {
        if (!this.bufferData || !this.indexData)
        {
            for (let i = 0; i < v1.length; i++) v1[i] = 0;
            for (let i = 0; i < v2.length; i++) v2[i] = 0;
            for (let i = 0; i < v3.length; i++) v3[i] = 0;
            throw new ErrSystemMirrorDisabled();
        }
        
        const d = this.GetUsageDeclaration(usage, usageIndex);
        // If no declaration empty arrays
        if (!d)
        {
            for (let i = 0; i < v1.length; i++) v1[i] = 0;
            for (let i = 0; i < v2.length; i++) v2[i] = 0;
            for (let i = 0; i < v3.length; i++) v3[i] = 0;
            throw new ErrVertexDeclarationNotFound({ usage, usageIndex });
        }
        
        const
            indices = Tw2GeometryMesh.GetFaceVertexIndices([], index, this.indexData),
            stride = this.declaration.stride / 4;

        Tw2GeometryMesh.GetVertexElement(v1, indices[0], stride, d.offset, d.elements, this.bufferData);
        Tw2GeometryMesh.GetVertexElement(v2, indices[1], stride, d.offset, d.elements, this.bufferData);
        Tw2GeometryMesh.GetVertexElement(v3, indices[2], stride, d.offset, d.elements, this.bufferData);

        // Debug data
        return {
            faceIndex: index,
            vertexIndices: [
                indices[0],
                indices[1],
                indices[2]
            ]
        };
    }

    /**
     * Gets the vertex indices for a face
     * @param {Number} index
     * @return {vec3|Array
     */
    GetFaceVertexIndices(index)
    {
        return Tw2GeometryMesh.GetFaceVertexIndices([], index, this.indexData);
    }

    /**
     * Gets a vertex element
     * @param {Array|Float32Array} out
     * @param {Number} index
     * @param {Number} usage
     * @param {Number} usageIndex
     * @param {Array|Float32Array} [bufferData=this.bufferData] (required when building areas for the first time)
     * @return {Array|Float32Array}
     */
    GetVertexElement(out, index, usage, usageIndex, bufferData = this.bufferData)
    {
        if (!this.bufferData)
        {
            for (let i = 0; i < out.length; i++) out[i] = 0;
            throw new ErrSystemMirrorDisabled();
        }

        const decl = this.GetUsageDeclaration(usage, usageIndex);
        if (!decl)
        {
            for (let i = 0; i < out.length; i++) out[i] = 0;
            throw new ErrVertexDeclarationNotFound({ usage, usageIndex });
        }

        return Tw2GeometryMesh.GetVertexElement(
            out,
            index,
            this.declaration.stride / 4,
            decl.offset,
            decl.elements,
            bufferData
        );
    }

    /**
     * Gets a face's vertex positions
     * @param {vec3} v1
     * @param {vec3} v2
     * @param {vec3} v3
     * @param {number} index
     * @return {{faceIndex: Number, vertexIndices: Number[]}}
     */
    GetFaceVertexPositions(v1, v2, v3, index)
    {
        return this.GetFaceVertexElements(v1, v2, v3, index, Tw2VertexElement.Type.POSITION, 0);
    }
    
    /**
     * Gets a tri3 for a face at a given index
     * @param {tri3} out
     * @param {Number} index
     * @return {{faceIndex: Number, vertexIndices: [Number,Number,Number]}} - debug data
     */
    GetFaceTri3(out, index)
    {
        return this.GetFaceVertexPositions(tri3.$v1(out), tri3.$v2(out), tri3.$v3(out), index);
    }

    /**
     * Gets a face's normal
     * @param {vec3} out
     * @param {Number} index
     * @return {vec3} out
     */
    GetFaceNormal(out, index)
    {
        const face = Tw2GeometryMesh.global.tri3_0;
        this.GetFaceTri3(face, index);
        return tri3.getNormal(out, face);
    }

    /**
     * Gets a face's midpoint
     * @param {vec3} out
     * @param {Number} index
     * @return {vec3}
     */
    GetFaceMidPoint(out, index)
    {
        const face = Tw2GeometryMesh.global.tri3_0;
        this.GetFaceTri3(face, index);
        return tri3.getMidpoint(out, face);
    }

    /**
     * Gets a vertex position by index
     * @param {vec3|Array} out
     * @param {Number} index
     * @return {Array|Float32Array} out
     */
    GetVertexPosition(out, index)
    {
        return this.GetVertexElement(out, index, Tw2VertexElement.Type.POSITION, 0);
    }

    /**
     * Gets a vertex normal by index
     * @param {vec3|Array} out
     * @param {Number} index
     * @return {Array|Float32Array} out
     */
    GetVertexNormal(out, index)
    {
        return this.GetVertexElement(out, index, Tw2VertexElement.Type.NORMAL, 0);
    }

    /**
     * Gets a vertex tangent by index
     * TODO: Generate tangents when uv and normals exist
     * @param {vec3|Array} out
     * @param {Number} index
     * @return {Array|Float32Array} out
     */
    GetVertexTangent(out, index)
    {
        return this.GetVertexElement(out, index, Tw2VertexElement.Type.TANGENT, 0);
    }

    /**
     * Gets a vertex bitangent by index
     * TODO: Generate bitangents when uv and normals exist
     * @param {vec3|Array} out
     * @param {Number} index
     * @return {Array|Float32Array} out
     */
    GetVertexBitangent(out, index)
    {
        return this.GetVertexElement(out, index, Tw2VertexElement.Type.BITANGENT, 0);
    }

    /**
     * Gets a uv by index
     * @param {Float32Array|Array} out
     * @param {Number} index
     * @param {Number} [usage=0]
     * @return {Array|Float32Array} out
     */
    GetVertexUV(out, index, usage)
    {
        return this.GetVertexElement(out, index, Tw2VertexElement.Type.TEXCOORD, usage);
    }

    /**
     * Gets the first uv by index
     * @param {vec3|Array|Float32Array} out
     * @param {Number} }index
     * @returns {vec3|Array|Float32Array}
     */
    GetVertexTexCoord0(out, index)
    {
        return this.GetVertexUV(out, index, 0);
    }

    /**
     * Gets the second uv by index
     * @param {vec3|Array|Float32Array} out
     * @param {Number} }index
     * @returns {vec3|Array|Float32Array} out
     */
    GetVertexTexCoord1(out, index)
    {
        return this.GetVertexUV(out, index, 1);
    }

    /**
     * Gets the vertex blend weight
     * @param {vec4|Array|Float32Array} out
     * @param {Number} index
     * @returns {vec4|Array|Float32Array} out
     */
    GetVertexBlendWeight(out, index)
    {
        return this.GetVertexElement(out, index, Tw2VertexElement.Type.BLENDWEIGHT, 0);
    }

    /**
     * Gets the vertex blend indice
     * @param {vec4|Array|Float32Array} out
     * @param {Number} index
     * @returns {vec4|Array|Float32Array} out
     */
    GetVertexBlendIndice(out, index)
    {
        return this.GetVertexElement(out, index, Tw2VertexElement.Type.BLENDINDICE, 0);
    }
    
    /**
     * Gets a face's vertex indices
     * @param {vec3|Array} out
     * @param {Number} index
     * @param {Array|TypedArray} indexData
     * @returns {vec3|Array}
     */
    static GetFaceVertexIndices(out, index, indexData)
    {
        if (index >= indexData.length / 3)
        {
            out[0] = out[1] = out[2] = 0;
            throw new ErrIndexBounds();
        }

        for (let i = 0; i < 3; i++)
        {
            out[i] = indexData[index * 3 + i];
        }

        return out;
    }

    /**
     * Gets a vertex element from buffer data
     * @param {Array|Float32Array} out
     * @param {Number} index
     * @param {Number} stride
     * @param {Number} offset
     * @param {Number} elements
     * @param {Array|Float32Array} bufferData
     * @return {*} out
     */
    static GetVertexElement(out, index, stride, offset, elements, bufferData)
    {
        if (index > bufferData.length / stride)
        {
            for (let i = 0; i < out.length; i++) out[i] = 0;
            throw new ErrIndexBounds();
        }

        /*
        if (out.length !== elements)
        {
            for (let i = 0; i < out.length; i++) out[i] = 0;
            throw new ErrIndexBounds();
        }
         */

        for (let i = 0; i < elements; i++)
        {
            out[i] = bufferData[index * stride + offset / 4 + i];
        }

        return out;
    }

    /**
     * Gets a bounding box from vertices
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
        const
            indices = Tw2GeometryMesh.global.vec3_0,
            position = Tw2GeometryMesh.global.vec3_1;

        box3.empty(out);

        for (let i = 0; i < count; i++)
        {
            this.GetFaceVertexIndices(indices, i + start, indexData);

            for (let x = 0; x < 3; x++)
            {
                this.GetVertexElement(position, indices[x], stride, pOffset, 3, bufferData);
                box3.addPoint(out, out, position);
            }
        }

        return out;
    }

    static global = {
        tri3_0: tri3.create(),
        pointLocal: vec3.create(),
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create(),
        box3_0: box3.create(),
        lne3_0: lne3.create()
    };

}


export class ErrSystemMirrorDisabled extends Tw2Error
{
    constructor(data)
    {
        super(data, "System mirror is required but has been disabled");
    }
}

export class ErrVertexDeclarationNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "Vertex usage %usage% not found for usage index %usageIndex%");
    }
}
