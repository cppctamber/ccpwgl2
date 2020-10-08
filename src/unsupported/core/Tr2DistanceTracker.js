import { meta, vec3 } from "global";


@meta.notImplemented
@meta.ctor("Tr2DistanceTracker")
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
