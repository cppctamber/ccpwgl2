/**
 * Degree-one Granny curve sampling.
 *
 * Deliberately dependency-free: this is the one correct sampler and both the
 * character path (`Tr2InteriorAdditiveAnimation`) and the ship path
 * (`Tr2GrannyAnimation`) route through it rather than keeping forks.
 *
 * It exists because the generic `curve.evaluate` interpolates a degree-one
 * curve with an incorrect last-knot-relative term. Handles cycling, endpoint
 * clamping and quaternion hemisphere correction.
 */


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
export function sampleDegreeOneCurve(out, data, time, cycle = false, duration = 0, quaternion = false)
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
 * Normalizes a quaternion in place
 * @param {ArrayLike<Number>} value
 * @returns {ArrayLike<Number>} value
 */
export function normalizeQuaternion(value)
{
    const length = Math.hypot(value[0], value[1], value[2], value[3]) || 1;
    value[0] /= length;
    value[1] /= length;
    value[2] /= length;
    value[3] /= length;
    return value;
}

function copyControl(out, controls, dimension, index)
{
    const offset = index * dimension;
    for (let i = 0; i < dimension; i++) out[i] = controls[offset + i];
    return out;
}
