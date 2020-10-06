import { meta, vec3 } from "global";


@meta.notImplemented
@meta.ctor("TriObserverLocal")
export class TriObserverLocal extends meta.Model
{

    @meta.string
    name = "";

    @meta.vector3
    front = vec3.create();

    @meta.struct()
    observer = null;

}
