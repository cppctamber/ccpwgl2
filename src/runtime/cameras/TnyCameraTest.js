import { mat4, vec3 } from "math";
import { isPlain, isString, meta } from "utils";
import { WrappedTestCamera } from "wrapped/WrappedTestCamera";
import { distanceToFitSphere } from "./cameraFit";


@meta.tny.type("TnyCameraTest")
@meta.tny.define("TnyCameraTest")
export class TnyCameraTest extends meta.Model
{

    @meta.struct()
    wrapped = null;

    @meta.plain
    custom = {};

    _controller = null;
    _distance = 1;
    _minDistance = -1;
    _maxDistance = 1000000;
    _fov = 50;
    _minFov = 2;
    _maxFov = 180;
    _rotationX = 0;
    _rotationY = 0;
    _nearPlane = 1;
    _farPlane = 0;
    _poi = vec3.create();
    _worldTransform = mat4.create();
    _worldInverseTransform = mat4.create();

    get isCamera()
    {
        return true;
    }

    get controller()
    {
        return this.wrapped ? this.wrapped.controller : this._controller;
    }

    set controller(value)
    {
        this._controller = value;
        if (this.wrapped)
        {
            this.wrapped.controller = value;
        }
    }

    @meta.float
    get distance()
    {
        return this.wrapped ? this.wrapped.distance : this._distance;
    }

    set distance(value)
    {
        this._distance = value;
        if (this.wrapped) this.wrapped.distance = value;
    }

    @meta.float
    get minDistance()
    {
        return this.wrapped ? this.wrapped.minDistance : this._minDistance;
    }

    set minDistance(value)
    {
        this._minDistance = value;
        if (this.wrapped) this.wrapped.minDistance = value;
    }

    @meta.float
    get maxDistance()
    {
        return this.wrapped ? this.wrapped.maxDistance : this._maxDistance;
    }

    set maxDistance(value)
    {
        this._maxDistance = value;
        if (this.wrapped) this.wrapped.maxDistance = value;
    }

    @meta.float
    get fov()
    {
        return this.wrapped ? this.wrapped.fov : this._fov;
    }

    set fov(value)
    {
        this._fov = value;
        if (this.wrapped) this.wrapped.fov = value;
    }

    @meta.float
    get minFov()
    {
        return this.wrapped ? this.wrapped.minFov : this._minFov;
    }

    set minFov(value)
    {
        this._minFov = value;
        if (this.wrapped) this.wrapped.minFov = value;
    }

    @meta.float
    get maxFov()
    {
        return this.wrapped ? this.wrapped.maxFov : this._maxFov;
    }

    set maxFov(value)
    {
        this._maxFov = value;
        if (this.wrapped) this.wrapped.maxFov = value;
    }

    @meta.float
    get rotationX()
    {
        return this.wrapped ? this.wrapped.rotationX : this._rotationX;
    }

    set rotationX(value)
    {
        this._rotationX = value;
        if (this.wrapped) this.wrapped.rotationX = value;
    }

    @meta.float
    get rotationY()
    {
        return this.wrapped ? this.wrapped.rotationY : this._rotationY;
    }

    set rotationY(value)
    {
        this._rotationY = value;
        if (this.wrapped) this.wrapped.rotationY = value;
    }

    @meta.float
    get nearPlane()
    {
        return this.wrapped ? this.wrapped.nearPlane : this._nearPlane;
    }

    set nearPlane(value)
    {
        this._nearPlane = value;
        if (this.wrapped) this.wrapped.nearPlane = value;
    }

    @meta.float
    get farPlane()
    {
        return this.wrapped ? this.wrapped.farPlane : this._farPlane;
    }

    set farPlane(value)
    {
        this._farPlane = value;
        if (this.wrapped) this.wrapped.farPlane = value;
    }

    @meta.vector3
    get poi()
    {
        return this.wrapped ? this.wrapped.poi : this._poi;
    }

    set poi(value)
    {
        vec3.copy(this._poi, value);
        if (this.wrapped)
        {
            vec3.copy(this.wrapped.poi, value);
        }
    }

    constructor(canvas = null, values)
    {
        if (isPlain(canvas))
        {
            const { canvas: optionCanvas, ...optionValues } = canvas;
            canvas = optionCanvas;
            values = values ? { ...optionValues, ...values } : optionValues;
        }

        super();

        if (values)
        {
            this.SetValues(values);
        }

        if (canvas)
        {
            this.AttachCanvas(canvas);
        }
    }

    AttachCanvas(canvas)
    {
        canvas = this.constructor.ResolveCanvas(canvas);
        this.wrapped = new WrappedTestCamera(canvas, this.GetCameraValues());
        this.ApplyValuesToWrapped();
        this.wrapped.controller = this._controller;
        return this;
    }

