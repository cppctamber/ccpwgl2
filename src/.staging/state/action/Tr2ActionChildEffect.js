import {Tw2BaseClass} from "../../class";

/**
 * Tr2ActionChildEffect
 * @implements StateAction
 *
 * @parameter {String} childName     -
 * @parameter {String} path          -
 * @parameter {Boolean} removeOnStop -
 */
export default class Tr2ActionChildEffect extends Tw2BaseClass
{

    childName = "";
    path = "";
    removeOnStop = false;

}

Tw2BaseClass.define(Tr2ActionChildEffect, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ActionChildEffect",
        category: "StateAction",
        props: {
            childName: Type.STRING,
            path: Type.PATH,
            removeOnStop: Type.BOOLEAN
        }
    };
});

