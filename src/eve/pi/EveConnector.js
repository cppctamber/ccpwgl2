// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/UI/EveConnector.{h,cpp,_Blue.cpp}
import { meta } from "utils";
import { vec3, vec4 } from "math";


const
    UP = vec3.fromValues(0, 1, 0),
    ALT_UP = vec3.fromValues(1, 0, 0),
    DEG_TO_RAD = Math.PI / 180,
    ELLIPSE_SEGMENTS = 32,
    ELLIPSE_LINE_SEGMENTS = 5,
    ELLIPSE_MIDDLE_BULGE = 1.01;


/**
 * A line, or ring of lines, drawn between two points - the link between two
 * planetary-interaction pins, and the orbit and anchor rings drawn around them.
 *
 * Carbon files this under `Eve/UI` alongside the tactical overlay and the curve
 * line sets, not under space objects: it is in-space UI, and it OWNS no
 * geometry. `AddLine` appends its lines to a caller-supplied
 * {@link EveCurveLineSet}, which draws them. One connector may add a dozen
 * lines; nothing is removed, so a caller that rebuilds clears the set itself.
 *
 * Endpoints come either from plain positions or from curves. `Update` samples
 * the curves; `AddLine` uses whatever the last sample left.
 */
@meta.define("EveConnector", true)
export class EveConnector extends meta.Model
{

    @meta.color
    animationColor = vec4.fromValues(1, 0, 0, 1);

    @meta.float
    animationScale = 1;

    @meta.float
    animationSpeed = 0;

    /**
     * Divides the animation speed by the line's own length and scales the
     * animation to it, so a long line and a short one animate at the same
     * apparent rate rather than the same absolute one.
     * @type {Boolean}
     */
    @meta.boolean
    autoScaleAnimation = false;

    @meta.color
    color = vec4.fromValues(0.5, 0.5, 0.5, 1);

    /**
     * Sampled into {@link destPosition} by `Update`, if present.
     * @type {?Object}
     */
    @meta.notOwned
    @meta.struct()
    destObject = null;

    @meta.vector3
    destPosition = vec3.create();

    @meta.boolean
    isAnimated = false;

    /**
     * Carbon's `m_length`, and NOT the length of the line that gets drawn -
     * that is measured per line and kept privately. This is the authored radius
     * for `CIRCLE` and `ORBIT`, and for `POINT_TO_POINT` a cap: a longer link
     * is cut to it and its far end faded out.
     * @type {Number}
     */
    @meta.float
    length = 0;

    @meta.float
    lineWidth = 1;

    /**
     * The plane `CIRCLE`, `ELLIPSE` and `ORBIT` are drawn in. The XZ_ types
     * ignore it and use world Y, as their names say.
     * @type {vec3}
     */
    @meta.vector3
    planeNormal = vec3.fromValues(0, 1, 0);

    /**
     * Sampled into {@link sourcePosition} by `Update`, if present.
     * @type {?Object}
     */
    @meta.notOwned
    @meta.struct()
    sourceObject = null;

    @meta.vector3
    sourcePosition = vec3.create();

    @meta.uint
    type = 0;

    /**
     * The length of the last line added, which is what `autoScaleAnimation`
     * divides by. Carbon keeps it on the connector for the same reason.
     * @type {Number}
     */
    _lineLength = 1;

    /**
     * Samples both endpoint curves.
     *
     * A curve is optional on either end; an absent one leaves the authored
     * position alone rather than zeroing it.
     *
     * @param {Number} time - seconds, as the curve expects
     */
    Update(time)
    {
        this.sourceObject?.GetValueAt?.(this.sourcePosition, time);
        this.destObject?.GetValueAt?.(this.destPosition, time);
    }