    SetWrapped(wrapped)
    {
        if (wrapped && !(wrapped instanceof WrappedTestCamera))
        {
            throw new TypeError("Invalid wrapped test camera");
        }

        this.wrapped = wrapped || null;
        if (wrapped)
        {
            this.SyncFromWrapped();
        }
        return this;
    }

    SyncFromWrapped()
    {
        if (!this.wrapped) return this;

        this._distance = this.wrapped.distance;
        this._minDistance = this.wrapped.minDistance;
        if (this.wrapped.maxDistance === undefined)
        {
            this.wrapped.maxDistance = this._maxDistance;
        }
        else
        {
            this._maxDistance = this.wrapped.maxDistance;
        }
        this._fov = this.wrapped.fov;
        this._minFov = this.wrapped.minFov;
        this._maxFov = this.wrapped.maxFov;
        this._rotationX = this.wrapped.rotationX;
        this._rotationY = this.wrapped.rotationY;
        this._nearPlane = this.wrapped.nearPlane;
        this._farPlane = this.wrapped.farPlane;
        this._controller = this.wrapped.controller;
        vec3.copy(this._poi, this.wrapped.poi);
        return this;
    }

    ApplyValuesToWrapped()
    {
        if (!this.wrapped) return this;

        this.wrapped.distance = this._distance;
        this.wrapped.minDistance = this._minDistance;
        this.wrapped.maxDistance = this._maxDistance;
        this.wrapped.fov = this._fov;
        this.wrapped.minFov = this._minFov;
        this.wrapped.maxFov = this._maxFov;
        this.wrapped.rotationX = this._rotationX;
        this.wrapped.rotationY = this._rotationY;
        this.wrapped.nearPlane = this._nearPlane;
        this.wrapped.farPlane = this._farPlane;
        vec3.copy(this.wrapped.poi, this._poi);
        return this;
    }

    GetCameraValues(out = {})
    {
        out.distance = this._distance;
        out.minDistance = this._minDistance;
        out.maxDistance = this._maxDistance;
        out.fov = this._fov;
        out.minFov = this._minFov;
        out.maxFov = this._maxFov;
        out.rotationX = this._rotationX;
        out.rotationY = this._rotationY;
        out.nearPlane = this._nearPlane;
        out.farPlane = this._farPlane;
        out.poi = vec3.copy(out.poi || vec3.create(), this._poi);
        return out;
    }

    GetNearPlane()
    {
        return this.wrapped ? this.wrapped.GetNearPlane() : this._nearPlane;
    }

    GetFarPlane()
    {
        return this.wrapped ? this.wrapped.GetFarPlane() : this._farPlane;
    }

    GetWorldDistance(position)
    {
        if (this.wrapped)
        {
            return this.wrapped.GetWorldDistance(position);
        }

        return vec3.distance(this._poi, position);
    }

