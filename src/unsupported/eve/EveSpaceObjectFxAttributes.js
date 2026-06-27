import { meta } from "utils";
import { quat, vec3 } from "math";

/**
 * EveSpaceObjectFxAttributes
 *
 */
@meta.notImplemented
@meta.type("EveSpaceObjectFxAttributes")
@meta.define({
    wgl: "EveSpaceObjectFxAttributes",
    ccp: true
})
export class EveSpaceObjectFxAttributes extends meta.Model
{

    @meta.string
    name = "";

    source = null;
    activationStrength = 1;
    boundingSphereRadius = 0;
    generatedShapeEllipsoidCenter = vec3.create();
    generatedShapeEllipsoidRadius = vec3.create();
    activeTurretCount = 0;
    parentWorldTranslation = vec3.create();
    parentWorldRotation = quat.create();
    ship = 0;
    childParent = 0;
    killCount = 0;

}
