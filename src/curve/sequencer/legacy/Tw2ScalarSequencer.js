import { meta } from "utils";
import { Tw2CurveSequencer } from "../Tw2CurveSequencer";


const Operator = {
    MULTIPLY: 0,
    ADD: 1
};


@meta.ctor("Tw2ScalarSequencer")
export class Tw2ScalarSequencer extends Tw2CurveSequencer
{

    @meta.float
    @meta.isPrivate
    value = 0;

    @meta.enums(Operator)
    operator = 0;

    @meta.list("Tw2Curve")
    functions = [];

    @meta.float
    inMinClamp = 0;

    @meta.float
    inMaxClamp = 1;

    @meta.float
    outMinClamp = 0;

    @meta.float
    outMaxClamp = 1;

    @meta.boolean
    clamping = false;


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
     *
     * @param {number} time
     */
    UpdateValue(time)
    {
        this.value = this.GetValueAt(time);
    }

    /**
     * Gets a value at a specific time
     *
     * @param {number} time
     * @returns {number}
     */
    GetValueAt(time)
    {
        let value;

        switch (this.operator)
        {
            case Tw2ScalarSequencer.Operator.MULTIPLY:
                value = 1;
                for (let i = 0; i < this.functions.length; ++i)
                {
                    let v = this.functions[i].GetValueAt(time);
                    if (this.clamping)
                    {
                        v = Math.min(Math.max(v, this.inMinClamp), this.inMaxClamp);
                    }
                    value *= v;
                }
                break;

            default:
                value = 0;
                for (let i = 0; i < this.functions.length; ++i)
                {
                    let v = this.functions[i].GetValueAt(time);
                    if (this.clamping)
                    {
                        v = Math.min(Math.max(v, this.inMinClamp), this.inMaxClamp);
                    }
                    value += v;
                }
        }

        if (this.clamping)
        {
            value = Math.min(Math.max(value, this.outMinClamp), this.outMaxClamp);
        }

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
    static outputDimension = 1;

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
    static Operator = Operator;

}
