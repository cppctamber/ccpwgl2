import { isFunction } from "../../global/util";
import { ErrInvalidDecoratorUsage } from "../../core/Tw2Error";

/**
 * Creates a decorator
 * @param options
 * @param {Boolean} [options.hasArguments]
 * @param {Function} [options.class]
 * @param {Function} [options.method]
 * @param {Function} [options.parameter]
 * @param {Function} [options.handler]
 * @param {Boolean} [hasArguments]
 * @returns {(function(...[*]): Function)|Function}
 */
export function create(options, hasArguments)
{
    if (options.hasArguments || hasArguments)
    {
        return function(...args)
        {
            return function(t, p, d)
            {
                if (!p)
                {
                    if (options.class)
                    {
                        return options.class(t, ...args);
                    }
                }
                else
                {
                    if (isFunction(t[p]))
                    {
                        if (options.method)
                        {
                            return options.method(t, p, d, ...args);
                        }
                    }
                    else
                    {
                        if (options.parameter)
                        {
                            return options.parameter(t, p, d, ...args);
                        }
                    }
                }

                if (options.handler)
                {
                    return options.handler(t, p, d, ...args);
                }

                throw new ErrInvalidDecoratorUsage();
            };
        };
    }
    else
    {

        return function(t, p, d)
        {
            if (!p)
            {
                if (options.class)
                {
                    return options.class(t);
                }
            }
            else
            {
                if (isFunction(t[p]))
                {
                    if (options.method)
                    {
                        return options.method(t, p, d);
                    }
                }
                else if (options.parameter)
                {
                    return options.parameter(t, p, d);
                }
            }

            if (options.handler)
            {
                return options.handler(t, p, d);
            }

            throw new ErrInvalidDecoratorUsage();
        };
    }
}

