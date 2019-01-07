import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataInstancedMesh
 *
 * @parameter {String} geometryResPath             -
 * @parameter {Array.<Vector>} instances           -
 * @parameter {Number} lowestLodVisible            -
 * @parameter {String} shader                      -
 * @parameter {Array.<EveSOFDataTexture>} textures -
 */
export default class EveSOFDataInstancedMesh extends Tw2StagingClass
{

    geometryResPath = "";
    instances = [];
    lowestLodVisible = 0;
    shader = "";
    textures = [];

}

Tw2StagingClass.define(EveSOFDataInstancedMesh, Type =>
{
    return {
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

