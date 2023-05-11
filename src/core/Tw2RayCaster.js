import { vec2, vec3, pln, lne3, ray3, mat4, sph3, tri3, box3, vec4 } from "math";
import { device } from "global";

/**
 * Ray intersection
 * @typedef RayIntersection
 * @property {Number} distance
 * @property {vec3} point
 */

let
    sph3_0,
    box3_0,
    vec3_0,
    mat4_0,
    pln_0;

/**
 * Ray caster
 *
 * TODO: If there are no near and far comparisons we can use ray3.distanceSquared for a performance increase
 * TODO: Or store near and far as squared values
 * @param {ray3} ray
 * @param {Number} nearSquared
 * @param {Number} farSquared
 * @param {Object} options
 * @param {Function|null} _maskFunction
 */
export class Tw2RayCaster
{

    ray = ray3.create();
    nearSquared = 0;
    farSquared = Infinity;

    bones = null;

    _pixelPosition = vec2.create();
    _viewport = vec4.create();

    options = {
        faces: { backfaceCulling: true },
        edges: { computeClosest: true },
        vertices: { computeClosest: true },
        locators: { radius: 20 },
    };

    _maskFunction = null;
    _sortFunction = ray3.SORT;

    /**
     * Updates the ray caster from an event
     * Todo: Add options
     * @param {MouseEvent} event
     * @param {HTMLElement} [element=event.target]
     * @param {Object} [options]
     */
    UpdateFromEvent(event, element=event.target, options)
    {
        vec2.pixelPositionFromEvent(this._pixelPosition, event, element);
        vec4.set(this._viewport, 0,0, device.viewportWidth, device.viewportHeight);
        this.Unproject(this._pixelPosition, this._viewport);
    }

    /**
     * Updates the ray caster from pixel coordinates
     * @param {vec2|Array} pixelPosition
     */
    UpdateFromCoordinates(pixelPosition)
    {
        vec2.copy(this._pixelPosition, pixelPosition);
        vec4.set(this._viewport, 0,0, device.viewportWidth, device.viewportHeight);
        this.Unproject(this._pixelPosition, this._viewport);
    }

    /**
     * Gets a ray option
     * @param {String} type
     * @param {String} key
     * @param {*} [defaultValue]
     * @return {*}
     */
    GetOption(type, key, defaultValue)
    {
        if (type in this.options)
        {
            if (key in this.options[type])
            {
                return this.options[type][key];
            }
        }
        return defaultValue;
    }

    /**
     * Sets an option
     * @param {String} type
     * @param {String} key
     * @param {*} value
     */
    SetOption(type, key, value)
    {
        if (!this.options[type]) this.options[type] = {};
        this.options[type][key] = value;
    }

    /**
     * Checks if faces should be intersected
     * @return {boolean}
     */
    DoFaceIntersection()
    {
        return !this.GetOption("faces", "skip", false);
    }

    /**
     * Checks if backface culling should be enabled
     * @return {boolean}
     */
    DoBackfaceCulling()
    {
        return this.GetOption("faces", "backfaceCulling", true);
    }

    /**
     * Checks if the closest edge should be calculated
     * @return {boolean}
     */
    DoFindClosestEdge()
    {
        return this.GetOption("edges", "computeClosest", true);
    }

    /**
     * Checks if closest vertex should be calculated
     * @return {boolean}
     */
    DoFindClosestVertex()
    {
        return this.GetOption("vertices", "computeClosest", true);
    }

    /**
     * Gets the ray in object space
     * @param {ray3}  out
     * @param {mat4} world
     * @return {ray3} out
     */
    GetLocalRay(out, world)
    {
        const inverseWorld = mat4_0 = mat4_0 || mat4.create();
        mat4.invert(inverseWorld, world);
        ray3.transformMat4(out, out, inverseWorld);
        return out;
    }

    /**
     * Sets the ray from origin and direction
     * @param {vec3} origin
     * @param {vec3} direction
     */
    From(origin, direction)
    {
        ray3.from(this.ray, origin, direction);
        ray3.normalize(this.ray, this.ray);
    }

    /**
     * Sets the ray from start and end vectors
     * @param {vec3} start
     * @param {vec3} end
     */
    FromStartEnd(start, end)
    {
        ray3.fromStartEnd(this.ray, start, end);
    }

