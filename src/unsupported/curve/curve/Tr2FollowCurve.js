import { meta } from "utils";
import { vec3 } from "math";


@meta.notImplemented
@meta.type("Tr2FollowCurve")
@meta.ccp.define("Tr2FollowCurve")
export class Tr2FollowCurve extends meta.Model
{
    @meta.string
    name = "";

    @meta.list([ "Tr2ObjectFollowCurveKey", "Tr2CameraFollowCurveKey" ])
    keys = [];

    @meta.private
    @meta.vector3
    currentValue = vec3.create();

    Sort()
    {
        this.keys.sort((a, b) => a.time - b.time);
    }

    UpdateValue(time)
    {
        return this.GetValueAt(time, this.currentValue);
    }

    GetValue(time)
    {
        return this.GetValueAt(time);
    }

    GetValueAt(time, out = vec3.create())
    {
        if (!this.keys.length)
        {
            vec3.set(out, 0, 0, 0);
            return out;
        }

        this.Sort();

        if (time <= this.keys[0].time)
        {
            return this.GetKeyValue(this.keys[0], out);
        }

        const last = this.keys[this.keys.length - 1];
        if (time >= last.time)
        {
            return this.GetKeyValue(last, out);
        }

        for (let i = 0; i < this.keys.length - 1; i++)
        {
            const
                k0 = this.keys[i],
                k1 = this.keys[i + 1];

            if (time >= k0.time && time <= k1.time)
            {
                return this.GetSegmentValue(time, k0, k1, out);
            }
        }

        return this.GetKeyValue(last, out);
    }

    GetSegmentValue(time, k0, k1, out)
    {
        const interpolation = k0.GetInterpolationType ? k0.GetInterpolationType() : k0.interpolation;
        if (interpolation === 0)
        {
            return this.GetKeyValue(k0, out);
        }

        const
            t = k1.time === k0.time ? 0 : (time - k0.time) / (k1.time - k0.time),
            v0 = this.GetKeyValue(k0, Tr2FollowCurve.global.vec3_0),
            v1 = this.GetKeyValue(k1, Tr2FollowCurve.global.vec3_1);

        if (interpolation === 2)
        {
            const
                t2 = t * t,
                t3 = t2 * t,
                h00 = 2 * t3 - 3 * t2 + 1,
                h10 = t3 - 2 * t2 + t,
                h01 = -2 * t3 + 3 * t2,
                h11 = t3 - t2,
                dt = k1.time - k0.time,
                m0 = k0.GetRightTangent ? k0.GetRightTangent() : k0.rightTangent,
                m1 = k1.GetLeftTangent ? k1.GetLeftTangent() : k1.leftTangent;

            out[0] = h00 * v0[0] + h10 * dt * m0[0] + h01 * v1[0] + h11 * dt * m1[0];
            out[1] = h00 * v0[1] + h10 * dt * m0[1] + h01 * v1[1] + h11 * dt * m1[1];
            out[2] = h00 * v0[2] + h10 * dt * m0[2] + h01 * v1[2] + h11 * dt * m1[2];
            return out;
        }

        vec3.lerp(out, v0, v1, t);
        return out;
    }

    GetKeyValue(key, out)
    {
        if (key.GetValue)
        {
            return key.GetValue(out);
        }

        vec3.copy(out, key.offset || key.value || Tr2FollowCurve.global.vec3_0);
        return out;
    }

    GetValueDotAt(time, out = vec3.create())
    {
        vec3.set(out, 0, 0, 0);
        return out;
    }

    GetValueDoubleDotAt(time, out = vec3.create())
    {
        vec3.set(out, 0, 0, 0);
        return out;
    }

    InterpolatedPosition(out, time)
    {
        return this.GetValueAt(time, out);
    }

    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create()
    };
}
