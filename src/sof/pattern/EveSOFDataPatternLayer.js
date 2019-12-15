import { meta } from "global";


@meta.type("EveSOFDataPatternLayer", true)
export class EveSOFDataPatternLayer
{

    @meta.black.boolean
    isTargetMtl1 = true;

    @meta.black.boolean
    isTargetMtl2 = true;

    @meta.black.boolean
    isTargetMtl3 = true;

    @meta.black.boolean
    isTargetMtl4 = true;

    @meta.black.uint
    materialSource = 0;

    @meta.black.uint
    projectionTypeU = 0;

    @meta.black.uint
    projectionTypeV = 0;

    @meta.black.string
    textureName = "";

    @meta.black.path
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

}
