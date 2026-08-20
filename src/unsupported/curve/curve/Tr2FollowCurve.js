import { meta } from "utils";
import { vec3 } from "math";


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

    /**
     * Sorts the keys by time.
     *
     * Carbon sorts on LIST MODIFICATION (`OnListModified`, cpp:21-37) with a
     * stable sort, not on every read. This sorts on demand and remembers, which
     * reaches the same state without sorting once per sample per frame.
     */
    Sort()
    {
        this.keys.sort((a, b) => a.GetTime() - b.GetTime());
        this._keysDirty = false;
    }

    /**
     * Sorts only if something marked the keys stale. Separate from `Sort` so
     * that calling `Sort()` still unconditionally sorts - narrowing a public
     * method to a no-op is the kind of change that breaks a caller silently.
     */
    SortIfNeeded()
    {
        if (this._keysDirty) this.Sort();
    }

    /**
     * Marks the keys unsorted. Anything that adds, removes or retimes a key
     * should call this - it is the hook Carbon gets from its list notify.
     */
    OnListModified()
    {
        this._keysDirty = true;
        return true;
    }

    UpdateValue(time)
    {
        return this.GetValueAt(time, this.currentValue);
    }

    GetValue(time)
    {
        return this.GetValueAt(time);
    }

    /**
     * Samples the curve.
     *
     * Carbon `Tr2FollowCurve::GetValue` (cpp:39-67) selects with a single walk:
     * `currentKey` is the last key at or before `time`, `nextKey` the first key
     * after it. Both present is a segment; only `currentKey` is past the end and
     * holds; NEITHER - which happens BEFORE THE FIRST KEY - returns a zero
     * vector, not the first key's value.
     *
     * That last case is the one worth stating: this used to clamp to `keys[0]`
     * before the first key, which is the intuitive reading and not what Carbon
     * does. Following Carbon's loop shape rather than a range scan also removes
     * the boundary question at exactly a key's time, since a key that is not
     * strictly after `time` becomes the current key rather than the far end of a
     * segment.
     *
     * @param {Number} time
     * @param {vec3} [out]
     * @returns {vec3} out
     */
    GetValueAt(time, out = vec3.create())
    {
        vec3.set(out, 0, 0, 0);

        if (!this.keys.length) return out;

        this.SortIfNeeded();

        let current = null, next = null;

        for (let i = 0; i < this.keys.length; i++)
        {
            const key = this.keys[i];
            if (!key) continue;

            if (time < key.GetTime())
            {
                next = key;
                break;
            }

            current = key;
        }

        if (current && next) return this.GetSegmentValue(time, current, next, out);
        if (current) return this.GetKeyValue(current, out);

        // before the first key - Carbon returns a default-constructed Vector3
        return out;
    }

    /**
     * Interpolates within one segment.
     *
     * Carbon `GetSegmentValue` (cpp:69-...): CONSTANT holds `k0` except exactly
     * at `k1`'s time, which matters only for keys sharing a time; LINEAR is a
     * plain lerp; HERMITE scales each tangent by the segment length.
     *
     * Carbon's Hermite coefficients are written as `c1 = 1 - c2`,
     * `c3 = s + c4 - s^2`, which expand to the standard basis - c1 is h00, c2 is
     * h01, c3 is h10 and c4 is h11 - so the two forms are the same polynomial.
     *
     * @param {Number} time
     * @param {*} k0
     * @param {*} k1
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetSegmentValue(time, k0, k1, out)
    {
        const
            t0 = k0.GetTime(),
            t1 = k1.GetTime(),
            interpolation = k0.GetInterpolationType();

        if (interpolation === Tr2FollowCurve.Interpolation.CONSTANT)
        {
            return this.GetKeyValue(time === t1 ? k1 : k0, out);
        }

        if (t1 === t0) return this.GetKeyValue(k1, out);

        const
            g = Tr2FollowCurve.global,
            length = t1 - t0,
            s = (time - t0) / length,
            v0 = this.GetKeyValue(k0, g.vec3_0),
            v1 = this.GetKeyValue(k1, g.vec3_1);

        if (interpolation === Tr2FollowCurve.Interpolation.HERMITE)
        {
            const
                s2 = s * s,
                s3 = s2 * s,
                c2 = -2 * s3 + 3 * s2,
                c1 = 1 - c2,
                c4 = s3 - s2,
                c3 = s + c4 - s2,
                m0 = k0.GetRightTangent(),
                m1 = k1.GetLeftTangent();

            for (let i = 0; i < 3; i++)
            {
                out[i] = v0[i] * c1 + v1[i] * c2 + m0[i] * length * c3 + m1[i] * length * c4;
            }

            return out;
        }

        return vec3.lerp(out, v0, v1, s);
    }

    /**
     * @param {*} key
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetKeyValue(key, out)
    {
        return key.GetValue(out);
    }

    // The three below are unimplemented IN CARBON as well - all of them are a
    // bare `return in;` / `return out;` with the argument untouched
    // (`Tr2FollowCurve.cpp:135-158`). So there is no reference behaviour to port,
    // and returning the caller's vector unchanged is the faithful result, which
    // is also what the sibling `Tr2CurveCombiner` already does. They previously
    // zeroed the output, and `InterpolatedPosition` sampled the curve - both
    // inventions, and the second one is the kind that reads as working.

    /**
     * First derivative - not implemented, here or in Carbon.
     * @param {Number} time
     * @param {vec3} [out]
     * @returns {vec3} out, unchanged
     */
    GetValueDotAt(time, out = vec3.create())
    {
        return out;
    }

    /**
     * Second derivative - not implemented, here or in Carbon.
     * @param {Number} time
     * @param {vec3} [out]
     * @returns {vec3} out, unchanged
     */
    GetValueDoubleDotAt(time, out = vec3.create())
    {
        return out;
    }

    /**
     * Not implemented, here or in Carbon. Argument order follows Carbon's
     * `InterpolatedPosition( Vector3d* out, Be::Time time )` - out first, unlike
     * `Tr2CurveCombiner`'s.
     * @param {vec3} out
     * @param {Number} time
     * @returns {vec3} out, unchanged
     */
    InterpolatedPosition(out, time)
    {
        return out;
    }

    _keysDirty = true;

    /**
     * Carbon `Tr2FollowCurveKeyInterpolation`.
     * @type {Object<String:Number>}
     */
    static Interpolation = {
        CONSTANT: 0,
        LINEAR: 1,
        HERMITE: 2
    };

    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create()
    };
}
