import { meta, vec3 } from "global";

/**
 * Tr2DistanceTracker
 *
 * @property {String} name
 * @property {vec3} direction
 * @property {vec3} targetPosition
 */
@meta.notImplemented
@meta.type("Tr2DistanceTracker")
export class Tr2DistanceTracker
{

    @meta.black.string
    name = "";

    @meta.black.vector3
    direction = vec3.create();

    @meta.black.vector3
    targetPosition = vec3.create();

}
