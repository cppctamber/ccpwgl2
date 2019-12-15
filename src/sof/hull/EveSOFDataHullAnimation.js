import { meta, quat } from "global";


@meta.type("EveSOFDataHullAnimation", true)
export class EveSOFDataHullAnimation
{

    @meta.black.string
    name = "";

    @meta.black.float
    endRate = 0;

    @meta.black.float
    endRotationTime = 0;

    @meta.black.quaternion
    endRotationValue = quat.create();

    @meta.black.uint
    id = 0;

    @meta.black.float
    startRate = 0;

    @meta.black.float
    startRotationTime = 0;

    @meta.black.quaternion
    startRotationValue = quat.create();

}
