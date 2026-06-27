import { meta } from "utils";
import { vec3,  mat4 } from "math";


@meta.notImplemented
@meta.type("EveChildInstanceContainer")
@meta.define({
    wgl: "EveChildInstanceContainer",
    ccp: true
})
export class EveChildInstanceContainer extends meta.Model
{

    @meta.struct()
    source = null;

    @meta.vector3
    scaling = vec3.fromValues(1,1,1);

    @meta.boolean
    useStaticRotation = false;

    //@meta.matrix4
    //localTransform = mat4.create()

}
