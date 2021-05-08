import { meta } from "utils";
import { EveChild } from "eve/child";
import { vec4, quat } from "math";


@meta.notImplemented
@meta.type("EveLineChildContainer", true)
export class EveLineChildContainer extends EveChild
{

    // @meta.struct("EveCurveLineSet")
    // lineSet = null;

    @meta.list()
    lines = [];

    @meta.quaternion
    rotation = quat.create();

}
