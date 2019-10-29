import { ErrInvalidDecoratorUsage } from "../../core/Tw2Error";
import { isArray, isFunction } from "../util/type";
import { structList, struct, fromList } from "../../core/reader/Tw2BlackPropertyReaders";
import { set, create } from "./meta";


/**
 * Identifies that a property is read by black reader
 * - It will use the type defined by the "meta.type" decorator
 * @type {PropertyDecorator}
 */
export const black = create(false, {

    property({ target, property })
    {
        set("black", true, target, property);
    }

});

/**
 * Identifies the black reader a property should use
 * @type {PropertyDecorator}
 */
export const blackReader = create(true, {

    property({ target, property }, reader)
    {
        set("black", reader, target, property);
    }

});

/**
 * Identifies that the black property is a struct
 * - Pass an array containing a function to identify a struct list
 * - Pass a function to identify a struct
 * @type {PropertyDecorator}
 */
export const blackStruct = create(true, {

    property({ target, property }, value)
    {
        let handler;

        // list
        if (isArray(value))
        {
            if (isFunction(value[0]))
            {
                handler = structList(value[0]);
            }
        }
        // object
        else if (isFunction(value))
        {
            handler = struct(value);
        }

        if (!handler)
        {
            throw new ErrInvalidDecoratorUsage({ reason: "Could not identify struct type" });
        }

        set("black", handler, target, property);
    }

});

/**
 * Defines a black reader which results in a plain object from an array or struct list
 * @type {PropertyDecorator}
 */
export const blackFromList = create(true, {

    property({ target, property }, options)
    {
        set("black", fromList(options), target, property);
    }

});

