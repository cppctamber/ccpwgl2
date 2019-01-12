import {Tw2BaseClass} from "../../../global";

/**
 * EveSOFDataFactionChild
 *
 * @property {Number} groupIndex -
 * @property {Boolean} isVisible -
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