    /**
     * Appends this connector's lines to a curve line set.
     *
     * @param {EveCurveLineSet} lineSet
     * @returns {Boolean} whether anything was added
     */
    AddLine(lineSet)
    {
        if (!lineSet) return false;

        const
            g = EveConnector.global,
            Type = EveConnector.Type,
            source = this.sourcePosition,
            dest = this.destPosition,
            v = g.vec3_0;

        switch (this.type)
        {
            case Type.STRAIGHT_ANCHOR:
                // Straight down from the pin to the plane its planet sits in.
                EveConnector.ProjectOnPlane(v, dest, source, UP);
                this._lineLength = vec3.distance(v, dest);
                this._AddStraightLine(lineSet, dest, v);
                return true;

            case Type.CURVED_ANCHOR:
            {
                // The same drop, but around the planet rather than through it.
                EveConnector.RotateToPlane(v, dest, source, UP);

                const
                    toDest = vec3.subtract(g.vec3_1, dest, source),
                    toProjected = vec3.subtract(g.vec3_2, v, source),
                    radius = vec3.length(toDest);

                vec3.normalize(toDest, toDest);
                vec3.normalize(toProjected, toProjected);

                // Arc length, so the animation covers the curve rather than the
                // chord across it.
                this._lineLength = radius * Math.acos(EveConnector.Clamp(vec3.dot(toDest, toProjected), -1, 1));
                this._AddSpheredSegment(lineSet, dest, v, source);
                return true;
            }

            case Type.XZ_CIRCLE:
                this._lineLength = Math.PI * vec3.distance(dest, source) * 0.5;
                this._AddCircleXZ(lineSet, source, vec3.distance(dest, source));
                return true;

            case Type.XZ_CIRCLE_STRAIGHT:
            {
                EveConnector.ProjectOnPlane(v, dest, source, UP);
                const radius = vec3.distance(v, source);
                this._lineLength = Math.PI * radius * 0.5;
                this._AddCircleXZ(lineSet, source, radius);
                return true;
            }

            case Type.CIRCLE:
                this._AddCircle(lineSet, source, this.length, this.planeNormal);
                return true;

            case Type.ELLIPSE:
                // The destination is not a POSITION here - it carries the two
                // radii and the rotation. Carbon reads it the same way.
                this._AddEllipse(lineSet, source, dest[0], dest[1], dest[2], this.planeNormal);
                return true;

            case Type.ORBIT:
                this._AddOrbit(lineSet, dest, this.length, this.planeNormal);
                return true;

            case Type.POINT_TO_POINT:
            default:
            {
                vec3.subtract(v, dest, source);
                this._lineLength = vec3.length(v);

                // Capped links fade out at the cut rather than stopping dead.
                const capped = this.length > 0 && this._lineLength > this.length;

                if (capped)
                {
                    vec3.normalize(v, v);
                    vec3.scaleAndAdd(v, source, v, this.length);
                }
                else
                {
                    vec3.copy(v, dest);
                }

                this._AddStraightLine(lineSet, source, v, capped);
                return true;
            }
        }
    }

    /**
     * Applies this connector's animation to a line that was just added.
     * @param {EveCurveLineSetItem} item
     * @private
     */
    _Animate(item)
    {
        if (!item || !this.isAnimated) return;

        if (this.autoScaleAnimation)
        {
            // Guarded because a degenerate line has no length to divide by, and
            // Carbon guards it the same way rather than letting it become
            // Infinity.
            const speed = this._lineLength ? this.animationSpeed / this._lineLength : this.animationSpeed;
            item.ChangeAnimation(this.animationColor, speed, this._lineLength * this.animationScale);
        }
        else
        {
            item.ChangeAnimation(this.animationColor, this.animationSpeed, this.animationScale);
        }
    }

    /**
     * @param {EveCurveLineSet} lineSet
     * @param {vec3} source
     * @param {vec3} destination
     * @param {Boolean} [fadeEnd] - fades the far end to nothing
     * @private
     */
    _AddStraightLine(lineSet, source, destination, fadeEnd)
    {
        // A colour, not an alpha: Carbon multiplies the whole RGBA by zero, so
        // an additive line fades out through black rather than through alpha.
        const endColor = fadeEnd
            ? vec4.set(EveConnector.global.vec4_0, 0, 0, 0, 0)
            : this.color;

        this._Animate(lineSet.AddStraightLine(source, destination, this.lineWidth, this.color, endColor));
    }

    /**
     * @param {EveCurveLineSet} lineSet
     * @param {vec3} p0
     * @param {vec3} p1
     * @param {vec3} center
     * @private
     */
    _AddSpheredSegment(lineSet, p0, p1, center)
    {
        this._Animate(lineSet.AddSpheredLineCrt(p0, p1, center, this.lineWidth, this.color, this.color));
    }

    /**
     * A ring, as four sphered quarter-segments.
     *
     * Four rather than one because a sphered line bulges toward its centre, so
     * a quarter is the largest arc that stays circular. Carbon draws all its
     * rings this way.
     *
     * @param {EveCurveLineSet} lineSet
     * @param {vec3} center
     * @param {Number} radius
     * @param {vec3} planeNormal
     * @private
     */
    _AddCircle(lineSet, center, radius, planeNormal)
    {
        const g = EveConnector.global;
        EveConnector.SideAndFront(g.vec3_side, g.vec3_front, planeNormal);
        this._AddCircleFromAxes(lineSet, center, radius, g.vec3_side, g.vec3_front);
    }

