// Source: E:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\LineSetPaths\IEveLineSetPath.h
import { meta } from "utils";
import { mat4, quat, vec3, vec4, sph3 } from "math";
import { EveChildTransform } from "eve/child/EveChildTransform";


/**
 * Base for the shapes an `EveChildLineSet` draws along: a generator that turns
 * its own parameters into a list of points, and then turns consecutive points
 * into lines on a shared `EveCurveLineSet`.
 *
 * Carbon's paths multiple-inherit `IEveLineSetPath` and `EveChildTransform`
 * (`EveCircle.h:8-13`, `EveBezierCurve.h`), so this base extends ccpwgl's
 * `EveChildTransform` to get the same SRT handling - including the detail that
 * matters here: `UpdateTransform` writes `localTransform` from the SRT triple
 * and `worldTransform` from that times the parent, and the points are emitted
 * through `localTransform` alone. The line set is what carries them the rest of
 * the way, so a path's points are in the LINE SET's space, not the world's.
 *
 * Carbon duplicates `GeneratePoints`/`AddLinesToSet` per shape rather than
 * sharing them, and so does this: they are short, and the closing-segment rule
 * genuinely differs between a closed circle and an open curve. What is shared is
 * the state and the segment count, which are identical expressions in both.
 */
@meta.define("IEveLineSetPath", true)
export class IEveLineSetPath extends EveChildTransform
{

    /** Generated points, in this path's local space. @type {Array<vec3>} */
    _points = [];

    /** @type {vec4} centre xyz, radius w - local, before `localTransform` */
    _boundingSphere = vec4.create();

    /**
     * The transform this path last generated against, so a regeneration
     * triggered by a parameter change (rather than by the owning line set) still
     * lands in the right place. Carbon keeps the same field for the same reason
     * (`m_parentTransform`, `EveCircle.cpp:99-107`).
     * @type {mat4}
     */
    _parentTransform = mat4.create();

    _regeneratePoints = true;

    /** Curve bindings notify UpdateValues, which dispatches this hook. */
    OnValueChanged()
    {
        // Animated endpoints, completeness and segment counts must invalidate
        // the samples too; OnModified alone only catches direct notifications.
        this._regeneratePoints = true;
    }

    /**
     * How many segments this path resolves to.
     *
     * `scaleSegmentsByCompleteness` shortens the path by dropping segments
     * instead of shortening each one. `completeness` runs 0..2 and the distance
     * from 1 is what shortens it, so 0 and 2 are both empty and 1 is whole
     * (`EveCircle.cpp:92`, `EveBezierCurve.cpp:94` - the same expression).
     *
     * @returns {Number}
     */
    SegmentCount()
    {
        const segments = this.SegmentSource();

        const scaled = this.scaleSegmentsByCompleteness
            ? (segments + 0.5) * (1 - Math.abs(this.completeness - 1))
            : segments + 0.5;

        return Math.trunc(scaled);
    }

    /**
     * The authored segment count.
     *
     * Both shapes hold it in Carbon's `m_segments`, but they SERIALISE it under
     * different names - the circle writes `numSegments` and the bezier writes
     * `segments` (`EveCircle_Blue.cpp`, `EveBezierCurve_Blue.cpp`). The field
     * names have to match the file, so the shared expression asks for the value
     * instead of naming a field.
     *
     * @returns {Number}
     */
    SegmentSource()
    {
        return this.segments;
    }

    /**
     * Resolves the transform a `GeneratePoints` call should use, and records it.
     *
     * Carbon treats an identity argument as "no parent supplied, reuse the one I
     * was last given" (`EveCircle.cpp:99-107`), which is how a regeneration
     * driven by `Update` keeps the placement it had. Callers that do have a
     * parent pass it and it becomes the new record.
     *
     * @param {mat4} [parentTransform]
     * @returns {mat4} this path's local transform, which the points are emitted through
     */
    ApplyParentTransform(parentTransform)
    {
        if (parentTransform && !mat4.exactEquals(parentTransform, IEveLineSetPath.IDENTITY))
        {
            mat4.copy(this._parentTransform, parentTransform);
        }

        this.UpdateTransform(this._parentTransform);
        return this.localTransform;
    }

    /**
     * Advances the scroll animation and regenerates if a parameter changed.
     * Carbon `EveCircle::Update` (cpp:65-83), `EveBezierCurve::Update`.
     * @param {Number} dt
     * @returns {Boolean} true if the points were regenerated
     */
    Update(dt)
    {
        if (this.movementSpeed !== 0)
        {
            this.animValue = (this.animValue + this.movementSpeed * dt) % 1;
        }

        if (this._regeneratePoints)
        {
            this.GeneratePoints();
            this.CalculateBoundingSphere();
            return true;
        }

        return false;
    }

    /**
     * Marks the generated points stale. The `OnModified` handlers the stubs
     * already carried clamp the parameters; this is what makes a clamp take
     * effect, and both readers call `OnModified` equivalents through
     * `Initialize`.
     */
    Initialize()
    {
        this._regeneratePoints = true;
        return true;
    }

    /**
     * @returns {Number} number of generated points
     */
    GetPointCount()
    {
        return this._points.length;
    }

    /**
     * This path's bounding sphere, moved into the line set's space.
     * Carbon `GetBoundingSphere` + `BoundingSphereTransform(m_localTransform, sphere)`
     * (`EveBezierCurve.cpp:144-148`).
     * @param {vec4} [out]
     * @returns {vec4} out
     */
    GetBoundingSphere(out = vec4.create())
    {
        const centre = vec3.transformMat4(IEveLineSetPath.global.vec3_0, this._boundingSphere, this.localTransform);
        const scale = mat4.maxScaleOnAxis(this.localTransform);
        return vec4.set(out, centre[0], centre[1], centre[2], this._boundingSphere[3] * scale);
    }

