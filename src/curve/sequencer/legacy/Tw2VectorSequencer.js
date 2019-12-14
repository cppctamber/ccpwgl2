import { meta, vec3 } from "global";
import { Tw2CurveSequencer } from "../Tw2CurveSequencer";

/**
 * Tw2VectorSequencer
 *
 * @property {String} name
 * @property {number} start
 * @property {vec3} value
 * @property {number} operator
 * @property {Array.<Tw2Curve>} functions
 */
@meta.type("Tw2VectorSequencer")
export class Tw2VectorSequencer extends Tw2CurveSequencer
{

    @meta.float
    start = 0;

    @meta.vector3
    @meta.isPrivate
    value = vec3.create();

    @meta.uint
    operator = 0;

    @meta.list
    functions = [];


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
     * @param {vec3} value
     * @returns {vec3}
     */
    GetValueAt(time, value)
    {
        const vec3_0 = Tw2CurveSequencer.global.vec3_0;

        switch (this.operator)
        {
            case Tw2VectorSequencer.Operator.MULTIPLY:
                vec3.set(value, 1, 1, 1);
                for (let i = 0; i < this.functions.length; ++i)
                {
                    this.functions[i].GetValueAt(time, vec3_0);
                    vec3.multiply(value, value, vec3_0);
                }
                return value;

            default:
                vec3.set(value, 0, 0, 0);
                for (let i = 0; i < this.functions.length; ++i)
                {
                    this.functions[i].GetValueAt(time, vec3_0);
                    vec3.add(value, value, vec3_0);
                }
                return value;
        }
    }

    /**
     * The sequencer's curve dimension
     * @type {number}
     */
    static inputDimension = 3;

    /**
     * The sequencer's dimension
     * @type {number}
     */
    static outputDimension = 3;

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
     * The sequencer's curve properties
     * @type {String}
     */
    static childArray = "functions";

    /**
     * Operator types
     * @type {{MULTIPLY: number, ADD: number}}
     */
    static Operator = {
        MULTIPLY: 0,
        ADD: 1
    };

}
