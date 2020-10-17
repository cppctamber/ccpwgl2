import { meta } from "utils";
import { vec3, quat } from "math";
import { Tw2CurveKey, Tw2Curve } from "../Tw2Curve";


@meta.ctor("Tw2Torque")
export class Tw2Torque extends Tw2CurveKey
{

    @meta.quaternion
    rot0 = quat.create();

    @meta.vector4
    omega0 = vec3.create();

    @meta.vector4
    torque = vec3.create();

}


@meta.ctor("Tw2RigidOrientation")
export class Tw2RigidOrientation extends Tw2Curve
{

    @meta.string
    name = "";

    @meta.float
    I = 1;

    @meta.float
    drag = 1;

    @meta.quaternion
    @meta.isPrivate
    value = quat.create();

    @meta.float
    start = 0;

    @meta.list("Tw2Torque")
    states = [];

    @meta.float
    @meta.isPrivate
    length = 0;


    /**
     * Sorts the curve's keys
     */
    Sort()
    {
        Tw2Curve.Sort(this, this.states);
    }

    /**
     * Gets the curve's length
     * @returns {number}
     */
    GetLength()
    {
        return this.length;
    }

    /**
     * Updates the current value at the given time
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.GetValueAt(time, this.value);
    }

    /**
     * Gets a value at a specific time
     * @param {number} time
     * @param {quat} value
     * @returns {quat}
     */
    GetValueAt(time, value)
    {
        if (this.states.length === 0 || time < 0 || time < this.states[0].time)
        {
            return quat.copy(value, this.value);
        }

        let key = 0;
        if (time >= this.states[this.states.length - 1].time)
        {
            key = this.states.length - 1;
        }
        else
        {
            for (; key + 1 < this.states.length; ++key)
            {
                if (time >= this.states[key].time && time < this.states[key + 1].time)
                {
                    break;
                }
            }
        }

        const
            vec3_0 = Tw2Curve.global.vec3_0,
            quat_0 = Tw2Curve.global.quat_0;

        const ck = this.states[key];
        vec3.exponentialDecay(vec3_0, ck.omega0, ck.torque, this.I, this.drag, time - ck.time);
        quat.exp(quat_0, vec3_0);
        quat.multiply(value, this.states[key].rot0, quat_0);
        return value;
    }

    /**
     * The curve's key dimension
     * @type {number}
     */
    static inputDimension = 4;

    /**
     * The curve's dimension
     * @type {number}
     */
    static outputDimension = 4;

    /**
     * The curve's current value property
     * @type {String}
     */
    static valueProperty = "value";

    /**
     * The curve's type
     * @type {number}
     */
    static curveType = Tw2Curve.Type.CURVE;

    /**
     * The curve's key constructor
     * @type {Tw2Torque}
     */
    static Key = Tw2Torque;

}
