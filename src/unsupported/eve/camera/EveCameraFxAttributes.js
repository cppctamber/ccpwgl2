import { meta } from "utils";
import { quat } from "math";


@meta.notImplemented
@meta.type("EveCameraFxAttributes", true)
export class EveCameraFxAttributes extends meta.Model
{

    @meta.string
    name = "";

    @meta.list()
    @meta.notImplemented
    fxAttributes = [];

    @meta.quaternion
    @meta.notImplemented
    cameraRotation = quat.create();

    @meta.quaternion
    @meta.notImplemented
    objectRotation = quat.create();

    @meta.quaternion
    @meta.notImplemented
    rotationWithChildTransform = quat.create();

    @meta.float
    @meta.notImplemented
    distanceToCamera = 0;

    @meta.float
    @meta.notImplemented
    lookAngleToObject = 0;


    /**
     * Per frame update
     *
     */
    @meta.notImplemented
    Update()
    {
        // Nothing yet
    }

}
