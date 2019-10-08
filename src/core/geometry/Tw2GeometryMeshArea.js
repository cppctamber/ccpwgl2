import { box3, sph3, vec3 } from "../../global";

/**
 * Tw2GeometryMeshArea
 *
 * @property {String} name
 * @property {Number} start
 * @property {Number} count
 * @property {vec3} minBounds
 * @property {vec3} maxBounds
 * @property {vec3} boundsSpherePosition
 * @property {Number} boundsSphereRadius
 */
export class Tw2GeometryMeshArea
{

    name = "";
    start = 0;
    count = 0;
    minBounds = vec3.fromValues(0, 0, 0);
    maxBounds = vec3.fromValues(0, 0, 0);
    boundsSpherePosition = vec3.create();
    boundsSphereRadius = 0;

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

}
