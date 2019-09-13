import { tw2 } from "../global";
import {isDNA, isNumber, isObject, isObjectObject, isPlain, isString} from "../global/util";

export class Wrapper
{
    wrapped = null;
    meta = null;

    constructor(meta, values)
    {
        const { wrapped, ...meta } = meta;
        this.constructor.SetWrapped(this, wrapped);
        this.meta = meta;
        this.Set(values);
    }

    /**
     * Sets values
     * @param values
     * @returns {boolean|*}
     */
    Set(values)
    {
        if (!values || !Object.keys(values).length)
        {
            return false;
        }

        if (this.wrapped)
        {
            return this.wrapped.Set(values);
        }

        return false;
    }

    /**
     * Sets the wrapped object
     * @param {*} item
     * @param {*} wrapped
     */
    static SetWrapped(item, wrapped)
    {
        item.wrapped = wrapped;
    }

    static async ParseOptions(options={})
    {
        if (!isPlain(options))
        {
            if (isObjectObject(options))
            {
                options = {wrapped: options};
            }
            else if (isDNA(options))
            {
                options = {dna: options};
            }
            else if (isString(options))
            {
                options = {resPath: options}
            }
            else if (isNumber(options))
            {
                options = {id: options};
            }
            else
            {
                throw new Error("Invalid options object");
            }
        }

        let { resPath, id, wrapped, ...values } = options;

        if (id && !resPath)
        {
            resPath = await this.ResolveID(id);
        }

        values.meta = { resPath, wrapped };
        return values;
    }

    static async ResolveID(id)
    {
        throw new Error("Id resolver not implemented");
    }

    static async fetch(options)
    {
        let { resPath, wrapped, ...values } = await this.ParseOptions(options);

        if (!wrapped && resPath)
        {
            wrapped = await tw2.FetchObject(resPath);
        }

        return new this({ wrapped, resPath }, values);
    }

}
