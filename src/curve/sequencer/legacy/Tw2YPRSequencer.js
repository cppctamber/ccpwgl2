import { meta } from "utils";
import { quat, vec3 } from "math";
import { Tw2CurveSequencer } from "../Tw2CurveSequencer";


@meta.type("Tw2YPRSequencer")
export class Tw2YPRSequencer extends Tw2CurveSequencer
{

    @meta.quaternion
    @meta.isPrivate
    value = quat.create();

    @meta.vector3
    @meta.isPrivate
    YawPitchRoll = vec3.create();

    @meta.struct("Tw2Curve")
    YawCurve = null;

    @meta.struct("Tw2Curve")
    PitchCurve = null;

    @meta.struct("Tw2Curve")
    RollCurve = null;

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
     *
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.value);
    }

    /**
     * Gets a value at a specific time
     *
     * @param {number} time
     * @param {quat} value
     * @returns {quat}
     */
    GetValueAt(time, value)
    {
        if (this.YawCurve) this.YawPitchRoll[0] = this.YawCurve.GetValueAt(time);
        if (this.PitchCurve) this.YawPitchRoll[1] = this.PitchCurve.GetValueAt(time);
        if (this.RollCurve) this.YawPitchRoll[2] = this.RollCurve.GetValueAt(time);

        const
            sinYaw = Math.sin(this.YawPitchRoll[0] / 180 * Math.PI / 2.0),
            cosYaw = Math.cos(this.YawPitchRoll[0] / 180 * Math.PI / 2.0),
            sinPitch = Math.sin(this.YawPitchRoll[1] / 180 * Math.PI / 2.0),
            cosPitch = Math.cos(this.YawPitchRoll[1] / 180 * Math.PI / 2.0),
            sinRoll = Math.sin(this.YawPitchRoll[2] / 180 * Math.PI / 2.0),
            cosRoll = Math.cos(this.YawPitchRoll[2] / 180 * Math.PI / 2.0);

        value[0] = sinYaw * cosPitch * sinRoll + cosYaw * sinPitch * cosRoll;
        value[1] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
        value[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
        value[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;

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
    static childProperties = [ "YawCurve", "PitchCurve", "RollCurve" ];

}
