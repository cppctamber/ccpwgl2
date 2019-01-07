import {Tw2StagingClass} from "../../class";

/**
 * EveStretch2
 *
 * @parameter {Tw2Effect} effect -
 * @parameter {Tw2CurveSet} loop -
 * @parameter {Number} quadCount -
 */
export default class EveStretch2 extends Tw2StagingClass
{

    effect = null;
    loop = null;
    quadCount = 0;

}

Tw2StagingClass.define(EveStretch2, Type =>
{
    return {
        type: "EveStretch2",
        props: {
            effect: ["Tw2Effect"],
            loop: ["Tw2CurveSet"],
            quadCount: Type.NUMBER
        }
    };
});

