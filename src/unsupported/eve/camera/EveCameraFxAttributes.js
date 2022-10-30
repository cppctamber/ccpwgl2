import { meta } from "utils";
import { quat } from "math";


@meta.notImplemented
@meta.type("EveCameraFxAttributes", true)
export class EveCameraFxAttributes extends meta.Model
{

    @meta.list()
    fxAttributes = [];

    @meta.quaternion
    cameraRotation = quat.create();

}
