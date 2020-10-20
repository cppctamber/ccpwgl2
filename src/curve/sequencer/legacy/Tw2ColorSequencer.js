import { meta } from "utils";
import { vec4 } from "math";
import { Tw2CurveSequencer } from "../Tw2CurveSequencer";


const Operator = {
    MULTIPLY: 0,
    ADD: 1
};


@meta.type("Tw2ColorSequencer")
export class Tw2ColorSequencer extends Tw2CurveSequencer
{

    @meta.string
    name = "";

    @meta.float
    start = 0;

    @meta.vector4
    value = vec4.create();

    @meta.enums(Operator)
    operator = 0;

    @meta.list("Tw2Curve")
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

        switch (this.operator)
        {
            case Tw2ColorSequencer.Operator.MULTIPLY:
                vec4.set(value, 1, 1, 1, 1);
                for (let i = 0; i < this.functions.length; ++i)
                {
                    this.functions[i].GetValueAt(time, vec4_0);
                    vec4.multiply(value, value, vec4_0);
                }
                break;

            default:
                vec4.set(value, 0, 0, 0, 0);
                for (let i = 0; i < this.functions.length; ++i)
                {
                    this.functions[i].GetValueAt(time, vec4_0);
                    vec4.add(value, value, vec4_0);
                }
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
     * Operators
     * @type {{MULTIPLY: number, ADD: number}}
     */
    static Operator = Operator;

}
