import {classes} from "../core/reader/black";
import * as readers from "../core/reader/Tw2BlackPropertyReaders";

/**
 * Helper class
 *
 * @property {String|Number} _id
 */
export class EveSOFBaseClass
{

    /**
     * Retains the classes name in case of minification
     * @type {null}
     * @private
     */
    static __type = null;

    /**
     * Defines the classes
     * @param {Function} func
     */
    static define(func)
    {
        if (this !== EveSOFBaseClass)
        {
            const {type = null, black = []} = func(readers);
            this.__type = type;
            classes.set(type, new Map(black));
        }
    }

}