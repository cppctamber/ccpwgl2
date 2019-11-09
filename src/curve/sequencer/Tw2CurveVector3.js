import { Tw2CurveSequencer } from "./Tw2CurveSequencer";
import { vec3 } from "global";

/**
 * Vector3 curve sequencer
 * @ccp Tr2CurveVector3
 *
 * @property {Tr2CurveScalar} x -
 * @property {Tr2CurveScalar} y -
 * @property {Tr2CurveScalar} z -
 * @property {vec3} currentValue      -
 */
export class Tw2CurveVector3 extends Tw2CurveSequencer
{

    x = null;
    y = null;
    z = null;
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


    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ],
            [ "x", r.rawObject ],
            [ "y", r.rawObject ],
            [ "z", r.rawObject ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 2;

}
