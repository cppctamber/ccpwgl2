/**
 * EveSOFDataGenericDecalShader
 *
 * @property {Array.<EveSOFDataParameter>} defaultParameters  -
 * @property {Array.<EveSOFDataTexture>} defaultTextures      -
 * @property {Array.<EveSOFDataGenericString>} parameters     -
 * @property {Array.<EveSOFDataGenericString>} parentTextures -
 * @property {String} shader                                  -
 */
export class EveSOFDataGenericDecalShader
{

    defaultTextures = [];
    parameters = [];
    parentTextures = [];
    shader = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["defaultTextures", r.array],
            ["parameters", r.array],
            ["parentTextures", r.array],
            ["shader", r.string],
        ];
    }
}