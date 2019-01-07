import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullPlaneSet
 *
 * @parameter {Number} atlasSize                         -
 * @parameter {Array.<EveSOFDataHullPlaneSetItem>} items -
 * @parameter {String} layer1MapResPath                  -
 * @parameter {String} layer2MapResPath                  -
 * @parameter {String} maskMapResPath                    -
 * @parameter {Boolean} skinned                          -
 * @parameter {Number} usage                             -
 */
export default class EveSOFDataHullPlaneSet extends Tw2StagingClass
{

    atlasSize = 0;
    items = [];
    layer1MapResPath = "";
    layer2MapResPath = "";
    maskMapResPath = "";
    skinned = false;
    usage = 0;

}

Tw2StagingClass.define(EveSOFDataHullPlaneSet, Type =>
{
    return {
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

