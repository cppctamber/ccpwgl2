/**
 * Samples decoded degree-one Granny curve data without using the generic
 * evaluator's incorrect last-knot-relative interpolation term.
 *
 * @param {ArrayLike<Number>} out
 * @param {{knots:ArrayLike<Number>,controls:ArrayLike<Number>,dimension:Number}} data
 * @param {Number} time
 * @param {Boolean} [cycle=false]
 * @param {Number} [duration=0]
 * @param {Boolean} [quaternion=false]
 * @returns {ArrayLike<Number>}
 */
export function sampleInteriorDegreeOneCurve(out, data, time, cycle = false, duration = 0, quaternion = false)
{
    if (!data || !data.knots || !data.controls || !data.dimension) return out;

    const
        dimension = data.dimension,
        count = Math.min(data.knots.length, Math.floor(data.controls.length / dimension));

    if (!count) return out;
    if (count === 1)
    {
        return copyControl(out, data.controls, dimension, 0);
    }

    let localTime = Number.isFinite(time) ? time : 0;
    if (cycle && duration > 0)
    {
        localTime = ((localTime % duration) + duration) % duration;
    }
    else
    {
        if (localTime <= data.knots[0]) return copyControl(out, data.controls, dimension, 0);
        if (localTime >= data.knots[count - 1]) return copyControl(out, data.controls, dimension, count - 1);
    }

    let next = 0;
    while (next < count && data.knots[next] <= localTime) next++;

    let previous;
    let start;
    let end;

    if (next < count)
    {
        previous = next === 0 ? count - 1 : next - 1;
        start = data.knots[previous];
        end = data.knots[next];
        if (cycle && next === 0) start -= duration;
    }
    else
    {
        if (!cycle) return copyControl(out, data.controls, dimension, count - 1);
        next = 0;
        previous = count - 1;
        start = data.knots[previous];
        end = data.knots[0] + duration;
    }

    if (cycle && localTime < start) localTime += duration;

    const span = end - start;
    const t = span > 0 ? Math.max(0, Math.min(1, (localTime - start) / span)) : 0;
    const p0 = previous * dimension;
    const p1 = next * dimension;
    let sign = 1;

    if (quaternion && dimension === 4)
    {
        const dot = data.controls[p0] * data.controls[p1] +
            data.controls[p0 + 1] * data.controls[p1 + 1] +
            data.controls[p0 + 2] * data.controls[p1 + 2] +
            data.controls[p0 + 3] * data.controls[p1 + 3];
        if (dot < 0) sign = -1;
    }

    for (let i = 0; i < dimension; i++)
    {
        out[i] = data.controls[p0 + i] * (1 - t) + data.controls[p1 + i] * sign * t;
    }

    if (quaternion && dimension === 4) normalizeQuaternion(out);
    return out;
}

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

function copyControl(out, controls, dimension, index)
{
    const offset = index * dimension;
    for (let i = 0; i < dimension; i++) out[i] = controls[offset + i];
    return out;
}

function normalizeQuaternion(value)
{
    const length = Math.hypot(value[0], value[1], value[2], value[3]) || 1;
    value[0] /= length;
    value[1] /= length;
    value[2] /= length;
    value[3] /= length;
    return value;
}
