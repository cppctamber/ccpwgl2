import { meta, vec3 } from "global";


/**
 * EveLocalPositionCurve
 *
 * @property {vec3} value -
 */
@meta.notImplemented
@meta.ctor("EveLocalPositionCurve")
export class EveLocalPositionCurve extends meta.Model
{

    @meta.vector3
    value = vec3.create();

}
