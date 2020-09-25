import { meta, quat } from "global";


@meta.ctor("EveSOFDataHullAnimation")
export class EveSOFDataHullAnimation
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
