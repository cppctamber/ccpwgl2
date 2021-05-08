import { meta } from "utils/index";
import { EveChild } from "eve/child";
import { vec4 } from "math";


@meta.notImplemented
@meta.type("EveChildSpherePin")
export class EveChildSpherePin extends EveChild
{

    @meta.string
    name =  "";

    @meta.vector3
    centerNormal = vec4.fromValues(0,0,0);

    @meta.float
    pinRadius = 0;

    @meta.float
    pinMaxRadius = 0;

    @meta.struct()
    mesh = null;

    @meta.uint
    minScreenSize = 0;

}
