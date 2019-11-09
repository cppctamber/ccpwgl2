import { Tw2CurveSequencer } from "./Tw2CurveSequencer";
import { quat } from "global";

/**
 * Euler to Quaternion sequencer
 * @ccp Tr2CurveEulerRotation
 *
 * @property {Tr2CurveScalar} pitch -
 * @property {Tr2CurveScalar} roll  -
 * @property {Tr2CurveScalar} yaw   -
 * @property {quat} currentValue
 */
export class Tw2CurveEulerRotation extends Tw2CurveSequencer
{

    pitch = null;
    roll = null;
    yaw = null;
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
            yaw = this.yaw ? this.yaw.GetValueAt(time) : 0.0,
            pitch = this.pitch ? this.pitch.GetValueAt(time) : 0.0,
            roll = this.roll ? this.roll.GetValueAt(time) : 0.0;

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
    static curveType = Tw2CurveSequencer.Type.SEQUENCER2;

    /**
     * The sequencer's curve property names
     * @type {string[]}
     */
    static childProperties = [ "yaw", "pitch", "roll" ];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ],
            [ "pitch", r.rawObject ],
            [ "roll", r.rawObject ],
            [ "yaw", r.rawObject ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 2;

}
