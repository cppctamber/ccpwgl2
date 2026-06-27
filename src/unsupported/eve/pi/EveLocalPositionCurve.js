import { meta } from "utils";
import { vec3 } from "math";


/**
 * EveLocalPositionCurve
 *
 * @property {vec3} value -
 */
@meta.notImplemented
@meta.type("EveLocalPositionCurve")
@meta.define({
    wgl: "EveLocalPositionCurve",
    ccp: true
})
export class EveLocalPositionCurve extends meta.Model
{

    @meta.vector3
    value = vec3.create();

}
