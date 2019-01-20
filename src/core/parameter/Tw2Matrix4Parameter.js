import {mat4} from "../../global";
import {Tw2VectorParameter} from "./Tw2VectorParameter";

/**
 * Tw2Matrix4Parameter
 *
 * @class
 */
export class Tw2Matrix4Parameter extends Tw2VectorParameter
{

    /**
     * Constructor
     * @param {String} [name='']
     * @param {mat4|Float32Array|Array} [value=mat4.create()]
     */
    constructor(name = "", value = mat4.create())
    {
        // Convert array of arrays
        if (Array.isArray(value) && value.length === 4 && value[0].length === 4)
        {
            const
                x = value[0],
                y = value[1],
                z = value[2],
                w = value[3];

            value = [
                x[0], x[1], x[2], x[3],
                y[0], y[1], y[2], y[3],
                z[0], z[1], z[2], z[3],
                w[0], w[1], w[2], w[3]
            ];
        }

        super(name, value);
    }

    /**
     * Composes the parameter's value from components
     * @param {Tw2Vector4Parameter|quat} rotation
     * @param {Tw2Vector3Parameter|vec3} translation
     * @param {Tw2Vector3Parameter|vec3} scaling
     */
    Compose(rotation, translation, scaling)
    {
        if ("value" in rotation) rotation = rotation["value"];
        if ("value" in translation) translation = translation["value"];
        if ("value" in scaling) scaling = scaling["value"];

        mat4.fromRotationTranslationScale(this.value, rotation, translation, scaling);
        this.OnValueChanged();
    }

    /**
     * Decomposes the parameter's value to components
     * @param {Tw2Vector4Parameter|quat} rotation
     * @param {Tw2Vector3Parameter|vec3} translation
     * @param {Tw2Vector3Parameter|vec3} scaling
     */
    Decompose(rotation, translation, scaling)
    {
        mat4.getRotation("value" in rotation ? rotation.value : rotation, this.value);
        mat4.getTranslation("value" in translation ? translation.value : translation, this.value);
        mat4.getScaling("value" in scaling ? scaling.value : scaling, this.value);

        if ("OnValueChanged" in rotation) rotation.OnValueChanged();
        if ("OnValueChanged" in translation) translation.OnValueChanged();
        if ("OnValueChanged" in scaling) scaling.OnValueChanged();
    }

    /**
     * Gets the matrices' translation x value
     * @returns {Number}
     */
    get x()
    {
        return this.GetIndexValue(12);
    }

    /**
     * Sets the matrices' translation x value
     * @param {Number} val
     */
    set x(val)
    {
        this.SetIndexValue(12, val);
    }

    /**
     * Gets the matrices' translation y value
     * @returns {Number}
     */
    get y()
    {
        return this.GetIndexValue(13);
    }

    /**
     * Sets the matrices' translation y value
     * @param {Number} val
     */
    set y(val)
    {
        this.SetIndexValue(13, val);
    }

    /**
     * Gets the matrices' translation z value
     * @returns {Number}
     */
    get z()
    {
        return this.GetIndexValue(14);
    }

    /**
     * Sets the matrices' translation z value
     * @param {Number} val
     */
    set z(val)
    {
        this.SetIndexValue(14, val);
    }

    /**
     * The parameter's constant buffer size
     * @type {Number}
     */
    static constantBufferSize = 16;

}

Tw2VectorParameter.define(Tw2Matrix4Parameter, Type =>
{
    return {
        type: "Tw2Matrix4Parameter",
        props: {
            value: Type.MATRIX4
        }
    };
});

export function Tw2MatrixParameter(name, value)
{
    console.warn("Tw2MatrixParameter is deprecated, use Tw2Matrix4Parameter instead");
    return new Tw2Matrix4Parameter(name, value);
}
