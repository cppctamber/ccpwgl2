import { meta } from "utils";
import { quat } from "math";
import { Tw2CurveSequencer } from "../Tw2CurveSequencer";


@meta.type("Tw2EulerRotation")
export class Tw2EulerRotation extends Tw2CurveSequencer
{

    @meta.struct("Tw2Curve")
    yawCurve = null;

    @meta.struct("Tw2Curve")
    pitchCurve = null;

    @meta.struct("Tw2Curve")
    rollCurve = null;

    @meta.quaternion
    @meta.isPrivate
    currentValue = quat.create();


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
        this.GetValueAt(time, this.currentValue);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {quat} value
     * @returns {quat}
     */
    GetValueAt(time, value)
    {
        const
            yaw = this.yawCurve ? this.yawCurve.GetValueAt(time) : 0.0,
            pitch = this.pitchCurve ? this.pitchCurve.GetValueAt(time) : 0.0,
            roll = this.rollCurve ? this.rollCurve.GetValueAt(time) : 0.0;

        const
            sinYaw = Math.sin(yaw / 2.0),
            cosYaw = Math.cos(yaw / 2.0),
            sinPitch = Math.sin(pitch / 2.0),
            cosPitch = Math.cos(pitch / 2.0),
            sinRoll = Math.sin(roll / 2.0),
            cosRoll = Math.cos(roll / 2.0);

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
    static valueProperty = "currentValue";

    /**
     * The sequencer's type
     * @type {number}
     */
    static curveType = Tw2CurveSequencer.Type.SEQUENCER2;

    /**
     * The sequencer's curve property names
     * @type {Array<String>}
     */
    static childProperties = [ "yawCurve", "pitchCurve", "rollCurve" ];

}
