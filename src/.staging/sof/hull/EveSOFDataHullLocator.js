import {mat4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullLocator
 *
 * @parameter {mat4} transform -
 */
export default class EveSOFDataHullLocator extends Tw2StagingClass
{

    transform = mat4.create();

}

Tw2StagingClass.define(EveSOFDataHullLocator, Type =>
{
    return {
        type: "EveSOFDataHullLocator",
        props: {
            transform: Type.MATRIX4
        }
    };
});

