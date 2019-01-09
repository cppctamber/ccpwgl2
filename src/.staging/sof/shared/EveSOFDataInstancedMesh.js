import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataInstancedMesh
 *
 * @parameter {String} geometryResPath             -
 * @parameter {Array.<Vector>} instances           -
 * @parameter {Number} lowestLodVisible            -
 * @parameter {String} shader                      -
 * @parameter {Array.<EveSOFDataTexture>} textures -
 */
export default class EveSOFDataInstancedMesh extends Tw2BaseClass
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

