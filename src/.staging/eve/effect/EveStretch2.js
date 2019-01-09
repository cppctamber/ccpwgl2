import {Tw2BaseClass} from "../../class";

/**
 * EveStretch2
 *
 * @parameter {Tr2Effect} effect -
 * @parameter {TriCurveSet} loop -
 * @parameter {Number} quadCount -
 */
export default class EveStretch2 extends Tw2BaseClass
{

    effect = null;
    loop = null;
    quadCount = 0;

}

Tw2BaseClass.define(EveStretch2, Type =>
{
    return {
        isStaging: true,
        type: "EveStretch2",
        props: {
            effect: ["Tr2Effect"],
            loop: ["TriCurveSet"],
            quadCount: Type.NUMBER
        }
    };
});