    /**
     * Sets the ray from world coordinates and a camera
     * @param coords
     * @param camera
     */
    FromCamera(coords, camera)
    {
        if ("SetRayFromCoords" in camera)
        {
            camera.SetRayFromCoords(coords, this.ray);
            ray3.normalize(this.ray, this.ray);
        }
        else
        {
            throw new Error("Camera does not support ray casting");
        }
    }

    /**
     * Unprojects pixels
     * @param {vec2} pixelPosition
     * @param {vec4} [viewPort]
     * @param {mat4} [viewProjectionInverse]
     */
    Unproject(pixelPosition, viewPort, viewProjectionInverse)
    {
        ray3.unproject(
            this.ray,
            pixelPosition,
            viewProjectionInverse || device.viewProjectionInverse,
            viewPort || [ 0, 0, device.viewportWidth, device.viewportHeight ],
        );
    }

    /*
    GetObjectIDFromRGBA(c)
    {
        return ((c[0] << 8) | (c[1] & 0xff)) - 1;
    }

    GetCCPObjectIDFromRGBA(c)
    {
        throw new Error("Not implemented");
    }
     */

    /**
     * Checks if an object is masked
     * @param {*} object
     * @return {Boolean}
     */
    IsMasked(object)
    {
        return this._maskFunction ? this._maskFunction(object) : false;
    }

    /**
     * Sets a mask function
     * @param {Function} func
     */
    SetMask(func)
    {
        this._maskFunction = func;
    }

    /**
     * Intersects an object
     * @param {*} object
     * @param {Array} [intersects]
     * @return {*[]}
     */
    IntersectObject(object, intersects = [])
    {
        if ("Intersect" in object)
        {
            object.Intersect(this, intersects);
            intersects.sort(ray3.SORT);
        }

        return intersects;
    }

    /**
     * Intersects objects
     * @param {Array} objects
     * @param {Array} intersects
     * @return {Array} intersects
     */
    IntersectObjects(objects, intersects = [])
    {
        for (let i = 0; i < objects.length; i++)
        {
            this.IntersectObject(objects[i], intersects);
        }

        intersects.sort(ray3.SORT);
        return intersects;
    }

    /**
     * Intersects a world sph3
     * @param {sph3} worldSphere
     * @return {{distance: (number|*), point: vec3}}
     */
    IntersectWorldSph3(worldSphere)
    {
        if (ray3.intersectsSph3(this.ray, worldSphere))
        {
            vec3_0 = vec3_0 || vec3.create();
            ray3.getIntersectSph3(vec3_0, this.ray, worldSphere);

            const distance = vec3.squaredDistance(this.ray, vec3_0);
            if (distance > this.nearSquared && distance < this.farSquared)
            {
                return {
                    name: "",
                    item: null,
                    root: null,
                    distance,
                    point: vec3.clone(vec3_0)
                };
            }
        }
    }

    /**
     * Intersects a sph3
     * @param {sph3|Array} sphere
     * @param {mat4} world
     * @return {{distance: (number|*), point: vec3}}
     */
    IntersectSph3(sphere, world)
    {
        sph3_0 = sph3_0 = sph3.create();
        sph3.transformMat4(sph3_0, sphere, world);
        return this.IntersectWorldSph3(sph3_0);
    }

    /**
     * Intersects a sphere's position and radius
     * @param {vec3} position
     * @param {Number} radius
     * @param {mat4} world
     * @return {{distance: (number|*), point: vec3}}
     */
    IntersectPositionRadius(position, radius, world)
    {
        return this.IntersectSph3([ position[0], position[1], position[2], radius ], world);
    }

    /**
     * Intersects a transform's position and a given radius
     * @param {mat4} m
     * @param {Number} radius
     * @param {mat4} world
     * @return {{distance: (number|*), point: vec3}}
     */
    IntersectTransformRadius(m, radius, world)
    {
        vec3_0 = vec3_0 || vec3.create();
        mat4.getTranslation(vec3_0, m);
        return this.IntersectSph3([ vec3_0[0], vec3_0[1], vec3_0[2], radius ], world);
    }

