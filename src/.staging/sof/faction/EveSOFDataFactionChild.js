import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataFactionChild
 *
 * @parameter {Number} groupIndex -
 * @parameter {Boolean} isVisible -
 */
export default class EveSOFDataFactionChild extends Tw2StagingClass
{

    groupIndex = 0;
    isVisible = false;

}

Tw2StagingClass.define(EveSOFDataFactionChild, Type =>
{
    return {
        type: "EveSOFDataFactionChild",
        props: {
            groupIndex: Type.NUMBER,
            isVisible: Type.BOOLEAN
        }
    };
});

