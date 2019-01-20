import {mat4} from "../../global";
import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataHullLocator
 *
 * @property {mat4} transform -
 */
export default class EveSOFDataHullLocator extends Tw2BaseClass
{

    transform = mat4.create();

}

Tw2BaseClass.define(EveSOFDataHullLocator, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataHullLocator",
        props: {
            transform: Type.MATRIX4
        }
    };
});

