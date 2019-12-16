import { meta, vec3 } from "global";


@meta.notImplemented
@meta.type("Tr2DistanceTracker", true)
export class Tr2DistanceTracker
{

    @meta.black.string
    name = "";

    @meta.black.vector3
    direction = vec3.create();

    @meta.black.vector3
    targetPosition = vec3.create();

}
