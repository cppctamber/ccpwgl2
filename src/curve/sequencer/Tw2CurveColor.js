import { meta } from "utils";
import { vec4 } from "math";
import { Tw2CurveSequencer } from "./Tw2CurveSequencer";


@meta.type("Tw2CurveColor", "Tr2CurveColor")
@meta.stage(2)
export class Tw2CurveColor extends Tw2CurveSequencer
{

    @meta.string
    name = "";

    @meta.raw("Tr2CurveScalar")
    r = null;

    @meta.raw("Tr2CurveScalar")
    g = null;

    @meta.raw("Tr2CurveScalar")
    b = null;

    @meta.raw("Tr2CurveScalar")
    a = null;

    @meta.color
    @meta.isPrivate
    currentValue = vec4.create();

    @meta.notImplemented
    @meta.boolean
    srgbOutput = false;

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
     * Updates the current value at the given time
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.currentValue);
    }

    /**
     * Gets a value at a specific time
     * @param {Number} time
     * @param {vec4} value
     * @returns {vec4}
     */
    GetValueAt(time, value)
    {
        value[0] = this.r ? this.r.GetValueAt(time) : 0;
        value[1] = this.g ? this.g.GetValueAt(time) : 0;
        value[2] = this.b ? this.b.GetValueAt(time) : 0;
        value[3] = this.a ? this.a.GetValueAt(time) : 0;
        return value;
    }

    /**
     * The sequencer's curve input dimension
     * @type {number}
     */
    static inputDimension = 1;

    /**
     * The sequencer's output dimension
     * @type {number}
     */
    static outputDimension = 4;

    /**
     * The sequencer's current value property
     * @type {String}
     */
    static valueProperty = "currentValue";

    /**
     * The sequencer's type
     * @type {number}
     */
    static curveType = Tw2CurveSequencer.Type.SEQUENCER;

    /**
     * The sequencer's curve property names
     * @type {?Array.<string>}
     */
    static childProperties = [ "r", "g", "b", "a" ];

}
