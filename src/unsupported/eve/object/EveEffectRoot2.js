import { meta, quat, vec3, vec4 } from "global";
import { EveObject } from "eve/object/EveObject";


@meta.notImplemented
@meta.ctor("EveEffectRoot2")
export class EveEffectRoot2 extends EveObject
{

    @meta.string
    name = "";

    @meta.vector3
    boundingSphereCenter = vec3.create();

    @meta.float
    boundingSphereRadius = 0;

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.float
    duration = 0;

    @meta.boolean
    dynamicLOD = false;

    @meta.list("EveChild")
    effectChildren = [];

    @meta.list("Tr2PointLight")
    lights = [];

    @meta.list("TriObserverLocal")
    observers = [];

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.color
    secondaryLightingEmissiveColor = vec4.create();

    @meta.float
    secondaryLightingSphereRadius = 0;

    @meta.vector3
    translation = vec3.create();

}
