import {vec3} from "../../global";

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
    minBounds = vec3.create();
    maxBounds = vec3.create();
    boundsSpherePosition = vec3.create();
    boundsSphereRadius = 0;

}
