import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataFactionChild
 *
 * @parameter {Number} groupIndex -
 * @parameter {Boolean} isVisible -
 */
export default class EveSOFDataFactionChild extends Tw2BaseClass
{

    groupIndex = 0;
    isVisible = false;

}

Tw2BaseClass.define(EveSOFDataFactionChild, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataFactionChild",
        props: {
            groupIndex: Type.NUMBER,
            isVisible: Type.BOOLEAN
        }
    };
});

