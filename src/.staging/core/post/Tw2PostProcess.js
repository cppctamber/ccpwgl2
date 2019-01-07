import {Tw2StagingClass} from "../../class";

/**
 * Tw2PostProcess
 * @ccp Tr2PostProcess
 *
 * @parameter {Array.<Tw2Effect>} stages -
 */
export default class Tw2PostProcess extends Tw2StagingClass
{

    stages = [];

}

Tw2StagingClass.define(Tw2PostProcess, Type =>
{
    return {
        type: "Tw2PostProcess",
        props: {
            stages: [["Tw2Effect"]]
        }
    };
});

