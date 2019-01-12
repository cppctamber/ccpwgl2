import {Tw2BaseClass} from "../../global";

/**
 * Tw2Float
 * @ccp Tw2Float
 *
 * @property {Number} value -
 */
export default class Tw2Float extends Tw2BaseClass
{

    value = 0;

}

Tw2BaseClass.define(Tw2Float, Type =>
{
    return {
        type: "Tw2Float",
        props: {
            value: Type.NUMBER
        }
    };
});

