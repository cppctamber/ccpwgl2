import {Tw2Curve} from "../curve/Tw2Curve";

/**
 * Tw2CurveSequencer base class
 *
 * @class
 */
export class Tw2CurveSequencer extends Tw2Curve
{
    /**
     * Legacy sequencer sorting
     * @param {Tw2CurveSequencer} sequencer
     * @param {String} [childArray]
     */
    static Sort(sequencer, childArray = sequencer.constructor.childArray)
    {
        let curves = sequencer[childArray];
        if (curves && curves.length)
        {
            for (let i = 0; i < curves.length; i++)
            {
                if (curves[i] && "Sort" in curves[i])
                {
                    curves[i].Sort();
                }
            }
        }
    }

    /**
     * Standard sequencer sorting
     * @param {Tw2CurveSequencer} sequencer
     * @param {Array<String>} [childProperties]
     */
    static Sort2(sequencer, childProperties = sequencer.constructor.childProperties)
    {
        if (childProperties)
        {
            for (let i = 0; i < childProperties.length; i++)
            {
                let curve = sequencer[childProperties[i]];
                if (curve && "Sort" in curve)
                {
                    curve.Sort();
                }
            }
        }
    }

    /**
     * Gets the length of the sequencer from it's key array
     * @param {Tw2CurveSequencer} sequencer
     * @param {String} [childArray]
     * @returns {number}
     */
    static GetLengthFromKeys(sequencer, childArray = sequencer.constructor.childArray)
    {
        const curveArray = sequencer[childArray];

        let len = 0;
        for (let i = 0; i < curveArray.length; ++i)
        {
            if ("GetLength" in curveArray[i])
            {
                len = Math.max(len, curveArray[i].GetLength());
            }
        }
        return len;
    }

    /**
     * Gets the length of a sequencer's curves
     * @param {*} sequencer
     * @param {Array<String>} [childProperties]
     * @returns {number}
     */
    static GetLengthFromProperties(sequencer, childProperties = sequencer.constructor.childProperties)
    {
        let len = 0;
        for (let i = 0; i < childProperties.length; i++)
        {
            const curve = sequencer[childProperties[i]];
            if (curve && "GetLength" in curve)
            {
                len = Math.max(len, curve.GetLength());
            }
        }
        return len;
    }

    /**
     * The sequencer's curve input dimension
     * @type {?number}
     */
    static inputDimension = null;

    /**
     * The sequencer's output dimension
     * @type {?number}
     */
    static outputDimension = null;

    /**
     * The sequencer's curve property names
     * @type {?Array.<string>}
     */
    static childProperties = null;

    /**
     * The sequencer's curve array
     * @type {?String}
     */
    static childArray = null;

    /**
     * Operator types
     * @type {null}
     */
    static Operator = null;

}