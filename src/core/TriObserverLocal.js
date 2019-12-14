import { meta, vec3, Tw2BaseClass } from "global";

/**
 * TriObserverLocal
 *
 * @property {vec3} front -
 */
@meta.notImplemented
@meta.type("TriObserverLocal")
export class TriObserverLocal extends Tw2BaseClass
{

    @meta.black.vector3
    front = vec3.create();

}
