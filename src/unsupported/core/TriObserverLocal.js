import { meta, vec3, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("TriObserverLocal", true)
export class TriObserverLocal extends Tw2BaseClass
{

    @meta.black.vector3
    front = vec3.create();

}
