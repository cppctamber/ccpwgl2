// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/Renderable/Stretch/EveLocalPositionCurve.{h,cpp,_Blue.cpp}
import { meta } from "utils";
import { vec3, quat, mat4 } from "math";
import { EveConnector } from "./EveConnector";


/**
 * A position derived from something else - a point on a hull, the centre of a
 * ship, a spot on the plane a planet sits in.
 *
 * Carbon calls it a curve because of the interface it satisfies
 * (`ITriVectorFunction`, i.e. `GetValueAt(out, time)`), not because it
 * interpolates: it COMPUTES a position each time it is asked, from a behaviour
 * and whatever it is attached to. {@link EveConnector} takes its endpoints
 * through this interface, which is how a link follows a moving ship.
 *
 * NOT ALL BEHAVIOURS ARE PORTED, and the ones that are missing are missing for
 * a reason rather than by omission - see {@link EveLocalPositionCurve.Behavior}.
 * An unported behaviour leaves {@link value} untouched rather than guessing, so
 * a connector using one draws from wherever it last was instead of snapping to
 * the origin.
 */
@meta.define("EveLocalPositionCurve", true)
export class EveLocalPositionCurve extends meta.Model
{

    @meta.uint
    behavior = 0;

    /**
     * The last computed position, and the value returned when a behaviour
     * cannot be evaluated.
     * @type {vec3}
     */
    @meta.vector3
    value = vec3.create();

    @meta.notOwned
    @meta.struct()
    parent = null;

    @meta.notOwned
    @meta.struct()
    parentPositionCurve = null;

    @meta.notOwned
    @meta.struct()
    parentRotationCurve = null;

    /**
     * The OTHER end - the thing being aimed at, or from. Carbon uses it as the
     * shooter's position for damage locators and as the direction source for
     * the nearest-bounds behaviour.
     * @type {?Object}
     */
    @meta.notOwned
    @meta.struct()
    alignPositionCurve = null;

    @meta.notOwned
    @meta.struct()
    turretSetObject = null;

    @meta.uint
    muzzleIndex = 0;

    /**
     * Half-extents of the parent's bounding box, used by the ellipsoid
     * intersection. Carbon skips that maths entirely when any axis is under 10
     * units - see {@link EveLocalPositionCurve.MIN_BOUNDING_SIZE}.
     * @type {vec3}
     */
    @meta.vector3
    boundingSize = vec3.create();

    /**
     * Pushes the result further out along the same bearing. Added to the
     * ellipsoid radius rather than scaling it, so it is a clearance in world
     * units.
     * @type {Number}
     */
    @meta.float
    offset = 0;

    @meta.vector3
    positionOffset = vec3.create();

    @meta.string
    locatorSetName = "";

    @meta.int32
    locatorIndex = -1;

    @meta.int32
    damageLocatorIndex = -1;

    @meta.float
    impactSize = 1;

    /**
     * Computes the position for the current behaviour.
     *
     * @param {vec3} [out] - written and returned; {@link value} is updated too
     * @param {Number} [time]
     * @returns {vec3} out
     */
    GetValueAt(out = vec3.create(), time = 0)
    {
        const Behavior = EveLocalPositionCurve.Behavior;

        switch (this.behavior)
        {
            case Behavior.OFFSET_POSITION:
                this._OffsetPosition(this.value, time);
                break;

            case Behavior.OFFSET_PLANE_ROTATION:
                this._OffsetPlaneRotation(this.value, time);
                break;

            case Behavior.CENTER_BOUNDS:
                this._CenterBounds(this.value);
                break;

            case Behavior.NEAREST_BOUNDS:
                this._NearestBounds(this.value, time);
                break;

            // NONE keeps whatever was last written, which is Carbon's behaviour
            // too: its default case falls through to copying the incoming value
            // into m_value rather than computing anything.
            //
            // DAMAGE_LOCATOR, DAMAGE_LOCATOR_IMPACT, NEAREST_FIRING_LOCATOR and
            // ACTIVE_TURRET are unported - see the Behavior enum for why - and
            // deliberately leave `value` alone rather than returning a position
            // that is wrong in a way nothing would notice.
            default:
                break;
        }

        return vec3.copy(out, this.value);
    }

    /**
     * The parent's position plus an offset carried in the parent's own frame.
     * Carbon: `CalculateOffsetPosition` (cpp:52-73).
     * @private
     */
    _OffsetPosition(out, time)
    {
        const g = EveLocalPositionCurve.global;

        vec3.copy(g.vec3_offset, this.positionOffset);

        if (this.parentRotationCurve?.GetValueAt)
        {
            this.parentRotationCurve.GetValueAt(g.quat_0, time);
            vec3.transformQuat(g.vec3_offset, g.vec3_offset, g.quat_0);
        }

        if (!this.parentPositionCurve?.GetValueAt)
        {
            return vec3.copy(out, g.vec3_offset);
        }

        this.parentPositionCurve.GetValueAt(g.vec3_parent, time);
        return vec3.add(out, g.vec3_parent, g.vec3_offset);
    }

    /**
     * The offset swung onto the plane through the parent, keeping its distance.
     * Carbon: `CalculateOffsetPlaneRotation` (cpp:30-50).
     * @private
     */
    _OffsetPlaneRotation(out, time)
    {
        const g = EveLocalPositionCurve.global;

        vec3.set(g.vec3_parent, 0, 0, 0);
        this.parentPositionCurve?.GetValueAt?.(g.vec3_parent, time);

        if (this.alignPositionCurve?.GetValueAt)
        {
            this.alignPositionCurve.GetValueAt(g.vec3_offset, time);
        }
        else
        {
            vec3.copy(g.vec3_offset, this.positionOffset);
        }

        // Same helper the curved anchor uses, and for the same reason: the point
        // has to end up on the plane WITHOUT moving closer to its origin.
        return EveConnector.RotateToPlane(out, g.vec3_offset, g.vec3_parent, EveLocalPositionCurve.UP);
    }