    /**
     * The XZ ring, on Carbon's HARDCODED axes.
     *
     * Carbon has two `AddCircle` overloads and the XZ types call the one
     * without a normal, which starts at `+Z` and turns through `+X`
     * (EveConnector.cpp:131-137). Deriving the axes from a world-up normal
     * instead yields `side = +Z`, `front = -X` - the same ring, entered at a
     * different point. Identical while still, and a quarter-turn out of phase
     * once the segments animate, which is exactly the kind of difference that
     * gets called a shader bug.
     *
     * @param {EveCurveLineSet} lineSet
     * @param {vec3} center
     * @param {Number} radius
     * @private
     */
    _AddCircleXZ(lineSet, center, radius)
    {
        const g = EveConnector.global;
        this._AddCircleFromAxes(lineSet, center, radius, vec3.set(g.vec3_side, 1, 0, 0), vec3.set(g.vec3_front, 0, 0, 1));
    }

    /**
     * A ring, as four sphered quarter-segments on the given axes.
     * @param {EveCurveLineSet} lineSet
     * @param {vec3} center
     * @param {Number} radius
     * @param {vec3} side - scaled in place
     * @param {vec3} front - scaled in place
     * @private
     */
    _AddCircleFromAxes(lineSet, center, radius, side, front)
    {
        const
            g = EveConnector.global,
            a = g.vec3_a,
            b = g.vec3_b;

        vec3.scale(side, side, radius);
        vec3.scale(front, front, radius);

        this._AddSpheredSegment(lineSet, vec3.add(a, center, front), vec3.add(b, center, side), center);
        this._AddSpheredSegment(lineSet, vec3.add(a, center, side), vec3.subtract(b, center, front), center);
        this._AddSpheredSegment(lineSet, vec3.subtract(a, center, front), vec3.subtract(b, center, side), center);
        this._AddSpheredSegment(lineSet, vec3.subtract(a, center, side), vec3.add(b, center, front), center);
    }

    /**
     * A ring, plus a spoke from the source out to it.
     *
     * The spoke meets the ring at the nearest point rather than at an axis: the
     * source is projected onto the ring's plane and pushed out to the radius,
     * so the line always reaches the ring squarely however the plane is turned.
     *
     * @param {EveCurveLineSet} lineSet
     * @param {vec3} center
     * @param {Number} radius
     * @param {vec3} planeNormal
     * @private
     */
    _AddOrbit(lineSet, center, radius, planeNormal)
    {
        const
            g = EveConnector.global,
            up = vec3.normalize(g.vec3_up, planeNormal),
            spoke = g.vec3_spoke;

        this._AddCircle(lineSet, center, radius, up);

        vec3.subtract(spoke, center, this.sourcePosition);
        vec3.scaleAndAdd(spoke, this.sourcePosition, up, vec3.dot(up, spoke));
        vec3.subtract(spoke, spoke, center);
        vec3.normalize(spoke, spoke);
        vec3.scaleAndAdd(spoke, center, spoke, radius);

        this._AddStraightLine(lineSet, this.sourcePosition, spoke);
    }

    /**
     * An ellipse, as curved segments around its perimeter.
     *
     * Not sphered segments: a sphered line is an arc of a circle and cannot
     * follow an ellipse, so each span is a curved line through a midpoint.
     *
     * @param {EveCurveLineSet} lineSet
     * @param {vec3} center
     * @param {Number} radiusX
     * @param {Number} radiusY
     * @param {Number} rotation - degrees, in the plane
     * @param {vec3} planeNormal
     * @private
     */
    _AddEllipse(lineSet, center, radiusX, radiusY, rotation, planeNormal)
    {
        const
            g = EveConnector.global,
            side = g.vec3_side,
            front = g.vec3_front,
            rotatedSide = g.vec3_a,
            rotatedFront = g.vec3_b,
            p1 = g.vec3_0,
            p2 = g.vec3_1,
            middle = g.vec3_2;

        EveConnector.SideAndFront(side, front, planeNormal);

        const
            radians = rotation * DEG_TO_RAD,
            cosRot = Math.cos(radians),
            sinRot = Math.sin(radians);

        vec3.scale(rotatedSide, side, cosRot);
        vec3.scaleAndAdd(rotatedSide, rotatedSide, front, sinRot);
        vec3.scale(rotatedFront, side, -sinRot);
        vec3.scaleAndAdd(rotatedFront, rotatedFront, front, cosRot);

        const step = 2 * Math.PI / ELLIPSE_SEGMENTS;

        for (let i = 0; i < ELLIPSE_SEGMENTS; i++)
        {
            const
                t1 = i * step,
                t2 = (i + 1) * step,
                tMid = (t1 + t2) * 0.5;

            EveConnector._EllipsePoint(p1, center, rotatedSide, rotatedFront, radiusX, radiusY, t1, 1);
            EveConnector._EllipsePoint(p2, center, rotatedSide, rotatedFront, radiusX, radiusY, t2, 1);

            // The midpoint is pushed slightly OUTSIDE the ellipse. Carbon's own
            // comment: "magic number 1.01 is to make sure the line is not too
            // jagged" - a curved line bends toward its middle, so a midpoint
            // exactly on the curve leaves each span flat.
            EveConnector._EllipsePoint(middle, center, rotatedSide, rotatedFront, radiusX, radiusY, tMid, ELLIPSE_MIDDLE_BULGE);

            const item = lineSet.AddCurvedLineCrt(p1, p2, middle, this.lineWidth, this.color, this.color);

            // Five, not the default twenty: there are already 32 spans, and
            // Carbon calls the default "overkill for an ellipse with this many
            // curved line segments".
            item?.ChangeSegmentation?.(ELLIPSE_LINE_SEGMENTS);
            this._Animate(item);
        }
    }

