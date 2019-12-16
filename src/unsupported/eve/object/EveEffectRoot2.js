import { meta, quat, vec3, vec4 } from "global";
import { EveObject } from "eve/object/EveObject";


@meta.notImplemented
@meta.type("EveEffectRoot2", true)
export class EveEffectRoot2 extends EveObject
{

    @meta.black.string
    name = "";

    @meta.black.vector3
    boundingSphereCenter = vec3.create();

    @meta.black.float
    boundingSphereRadius = 0;

    @meta.black.listOf("Tw2CurveSet")
    curveSets = [];

    @meta.black.float
    duration = 0;

    @meta.black.boolean
    dynamicLOD = false;

    @meta.black.listOf("EveChild")
    effectChildren = [];

    @meta.black.listOf("Tr2PointLight")
    lights = [];

    @meta.black.listOf("TriObserverLocal")
    observers = [];

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.black.color
    secondaryLightingEmissiveColor = vec4.create();

    @meta.black.float
    secondaryLightingSphereRadius = 0;

    @meta.black.vector3
    translation = vec3.create();

}
