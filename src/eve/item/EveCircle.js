// Source: E:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\LineSetPaths\EveCircle.cpp
import { meta } from "utils";
import { quat, vec3, vec4 } from "math";
import { IEveLineSetPath } from "./IEveLineSetPath";


/**
 * A ring of points for an `EveChildLineSet` to draw along, optionally squashed
 * into an ellipse by `circleDistort` and optionally cut short by `completeness`.
 *
 * Port of Carbon `EveCircle`. The field names are the serialised ones, which is
 * why the segment count is `numSegments` here and `segments` on
 * `EveBezierCurve` even though both are `m_segments` in Carbon.
 */
@meta.type("EveCircle")
@meta.define({
    wgl: "EveCircle",
    ccp: true
})
export class EveCircle extends IEveLineSetPath
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

    @meta.float
    circleRadius = 100;

    @meta.vector4
    circleDistort = vec4.fromValues(1, 0, 1, 0);

    @meta.float
    numSegments = 64;

    @meta.float
    completeness = 1;

    @meta.float
    startPoint = 0;

    @meta.float
    lineWidth = 1;

    @meta.boolean
    scaleSegmentsByCompleteness = false;

    @meta.boolean
    scaleEndpoints = true;

    @meta.boolean
    billboardObjects = false;

    @meta.vector3
    objectScale = vec3.fromValues(1, 1, 1);

    @meta.float
    movementSpeed = 0;

    @meta.float
    animValue = 0;

    OnModified()
    {
        this.completeness = Math.min(2, Math.max(0, this.completeness));
        this.numSegments = Math.min(Math.max(1, this.numSegments), 128);
        this.startPoint = this.startPoint % 1;
        this._regeneratePoints = true;
        return true;
    }

    /**
     * @returns {Number} the circle's authored segment count
     */
    SegmentSource()
    {
        return this.numSegments;
    }

    /**
     * Lays the points out around the ring.
     *
     * Carbon `EveCircle::GeneratePoints` (cpp:90-133). The ring lies in XZ; Y is
     * only ever non-zero when `circleDistort` asks for it, and then it is a
     * sin²/cos² blend of two of the four distort components chosen by which
     * quadrant the point is in - so opposite sides of the ring can bulge by
     * different amounts. `animValue` rotates the whole ring by a fraction of one
     * segment, which is what makes a scrolling ring move rather than flicker.
     *
     * @param {mat4} [parentTransform]
     */
    GeneratePoints(parentTransform)
    {
        const seg = this.SegmentCount();
        if (seg <= 1) return;

        this.ApplyParentTransform(parentTransform);

        const
            totalArc = (1 - Math.abs(this.completeness - 1)) * Math.PI * 2,
            startOffset = this.startPoint * Math.PI * 2
                + Math.max(this.completeness - 1, 0) * Math.PI * 2
                + totalArc / (2 * seg);

        this._points.length = 0;

        for (let i = 0; i < seg; i++)
        {
            const
                locOnCircle = startOffset + totalArc * ((i / seg) + this.animValue / seg),
                sin = Math.sin(locOnCircle),
                cos = Math.cos(locOnCircle);

            let y = 0;

            if (this.circleDistort[1] !== 0 || this.circleDistort[3] !== 0)
            {
                const
                    distort1 = sin < 0 ? this.circleDistort[0] : this.circleDistort[2],
                    distort2 = cos < 0 ? this.circleDistort[3] : this.circleDistort[1];

                y = sin * sin * this.circleRadius * distort1 + cos * cos * this.circleRadius * distort2;
            }

            this._points.push(vec3.fromValues(cos * this.circleRadius, y, sin * this.circleRadius));
        }

        this._regeneratePoints = false;
    }

    /**
     * Carbon `EveCircle::CalculateBoundingSphere` (cpp:135-147): centred on the
     * path's own origin, with the line width and any placed mesh added to the
     * radius. A remembered non-zero `meshSize` survives a call that omits it.
     * @param {Number} [meshSize=0]
     */
    CalculateBoundingSphere(meshSize = 0)
    {
        if (meshSize !== 0) this._meshSize = meshSize;
        else if (this._meshSize) meshSize = this._meshSize;

        vec4.set(this._boundingSphere, 0, 0, 0, this.circleRadius + this.lineWidth + meshSize);
    }

    /**
     * Joins consecutive points, closing the ring back to the first point only
     * when the circle is whole. Carbon `EveCircle::AddLinesToSet` (cpp:173-207).
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

            // A partial ring has no closing segment
            if (this.completeness !== 1 && next === 0) continue;

            this.AddSegment(
                lineSet,
                vec3.transformMat4(g.vec3_0, this._points[i], this.localTransform),
                vec3.transformMat4(g.vec3_1, this._points[next], this.localTransform),
                color,
                animColor,
                scrollSpeed
            );
        }
    }

    /** Remembered mesh size, see `CalculateBoundingSphere`. */
    _meshSize = 0;

}
