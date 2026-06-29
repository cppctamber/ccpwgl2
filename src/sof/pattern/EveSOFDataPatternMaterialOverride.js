import { meta } from "utils";


@meta.type("EveSOFDataPatternMaterialOverride")
@meta.define({
    wgl: "EveSOFDataPatternMaterialOverride",
    ccp: true
})
export class EveSOFDataPatternMaterialOverride extends meta.Model
{

    @meta.boolean
    isTargetMtl1 = true;

    @meta.boolean
    isTargetMtl2 = true;

    @meta.boolean
    isTargetMtl3 = true;

    @meta.boolean
    isTargetMtl4 = true;

    /**
     * Gets source-shaped material targets.
     * @param {boolean[]} [out=[]]
     * @returns {boolean[]} out
     */
    GetTargets(out = [])
    {
        out[0] = this.isTargetMtl1;
        out[1] = this.isTargetMtl2;
        out[2] = this.isTargetMtl3;
        out[3] = this.isTargetMtl4;
        return out;
    }

}
