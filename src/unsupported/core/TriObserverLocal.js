import { meta, vec3, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.ctor("TriObserverLocal")
export class TriObserverLocal extends Tw2BaseClass
{

    @meta.string
    name = "";

    @meta.vector3
    front = vec3.create();

    @meta.struct()
    observer = null;

}
