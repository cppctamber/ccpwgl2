import { Tw2CurveSequencer } from "./Tw2CurveSequencer";
import { meta, vec3 } from "global";


@meta.type("Tw2CurveVector3", "Tr2CurveVector3")
@meta.stage(2)
export class Tw2CurveVector3 extends Tw2CurveSequencer
{

    @meta.black.string
    name = "";

    @meta.black.rawOf("Tr2CurveScalar")
    x = null;

    @meta.black.rawOf("Tr2CurveScalar")
    y = null;

    @meta.black.rawOf("Tr2CurveScalar")
    z = null;

    @meta.vector3
    @meta.isPrivate
    currentValue = vec3.create();


    /**
     * Sorts the sequencer
     */
    Sort()
    {
        Tw2CurveSequencer.Sort2(this);
    }

    /**
     * Gets sequencer length
     * @returns {number}
     */
    GetLength()
    {
        return Tw2CurveSequencer.GetLengthFromProperties(this);
    }

    /**
     * Updates a value at a specific time
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.currentValue);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {vec3} value
     * @returns {vec3}
     */
    GetValueAt(time, value)
    {
        value[0] = this.x ? this.x.GetValueAt(time) : 0;
        value[1] = this.y ? this.y.GetValueAt(time) : 0;
        value[2] = this.z ? this.z.GetValueAt(time) : 0;
        return value;
    }

    /**
     * The sequencer's curve dimension
     * @type {number}
     */
    static inputDimension = 1;

    /**
     * The sequencer's dimension
     * @type {number}
     */
    static outputDimension = 3;

    /**
     * The sequencer's current value property
     * @type {String}
     */
    static valueProperty = "currentValue";

    /**
     * The sequencer's type
     * @type {number}
     */
    static curveType = Tw2CurveSequencer.Type.SEQUENCER2;

    /**
     * The sequencer's curve property names
     * @type {String[]}
     */
    static childProperties = [ "x", "y", "z" ];

}
