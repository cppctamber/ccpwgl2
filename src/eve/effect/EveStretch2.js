import {Tw2BaseClass} from "../../global";

/**
 * EveStretch2
 * TODO: Implement
 *
 * @property {Tr2Effect} effect -
 * @property {TriCurveSet} loop -
 * @property {Number} quadCount -
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
        },
        notImplemented: ["*"]
    };
});

