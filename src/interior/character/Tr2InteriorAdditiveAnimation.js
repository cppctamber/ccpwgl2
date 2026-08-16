import { sampleDegreeOneCurve, normalizeQuaternion } from "../../core/geometry/sampleDegreeOneCurve.js";


/**
 * The character path's name for the shared degree-one sampler.
 *
 * It used to live here. The ship path needs the same correction, and a second
 * copy of a correctness fix is how the first one stops being maintained, so the
 * implementation moved to core and this is the re-export.
 */
export { sampleDegreeOneCurve as sampleInteriorDegreeOneCurve };

/**
 * Composes Into + (Delta - Base) * Amount for translation and scale/shear,
 * and pow(Delta * inverse(Base), Amount) * Into for local rotation.
 * Output buffers may alias the Into buffers.
 *
 * @param {ArrayLike<Number>} outPosition
 * @param {ArrayLike<Number>} outOrientation
 * @param {ArrayLike<Number>} outScale
 * @param {ArrayLike<Number>} intoPosition
 * @param {ArrayLike<Number>} intoOrientation
 * @param {ArrayLike<Number>} intoScale
 * @param {ArrayLike<Number>} basePosition
 * @param {ArrayLike<Number>} baseOrientation
 * @param {ArrayLike<Number>} baseScale
 * @param {ArrayLike<Number>} deltaPosition
 * @param {ArrayLike<Number>} deltaOrientation
 * @param {ArrayLike<Number>} deltaScale
 * @param {Number} amount
 */
export function composeInteriorAdditivePose(
    outPosition,
    outOrientation,
    outScale,
    intoPosition,
    intoOrientation,
    intoScale,
    basePosition,
    baseOrientation,
    baseScale,
    deltaPosition,
    deltaOrientation,
    deltaScale,
    amount)
{
    const weight = Number.isFinite(amount) ? amount : 0;

    for (let i = 0; i < 3; i++)
    {
        outPosition[i] = intoPosition[i] + (deltaPosition[i] - basePosition[i]) * weight;
    }
    for (let i = 0; i < 9; i++)
    {
        outScale[i] = intoScale[i] + (deltaScale[i] - baseScale[i]) * weight;
    }

    if (weight === 0)
    {
        for (let i = 0; i < 4; i++) outOrientation[i] = intoOrientation[i];
        return;
    }

    let bx = baseOrientation[0], by = baseOrientation[1], bz = baseOrientation[2], bw = baseOrientation[3];
    let dx = deltaOrientation[0], dy = deltaOrientation[1], dz = deltaOrientation[2], dw = deltaOrientation[3];
    let length = Math.hypot(bx, by, bz, bw) || 1;
    bx /= length; by /= length; bz /= length; bw /= length;
    length = Math.hypot(dx, dy, dz, dw) || 1;
    dx /= length; dy /= length; dz /= length; dw /= length;

    // Equivalent quaternion signs must produce the identity delta.
    if (bx * dx + by * dy + bz * dz + bw * dw < 0)
    {
        dx = -dx; dy = -dy; dz = -dz; dw = -dw;
    }

    let rx = -dw * bx + dx * bw - dy * bz + dz * by;
    let ry = -dw * by + dx * bz + dy * bw - dz * bx;
    let rz = -dw * bz - dx * by + dy * bx + dz * bw;
    let rw = dw * bw + dx * bx + dy * by + dz * bz;
    length = Math.hypot(rx, ry, rz, rw) || 1;
    rx /= length; ry /= length; rz /= length; rw /= length;

    if (rw < 0)
    {
        rx = -rx; ry = -ry; rz = -rz; rw = -rw;
    }

    const angle = Math.acos(Math.max(-1, Math.min(1, rw)));
    const sinAngle = Math.sin(angle);
    let wx;
    let wy;
    let wz;
    let ww;

    if (Math.abs(sinAngle) < 1e-8)
    {
        wx = rx * weight;
        wy = ry * weight;
        wz = rz * weight;
        ww = 1;
        length = Math.hypot(wx, wy, wz, ww) || 1;
        wx /= length; wy /= length; wz /= length; ww /= length;
    }
    else
    {
        const multiplier = Math.sin(angle * weight) / sinAngle;
        wx = rx * multiplier;
        wy = ry * multiplier;
        wz = rz * multiplier;
        ww = Math.cos(angle * weight);
    }

    const ix = intoOrientation[0], iy = intoOrientation[1], iz = intoOrientation[2], iw = intoOrientation[3];
    outOrientation[0] = ww * ix + wx * iw + wy * iz - wz * iy;
    outOrientation[1] = ww * iy - wx * iz + wy * iw + wz * ix;
    outOrientation[2] = ww * iz + wx * iy - wy * ix + wz * iw;
    outOrientation[3] = ww * iw - wx * ix - wy * iy - wz * iz;
    normalizeQuaternion(outOrientation);
}

/**
 * Resolves one bone's weight from array, map, or bone-name projection masks.
 * Missing entries are deliberately zero so unknown bones cannot become a
 * full-body additive layer.
 *
 * @param {ArrayLike<Number>|Map|Object} mask
 * @param {String} boneName
 * @param {Number} boneIndex
 * @returns {Number}
 */
export function getInteriorMaskWeight(mask, boneName, boneIndex)
{
    if (!mask) return 0;
    if (mask.weights) return getInteriorMaskWeight(mask.weights, boneName, boneIndex);

    let value;
    if (mask instanceof Map)
    {
        value = mask.has(boneName) ? mask.get(boneName) : mask.get(boneIndex);
    }
    else if (typeof mask.length === "number")
    {
        value = boneIndex >= 0 && boneIndex < mask.length ? mask[boneIndex] : 0;
    }
    else
    {
        value = boneName && Object.prototype.hasOwnProperty.call(mask, boneName)
            ? mask[boneName]
            : mask[boneIndex];
    }
    return Number.isFinite(value) ? value : 0;
}


