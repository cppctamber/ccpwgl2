import { box3, meta, sph3, vec3 } from "global";


@meta.ctor("Tw2GeometryMeshArea")
export class Tw2GeometryMeshArea
{

    @meta.string
    name = "";

    @meta.uint
    start = 0;

    @meta.uint
    count = 0;

    @meta.vector3
    minBounds = vec3.fromValues(0, 0, 0);

    @meta.vector3
    maxBounds = vec3.fromValues(0, 0, 0);

    @meta.vector3
    boundsSpherePosition = vec3.create();

    @meta.float
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
