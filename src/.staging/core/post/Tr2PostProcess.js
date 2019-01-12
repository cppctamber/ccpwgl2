import {Tw2BaseClass} from "../../../global";

/**
 * Tr2PostProcess
 *
 * @property {Array.<Tr2Effect>} stages -
 */
export default class Tr2PostProcess extends Tw2BaseClass
{

    stages = [];

}

Tw2BaseClass.define(Tr2PostProcess, Type =>
{
    return {
        isStaging: true,
        type: "Tr2PostProcess",
        props: {
            stages: [["Tr2Effect"]]
        }
    };
});

