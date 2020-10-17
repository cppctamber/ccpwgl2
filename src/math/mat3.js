import { mat3 } from "gl-matrix";

export { mat3 };

/**
 * Sets a mat3 from an array at an option offset
 *
 * @param {mat3} out
 * @param {Array} arr
 * @param {number} [offset=0]
 * @returns {mat3} out
 */
mat3.fromArray = function(out, arr, offset = 0)
{
    out[0] = arr[offset];
    out[1] = arr[offset + 1];
    out[2] = arr[offset + 2];
    out[3] = arr[offset + 3];
    out[4] = arr[offset + 4];
    out[5] = arr[offset + 5];
    out[6] = arr[offset + 6];
    out[7] = arr[offset + 7];
    out[8] = arr[offset + 8];
    return out;
};

/**
 * Sets a mat3 from an array at an option offset
 *
 * @param {mat3} out
 * @param {Array} arr
 * @param {number} [index=0]
 * @returns {mat3} out
 */
mat3.setArray = function(out, arr, index = 0)
{
    out[0] = arr[index];
    out[1] = arr[index + 1];
    out[2] = arr[index + 2];
    out[3] = arr[index + 3];
    out[4] = arr[index + 4];
    out[5] = arr[index + 5];
    out[6] = arr[index + 6];
    out[7] = arr[index + 7];
    out[8] = arr[index + 8];
    return out;
};

/**
 * Sets an array at an optional offset
 *
 * @param {mat3} a
 * @param {Array} arr
 * @param {number} [index=0]
 * @returns {mat3} a
 */
mat3.toArray = function(a, arr, index = 0)
{
    arr[index] = a[0];
    arr[index + 1] = a[1];
    arr[index + 2] = a[2];
    arr[index + 3] = a[3];
    arr[index + 4] = a[4];
    arr[index + 5] = a[5];
    arr[index + 6] = a[6];
    arr[index + 7] = a[7];
    arr[index + 8] = a[8];
    return a;
};

