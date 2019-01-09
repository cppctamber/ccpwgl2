import {Tw2BaseClass} from "../../class";

/**
 * Tr2Matrix4Parameter
 * @implements Parameter
 *
 * @parameter {Array.<Vector>} value -
 */
export default class Tr2Matrix4Parameter extends Tw2BaseClass
{

    value = [];

}

Tw2BaseClass.define(Tr2Matrix4Parameter, Type =>
{
    return {
        isStaging: true,
        type: "Tr2Matrix4Parameter",
        category: "Parameter",
        props: {
            value: [["Vector"]]
        }
    };
});

