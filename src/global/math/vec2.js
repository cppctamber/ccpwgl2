import { vec2 } from "gl-matrix";

export { vec2 };


/**
 * Adds a scalar to a vec2
 *
 * @param {vec2} out
 * @param {vec2} a
 * @param {Number} s
 * @returns {vec2} out
 */
vec2.addScalar = function(out, a, s)
{
    out[0] = a[0] + s;
    out[1] = a[1] + s;
    return out;
};

/**
 * Checks if a vector2 is empty
 * @param {vec2} a
 * @returns {boolean}
 */
vec2.isEmpty = function(a)
{
    return a[0] === 0 && a[1] === 0;
};

/**
 * Divides a vec2 by a scalar
 *
 * @param {vec2} out
 * @param {vec2} a
 * @param {Number} s
 * @returns {vec2} out
 */
vec2.divideScalar = function(out, a, s)
{
    return vec2.multiplyScalar(out, a, 1 / s);
};


/**
 * Multiplies a vec2 by a scalar
 *
 * @param {vec2} out
 * @param {vec2} a
 * @param {Number} s
 * @returns {vec2} out
 */
vec2.multiplyScalar = function(out, a, s)
{
    out[0] = a[0] * s;
    out[1] = a[1] * s;
    return out;
};

/**
 * Sets a vec2 from a scalar
 *
 * @param {vec2} out
 * @param {Number} s
 * @returns {vec2} out
 */
vec2.setScalar = function(out, s)
{
    out[0] = s;
    out[1] = s;
    return out;
};

/**
 * Subtracts a scalar from a vec2
 *
 * @param {vec2} out
 * @param {vec2} a
 * @param {Number} s
 * @returns {vec2} out
 */
vec2.subtractScalar = function(out, a, s)
{
    out[0] = a[0] - s;
    out[1] = a[1] - s;
    return out;
};

/**
 * Sets a vec2 from an array with an optional offset
 * @param {vec3} out
 * @param {TypedArray|Array} array
 * @param {Number} [offset=0]
 * @returns {vec3} out
 */
vec2.fromArray = function(out, array, offset=0)
{
    out[0] = array[offset];
    out[1] = array[offset + 1];
    return out;
};

/**
 * Gets mouse position from a mouse event
 * @param {vec2} out
 * @param {MouseEvent} event
 * @returns {vec2} out - mouse coordinates
 */
vec2.mousePositionFromEvent = function(out, event)
{
    out[0] = event.clientX;
    out[1] = event.clientY;
    return out;
};

/**
 * Gets CSS position from an event
 * @param {vec2} out
 * @param {MouseEvent} event
 * @param {HTMLElement} [element=element.target]
 * @returns {vec2} out - css coordinates
 */
vec2.cssPositionFromEvent = function(out, event, element=event.target)
{
    const rect = element.getBoundingClientRect();
    out[0] = event.clientX - rect.left;
    out[1] = event.clientY - rect.top;
    return out;
};

/**
 * Gets the pixel coordinates from an element event
 * @param {vec2} out
 * @param {MouseEvent} event
 * @param {HTMLElement} [element=element.target]
 * @returns {vec2} out - the pixel coordinates
 */
vec2.pixelPositionFromEvent = function(out, event, element=event.target)
{
    const
        rect = element.getBoundingClientRect(),
        cssX = event.clientX - rect.left,
        cssY = event.clientY - rect.top;

    out[0] = cssX * element.width / element.clientWidth;
    out[1] = element.height - cssY * element.height / element.clientHeight - 1;
    return out;
};