import { meta, quat, vec3 } from "global";
import { EveObject } from "eve/object/EveObject";


@meta.notImplemented
@meta.ctor("EveRootTransform")
export class EveRootTransform extends EveObject
{

    @meta.string
    name = "";

    @meta.float
    boundingSphereRadius = 0;

    @meta.list("EveObject")
    children = [];

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.boolean
    display = false;

    @meta.struct("Tw2Mesh")
    mesh = null;

    @meta.uint
    modifier = 0;

    @meta.list("TriObserverLocal")
    observers = [];

    @meta.quaternion
    rotation = quat.create();

    @meta.struct("Tw2Curve") //Tr2CurveConstant, Tr2RotationAdapter
    rotationCurve = null;

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.float
    sortValueMultiplier = 0;

    @meta.vector3
    translation = vec3.create();

    @meta.struct("Tw2Curve") //Tr2CurveConstant, Tr2TranslationAdapter
    translationCurve = null;

}

