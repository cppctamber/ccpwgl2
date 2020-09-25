import { meta, vec3 } from "global";


@meta.notImplemented
@meta.ctor("Tr2DistanceTracker")
export class Tr2DistanceTracker
{

    @meta.string
    name = "";

    @meta.vector3
    direction = vec3.create();

    @meta.vector3
    targetPosition = vec3.create();

}
