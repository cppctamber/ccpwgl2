import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataGenericDecalShader
 *
 * @property {Array.<EveSOFDataParameter>} defaultParameters  -
 * @property {Array.<EveSOFDataTexture>} defaultTextures      -
 * @property {Array.<EveSOFDataGenericString>} parameters     -
 * @property {Array.<EveSOFDataGenericString>} parentTextures -
 * @property {String} shader                                  -
 */
export class EveSOFDataGenericDecalShader extends EveSOFBaseClass
{

    defaultTextures = [];
    parameters = [];
    parentTextures = [];
    shader = "";

}

EveSOFDataGenericDecalShader.define(r =>
{
    return {
        type: "EveSOFDataGenericDecalShader",
        black: [
            ["defaultTextures", r.array],
            ["parameters", r.array],
            ["parentTextures", r.array],
            ["shader", r.string],
        ]
    };
});