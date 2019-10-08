/**
 * EveSOFDataPatternLayer
 *
 * @property {Boolean} isTargetMtl1      -
 * @property {Boolean} isTargetMtl2      -
 * @property {Boolean} isTargetMtl3      -
 * @property {Boolean} isTargetMtl4      -
 * @property {Number} materialSource     -
 * @property {Number} projectionTypeU    -
 * @property {Number} projectionTypeV    -
 * @property {String} textureName        -
 * @property {String} textureResFilePath -
 */
export class EveSOFDataPatternLayer
{

    isTargetMtl1 = true;
    isTargetMtl2 = true;
    isTargetMtl3 = true;
    isTargetMtl4 = true;
    materialSource = 0;
    projectionTypeU = 0;
    projectionTypeV = 0;
    textureName = "";
    textureResFilePath = "";

    /**
     * Gets an address mode from a projection type
     * @param {Number} projectionType
     * @returns {Number}
     */
    static ToAddress(projectionType)
    {
        switch (projectionType)
        {
            case 2:
                return 4;

            case 1:
                return 3;

            default:
                return 1;
        }
    }

    /**
     * Gets a projection type from an address mode
     * @param {Number} addressMode
     * @returns {Number}
     */
    static FromProjection(addressMode)
    {
        switch (addressMode)
        {
            case 4:
                return 2;

            case 3:
                return 1;

            default:
                return 0;
        }
    }


    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "isTargetMtl1", r.boolean ],
            [ "isTargetMtl2", r.boolean ],
            [ "isTargetMtl3", r.boolean ],
            [ "isTargetMtl4", r.boolean ],
            [ "materialSource", r.uint ],
            [ "projectionTypeU", r.uint ],
            [ "projectionTypeV", r.uint ],
            [ "textureName", r.string ],
            [ "textureResFilePath", r.path ]
        ];
    }
}
