import { vec3, ray3 } from "math";

/**
 * Ray intersection
 * @typedef RayIntersection
 * @property {String} name
 * @property {Number} distance
 * @property {Number} distanceToRay
 * @property {vec3} point
 * @property {Number} faceIndex
 * @property {*|null} item
 * @property {*|null} set
 * @property {*} root
 */


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
    options = {};

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

}
