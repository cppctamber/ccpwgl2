import { isBoolean } from "global/util";
export const isValue = isBoolean;
export const equals = (a, b) => a === b;
export const set = (a, key, value) => a[key] = value;
export const get = (a, key) => a[key];
