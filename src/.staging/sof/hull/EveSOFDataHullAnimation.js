import {quat} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataHullAnimation
 *
 * @parameter {Number} endRate           -
 * @parameter {Number} endRotationTime   -
 * @parameter {quat} endRotationValue    -
 * @parameter {Number} id                -
 * @parameter {Number} startRate         -
 * @parameter {Number} startRotationTime -
 * @parameter {quat} startRotationValue  -
 */
export default class EveSOFDataHullAnimation extends Tw2BaseClass
{

    endRate = 0;
    endRotationTime = 0;
    endRotationValue = quat.create();
    id = 0;
    startRate = 0;
    startRotationTime = 0;
    startRotationValue = quat.create();

}

Tw2BaseClass.define(EveSOFDataHullAnimation, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataHullAnimation",
        props: {
            endRate: Type.NUMBER,
            endRotationTime: Type.NUMBER,
            endRotationValue: Type.TR_ROTATION,
            id: Type.NUMBER,
            startRate: Type.NUMBER,
            startRotationTime: Type.NUMBER,
            startRotationValue: Type.TR_ROTATION
        }
    };
});

