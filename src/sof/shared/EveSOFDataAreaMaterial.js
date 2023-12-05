import { __get, assignIfExists, isNoU, meta } from "utils";


@meta.type("EveSOFDataAreaMaterial")
export class EveSOFDataAreaMaterial extends meta.Model
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
        out.name = this.name;
        out.colorType = this.colorType;
        if (this.material1) out.material1 = this.material1;
        if (this.material2) out.material2 = this.material2;
        if (this.material3) out.material3 = this.material3;
        if (this.material4) out.material4 = this.material4;
        return out;
    }

    /**
     * Merges two area materials
     * @param {EveSOFDataAreaMaterial} [a]
     * @param {EveSOFDataAreaMaterial} b
     * @param {EveSOFDataAreaMaterial} [out]
     * @returns {EveSOFDataAreaMaterial|null}
     */
    static combine(a, b, out)
    {
        // For now assume if the parent doesn't exist it can't be overridden
        if (!a) return null;

        out = out || new this();

        // Use the parent's name (they should match anyway)
        out.name = a.name;

        // Assume that b's values can be null or undefined
        out.colorType = __get(b, "colorType", a);
        out.material1 = __get(b, "material1", a);
        out.material2 = __get(b, "material2", a);
        out.material3 = __get(b, "material3", a);
        out.material4 = __get(b, "material4", a);
        return out;
    }

}
