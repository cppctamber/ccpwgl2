import { meta } from "utils";


@meta.ctor("EveSOFDataAreaMaterial")
export class EveSOFDataAreaMaterial
{

    @meta.string
    name = "";

    @meta.uint
    colorType = 0;

    @meta.string
    material1 = "";

    @meta.string
    material2 = "";

    @meta.string
    material3 = "";

    @meta.string
    material4 = "";

    /**
     * TEMPORARY
     * @param {Object} out
     * @returns {{}}
     */
    Assign(out = {})
    {
        out.colorType = this.colorType;
        if (this.material1) out.material1 = this.material1;
        if (this.material2) out.material2 = this.material2;
        if (this.material3) out.material3 = this.material3;
        if (this.material4) out.material4 = this.material4;
        return out;
    }

}
