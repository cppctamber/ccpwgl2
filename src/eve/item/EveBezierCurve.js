// Source: E:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\LineSetPaths\EveBezierCurve.cpp
import { meta } from "utils";
import { vec3, vec4, quat } from "math";
import { IEveLineSetPath } from "./IEveLineSetPath";


/**
 * A quadratic bezier for an `EveChildLineSet` to draw along: `point1` to
 * `point2`, pulled towards `bezierPoint`.
 *
 * Port of Carbon `EveBezierCurve`. Unlike `EveCircle` this path is open, so its
 * last segment runs to `point2` rather than back to the first point.
 */
@meta.type("EveBezierCurve")
@meta.define({
    wgl: "EveBezierCurve",
    ccp: true
})
export class EveBezierCurve extends IEveLineSetPath
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.vector3
    translation = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.boolean
    isVisible = true;

    @meta.boolean
    billboardObjects = true;

    @meta.vector3
    bezierPoint = vec3.create();

    @meta.float
    completeness = 1;

    @meta.float
    lineWidth = 1;

    @meta.float
    segmentOffset = 0;

    @meta.float
    movementSpeed = 0;

    @meta.float
    animValue = 0;

    @meta.vector3
    objectScale = vec3.fromValues(1, 1, 1);

    @meta.vector3
    point1 = vec3.create();

    @meta.vector3
    point2 = vec3.create();

    @meta.boolean
    scaleEndpoints = true;

    @meta.boolean
    scaleSegmentsByCompleteness = true;

    @meta.float
    segments = 24;

    OnModified()
    {
        this.completeness = Math.min(2, Math.max(0, this.completeness));
        this.segments = Math.min(Math.max(1, this.segments), 128);
        this.segmentOffset = Math.min(Math.max(0, this.segmentOffset), 1);
        this._regeneratePoints = true;
        return true;
    }

    /**
     * Samples the curve at `SegmentCount()` evenly spaced positions.
     *
     * Carbon `EveBezierCurve::GeneratePoints` (cpp:92-126). `completeness` runs
     * 0..2 and does double duty: below 1 it shortens the curve from the far end,
     * above 1 it shortens it from the near end, so the sampled span is
     * `[max(0, c-1), min(c, 1)]`. `segmentOffset` slides the samples along by a
     * fraction of one segment.
     *
     * @param {mat4} [parentTransform]
     */
    GeneratePoints(parentTransform)
    {
        const seg = this.SegmentCount();
        if (seg <= 1) return;

        this.ApplyParentTransform(parentTransform);

        const
            spanStart = Math.max(0, this.completeness - 1),
            spanLength = Math.min(this.completeness, 1) - spanStart;

        this._points.length = 0;

        for (let i = 0; i < seg; i++)
        {
            // Location on curve
            const
                loc = ((i / seg) + this.segmentOffset / seg) * spanLength + spanStart,
                inv = 1 - loc,
                a = inv * inv,
                b = 2 * inv * loc,
                c = loc * loc;

            this._points.push(vec3.fromValues(
                a * this.point1[0] + b * this.bezierPoint[0] + c * this.point2[0],
                a * this.point1[1] + b * this.bezierPoint[1] + c * this.point2[1],
                a * this.point1[2] + b * this.bezierPoint[2] + c * this.point2[2]
            ));
        }

        this._regeneratePoints = false;
    }

    /**
     * Carbon `EveBezierCurve::CalculateBoundingSphere` (cpp:128-142): centred on
     * the mean of the three control points, with a radius reaching the furthest
     * of them plus any placed mesh. Loose - the curve never reaches
     * `bezierPoint` - which is what Carbon settles for too.
     * @param {Number} [meshSize=0]
     */
    CalculateBoundingSphere(meshSize = 0)
    {
        if (meshSize !== 0) this._meshSize = meshSize;
        else if (this._meshSize) meshSize = this._meshSize;

        const centre = vec3.create();
        vec3.add(centre, this.point1, this.point2);
        vec3.add(centre, centre, this.bezierPoint);
        vec3.scale(centre, centre, 1 / 3);

        const radius = Math.sqrt(Math.max(
            vec3.squaredDistance(this.bezierPoint, centre),
            vec3.squaredDistance(this.point2, centre),
            vec3.squaredDistance(this.point1, centre)
        ));

        vec4.set(this._boundingSphere, centre[0], centre[1], centre[2], radius + meshSize);
    }

    /**
     * Joins consecutive points, and runs the final segment to `point2` rather
     * than wrapping. Carbon `EveBezierCurve::AddLinesToSet` (cpp:166-205).
     *
     * The last sample sits one segment short of the end - `loc` never reaches 1 -
     * so without that closing segment a whole curve would stop short of its own
     * endpoint. A shortened curve (`completeness < 1`) is meant to stop short,
     * so it skips it.
     *
     * @param {EveCurveLineSet} lineSet
     * @param {vec4} color
     * @param {vec4} animColor
     * @param {Number} scrollSpeed
     */
    AddLinesToSet(lineSet, color, animColor, scrollSpeed)
    {
        if (!this.display || !this.isVisible) return;

        if (this._regeneratePoints)
        {
            this.GeneratePoints();
            this.CalculateBoundingSphere();
        }

        const
            g = IEveLineSetPath.global,
            seg = Math.min(this.SegmentCount(), this._points.length);

        for (let i = 0; i < seg; i++)
        {
            const next = (i + 1) % seg;

            let end;

            if (next !== 0)
            {
                end = this._points[next];
            }
            else
            {
                if (this.completeness < 1) continue;
                end = this.point2;
            }

            this.AddSegment(
                lineSet,
                vec3.transformMat4(g.vec3_0, this._points[i], this.localTransform),
                vec3.transformMat4(g.vec3_1, end, this.localTransform),
                color,
                animColor,
                scrollSpeed
            );
        }
    }

    /** Remembered mesh size, see `CalculateBoundingSphere`. */
    _meshSize = 0;

}
