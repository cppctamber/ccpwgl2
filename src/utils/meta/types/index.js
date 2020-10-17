import * as types from "./ModelPropertyTypes";

export const propTypes = new Map();

const type = Object.assign({}, types);
for (const key in type)
{
    if (type.hasOwnProperty(key))
    {
        propTypes.set(type[key].type, type[key]);
    }
}
