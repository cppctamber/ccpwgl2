import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullController
 *
 * @parameter {String} path -
 */
export default class EveSOFDataHullController extends Tw2StagingClass
{

    path = "";

}

Tw2StagingClass.define(EveSOFDataHullController, Type =>
{
    return {
        type: "EveSOFDataHullController",
        props: {
            path: Type.PATH
        }
    };
});

