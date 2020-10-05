export { isVector4 as isValue, isVectorEqual as equals } from "global/util";
export const get = (a, key) => Array.from(a[key]);
export const set = (a, key, value) => a[key].set(value);
