import { meta } from "utils";
import { vec3 } from "math";

@meta.notImplemented
@meta.type("TriObserverLocal")
export class TriObserverLocal extends meta.Model
{

    @meta.string
    name = "";

    @meta.vector3
    front = vec3.create();

    @meta.struct()
    observer = null;

}
