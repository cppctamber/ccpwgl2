import { meta } from "global";


@meta.type("EveSOFDataPatternPerHull", true)
export class EveSOFDataPatternPerHull
{

    @meta.black.string
    name = "";

    @meta.black.objectOf("EveSOFDataPatternTransform")
    transformLayer1 = null;

    @meta.black.objectOf("EveSOFDataPatternTransform")
    transformLayer2 = null;


    /**
     * Reduces transforms to an array
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    AssignTransforms(out = [])
    {
        if (this.transformLayer1) out[0] = this.transformLayer1.Reduce();
        if (this.transformLayer2) out[1] = this.transformLayer2.Reduce();
        return out;
    }

}
