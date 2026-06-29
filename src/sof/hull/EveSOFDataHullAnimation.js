import { meta } from "utils";
import { quat, vec3 } from "math";


@meta.type("EveSOFDataHullAnimation")
@meta.define({
    wgl: "EveSOFDataHullAnimation",
    ccp: true
})
export class EveSOFDataHullAnimation extends meta.Model
{

    @meta.string
    name = "";

    @meta.float
    endRate = 0;

    @meta.float
    endRotationTime = 0;

    @meta.quaternion
    endRotationValue = quat.create();

    @meta.float
    endTranslationTime = 0;

    @meta.vector3
    endTranslationValue = vec3.create();

    @meta.uint
    id = 0;

    @meta.float
    startRate = 0;

    @meta.float
    startRotationTime = 0;

    @meta.quaternion
    startRotationValue = quat.create();

    @meta.float
    startTranslationTime = 0;

    @meta.vector3
    startTranslationValue = vec3.create();

}
