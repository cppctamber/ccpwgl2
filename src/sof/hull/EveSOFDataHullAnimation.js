import {quat} from "../../global";
import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullAnimation
 *
 * @property {String} name              -
 * @property {Number} endRate           -
 * @property {Number} endRotationTime   -
 * @property {quat} endRotationValue    -
 * @property {Number} id                -
 * @property {Number} startRate         -
 * @property {Number} startRotationTime -
 * @property {quat} startRotationValue  -
 */
export class EveSOFDataHullAnimation extends EveSOFBaseClass
{

    name = "";
    endRate = 0;
    endRotationTime = 0;
    endRotationValue = quat.create();
    id = 0;
    startRate = 0;
    startRotationTime = 0;
    startRotationValue = quat.create();

}

EveSOFDataHullAnimation.define(r =>
{
    return {
        type: "EveSOFDataHullAnimation",
        black: [
            ["endRate", r.float],
            ["endRotationTime", r.float],
            ["endRotationValue", r.vector4],
            ["id", r.uint],
            ["name", r.string],
            ["startRate", r.float],
            ["startRotationTime", r.float],
            ["startRotationValue", r.vector4]
        ]
    };
});