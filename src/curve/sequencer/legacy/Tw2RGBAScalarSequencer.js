import { meta, vec4 } from "global";
import { Tw2CurveSequencer } from "../Tw2CurveSequencer";


@meta.ctor("Tw2RGBAScalarSequencer")
export class Tw2RGBAScalarSequencer extends Tw2CurveSequencer
{

    @meta.vector4
    @meta.isPrivate
    value = vec4.create();

    @meta.struct("Tw2Curve")
    RedCurve = null;

    @meta.struct("Tw2Curve")
    GreenCurve = null;

    @meta.struct("Tw2Curve")
    BlueCurve = null;

    @meta.struct("Tw2Curve")
    AlphaCurve = null;


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
     * Updates the current value at a specific time
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.value);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {vec4} value
     * @returns {vec4}
     */
    GetValueAt(time, value)
    {
        value[0] = this.RedCurve ? this.RedCurve.GetValueAt(time) : 0;
        value[1] = this.GreenCurve ? this.GreenCurve.GetValueAt(time) : 0;
        value[2] = this.BlueCurve ? this.BlueCurve.GetValueAt(time) : 0;
        value[3] = this.AlphaCurve ? this.AlphaCurve.GetValueAt(time) : 0;
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
    static outputDimension = 4;

    /**
     * The sequencer's current value property
     * @type {String}
     */
    static valueProperty = "value";

    /**
     * The sequencer's type
     * @type {number}
     */
    static curveType = Tw2CurveSequencer.Type.SEQUENCER2;

    /**
     * The sequencer's curve property names
     * @type {String[]}
     */
    static childProperties = [ "RedCurve", "GreenCurve", "BlueCurve", "AlphaCurve" ];

}
