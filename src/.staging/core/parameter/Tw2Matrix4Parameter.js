import {Tw2StagingClass} from "../../class";

/**
 * Tw2Matrix4Parameter
 * @ccp Tr2Matrix4Parameter
 * @implements Parameter
 *
 * @parameter {Array.<Vector>} value -
 */
export default class Tw2Matrix4Parameter extends Tw2StagingClass
{

    value = [];

}

Tw2StagingClass.define(Tw2Matrix4Parameter, Type =>
{
    return {
        type: "Tw2Matrix4Parameter",
        category: "Parameter",
        props: {
            value: [["Vector"]]
        }
    };
});