    /**
     * A point on the rotated ellipse, optionally pushed out by `bulge`.
     * @private
     */
    static _EllipsePoint(out, center, side, front, radiusX, radiusY, t, bulge)
    {
        const
            x = Math.cos(t) * radiusX * bulge,
            y = Math.sin(t) * radiusY * bulge;

        vec3.scale(out, side, x);
        vec3.scaleAndAdd(out, out, front, y);
        return vec3.add(out, out, center);
    }

    /**
     * Two perpendicular axes spanning the plane a normal defines.
     *
     * The fallback matters: crossing with world up degenerates when the plane's
     * normal IS world up, which is the commonest case here - a ring lying flat.
     * Carbon switches to the X axis past 0.999, and the threshold is a cosine,
     * so it is about two and a half degrees of tolerance.
     *
     * @param {vec3} outSide
     * @param {vec3} outFront
     * @param {vec3} planeNormal
     */
    static SideAndFront(outSide, outFront, planeNormal)
    {
        const up = vec3.normalize(EveConnector.global.vec3_normal, planeNormal);
        const reference = Math.abs(vec3.dot(up, UP)) < 0.999 ? UP : ALT_UP;

        vec3.cross(outSide, reference, up);
        vec3.normalize(outSide, outSide);
        vec3.cross(outFront, outSide, up);
        vec3.normalize(outFront, outFront);
    }

    /**
     * Drops a point onto a plane, straight along the normal.
     * Carbon's `TriVectorProjectOnPlane` (TriMath.cpp:60-66).
     *
     * @param {vec3} out
     * @param {vec3} point
     * @param {vec3} planePoint
     * @param {vec3} normal
     * @returns {vec3} out
     */
    static ProjectOnPlane(out, point, planePoint, normal)
    {
        const offset = vec3.subtract(EveConnector.global.vec3_project, point, planePoint);
        vec3.scale(out, normal, vec3.dot(offset, normal));
        return vec3.subtract(out, point, out);
    }

    /**
     * Drops a point onto a plane while KEEPING ITS DISTANCE from the plane's
     * origin - so it swings onto the plane rather than falling onto it.
     * Carbon's `TriVectorRotateToPlane` (TriMath.cpp:69-79).
     *
     * That distinction is the difference between the two anchor types: the
     * straight one drops the pin onto the planet's plane, the curved one swings
     * it around the planet at constant radius.
     *
     * @param {vec3} out
     * @param {vec3} point
     * @param {vec3} planePoint
     * @param {vec3} normal
     * @returns {vec3} out
     */
    static RotateToPlane(out, point, planePoint, normal)
    {
        const
            g = EveConnector.global,
            offset = vec3.subtract(g.vec3_project, point, planePoint),
            distance = vec3.length(offset);

        vec3.scale(out, normal, vec3.dot(offset, normal));
        vec3.subtract(out, point, out);
        vec3.subtract(out, out, planePoint);
        vec3.normalize(out, out);
        return vec3.scaleAndAdd(out, planePoint, out, distance);
    }

    /**
     * @param {Number} value
     * @param {Number} min
     * @param {Number} max
     * @returns {Number}
     */
    static Clamp(value, min, max)
    {
        return value < min ? min : value > max ? max : value;
    }

    /**
     * Carbon's `EveConnector::ConnectorType` (EveConnector.h:25-35), in Carbon's
     * order - the value is persisted, so the ordinals are the contract.
     * @type {Object}
     */
    static Type = Object.freeze({
        POINT_TO_POINT: 0,
        XZ_CIRCLE_STRAIGHT: 1,
        XZ_CIRCLE: 2,
        STRAIGHT_ANCHOR: 3,
        CURVED_ANCHOR: 4,
        ORBIT: 5,
        CIRCLE: 6,
        ELLIPSE: 7
    });

    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create(),
        vec3_a: vec3.create(),
        vec3_b: vec3.create(),
        vec3_up: vec3.create(),
        vec3_side: vec3.create(),
        vec3_front: vec3.create(),
        vec3_spoke: vec3.create(),
        vec3_normal: vec3.create(),
        vec3_project: vec3.create(),
        vec4_0: vec4.create()
    };

}