    /**
     * Intersects a world box3
     * @param {box3} worldBox
     * @return {{distance: (number|*), point: vec3}}
     */
    IntersectWorldBox3(worldBox)
    {
        if (ray3.intersectsBox3(this.ray, worldBox))
        {
            vec3_0 = vec3_0 || vec3.create();
            ray3.getIntersectBox3(vec3_0, this.ray, worldBox);

            const distance = vec3.squaredDistance(this.ray, vec3_0);
            if (distance > this.nearSquared && distance < this.farSquared)
            {
                return {
                    name: "",
                    item: null,
                    root: null,
                    distance,
                    point: vec3.clone(vec3_0)
                };
            }
        }
    }

    /**
     * Intersects a box3
     * @param {box3|Array} box
     * @param world
     * @return {{distance: (number|*), point: vec3}}
     */
    IntersectBox3(box, world)
    {
        box3_0 = box3_0 || box3.create();
        box3.transformMat4(box3_0, box, world);
        return this.IntersectWorldBox3(box3_0);
    }

    /**
     *  Intersects a boxes bounds
     * @param {vec3} minBounds
     * @param {vec3} maxBounds
     * @param {mat4} world
     * @return {{distance: (number|*), point: vec3}}
     */
    IntersectBounds(minBounds, maxBounds, world)
    {
        return this.IntersectBox3([
            minBounds[0], minBounds[1], minBounds[2],
            maxBounds[0], maxBounds[1], maxBounds[2]
        ], world);
    }

    /**
     * Intersects a world plane
     * @param {pln} worldPlane
     * @return {{distance: Number, point: vec3}}
     */
    IntersectWorldPln(worldPlane)
    {
        if (ray3.intersectsPln(this.ray, worldPlane))
        {
            vec3_0 = vec3_0 || vec3.create();
            ray3.getIntersectPln(vec3_0, this.ray, worldPlane);

            const distance = vec3.squaredDistance(this.ray, vec3_0);
            if (distance > this.nearSquared && distance < this.farSquared)
            {
                return { distance, point: vec3.clone(vec3_0) };
            }
        }
    }

    /**
     * Intersects a pln
     * @param {pln|Array} plane
     * @param {mat4} nMatrix
     * @return {{distance: Number, point: vec3}}
     */
    IntersectPln(plane, nMatrix)
    {
        pln_0 = pln_0 || pln.create();
        pln.transformMat4(pln_0, plane, nMatrix);
        return this.IntersectWorldPln(pln_0);
    }

    /**
     * Intersects a plane's normal and constant
     * @param {vec3} normal
     * @param {Number} constant
     * @param {mat4} nMatrix
     * @return {{distance: Number, point: vec3}}
     */
    IntersectNormalConstant(normal, constant, nMatrix)
    {
        return this.IntersectPln([ normal[0], normal[1], normal[2], constant ], nMatrix);
    }


    /*
    IntersectWorldTri3(worldTriangle, backFaceCulling)
    {
        vec3_0 = vec3_0 || vec3.create();

        if (ray3.getIntersectTri3(vec3_0, this.ray, worldTriangle, backFaceCulling))
        {
            const distance = ray3.distance(this.ray, vec3_0);
            if (distance > this.nearSquared && distance <this.farSquared)
            {
                return {
                    distance,
                    point: vec3.clone(vec3_0)
                };
            }
        }
    }

    IntersectTri3(triangle, world, backFaceCulling)
    {
        tri3_0 = tri3_0 || tri3.create();
        tri3.transformMat4(tri3_0, triangle, world);
        return this.IntersectWorldTri3(tri3_0, backFaceCulling);
    }

    IntersectTriangleVertices(v1, v2, v3, world, backFaceCulling)
    {
        tri3_0 = tri3_0 || tri3.create();
        tri3.fromVertices(tri3_0, v1, v2, v3);
        tri3.transformMat4(tri3_0, tri3_0, world);
        return this.IntersectWorldTri3(tri3_0, backFaceCulling);
    }

    IntersectWorldLne3(worldLine)
    {
        throw new ErrFeatureNotImplemented();
    }

    IntersectLne3(line, world)
    {
        throw new ErrFeatureNotImplemented();
    }

    IntersectStartEnd(start, end, world)
    {
        throw new ErrFeatureNotImplemented();
    }
    */

    static Type = {
        VERTEX: 0,
        EDGE: 1,
        FACE: 2,
        MESH_AREA: 3,
        MESH: 4,
        GEOMETRY: 5,
        SET_ITEM: 6,
        LOCATOR: 7,
        SET: 8,
        OBJECT: 9,
    };
}

