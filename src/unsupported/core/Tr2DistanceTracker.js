import { meta } from "utils";
import { vec3 } from "math";


@meta.notImplemented
@meta.type("Tr2DistanceTracker")
export class Tr2DistanceTracker extends meta.Model
{

    @meta.string
    name = "";

    @meta.vector3
    direction = vec3.create();

    @meta.vector3
    targetPosition = vec3.create();

    @meta.float
    value = 0;

}
