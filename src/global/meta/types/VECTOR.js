export { get, equals } from "./VECTOR4";
export { isVector as isValue } from "global/util";

export function set(a, key, value)
{
    if (a[key].length === value.length)
    {
        a[key].set(value);
    }
    else
    {
        a[key] = new a[key].constructor(value);
    }
}
