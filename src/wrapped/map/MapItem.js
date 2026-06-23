import { mat4, quat, vec3 } from "math";
import { Tw2GeometryRes, Tw2Mesh } from "core";


class CelestialGroupGeometry
{

    _mesh = new Tw2Mesh();
    _res = new Tw2GeometryRes();
    _dirty = true;

    /**
     * Gets the geometry's mesh
     * @returns {Tw2Mesh}
     */
    get mesh()
    {
        return this._mesh;
    }

    /**
     * Gets the geometry's res
     * @returns {Tw2GeometryRes}
     */
    get res()
    {
        return this._res;
    }

    /**
     * Per frame update
     * @param {Number} dt
     */
    RebuildGeometryBounds()
    {

    }

    /**
     * Gets the mesh's bounding box
     * @param {box3} out
     * @returns {box3|null}
     */
    GetBoundingBox(out)
    {
        return this._mesh.GetBoundingBox(out);
    }

    /**
     * Gets the mesh's bounding sphere
     * @param {sph3} out
     * @returns {sph3|null}
     */
    GetBoundingSphere(out)
    {
        return this._mesh.GetBoundingSphere(out);
    }

    /**
     * Intersects the mesh
     * @param ray
     * @param intersects
     * @param worldTransform
     * @param cache
     * @returns {*}
     * @constructor
     */
    Intersect(ray, intersects, worldTransform, cache)
    {
        return this._mesh.Intersect(ray, intersects, worldTransform);
    }

    /**
     * Gets the mesh's resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>}
     */
    GetResources(out)
    {
        return this._mesh.GetResources(out)
    }

    /**
     * Checks if the mesh is good
     * @returns {boolean}
     */
    IsGood()
    {
        return this._res && !this._dirty && this._res.IsGood();
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if something was accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        return this._mesh.GetBatches(mode, accumulator, perObjectData);
    }

}


class Celestial
{
    id = "";
    name = "";
    children = [];

    showChildrenOnLod = 0;

    groupGeometry = null;

    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1,1,1);

    _localTransform = mat4.create();
    _worldTransform = mat4.create();
    _lod = 0;

    ResetLod()
    {
        this._lod = 3;
    }

    SetLod()
    {

    }
}


export class Universe
{
    name = "";
    id = null;
    regions = [];
}

export class Constellation
{

    systems = [];
}

export class Region
{
    constellations = [];
}

export class System
{
    planets = [];
}

export class Planet
{
    planet = null;
    moons = [];
}