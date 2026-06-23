
export function replaceObjectProperties(target, props)
{
    for (const key in props)
    {
        if (props.hasOwnProperty(key))
        {
            const targetKey = props[key];
            const value = target[key];

            if (value !== undefined)
            {
                target[targetKey] = value;
                Reflect.deleteProperty(target, key);
            }
        }
    }
    return target;
}

/**
 *
 * @param {Object} target
 * @param {Object} source
 * @param {String|String[]}props
 */
export function transformObjectVectors(target, source, props)
{
    props = Array.isArray(props) ? props : [ props ];
    for (let i = 0; i < props.length; i++)
    {
        const
            prop = props[i],
            value = source[prop];

        if (value)
        {
            if ("r" in value)
            {
                target[prop] = [ value.r, value.g, value.b ];
                if (value.a) target[prop].push(value.a);
            }
            else if ("x" in value)
            {
                target[prop] = [ value.x, value.y, value.z ];
                if (value.w) target[prop].push(value.w);
            }
            else
            {
                throw new TypeError("Unexpected vector object");
            }
        }
    }
    return target;
}



export function snakeToCamel(str)
{
    return str
        .toLowerCase()
        .replace(/[-_][a-z]/g, (group) => group.slice(-1).toUpperCase());
}

export function camelToSnake(str)
{
    return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

export function objectToArray(obj, propertyName)
{
    return Object.keys(obj)
        .sort((a, b) => a - b)
        .map(id =>
        {
            obj[id][propertyName] = Number(id);
            return obj[id];
        });
}

export function objectCamelToSnake(obj)
{
    return Object.keys(obj)
        .sort((a, b) => a - b)
        .reduce((acc, cur) =>
        {
            acc[camelToSnake(cur)] = obj[cur];
            return acc;
        }, {});
}

export function objectSnakeToCamel(obj)
{
    return Object.keys(obj)
        .sort((a,b)=>a-b)
        .reduce((acc, cur) =>
        {
            acc[snakeToCamel(cur)] = obj[cur];
            return acc;
        }, {});
}