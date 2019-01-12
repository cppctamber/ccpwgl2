import {Tw2BaseClass} from "../../../global";

/**
 * Tr2ActionChildEffect
 * @implements StateAction
 *
 * @property {String} childName     -
 * @property {String} path          -
 * @property {Boolean} removeOnStop -
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

