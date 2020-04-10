import { meta } from "global";


@meta.type("EveSOFDataAreaMaterial", true)
export class EveSOFDataAreaMaterial
{

    @meta.string
    name ="";

    @meta.black.uint
    colorType = 0;

    @meta.black.string
    material1 = "";

    @meta.black.string
    material2 = "";

    @meta.black.string
    material3 = "";

    @meta.black.string
    material4 = "";

    /**
     * Assigns the value of the area material to an object
     * @param {Object} out
     * @returns {Object}
     */
    Assign(out={})
    {
        out.name = this.name;
        out.colorType = this.colorType;
        out.material1 = this.material1;
        out.material2 = this.material2;
        out.material3 = this.material3;
        out.material4 = this.material4;
        return out;
    }

}
