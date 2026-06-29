export const Tr2CurveInterpolation = {
    CONSTANT: 0,
    LINEAR: 1,
    HERMITE: 2
};

export const Tr2CurveTangentType = {
    AUTO_CLAMP: 0,
    AUTO: 1,
    FREE_JOINED: 2,
    FREE_SPLIT: 3
};

export const Tr2CurveExtrapolation = {
    CLAMP: 0,
    CYCLE: 1,
    MIRROR: 2,
    LINEAR: 3
};

const EPSILON = 1e-6;

export function GetAutoTangent(prevTime, prevValue, time, value, nextTime, nextValue)
{
    let left = 0;
    if (time - prevTime > EPSILON)
    {
        left = (value - prevValue) / (time - prevTime);
    }

    let right = 0;
    if (nextTime - time > EPSILON)
    {
        right = (nextValue - value) / (nextTime - time);
    }

    const x = (time - prevTime) / (nextTime - prevTime);
    return left * (1 - x) + right * x;
}

export function GetAutoClampedTangent(prevTime, prevValue, time, value, nextTime, nextValue)
{
    if ((value < prevValue && value < nextValue) || (value > prevValue && value > nextValue))
    {
        return 0;
    }

    const valueDiff = Math.abs(prevValue - nextValue);
    if (valueDiff === 0)
    {
        return 0;
    }

    let keyDistance = Math.abs(value - prevValue) / valueDiff;
    keyDistance = Math.min(1, Math.min(keyDistance, 1 - keyDistance) * 6);

    const autoTangent = (nextValue - prevValue) / (nextTime - prevTime);
    return autoTangent * keyDistance;
}

export function GetScalarSegmentValue(time, k0, k1)
{
    switch (k0.interpolation)
    {
        case Tr2CurveInterpolation.CONSTANT:
            return time === k1.time ? k1.value : k0.value;

        case Tr2CurveInterpolation.LINEAR:
            if (k1.time === k0.time)
            {
                return k1.value;
            }
            return k0.value + (k1.value - k0.value) * (time - k0.time) / (k1.time - k0.time);

        case Tr2CurveInterpolation.HERMITE: {
            const length = k1.time - k0.time;
            if (length === 0)
            {
                return k1.value;
            }

            const inTangent = k0.rightTangent * length;
            const outTangent = k1.leftTangent * length;
            const s = (time - k0.time) / length;
            const s2 = s * s;
            const s3 = s2 * s;
            const c2 = -2 * s3 + 3 * s2;
            const c1 = 1 - c2;
            const c4 = s3 - s2;
            const c3 = s + c4 - s2;

            return k0.value * c1 + k1.value * c2 + inTangent * c3 + outTangent * c4;
        }

        default:
            return 0;
    }
}

export function GetScalarSegmentTangent(time, k0, k1)
{
    switch (k0.interpolation)
    {
        case Tr2CurveInterpolation.CONSTANT:
            return 0;

        case Tr2CurveInterpolation.LINEAR:
            return (k1.value - k0.value) / (k1.time - k0.time);

        case Tr2CurveInterpolation.HERMITE: {
            const length = k1.time - k0.time;
            if (length === 0)
            {
                return k1.rightTangent;
            }

            const inTangent = k0.rightTangent * length;
            const outTangent = k1.leftTangent * length;
            const s = (time - k0.time) / length;
            const s2 = s * s;
            const m2s = 2 * s;
            const c1 = 6 * s2 - 6 * s;
            const c2 = -c1;
            const c4 = 3 * s2 - m2s;
            const c3 = c4 - m2s + 1;

            return (k0.value * c1 + k1.value * c2 + inTangent * c3 + outTangent * c4) / length;
        }

        default:
            return 0;
    }
}

export function GetWrappedLocalTime(time, first, last, extrapolationBefore, extrapolationAfter)
{
    const length = last - first;
    if (length === 0)
    {
        return first;
    }

    if (time < first)
    {
        const raw = -(time - first) / length;
        const intPart = Math.trunc(raw);
        let fracPart = raw - intPart;

        if (extrapolationBefore === Tr2CurveExtrapolation.CYCLE)
        {
            fracPart = 1 - fracPart;
        }
        else if (intPart % 2 !== 0)
        {
            fracPart = 1 - fracPart;
        }

        return fracPart * length + first;
    }

    if (time <= last)
    {
        return time;
    }

    const raw = (time - first) / length;
    const intPart = Math.trunc(raw);
    let fracPart = raw - intPart;

    if (extrapolationAfter === Tr2CurveExtrapolation.MIRROR && intPart % 2 !== 0)
    {
        fracPart = 1 - fracPart;
    }

    return fracPart * length + first;
}
