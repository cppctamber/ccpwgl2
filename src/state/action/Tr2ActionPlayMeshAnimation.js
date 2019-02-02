import {Tw2BaseClass} from "../../global";

/**
 * Tr2ActionPlayMeshAnimation
 * @implements StateAction
 * Todo: Implement
 *
 * @property {String} animation -
 * @property {Number} loops     -
 * @property {String} mask      -
 */
export class Tr2ActionPlayMeshAnimation extends Tw2BaseClass
{

    animation = "";
    loops = 0;
    mask = "";

}

Tw2BaseClass.define(Tr2ActionPlayMeshAnimation, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ActionPlayMeshAnimation",
        category: "StateAction",
        props: {
            animation: Type.STRING,
            loops: Type.NUMBER,
            mask: Type.STRING
        },
        notImplemented: [
            "animation",
            "loops",
            "mask"
        ]
    };
});

