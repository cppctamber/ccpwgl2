import { meta } from "utils";
import { quat } from "math";


@meta.type("EveSOFDataHullAnimation")
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

    @meta.uint
    id = 0;

    @meta.float
    startRate = 0;

    @meta.float
    startRotationTime = 0;

    @meta.quaternion
    startRotationValue = quat.create();

}
