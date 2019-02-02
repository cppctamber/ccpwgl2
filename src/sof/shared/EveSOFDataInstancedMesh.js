import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataInstancedMesh
 *
 * @property {String} geometryResPath             -
 * @property {Array.<Vector>} instances           -
 * @property {Number} lowestLodVisible            -
 * @property {String} shader                      -
 * @property {Array.<EveSOFDataTexture>} textures -
 */
export class EveSOFDataInstancedMesh extends Tw2BaseClass
{

    geometryResPath = "";
    instances = [];
    lowestLodVisible = 0;
    shader = "";
    textures = [];

}

Tw2BaseClass.define(EveSOFDataInstancedMesh, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataInstancedMesh",
        props: {
            geometryResPath: Type.PATH,
            instances: [["Vector"]],
            lowestLodVisible: Type.NUMBER,
            shader: Type.STRING,
            textures: [["EveSOFDataTexture"]]
        }
    };
});

