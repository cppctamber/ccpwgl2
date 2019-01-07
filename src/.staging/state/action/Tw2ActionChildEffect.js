import {Tw2StagingClass} from "../../class";

/**
 * Tw2ActionChildEffect
 * @ccp Tr2ActionChildEffect
 * @implements StateAction
 *
 * @parameter {String} childName     -
 * @parameter {String} path          -
 * @parameter {Boolean} removeOnStop -
 */
export default class Tw2ActionChildEffect extends Tw2StagingClass
{

    childName = "";
    path = "";
    removeOnStop = false;

}

Tw2StagingClass.define(Tw2ActionChildEffect, Type =>
{
    return {
        type: "Tw2ActionChildEffect",
        category: "StateAction",
        props: {
            childName: Type.STRING,
            path: Type.PATH,
            removeOnStop: Type.BOOLEAN
        }
    };
});

