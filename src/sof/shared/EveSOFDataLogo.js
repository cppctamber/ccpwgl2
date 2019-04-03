/**
 * EveSOFDataLogo
 *
 * @parameter {Array<EveSOFDataTexture>} textures
 */
export class EveSOFDataLogo
{

    textures = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["textures", r.array]
        ];
    }
}