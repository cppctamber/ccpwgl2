import { meta } from "utils";
import { vec3, mat4, pln, box3 } from "math";


@meta.type("Tw2Frustum")
export class Tw2Frustum
{

    _halfWidthProjection = 1;
    _viewPos = null;
    _viewDir = null;

    /**
     * Frustum planes
     * @type {Array<pln|vec4>}
     * @private
     */
    _planes = [ pln.create(), pln.create(), pln.create(), pln.create(), pln.create(), pln.create() ];

    /**
     * Initializes the Tw2Frustum
     *
     * @param {mat4} view - View Matrix
     * @param {mat4} proj - Projection Matrix
     * @param {Number} viewportSize
     * @param {mat4} [viewInverse] Optional viewInverse matrix
     * @param {mat4} [viewProjection] Optional viewProjection matrix
     */
    Initialize(view, proj, viewportSize, viewInverse, viewProjection)
    {
        const mat4_0 = Tw2Frustum.global.mat4_0;

        if (!this._viewPos) this._viewPos = new vec3.create();
        if (!this._viewDir) this._viewDir = new vec3.create();

        const viewInv = viewInverse ? viewInverse : mat4.invert(mat4_0, view);

        this._viewPos.set(viewInv.subarray(12, 14));
        this._viewDir.set(viewInv.subarray(8, 10));
        this._halfWidthProjection = proj[0] * viewportSize * 0.5;

        const viewProj = viewProjection ? viewProjection : mat4.multiply(mat4_0, proj, view);
        this.FromViewProjectionMatrix(viewProj);
    }

    /**
     * Checks to see if a sphere is visible within the frustum
     * @param {vec3} center
     * @param {Number} radius
     * @returns {Boolean}
     */
    IsSphereVisible(center, radius)
    {
        return this.IntersectsPositionRadius(center, radius);
    }

    /**
     * Checks if the frustum intersects a sphere's components
     * @param {vec3|Array} position
     * @param {Number} radius
     * @return {boolean}
     */
    IntersectsPositionRadius(position, radius)
    {
        const p = this._planes;
        for (let i = 0; i < 6; ++i)
        {
            if (p[i][0] * position[0] + p[i][1] * position[1] + p[i][2] * position[2] + p[i][3] < -radius)
            {
                return false;
            }
        }
        return true;
    }

    /**
     * Checks if the frustum intersects a sphere
     * @param {sph3|Array} sph
     * @return {boolean}
     */
    IntersectsSph3(sph)
    {
        return this.IntersectsPositionRadius(sph, sph[3]);
    }

    /**
     * Checks if the frustum is intersected by a box
     * @param {box3|Array} box
     * @return {boolean}
     */
    IntersectsBox3(box)
    {

        const { vec3_0 } = this.constructor.global;

        for (let i = 0; i < 6; i++)
        {
            const p = this._planes[i];
            vec3_0[0] = p[0] > 0 ? box[0] : box[3];
            vec3_0[1] = p[1] > 0 ? box[1] : box[4];
            vec3_0[2] = p[2] > 0 ? box[2] : box[5];
            if (pln.distanceToPoint(p, vec3_0) < 0) return false;
        }

        return true;
    }

    /**
     * Checks if the frustum is intersected by a box's bounds
     * @param {vec3} minBounds
     * @param {vec3} maxBounds
     * @return {boolean}
     */
    IntersectsBounds(minBounds, maxBounds)
    {
        return this.IntersectsBox3([ minBounds[0], minBounds[1], minBounds[2], maxBounds[0], maxBounds[1], maxBounds[2] ]);
    }

    /**
     * Checks if the frustum contains a point
     * @param {vec3|Array} v
     * @return {boolean}
     */
    ContainsPoint(v)
    {
        const p = this._planes;
        for (let i = 0; i < 6; i++)
        {
            if (pln.distanceToPoint(p[i], v) < 0) return false;
        }
        return true;
    }

    /**
     * GetPixelSizeAcross
     * @param {vec3} center
     * @param {Number} radius
     * @returns {Number}
     */
    GetPixelSizeAcross(center, radius)
    {
        const d = vec3.subtract(Tw2Frustum.global.vec3_0, this._viewPos, center);

        let depth = vec3.dot(this._viewDir, d),
            epsilon = 1e-5;

        if (depth < epsilon) depth = epsilon;
        if (radius < epsilon) return 0;

        let ratio = radius / depth;
        return ratio * this._halfWidthProjection * 2;
    }

    /**
     * Sets the frustum from a projection matrix
     * @param {mat4} m
     * @return {Tw2Frustum}
     */
    FromViewProjectionMatrix(m)
    {
        const
            planes = this._planes,
            m0 = m[0],
            m1 = m[1],
            m2 = m[2],
            m3 = m[3],
            m4 = m[4],
            m5 = m[5],
            m6 = m[6],
            m7 = m[7],
            m8 = m[8],
            m9 = m[9],
            m10 = m[10],
            m11 = m[11],
            m12 = m[12],
            m13 = m[13],
            m14 = m[14],
            m15 = m[15];


        pln.setAndNormalize(planes[0], m3 - m0, m7 - m4, m11 - m8, m15 - m12);
        pln.setAndNormalize(planes[1], m3 + m0, m7 + m4, m11 + m8, m15 + m12);
        pln.setAndNormalize(planes[2], m3 + m1, m7 + m5, m11 + m9, m15 + m13);
        pln.setAndNormalize(planes[3], m3 - m1, m7 - m5, m11 - m9, m15 - m13);
        pln.setAndNormalize(planes[4], m3 - m2, m7 - m6, m11 - m10, m15 - m14);
        pln.setAndNormalize(planes[5], m3 + m2, m7 + m6, m11 + m10, m15 + m14);

        return this;
    }

    /**
     * Global and scratch variables
     */
    static global = {
        vec3_0: vec3.create(),
        mat4_0: mat4.create()
    };

}

