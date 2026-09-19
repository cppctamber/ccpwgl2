import { meta } from "utils";
import { mat4 } from "math";


/** Carbon projection modes; parameters are stored and the matrix is built on read. */
@meta.define("TriProjection", true)
export class TriProjection extends meta.Model
{
    static FOV = 1;
    static OFF_CENTER = 2;
    static ORTHO = 3;
    static CUSTOM = 4;
    _projectionType = 0;
    _fov = 0;
    _aspect = 0;
    _left = 0;
    _right = 0;
    _bottom = 0;
    _top = 0;
    _zn = 0;
    _zf = 0;
    _customTransform = mat4.create();

    get transform() { return this.GetTransform(); }

    PerspectiveFov(fov, aspect, zn, zf)
    {
        this._projectionType = TriProjection.FOV;
        this._fov = fov;
        this._aspect = aspect;
        this._zn = zn;
        this._zf = zf;
    }

    PerspectiveOffCenter(left, right, bottom, top, zn, zf)
    {
        this._projectionType = TriProjection.OFF_CENTER;
        this._left = left;
        this._right = right;
        this._bottom = bottom;
        this._top = top;
        this._zn = zn;
        this._zf = zf;
    }

    PerspectiveOrthographic(width, height, front, back)
    {
        this._projectionType = TriProjection.ORTHO;
        this._left = width;
        this._top = height;
        this._zn = front;
        this._zf = back;
    }

    CustomProjection(value)
    {
        this._projectionType = TriProjection.CUSTOM;
        mat4.copy(this._customTransform, value);
    }

    GetProjectionType() { return this._projectionType; }

    GetMatrixWithoutViewAdjustment(out)
    {
        switch (this._projectionType)
        {
            case TriProjection.FOV:
            {
                const y = this._zn * Math.tan(this._fov / 2), x = y * this._aspect;
                mat4.carbonPerspectiveOffCenter(out, -x, x, -y, y, this._zn, this._zf);
                break;
            }
            case TriProjection.OFF_CENTER:
                mat4.carbonPerspectiveOffCenter(out, this._left, this._right, this._bottom, this._top, this._zn, this._zf);
                break;
            case TriProjection.ORTHO:
                mat4.identity(out);
                out[0] = 2 / this._left;
                out[5] = 2 / this._top;
                out[10] = 1 / (this._zn - this._zf);
                out[14] = this._zn / (this._zn - this._zf);
                break;
            case TriProjection.CUSTOM:
                mat4.copy(out, this._customTransform);
                break;
        }
        return out;
    }

    GetTransform(out = mat4.create())
    {
        return this.GetMatrixWithoutViewAdjustment(out);
    }

    /** JS renderer boundary: accepts a CCPWGL device and optional clip adjustment. */
    SetProjection(target, viewportAdjustment = null)
    {
        if (!this._projectionType) return;
        const projection = this.GetTransform();
        if (viewportAdjustment) mat4.multiply(projection, viewportAdjustment, projection);
        target.SetProjection(projection);
    }

    /** The native render-context overload's viewport adjustment, before composition. */
    static GetViewportAdjustment(viewport, deviceViewport, renderTargetHeight, out = mat4.create())
    {
        mat4.identity(out);
        out[0] = viewport.width / deviceViewport.width;
        out[5] = viewport.height / deviceViewport.height;
        out[8] = (viewport.width - deviceViewport.width) / deviceViewport.width;
        out[9] = (viewport.height - deviceViewport.height) / deviceViewport.height;
        if (viewport.x < 0) out[8] *= -1;
        if (viewport.y + viewport.height > renderTargetHeight) out[9] *= -1;
        return out;
    }
}
