import {vec2} from "gl-matrix";

export {vec2};

/**
 * Checks if a vector2 is empty
 * @param {vec2} a
 * @returns {boolean}
 */
vec2.isEmpty = function (a)
{
    return a[0] === 0 && a[1] === 0;
};