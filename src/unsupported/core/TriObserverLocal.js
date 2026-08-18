import { meta } from "utils";
import { vec3 } from "math";

@meta.notImplemented
@meta.type("TriObserverLocal")
@meta.ccp.define("TriObserverLocal")
export class TriObserverLocal extends meta.Model
{

    @meta.string
    name = "";

    // The observer's object-local position, transformed by the owner's world
    // transform each Update. Persisted, and its absence here made every black
    // file carrying one fail to read - at1_t1_fx.black among them.
    @meta.vector3
    position = vec3.create();

    @meta.vector3
    front = vec3.create();

    @meta.struct()
    observer = null;

}
