import {Tw2StagingClass} from "../../class";

/**
 * Tw2ActionPlayMeshAnimation
 * @ccp Tr2ActionPlayMeshAnimation
 * @implements StateAction
 *
 * @parameter {String} animation -
 * @parameter {Number} loops     -
 * @parameter {String} mask      -
 */
export default class Tw2ActionPlayMeshAnimation extends Tw2StagingClass
{

    animation = "";
    loops = 0;
    mask = "";

}

Tw2StagingClass.define(Tw2ActionPlayMeshAnimation, Type =>
{
    return {
        type: "Tw2ActionPlayMeshAnimation",
        category: "StateAction",
        props: {
            animation: Type.STRING,
            loops: Type.NUMBER,
            mask: Type.STRING
        }
    };
});

