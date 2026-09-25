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
 * (`ITriVectorFunction`; exposed with ccpwgl's `GetValueAt(time, out)`), not because it
 * interpolates: it COMPUTES a position each time it is asked, from a behaviour
 * and whatever it is attached to. {@link EveConnector} takes its endpoints
 * through this interface, which is how a link follows a moving ship.
 *
 * All Carbon behaviours are represented. Behaviours that depend on an absent
 * parent API leave the caller with the authored {@link value} fallback. The damage-impact behaviour can
 * drive the complete CreateImpact/UpdateImpact lifecycle; displaying the
 * overlay still depends on the target object's implementation of those calls.
 */
@meta.define("EveLocalPositionCurve", true)
export class EveLocalPositionCurve extends meta.Model
{

    @meta.uint
    behavior = 0;

    /**
     * The authored fallback copied into each evaluation output before a
     * behaviour attempts to replace it.
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
     * Carbon's handle for the impact overlay created by
     * {@link _DamageLocatorImpact}. A failed creation remains -1 so the next
     * evaluation can retry once the target's impact system is ready.
     * @type {Number}
     * @private
     */
    _impactEffectIndex = -1;

    /**
     * Computes the position for the current behaviour.
     *
     * @param {Number} [time]
     * @param {vec3} [out] - written and returned
     * @returns {vec3} out
     */
    GetValueAt(time = 0, out = vec3.create())
    {
        const Behavior = EveLocalPositionCurve.Behavior;
        vec3.copy(out, this.value);

        switch (this.behavior)
        {
            case Behavior.OFFSET_POSITION:
                this._OffsetPosition(out, time);
                break;

            case Behavior.OFFSET_PLANE_ROTATION:
                this._OffsetPlaneRotation(out, time);
                break;

            case Behavior.CENTER_BOUNDS:
                this._CenterBounds(out);
                break;

            case Behavior.NEAREST_BOUNDS:
                this._NearestBounds(out, time);
                break;

            case Behavior.DAMAGE_LOCATOR:
                this._DamageLocator(out, time);
                break;

            case Behavior.DAMAGE_LOCATOR_IMPACT:
                this._DamageLocatorImpact(out, time);
                break;

            case Behavior.NEAREST_FIRING_LOCATOR:
                this._NearestFiringLocator(out);
                break;

            case Behavior.ACTIVE_TURRET:
                this._ActiveTurret(out);
                break;

            // NONE keeps whatever was last written, which is Carbon's behaviour
            // too: its default case falls through to copying the incoming value
            // into m_value rather than computing anything.
            //
            default:
                break;
        }

        return out;
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
            this.parentRotationCurve.GetValueAt(time, g.quat_0);
            vec3.transformQuat(g.vec3_offset, g.vec3_offset, g.quat_0);
        }

        if (!this.parentPositionCurve?.GetValueAt)
        {
            return vec3.copy(out, g.vec3_offset);
        }

        this.parentPositionCurve.GetValueAt(time, g.vec3_parent);
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
        this.parentPositionCurve?.GetValueAt?.(time, g.vec3_parent);

        if (this.alignPositionCurve?.GetValueAt)
        {
            this.alignPositionCurve.GetValueAt(time, g.vec3_offset);
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
            this.parentPositionCurve?.GetValueAt?.(time, out);
            return out;
        }

        this.parentPositionCurve.GetValueAt(time, g.vec3_parent);
        this.alignPositionCurve.GetValueAt(time, g.vec3_align);
        this.parentRotationCurve.GetValueAt(time, g.quat_0);

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
     * Picks the damage locator nearest the aligned point once, then follows
     * that locator in world space. Carbon deliberately latches the index: a
     * moving shooter does not make an in-flight stretch jump between locators.
     *
     * @param {vec3} out
     * @param {Number} time
     * @returns {vec3}
     * @private
     */
    _DamageLocator(out, time)
    {
        const parent = this.parent;
        if (!this.alignPositionCurve?.GetValueAt ||
            typeof parent?.GetGoodDamageLocatorIndex !== "function" ||
            typeof parent?.GetDamageLocatorPosition !== "function")
        {
            return out;
        }

        if (this.damageLocatorIndex === -1)
        {
            this.alignPositionCurve.GetValueAt(time, EveLocalPositionCurve.global.vec3_align);
            const index = Number(parent.GetGoodDamageLocatorIndex(
                EveLocalPositionCurve.global.vec3_align
            ));
            if (!Number.isFinite(index)) return out;
            this.damageLocatorIndex = index | 0;
        }

        parent.GetDamageLocatorPosition(out, this.damageLocatorIndex, true);
        return out;
    }

    /**
     * Damage-locator tracking with Carbon's impact-overlay lifecycle. The
     * target receives the unnormalised vector from the locator towards the
     * shooter. Creation is retried while it returns -1; a valid handle is then
     * reused and updated on every evaluation.
     *
     * @param {vec3} out
     * @param {Number} time
     * @returns {vec3}
     * @private
     */
    _DamageLocatorImpact(out, time)
    {
        const parent = this.parent;
        if (!this.alignPositionCurve?.GetValueAt ||
            typeof parent?.GetGoodDamageLocatorIndex !== "function" ||
            typeof parent?.GetDamageLocatorPosition !== "function")
        {
            return out;
        }

        const g = EveLocalPositionCurve.global;
        this.alignPositionCurve.GetValueAt(time, g.vec3_align);

        if (this.damageLocatorIndex === -1)
        {
            const index = Number(parent.GetGoodDamageLocatorIndex(g.vec3_align));
            if (!Number.isFinite(index)) return out;
            this.damageLocatorIndex = index | 0;
        }

        parent.GetDamageLocatorPosition(out, this.damageLocatorIndex, true);
        vec3.subtract(g.vec3_direction, g.vec3_align, out);

        if (this._impactEffectIndex === -1 && typeof parent.CreateImpact === "function")
        {
            const impactEffectIndex = Number(parent.CreateImpact(
                this.damageLocatorIndex,
                g.vec3_direction,
                2,
                this.impactSize
            ));
            if (Number.isFinite(impactEffectIndex)) this._impactEffectIndex = impactEffectIndex | 0;
        }

        if (typeof parent.UpdateImpact === "function")
        {
            parent.UpdateImpact(out, g.vec3_direction, this._impactEffectIndex);
        }

        return out;
    }

    /**
     * Resolves a locator in a named set. Missing configuration or parent API
     * leaves the previous value untouched.
     *
     * @param {vec3} out
     * @returns {vec3}
     * @private
     */
    _NearestFiringLocator(out)
    {
        if (this.locatorIndex !== -1 && this.locatorSetName &&
            typeof this.parent?.GetLocatorPosition === "function")
        {
            this.parent.GetLocatorPosition(out, this.locatorIndex, true, this.locatorSetName);
        }
        return out;
    }

    /**
     * Reads the active turret muzzle's firing-bone world transform and returns
     * its translation. When no active turret or firing bone is available, the
     * turret API supplies its authored parent-transform fallback.
     *
     * @param {vec3} out
     * @returns {vec3}
     * @private
     */
    _ActiveTurret(out)
    {
        const turretSet = this.turretSetObject;
        if (typeof turretSet?.GetFiringBoneWorldTransform !== "function") return out;

        const transform = EveLocalPositionCurve.global.mat4_turret;
        if (turretSet.GetFiringBoneWorldTransform(transform, this.muzzleIndex) !== false)
        {
            mat4.getTranslation(out, transform);
        }
        return out;
    }

    /**
     * Carbon's `LocalPositionBehavior` (EveLocalPositionCurve.h:27-38), in
     * Carbon's order - the value is persisted, so the ordinals are the contract.
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
        mat4_turret: mat4.create(),
        sph3_0: new Float32Array(4)
    };

}
