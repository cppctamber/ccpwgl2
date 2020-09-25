import { meta, vec3, Tw2BaseClass } from "global";


/**
 * EveLocalPositionCurve
 *
 * @property {vec3} value -
 */
@meta.notImplemented
@meta.ctor("EveLocalPositionCurve")
export class EveLocalPositionCurve extends Tw2BaseClass
{

    @meta.vector3
    value = vec3.create();

}