    /**
     * The parent's model centre in world space.
     * Carbon: `GetCenterBoundingSphere` (cpp:143-156).
     * @private
     */
    _CenterBounds(out)
    {
        const parent = this.parent;
        if (!parent) return out;

        if (typeof parent.GetModelCenterWorldPosition === "function")
        {
            parent.GetModelCenterWorldPosition(out);
        }
        else if (typeof parent.GetBoundingSphere === "function")
        {
            const sphere = parent.GetBoundingSphere(EveLocalPositionCurve.global.sph3_0);
            if (sphere) vec3.set(out, sphere[0], sphere[1], sphere[2]);
        }

        return out;
    }

    /**
     * Where a line from the parent toward the aligned point leaves the parent's
     * bounding ELLIPSOID. Carbon: `CalculateNearestBoundingPoint` (cpp:75-141).
     *
     * The direction is taken into the parent's own frame before the ellipsoid
     * is solved, because the box is axis-aligned in that frame and not in the
     * world - Carbon's own comment spends a paragraph on this.
     *
     * @private
     */
    _NearestBounds(out, time)
    {
        const
            g = EveLocalPositionCurve.global,
            hasAll = this.parentPositionCurve?.GetValueAt
                && this.alignPositionCurve?.GetValueAt
                && this.parentRotationCurve?.GetValueAt;

        if (!hasAll)
        {
            // Carbon falls back to the parent's centre rather than to nothing.
            this.parentPositionCurve?.GetValueAt?.(out, time);
            return out;
        }

        this.parentPositionCurve.GetValueAt(g.vec3_parent, time);
        this.alignPositionCurve.GetValueAt(g.vec3_align, time);
        this.parentRotationCurve.GetValueAt(g.quat_0, time);

        const direction = vec3.subtract(g.vec3_direction, g.vec3_align, g.vec3_parent);
        vec3.normalize(direction, direction);

        // Into the parent's frame: invert the rotation, then apply it.
        quat.normalize(g.quat_0, g.quat_0);
        quat.invert(g.quat_0, g.quat_0);
        mat4.fromQuat(g.mat4_0, g.quat_0);

        const local = vec3.transformMat4(g.vec3_local, direction, g.mat4_0);
        const size = this.boundingSize;

        let scaling = this.offset;

        // Carbon guards the ellipsoid solve on every axis exceeding 10 units:
        // "if the object is really small (or the bounding size is erroring),
        // just use the center of it, rather than giving a NaN result". The
        // denominator collapses toward zero for a degenerate box, so this is a
        // NaN guard rather than a level-of-detail choice.
        const MIN = EveLocalPositionCurve.MIN_BOUNDING_SIZE;

        if (size[0] > MIN && size[1] > MIN && size[2] > MIN)
        {
            const
                x2 = local[0] * local[0], y2 = local[1] * local[1], z2 = local[2] * local[2],
                a2 = size[0] * size[0], b2 = size[1] * size[1], c2 = size[2] * size[2],
                denominator = Math.sqrt(x2 * b2 * c2 + y2 * a2 * c2 + z2 * a2 * b2);

            if (denominator > 0)
            {
                scaling += Math.abs(size[0] * size[1] * size[2] / denominator);
            }
        }

        // Scaled along the ORIGINAL direction, not the transformed one - the
        // frame change existed only to solve for the distance.
        return vec3.scaleAndAdd(out, g.vec3_parent, direction, scaling);
    }

    /**
     * Carbon's `LocalPositionBehavior` (EveLocalPositionCurve.h:27-38), in
     * Carbon's order - the value is persisted, so the ordinals are the contract.
     *
     * Four are UNPORTED, and they share a cause: each needs client-side combat
     * state that ccpwgl has no equivalent for.
     *
     *   DAMAGE_LOCATOR, DAMAGE_LOCATOR_IMPACT - need `ITriTargetable`, which
     *     picks a damage locator for an incoming shot and can CREATE and update
     *     an impact effect on the target. That is a game-client concern; there
     *     is no targetable interface here to port it onto.
     *
     *   NEAREST_FIRING_LOCATOR - needs the parent to resolve a locator by SET
     *     NAME and index. ccpwgl has locator sets, so this one is reachable; it
     *     is unported because nothing yet asks for it.
     *
     *   ACTIVE_TURRET - needs a turret set's firing-bone world transform for a
     *     given muzzle, which ccpwgl's turret sets do not expose.
     *
     * @type {Object}
     */
    static Behavior = Object.freeze({
        NONE: 0,
        NEAREST_BOUNDS: 1,
        CENTER_BOUNDS: 2,
        DAMAGE_LOCATOR: 3,
        DAMAGE_LOCATOR_IMPACT: 4,
        OFFSET_POSITION: 5,
        OFFSET_PLANE_ROTATION: 6,
        NEAREST_FIRING_LOCATOR: 7,
        ACTIVE_TURRET: 8
    });

    /**
     * Below this, on any axis, the ellipsoid solve is skipped. Carbon's
     * threshold, in world units.
     * @type {Number}
     */
    static MIN_BOUNDING_SIZE = 10;

    static UP = vec3.fromValues(0, 1, 0);

    static global = {
        vec3_parent: vec3.create(),
        vec3_align: vec3.create(),
        vec3_offset: vec3.create(),
        vec3_direction: vec3.create(),
        vec3_local: vec3.create(),
        quat_0: quat.create(),
        mat4_0: mat4.create(),
        sph3_0: new Float32Array(4)
    };

}