    // Empty base paths remain inert for compatibility with legacy hydrated data.

    /**
     * Lays out this shape's points, in its own local space.
     * @param {mat4} [parentTransform]
     */
    GeneratePoints(parentTransform)
    {
    }

    /**
     * @param {Number} [meshSize]
     */
    CalculateBoundingSphere(meshSize)
    {
    }

    /**
     * Adds this path's segments to a line set.
     * @param {EveCurveLineSet} lineSet
     * @param {vec4} color
     * @param {vec4} animColor
     * @param {Number} scrollSpeed
     */
    AddLinesToSet(lineSet, color, animColor, scrollSpeed)
    {
    }

    /**
     * Adds one segment, applying the scroll animation when there is one.
     * Carbon pairs every `AddStraightLine` with a conditional
     * `ChangeLineAnimation` (`EveCircle.cpp:200-205`); ccpwgl's line set returns
     * the item rather than an id, so the animation is set on it directly.
     *
     * @param {EveCurveLineSet} lineSet
     * @param {vec3} start
     * @param {vec3} end
     * @param {vec4} color
     * @param {vec4} animColor
     * @param {Number} scrollSpeed
     * @returns {EveCurveLineSetItem}
     */
    AddSegment(lineSet, start, end, color, animColor, scrollSpeed)
    {
        const item = lineSet.AddStraightLine(start, end, this.lineWidth, color, color);
        if (scrollSpeed !== 0 && item) item.ChangeAnimation(animColor, scrollSpeed, 1);
        return item;
    }

    /**
     * Applies Carbon's per-path transformed-sphere frustum test.
     * @param {Tw2Frustum} frustum
     * @param {Number} parentLodLevel
     * @param {mat4} systemLocation
     */
    UpdateVisibility(frustum, parentLodLevel, systemLocation)
    {
        if (!this.display)
        {
            this.isVisible = false;
            return;
        }

        const sphere = IEveLineSetPath.global.sph3_0;
        this.GetBoundingSphere(sphere);
        sph3.transformMat4(sphere, sphere, systemLocation);
        this.isVisible = frustum.IsSphereVisible(sphere, sphere[3]);
    }

    /** Restores authored path visibility. */
    ResetLod()
    {
        this.isVisible = true;
    }

    /** Writes packed 3x4 transforms; returns the next float offset. */
    UpdateBuffer(data, offset = 0, systemLocation, viewPosition)
    {
        return offset;
    }

    /** Writes Carbon's zero-scale records without changing the instance count. */
    WriteHiddenInstances(data, offset)
    {
        const end = offset + this.GetPointCount() * 12;
        data.fill(0, offset, end);
        return end;
    }

    /**
     * Packs one path-local instance, including camera-facing orientation.
     * Carbon: EveCircle.cpp:240-263 and EveBezierCurve.cpp:269-287.
     */
    WriteInstanceTransform(data, offset, translation, direction, size, systemLocation, viewPosition)
    {
        const g = IEveLineSetPath.global;
        if (this.billboardObjects)
        {
            // Carbon (row-vector): local * system, local first.
            mat4.multiply(g.mat4_0, systemLocation, this.localTransform);
            mat4.getScaling(g.vec3_2, g.mat4_0);
            for (let column = 0; column < 3; column++)
            {
                for (let row = 0; row < 3; row++)
                {
                    g.mat4_1[column * 4 + row] = g.vec3_2[column] ? g.mat4_0[column * 4 + row] / g.vec3_2[column] : 0;
                }
            }
            mat4.getRotation(g.quat_0, g.mat4_1);
            quat.normalize(g.quat_0, g.quat_0);
            quat.conjugate(g.quat_0, g.quat_0);
            vec3.transformMat4(g.vec3_2, translation, g.mat4_0);
            vec3.subtract(direction, viewPosition, g.vec3_2);
            vec3.transformQuat(direction, direction, g.quat_0);
        }

        // TriMath.cpp:341-358, TriQuaternionArcFromForward uses forward -Z.
        vec3.normalize(g.vec3_2, direction);
        if (g.vec3_2[2] < 0.99999)
        {
            const z = Math.sqrt(1 - g.vec3_2[2]);
            const div = Math.SQRT1_2 / z;
            quat.set(g.quat_0, g.vec3_2[1] * div, -g.vec3_2[0] * div, 0, Math.SQRT1_2 * z);
        }
        else
        {
            quat.set(g.quat_0, 1, 0, 0, 0);
        }
        vec3.scale(g.vec3_2, this.objectScale, size);
        mat4.fromRotationTranslationScale(g.mat4_0, g.quat_0, translation, g.vec3_2);
        // Carbon (row-vector): instance * local, instance first.
        mat4.multiply(g.mat4_0, this.localTransform, g.mat4_0);
        for (let row = 0; row < 3; row++)
        {
            for (let column = 0; column < 4; column++)
            {
                data[offset++] = g.mat4_0[column * 4 + row];
            }
        }
        return offset;
    }

    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create(),
        translation: vec3.create(),
        direction: vec3.create(),
        target: vec3.create(),
        endpoint: vec3.create(),
        mat4_0: mat4.create(),
        mat4_1: mat4.create(),
        quat_0: quat.create(),
        sph3_0: sph3.create()
    };

    static IDENTITY = mat4.create();

}
