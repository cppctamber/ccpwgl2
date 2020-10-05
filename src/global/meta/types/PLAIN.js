export { isEqual as equals, isPlain as isValue } from "global/util";
export const set = (a, key, value) => a[key] = Object.assign({}, a[key], value);
export const get = (a, key) => Object.assign({}, a[key]);
