import { meta, vec3 } from "global";
import { Tw2CurveAdapter } from "./Tw2CurveAdapter";


@meta.notImplemented
@meta.type("Tr2TranslationAdapter", true)
export class Tr2TranslationAdapter extends Tw2CurveAdapter
{

    @meta.black.objectOf("Tw2Curve"])
    curve = null;

    @meta.black.vector3
    value = vec3.create();


    /**
     * Gets value at a given time
     * @param {Number} time
     * @param {*} value
     * @returns {vec3}
     */
    GetValueAt(time, value)
    {
        if (this.curve)
        {
            this.curve.GetValueAt(time, this.value);
        }

        return vec3.copy(value, this.value);
    }

    /**
     * The sequencer's output dimension
     * @type {number}
     */
    static outputDimension = 3;

}