    /**
     * Frames an object by fitting its bounding sphere to the view.
     *
     * **This replaces `Focus`, which is scheduled for retirement.** It is left in
     * place for now because the interactive multipliers around the organization
     * were tuned against its error, so removing it would move every framing in
     * every consumer at once — a separate change with its own visual review. New
     * callers use this one; the last `Focus` caller to leave takes `Focus` with it.
     *
     * Prefer this to `Focus`, which is measurably wrong — see `cameraFit.js` for
     * the numbers and the cause. In one line: `Focus` fits the object's local
     * AABB width or height and never considers its length, so a hull viewed from
     * the side is fitted for one of its two short axes and runs off the frame. It
     * under-fits by 1.4x to 4.0x depending on the hull's proportions, which is why
     * no single multiplier ever corrected it.
     *
     * `FitToScreen` is orientation-independent, so the answer holds at any yaw and pitch
     * and does not have to be recomputed when the camera turns.
     *
     * ### The aspect is an argument, not a lookup
     *
     * `Focus` read the aspect the projection last happened to be built with. That
     * is right for a camera drawing to the screen it was just drawn to and wrong
     * for anything rendering offscreen at a size of its own choosing, where the
     * output aspect is known up front and the device's is irrelevant. Pass it.
     *
     * The default reads the wrapped camera's last projection aspect and falls back
     * to 1, which is square rather than plausible — a wrong aspect silently mis-fits
     * one axis, so guessing a widescreen value would be the worse default.
     *
     * @param {TnySpaceObject} object - anything answering `GetBoundingSphere`
     * @param {Object} [options]
     * @param {Number} [options.margin=1.05] - 1 fills the tighter axis exactly
     * @param {Number} [options.aspect] - output width / height
     * @param {Number} [options.fov] - vertical fov in degrees; the camera's by default
     * @param {Boolean} [options.aim=true] - move the point of interest to the sphere centre
     * @returns {{distance: Number, radius: Number, aspect: Number, fov: Number}|null}
     *          what was applied, or null when the object has no measurable bound
     */
    FitToScreen(object, { margin = 1.05, aspect, fov, aim = true } = {})
    {
        const sphere = object && object.GetBoundingSphere ? object.GetBoundingSphere() : null;

        // Null rather than a guess. An unmeasurable subject is a subject whose
        // distance the caller has to supply, and inventing one here is how a
        // cropped or empty frame becomes indistinguishable from a correct one.
        if (!sphere || !(sphere[3] > 0)) return null;

        const resolvedFov = Number.isFinite(fov) ? fov : this.fov;
        const resolvedAspect = Number.isFinite(aspect) && aspect > 0
            ? aspect
            : (this.wrapped && this.wrapped._aspect > 0 ? this.wrapped._aspect : 1);

        const distance = distanceToFitSphere({
            radius: sphere[3],
            fovVerticalDegrees: resolvedFov,
            aspect: resolvedAspect,
            margin
        });

        if (aim) vec3.set(this._poi, sphere[0], sphere[1], sphere[2]);

        this._distance = distance;

        if (this.wrapped)
        {
            if (aim) vec3.copy(this.wrapped.poi, this._poi);
            this.wrapped.distance = distance;

            // The wrapped camera keeps drag, wheel and pan input in additive
            // offsets that are applied on top of `poi` and `distance`, so a fit
            // that does not clear them is a fit the reader's last gesture still
            // moves. `Focus` clears the translation offsets for this reason; the
            // distance offset matters just as much and it did not clear that.
            this.wrapped._translationX = 0;
            this.wrapped._translationY = 0;
            this.wrapped._translationZ = 0;
            this.wrapped._distance = 0;

            this.SyncFromWrapped();
        }

        return { distance, radius: sphere[3], aspect: resolvedAspect, fov: resolvedFov };
    }

    /**
     * @deprecated Measurably under-fits; use `Fit`. Kept because the interactive
     * consumers' margin multipliers were tuned against its error, so changing its
     * behaviour would move every framing on every site at once.
     */
    Focus(object, multiplier)
    {
        if (this.wrapped)
        {
            this.wrapped.Focus(object, multiplier);
            return this.SyncFromWrapped();
        }
        return this;
    }

    SetFocus(position, distance)
    {
        vec3.copy(this._poi, position);
        this._distance = distance;

        if (this.wrapped)
        {
            this.wrapped.SetFocus(position, distance);
        }

        return this;
    }

    GetWorldDirection(out = vec3.create())
    {
        if (this.wrapped)
        {
            return this.wrapped.GetWorldDirection(out);
        }

        vec3.set(out, 0, 0, 1);
        return out;
    }

    GetView(out)
    {
        if (this.wrapped)
        {
            return this.wrapped.GetView(out);
        }

        return mat4.copy(out, this._worldInverseTransform);
    }

    GetProjection(out, aspect)
    {
        if (this.wrapped)
        {
            return this.wrapped.GetProjection(out, aspect);
        }

        const
            nearPlane = this._nearPlane,
            distance = this._distance,
            fH = Math.tan(this._fov / 360 * Math.PI) * nearPlane,
            fW = fH * aspect,
            farPlane = this._farPlane > 0 ? this._farPlane : distance * 2;

        return mat4.frustum(out, -fW, fW, -fH, fH, nearPlane, farPlane);
    }

    Render(dt)
    {
        return this.wrapped && this.wrapped.Render ? this.wrapped.Render(dt) : false;
    }

    Update(dt)
    {
        if (this.wrapped)
        {
            this.wrapped.Update(dt);
            this.SyncFromWrapped();
        }

        this.EmitEvent("update", this, dt);
        return true;
    }

    static ResolveCanvas(canvas)
    {
        if (isString(canvas))
        {
            if (typeof document === "undefined")
            {
                throw new ReferenceError("Document is not available");
            }
            canvas = document.getElementById(canvas);
        }

        if (typeof HTMLCanvasElement === "undefined" || !(canvas instanceof HTMLCanvasElement))
        {
            throw new ReferenceError("Invalid canvas element");
        }

        return canvas;
    }

    static GetWrapped(item)
    {
        return item ? item.wrapped || null : null;
    }

    static HasWrapped(item)
    {
        return !!this.GetWrapped(item);
    }

    static ClearWrapped(item)
    {
        if (item)
        {
            item.wrapped = null;
        }

        return item;
    }

    static async fetch(options = {})
    {
        if (!isPlain(options))
        {
            options = { canvas: options };
        }

        const { canvas, ...values } = options;
        return new this(canvas, values);
    }

    static isCamera = true;

}
