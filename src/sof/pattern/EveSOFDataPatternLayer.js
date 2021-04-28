import { meta } from "utils";


@meta.type("EveSOFDataPatternLayer")
export class EveSOFDataPatternLayer extends meta.Model
{

    @meta.boolean
    isTargetMtl1 = true;

    @meta.boolean
    isTargetMtl2 = true;

    @meta.boolean
    isTargetMtl3 = true;

    @meta.boolean
    isTargetMtl4 = true;

    @meta.uint
    materialSource = 0;

    @meta.uint
    projectionTypeU = 0;

    @meta.uint
    projectionTypeV = 0;

    @meta.string
    textureName = "";

    @meta.path
    textureResFilePath = "";

    /**
     * Gets an address mode from a projection type
     * @param {Number} projectionType
     * @returns {Number}
     */
    static ToAddressMode(projectionType)
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
    static FromAddressMode(addressMode)
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

}
