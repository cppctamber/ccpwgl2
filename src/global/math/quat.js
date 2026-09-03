import { quat as glQuat } from "gl-matrix";
import { vec3 } from "./vec3";
import { num } from "./num";
import { pool } from "global/math/pool";

const quat = { ...glQuat };

export { quat };

/**
 * Allocates a pooled vec4
 * @returns {Float32Array|quat}
 */
quat.alloc = function()
{
    return pool.allocF32(4);
};

/**
 * Unallocates a pooled vec4
 * @param {Float32Array|quat} a
 */
quat.unalloc = function(a)
{
    pool.freeType(a);
};

/**
 * Creates a quat from unit vectors
 *
 * @param {quat} out
 * @param {vec3} from
 * @param {vec3} to
 * @returns {quat}
 */
quat.fromUnitVectors = function(out, from, to)
{
    let r = vec3.dot(from, to) + 1;
    if (r < num.EPSILON)
    {
        r = 0;
        if (Math.abs(from[0]) > Math.abs(from[2]))
        {
            out[0] = -from[1];
            out[1] = from[0];
            out[2] = 0;
            out[3] = r;
        }
        else
        {
            out[0] = 0;
            out[1] = - from[2];
            out[2] = from[1];
            out[3] = r;
        }
    }
    else
    {
        out[0] = from[1] * to[2] - from[2] * to[1];
        out[1] = from[2] * to[0] - from[0] * to[2];
        out[2] = from[0] * to[1] - from[1] * to[0];
        out[3] = r;
    }
    return quat.normalize(out, out);
};

/**
 * Creates a Carbon yaw/pitch/roll quaternion.
 * @param {quat} out
 * @param {Number} yaw
 * @param {Number} pitch
 * @param {Number} roll
 * @returns {quat}
 */
quat.fromYawPitchRoll = function(out, yaw, pitch, roll)
{
    const
        sinYaw = Math.sin(yaw / 2),
        cosYaw = Math.cos(yaw / 2),
        sinPitch = Math.sin(pitch / 2),
        cosPitch = Math.cos(pitch / 2),
        sinRoll = Math.sin(roll / 2),
        cosRoll = Math.cos(roll / 2);

    out[0] = sinYaw * cosPitch * sinRoll + cosYaw * sinPitch * cosRoll;
    out[1] = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
    out[2] = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
    out[3] = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
    return out;
};
