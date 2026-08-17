// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
// Adapted: relocated from runtime-trinity's `eve/CjsDistributionRandom.js` (one
// level above `eve/distribution/`) to `eve/distribution/CjsDistributionRandom.js`
// so the shared helper stays inside this port's target directory.
/**
 * Carbon distribution helpers shared by the generated placement modifiers.
 * std::minstd_rand is Park-Miller with multiplier 48271 and modulus 2^31 - 1.
 */
export function createMinStdRandom(seed)
{
    const modulus = 2147483647;
    let state = Math.trunc(seed) % modulus;
    if (state === 0)
    {
        state = 1;
    }
    else if (state < 0)
    {
        state += modulus;
    }

    return function next()
    {
        state = state * 48271 % modulus;
        return (state - 1) / (modulus - 1);
    };
}


/**
 * Seed for a placement's random stream: the placement's own unique ID when the
 * distribution wants a result that is stable across runs, otherwise the time
 * seed shifted left by that ID.
 */
export function getDistributionSeed(uniqueID, timeSeed, consistentRandom)
{
    const id = Number(uniqueID) >>> 0;
    return consistentRandom ? id : (Number(timeSeed) << (id % 11)) >>> 0;
}


/** Carbon math::RotationQuaternion(yaw, pitch, roll), with radian inputs. */
export function setYawPitchRoll(out, yaw, pitch, roll)
{
    const sinYaw = Math.sin(yaw / 2);
    const cosYaw = Math.cos(yaw / 2);
    const sinPitch = Math.sin(pitch / 2);
    const cosPitch = Math.cos(pitch / 2);
    const sinRoll = Math.sin(roll / 2);
    const cosRoll = Math.cos(roll / 2);

    out[0] = sinYaw * cosPitch * sinRoll + cosYaw * sinPitch * cosRoll;
    out[1] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
    out[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
    out[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
    return out;
}
