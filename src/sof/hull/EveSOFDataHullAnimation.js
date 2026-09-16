import { meta } from "utils";
import { quat, vec3 } from "math";


@meta.define("EveSOFDataHullAnimation", true)
export class EveSOFDataHullAnimation extends meta.Model
{

    // Carbon defaults every time, rate and id to -1 (`EveSOFData.cpp:529-543`); each is a
    // sentinel `SetupChildrenAndAnimations` tests before it builds a curve
    // (`EveSOF.cpp:2063`, `:2086`, `:2119`), so a zero default builds curves the hull
    // never authored

    @meta.string
    name = "";

    @meta.float
    endRate = -1;

    @meta.float
    endRotationTime = -1;

    @meta.quaternion
    endRotationValue = quat.create();

    @meta.float
    endTranslationTime = -1;

    @meta.vector3
    endTranslationValue = vec3.create();

    @meta.int32
    id = -1;

    @meta.float
    startRate = -1;

    @meta.float
    startRotationTime = -1;

    @meta.quaternion
    startRotationValue = quat.create();

    @meta.float
    startTranslationTime = -1;

    @meta.vector3
    startTranslationValue = vec3.create();

}
