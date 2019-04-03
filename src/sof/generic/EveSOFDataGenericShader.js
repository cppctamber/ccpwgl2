/**
 * EveSOFDataGenericShader
 *
 * @property {Array.<EveSOFDataParameter>} defaultParameters -
 * @property {Array.<EveSOFDataTexture>} defaultTextures     -
 * @property {Boolean} doGenerateDepthArea                   -
 * @property {Array.<EveSOFDataGenericString>} parameters    -
 * @property {String} shader                                 -
 * @property {Array.<EveSOFData
 * @property {String} transparencyTextureName                -
 */
export class EveSOFDataGenericShader
{

    defaultParameters = [];
    defaultTextures = [];
    doGenerateDepthArea = false;
    parameters = [];
    shader = "";
    transparencyTextureName = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["defaultParameters", r.array],
            ["defaultTextures", r.array],
            ["doGenerateDepthArea", r.boolean],
            ["parameters", r.array],
            ["shader", r.string],
            ["transparencyTextureName", r.string],
        ];
    }
}