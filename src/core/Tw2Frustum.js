import { meta } from "utils";
import { vec3, vec4, mat4 } from "math";


@meta.ctor("Tw2Frustum")
export class Tw2Frustum
{

    _halfWidthProjection = 1;
    _planes = [ vec4.create(), vec4.create(), vec4.create(), vec4.create(), vec4.create(), vec4.create() ];
    _viewPos = vec3.create();
    _viewDir = vec3.create();


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

        const viewInv = viewInverse ? viewInverse : mat4.invert(mat4_0, view);
        this._viewPos.set(viewInv.subarray(12, 14));
        this._viewDir.set(viewInv.subarray(8, 10));
        this._halfWidthProjection = proj[0] * viewportSize * 0.5;

        const
            viewProj = viewProjection ? viewProjection : mat4.multiply(mat4_0, proj, view),
            p = this._planes;

        p[0][0] = viewProj[2];
        p[0][1] = viewProj[6];
        p[0][2] = viewProj[10];
        p[0][3] = viewProj[14];

        p[1][0] = viewProj[3] + viewProj[0];
        p[1][1] = viewProj[7] + viewProj[4];
        p[1][2] = viewProj[11] + viewProj[8];
        p[1][3] = viewProj[15] + viewProj[12];

        p[2][0] = viewProj[3] - viewProj[1];
        p[2][1] = viewProj[7] - viewProj[5];
        p[2][2] = viewProj[11] - viewProj[9];
        p[2][3] = viewProj[15] - viewProj[13];

        p[3][0] = viewProj[3] - viewProj[0];
        p[3][1] = viewProj[7] - viewProj[4];
        p[3][2] = viewProj[11] - viewProj[8];
        p[3][3] = viewProj[15] - viewProj[12];

        p[4][0] = viewProj[3] + viewProj[1];
        p[4][1] = viewProj[7] + viewProj[5];
        p[4][2] = viewProj[11] + viewProj[9];
        p[4][3] = viewProj[15] + viewProj[13];

        p[5][0] = viewProj[3] - viewProj[2];
        p[5][1] = viewProj[7] - viewProj[6];
        p[5][2] = viewProj[11] - viewProj[10];
        p[5][3] = viewProj[15] - viewProj[14];

        for (let i = 0; i < 6; ++i)
        {
            let len = vec3.length(p[i]);
            p[i][0] /= len;
            p[i][1] /= len;
            p[i][2] /= len;
            p[i][3] /= len;
        }
    }

    /**
     * Checks to see if a sphere is visible within the frustum
     *
     * @param {vec3} center
     * @param {Number} radius
     * @returns {Boolean}
     */
    IsSphereVisible(center, radius)
    {
        const p = this._planes;

        for (let i = 0; i < 6; ++i)
        {
            if (p[i][0] * center[0] + p[i][1] * center[1] + p[i][2] * center[2] + p[i][3] < -radius)
            {
                return false;
            }
        }
        return true;
    }

    /**
     * GetPixelSizeAcross
     *
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
     * Global and scratch variables
     */
    static global = {
        vec3_0: vec3.create(),
        mat4_0: mat4.create()
    };

}

