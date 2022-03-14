import { meta } from "utils";
import { box3, sph3, vec3 } from "math";


@meta.type("Tw2GeometryMeshArea")
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
     * Gets the mesh area's bounding box
     * @param {box3} out
     * @return {box3} out
     */
    GetBoundingBox(out)
    {
        return box3.fromBounds(out, this.minBounds, this.maxBounds);
    }

    /**
     * gets the mesh area's bounding Sphere
     * @param {sph3} out
     * @return {sph3} out
     */
    GetBoundingSphere(out)
    {
        return sph3.fromPositionRadius(out, this.boundsSpherePosition, this.boundsSphereRadius);
    }

}
