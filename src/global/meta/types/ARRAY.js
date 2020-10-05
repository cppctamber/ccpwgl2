import { isArray } from "global/util";
export const isValue = isArray;
export const get = (a, key) => Array.from(a[key]);
