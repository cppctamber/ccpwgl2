import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataHullPlaneSet
 *
 * @property {Number} atlasSize                         -
 * @property {Array.<EveSOFDataHullPlaneSetItem>} items -
 * @property {String} layer1MapResPath                  -
 * @property {String} layer2MapResPath                  -
 * @property {String} maskMapResPath                    -
 * @property {Boolean} skinned                          -
 * @property {Number} usage                             -
 */
export class EveSOFDataHullPlaneSet extends Tw2BaseClass
{

    atlasSize = 0;
    items = [];
    layer1MapResPath = "";
    layer2MapResPath = "";
    maskMapResPath = "";
    skinned = false;
    usage = 0;

}

Tw2BaseClass.define(EveSOFDataHullPlaneSet, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataHullPlaneSet",
        props: {
            atlasSize: Type.NUMBER,
            items: [["EveSOFDataHullPlaneSetItem"]],
            layer1MapResPath: Type.PATH,
            layer2MapResPath: Type.PATH,
            maskMapResPath: Type.PATH,
            skinned: Type.BOOLEAN,
            usage: Type.NUMBER
        }
    };
});

