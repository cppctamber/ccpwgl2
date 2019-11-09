import { vec4 } from "global";
import { Tw2CurveSequencer } from "./Tw2CurveSequencer";

/**
 * Color sequencer
 * TODO: Can't rename to Tw2ColorSequencer as a legacy one already exists
 * @ccp TriColorSequencer
 *
 * @property {String} name                                   -
 * @property {Array.<Tw2Curve|Tw2CurveExpression>} functions -
 * @property {vec4} value                                    -
 */
export class TriColorSequencer extends Tw2CurveSequencer
{

    functions = [];
    value = vec4.create();

    /**
     * Sorts the sequencer
     */
    Sort()
    {
        Tw2CurveSequencer.Sort(this);
    }

    /**
     * Gets sequencer length
     * @returns {number}
     */
    GetLength()
    {
        return Tw2CurveSequencer.GetLengthFromKeys(this);
    }

    /**
     * Updates a value at a specific time
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
        const vec4_0 = Tw2CurveSequencer.global.vec4_0;

        vec4.set(vec4_0, 0, 0, 0, 0);
        for (let i = 0; i < this.functions.length; i++)
        {
            this.functions[i].GetValueAt(time, value);
            vec4.add(value, value, vec4_0);
        }

        return value;
    }

    /**
     * The sequencer's curve dimension
     * @type {number}
     */
    static inputDimension = 4;

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
    static curveType = Tw2CurveSequencer.Type.SEQUENCER;

    /**
     * The sequencer's curve array
     * @type {String}
     */
    static childArray = "functions";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "functions", r.array ],
            [ "name", r.string ],
            [ "value", r.vector4 ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 2;

}
