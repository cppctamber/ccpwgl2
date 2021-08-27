import { ErrFeatureNotImplemented } from "core/Tw2Error";
import { vec3, pln, lne3, ray3, mat4, sph3, tri3, box3 } from "math";
import {
    RM_ADDITIVE,
    RM_DEPTH,
    RM_DISTORTION,
    RM_FULLSCREEN,
    RM_OPAQUE,
    RM_PICKABLE,
    RM_TRANSPARENT
} from "constant/d3d";

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
    lne3_0,
    tri3_0,
    pln_0;


/**
 * Ray caster
 * @param {ray3} ray
 * @param {Number} near
 * @param {Number} far
 * @param {Array} masks
 * @param {Object} options
 */
export class Tw2RayCaster
{

    ray = ray3.create();
    near = 0;
    far = Infinity;
    masks = [];

    renderModes = {
        [RM_OPAQUE] : true,
        [RM_TRANSPARENT] : true,
        [RM_ADDITIVE] : true,
        [RM_DEPTH] : false,
        [RM_DISTORTION] : false,
        [RM_PICKABLE] : false,
        [RM_FULLSCREEN] : false
    };

    options = {
        /*
        decal: { threshold: 1, skip: true },
        banner: { threshold: 0 },
        booster: { threshold: 1 },
        locator: { threshold: 1 },
        hazeSet: { threshold: 0 },
        planeSet: { threshold: 0 },
        spriteSet: { threshold: 0 },
        spotlightSet: { threshold: 0 },
        spriteLineSet: { threshold: 0 },
        */
    };

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
     * Masks constructors from intersection tests
     * @param {Function} Ctor
     */
    MaskConstructor(Ctor)
    {
        if (!this.masks.includes(Ctor))
        {
            this.masks.push(Ctor);
        }
    }

    /**
     * Intersects an object
     * @param {*} object
     * @param {Array} [intersects]
     * @param {Boolean} [recursive]
     * @return {*[]}
     */
    IntersectObject(object, intersects = [], recursive)
    {
        if ("Intersect" in object)
        {
            object.Intersect(this, intersects, recursive);
            intersects.sort(ray3.SORT);
        }

        return intersects;
    }

    /**
     * Intersects objects
     * @param {Array} objects
     * @param {Array} intersects
     * @param {Boolean} [recursive]
     * @return {Array} intersects
     */
    IntersectObjects(objects, intersects = [], recursive)
    {
        for (let i = 0; i < objects.length; i++)
        {
            this.IntersectObject(objects[i], intersects, recursive);
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
            const distance = ray3.distanceToSph3(worldSphere);
            if (distance > this.near && distance < this.far)
            {
                return {
                    distance,
                    point: ray3.getIntersectSph3(vec3.create(), this.ray, worldSphere)
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
        const worldSphere = sph3_0 = sph3_0 = sph3.create();

        sph3.transformMat4(worldSphere, sphere, world);
        return this.IntersectWorldSph3(worldSphere);
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
     * Intersects a world box3
     * @param {box3} worldBox
     * @return {{distance: (number|*), point: vec3}}
     */
    IntersectWorldBox3(worldBox)
    {
        if (ray3.intersectsBox3(this.ray, worldBox))
        {
            if (!vec3_0) vec3_0 = vec3.create();
            ray3.getIntersectBox3(vec3_0, this.ray, worldBox);

            const distance = ray3.distanceToPoint(vec3_0);
            if (distance > this.near && distance < this.far)
            {
                return {
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
        const worldBox = box3_0 = box3_0 || box3.create();

        box3.transformMat4(worldBox, box, world);
        return this.IntersectWorldBox3(worldBox);
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
            const distance = ray3.distancePln(this.ray, worldPlane);
            if (distance > this.near && distance < this.far)
            {
                return {
                    distance,
                    point: ray3.getIntersectPln(vec3.create(), this.ray, worldPlane)
                };
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
        const worldPlane = pln_0 = pln_0 || pln.create();

        pln.transformMat4(worldPlane, plane, nMatrix);
        return this.IntersectWorldPln(worldPlane);
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

    /**
     * Intersects a world tri3
     * @param {tri3} worldTriangle
     * @param {Boolean} backFaceCulling
     * @return {{distance: number, point: vec3}}
     */
    IntersectWorldTri3(worldTriangle, backFaceCulling)
    {
        if (!vec3_0) vec3_0 = vec3.create();

        const
            point = ray3.getIntersectTri3(this.ray, worldTriangle, backFaceCulling),
            distance = ray3.distance(this.ray, point);

        if (distance > this.near && distance < this.far)
        {
            return {
                distance,
                point: vec3.clone(point)
            };
        }
    }

    /**
     * Intersects a tri3
     * @param {tri3} triangle
     * @param {mat4} world
     * @param {Boolean} [backFaceCulling]
     * @return {{distance: number, point: vec3}}
     */
    IntersectTri3(triangle, world, backFaceCulling)
    {
        const worldTriangle = tri3_0 = tri3_0 || tri3.create();

        tri3.transformMat4(worldTriangle, triangle, world);
        return this.IntersectWorldTri3(worldTriangle, backFaceCulling);
    }

    /**
     * Intersects triangle vertices
     * @param {vec3} v1
     * @param {vec3} v2
     * @param {vec3} v3
     * @param {mat4} world
     * @param {Boolean} backFaceCulling
     * @return {{distance: number, point: vec3}}
     */
    IntersectTriangleVertices(v1, v2, v3, world, backFaceCulling)
    {
        const worldTriangle = tri3_0 = tri3_0 || tri3.create();

        tri3.fromVertices(worldTriangle, v1, v2, v3);
        tri3.transformMat4(worldTriangle, worldTriangle, world);
        return this.IntersectWorldTri3(worldTriangle, backFaceCulling);
    }

    /**
     * Intersects a world lne3
     * @param {lne3} worldLine
     */
    IntersectWorldLne3(worldLine)
    {
        throw new ErrFeatureNotImplemented();
    }

    /**
     * Intersects a lne3
     * @param {lne3|Array} line
     * @param {mat4} world
     */
    IntersectLne3(line, world)
    {
        throw new ErrFeatureNotImplemented();
    }

    /**
     * Intersects a lines start and end
     * @param {vec3} start
     * @param {vec3} end
     * @param {mat4} world
     */
    IntersectStartEnd(start, end, world)
    {
        throw new ErrFeatureNotImplemented();
    }

}
