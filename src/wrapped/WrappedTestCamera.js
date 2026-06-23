import { vec3, mat4 } from "math";
import { isPlain, isString, meta } from "utils";
import { device } from "global/tw2";


@meta.type("WrappedTestCamera")
export class WrappedTestCamera extends meta.Model
{

    @meta.float
    distance = 1;

    @meta.float
    minDistance = -1;

    @meta.float
    fov = 50;

    @meta.float
    minFov = 2;

    @meta.float
    maxFov = 180;

    @meta.float
    rotationX = 0;

    @meta.float
    rotationY = 0;

    @meta.vector3
    poi = vec3.create();

    @meta.float
    nearPlane = 1;

    @meta.float
    farPlane = 0;

    post = null;

    shift = 0;
    shiftStage = 0;
    button = null;
    rightMouseMove = false;
    resetTime = 2;
    shiftZoom = null;
    record = false;
    recorded = vec3.create();
    onShift = null;

    _shiftX = null;
    _rightMouse = null;
    _doReset = false;
    _distance = 1;
    _rotationX = 0;
    _rotationY = 0;
    _translationX = 0;
    _translationY = 0;
    _translationZ = 0;
    _dragX = 0;
    _dragY = 0;
    _lastRotationX = 0;
    _lastRotationY = 0;
    _rotationSpeedX = 0;
    _rotationSpeedY = 0;
    _measureRotation = null;
    _moveEvent = null;
    _upEvent = null;
    _prevScale = null;
    _distanceSpeed = 0;
    _distanceArc = 0.9;
    distanceChange = 2;

    _additionalRotationX = 0;
    _additionalRotationY = 0;
    _lastTap = 0;
    _resetTimeDone = 0;

    _worldTransform = mat4.create();
    _worldInverseTransform = mat4.create();

    enableDoubleClick = false;

    GetNearPlane()
    {
        return this.nearPlane;
    }

    GetFarPlane()
    {
        return this.farPlane;
    }

    constructor(element, values)
    {

        if (element !== null && !(element instanceof HTMLCanvasElement))
        {
            throw new ReferenceError("Invalid element");
        }

        super();

        element.addEventListener("mousedown", event => this._DragStart(event, element), false);
        element.addEventListener("touchstart", event => this._DragStart(event, element), true);
        element.addEventListener("dblclick", () => 
        {
            if (this.enableDoubleClick) this._doReset = true;
        }, false);
        window.addEventListener("DOMMouseScroll", e => this._WheelHandler(e, element), false);
        window.addEventListener("mousewheel", e => this._WheelHandler(e, element), false);

        if (values) this.SetValues(values);
    }

    /**
     * Gets the distance from an object in world space to the camera
     * @param {vec3} v
     * @returns {Number}
     */
    GetWorldDistance(v)
    {
        const cameraPosition = mat4.getTranslation(vec3.alloc(), this._worldTransform);
        const distance = vec3.distance(cameraPosition, v);
        vec3.unalloc(cameraPosition);
        return distance;
    }

    /**
     *
     * @param obj
     * @param,multiplier
     */
    Focus(obj, multiplier = 1)
    {
        let distance = 1000,
            center = [ 0, 0, 0 ];

        if (obj.GetWidth)
        {
            const
                width = obj.GetWidth(),
                height = obj.GetHeight(),
                objectAspect = width / height;

            //size = obj.GetSize(),
            //maxSize = Math.max(size[0], size[1], size[2]),
            //fitHeightDistance = maxSize  / ( 2 * Math.atan(Math.PI  * this.fov / 360)),
            //fitWidthDistance =   fitHeightDistance / this._aspect;
            //distance = multiplier * Math.max(fitHeightDistance, fitWidthDistance);

            const { radians } = WrappedTestCamera.getFovFromHorizontalDegrees(this.fov, this._aspect);

            if (objectAspect <= this._aspect)
            {
                distance = WrappedTestCamera.distanceToFitObjectInView(height, radians.vertical);
            }
            else
            {
                distance = WrappedTestCamera.distanceToFitObjectInView(width, radians.horizontal);
            }

            distance = Math.abs(distance);
            //obj.GetCenter(center);
            if (obj.wrapped.radius)
            {
                obj.wrapped.GetTranslation(center);
                distance = obj.wrapped.radius * 2;
            }
            else if (obj.wrapped.boundingSphereCenter)
            {
                vec3.copy(center, obj.wrapped.boundingSphereCenter);
            }
            else
            {
                // We should calculate the center of the object
                // Why are we using translation that is probably meaningless...
                obj.wrapped.GetTranslation(center);
            }
            vec3.transformMat4(center, center, obj.wrapped.GetTransform([]));
        }

        this._translationZ=this._translationX=this._translationY=0;

        vec3.copy(this.poi, center);
        this.distance = distance * multiplier;
        return this;
    }


    /**
     * Sets the focus of the camera to a position in space at a set distance
     * @param {Vector3} position
     * @param {number} distance
     */
    SetFocus(position, distance)
    {
        this.poi[0] = position[0];
        this.poi[1] = position[1];
        this.poi[2] = position[2];
        this.distance = distance;
    }

    /**
     * Gets the world direction
     * @param out
     * @return {vec3}
     */
    GetWorldDirection(out = vec3.create())
    {
        const mat4_0 = mat4.alloc();
        const view = this.GetView(mat4_0);
        out[0] = view[8];
        out[1] = view[9];
        out[2] = view[10];
        mat4.unalloc(mat4_0);
        return out;
    }

    GetView(out)
    {
        return mat4.copy(out, this._worldInverseTransform);
    }

    /**
     * Todo: Replace this with the new frustum mat4 method
     * @param out
     * @param aspect
     * @returns {*}
     */
    GetProjection(out, aspect)
    {
        const
            fH = Math.tan(this.fov / 360 * Math.PI) * this.nearPlane,
            fW = fH * aspect;

        this._aspect = aspect;

        return mat4.frustum(
            out,
            -fW,
            fW,
            -fH,
            fH,
            this.nearPlane,
            this.farPlane > 0 ? this.farPlane : (this.distance + this._distance) * 2
        );

    }

    /**
     * Gets the distance to fit an object in view
     * @param {Number} size
     * @param {Number} fovRadians
     * @return {number}
     */
    static distanceToFitObjectInView(size, fovRadians)
    {
        return size / (2 * Math.tan(fovRadians / 2));
    }


    /**
     * Gets fov data from horizontal fov degrees
     * @param {Number} fovHorizontalDegrees
     * @param {Number} aspect
     * @return {{radians: {horizontal: number, vertical: number}, degrees: {horizontal: *, vertical: number}}}
     */
    static getFovFromHorizontalDegrees(fovHorizontalDegrees, aspect)
    {
        const
            fHRad = fovHorizontalDegrees * Math.PI / 180,
            fVRad = 2 * Math.atan(Math.tan(fHRad / 2) * aspect),
            fVDegrees = Math.ceil(fVRad * 180 / Math.PI);

        return {
            degrees: {
                vertical: fVDegrees,
                horizontal: fovHorizontalDegrees
            },
            radians: {
                vertical: fHRad,
                horizontal: fVRad
            }
        };
    }

    RecordDrag()
    {
        this.record = true;
    }

    RecordStop()
    {
        this.recorded = [ 0, 0, 0 ];
        this.record = false;
    }

    GetRecorded()
    {
        console.log(this.recorded);
        return this.recorded;
    }

    /**
     * Renders the camera's post effects
     * @param {Number} dt
     * @return {Boolean}
     */
    Render(dt)
    {
        return this.post ? this.post.Render(dt) : false;
    }


    Update(dt)
    {
        this._rotationX += this._rotationSpeedX * dt;
        this._rotationSpeedX *= 0.9;
        this._rotationY += this._rotationSpeedY * dt;
        this._rotationSpeedY *= 0.9;

        if ((this.rotationY + this._rotationY) < -Math.PI / 2)
        {
            this._rotationY = (-Math.PI / 2) - this.rotationY;
        }

        if ((this.rotationY + this._rotationY) > Math.PI / 2)
        {
            this._rotationY = (Math.PI / 2) - this.rotationY;
        }

        if (this.shiftStage == 2)
        {
            this.shift += this.shift * dt * 5;
            if (Math.abs(this.shift) > 2)
            {
                this.onShift(1, this.shift > 0);
                //this.shift = -this.shift;
                //this._shiftOut = false;
            }
        }
        else if (this.shiftStage == 1)
        {
            this.shift -= this.shift * Math.min(dt, 0.5) * 2;
        }

        if (this._doReset)
        {
            this._rotationX = this._rotationX * (1 - (Math.pow(this._resetTimeDone / this.resetTime, 3)));
            this._rotationY = this._rotationY * (1 - (Math.pow(this._resetTimeDone / this.resetTime, 3)));
            this._distance = this._distance * (1 - (Math.pow(this._resetTimeDone / this.resetTime, 3)));
            this._translationX = this._translationX * (1 - (Math.pow(this._resetTimeDone / this.resetTime, 3)));
            this._translationY = this._translationY * (1 - (Math.pow(this._resetTimeDone / this.resetTime, 3)));
            this._translationZ = this._translationZ * (1 - (Math.pow(this._resetTimeDone / this.resetTime, 3)));
            this._resetTimeDone += dt;
            if (this._resetTimeDone >= this.resetTime)
            {
                this._rotationX = 0;
                this._rotationY = 0;
                this._distance = 0;
                this._translationX = 0;
                this._translationY = 0;
                this._translationZ = 0;
                this._resetTimeDone = 0;
                this._doReset = false;
            }
        }

        this.EmitEvent("update", dt);

        const it = this._worldInverseTransform;
        mat4.identity(it);
        mat4.rotateY(it, it, -this.shift);
        mat4.translate(it, it, [ 0, 0, -(this.distance + this._distance) ]);
        mat4.rotateX(it, it, this.rotationY + this._rotationY + this._additionalRotationY);
        mat4.rotateY(it, it, this.rotationX + this._rotationX + this._additionalRotationX);
        mat4.translate(it, it, [
            -this.poi[0] + this._translationX,
            -this.poi[1] - this._translationY,
            -this.poi[2] + this._translationZ
        ]);
        mat4.invert(this._worldTransform, it);

        if (this.post) this.post.Update(dt);
    }

    /**
     * Drag start event
     * @param event
     * @param element
     * @private
     */
    _DragStart(event, element)
    {
        if (!event.touches && !this.onShift && event.button != 0 && event.button != 2)
        {
            return;
        }

        if (this._moveEvent || this._upEvent)
        {
            return;
        }

        this.button = event.button;

        // Context menu must be driven from the UI not the camera view
        if (this.rightMouseMove && this._rightMouse == null)
        {
            element.addEventListener("contextmenu", this._rightMouse = e =>
            {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
        }

        if (this._moveEvent == null)
        {
            document.addEventListener("mousemove", this._moveEvent = e => {this._DragMove(e);}, true);
            document.addEventListener("touchmove", this._moveEvent, true);
        }

        if (this._upEvent == null)
        {
            document.addEventListener("mouseup", this._upEvent = e => {this._DragStop(e);}, true);
            document.addEventListener("touchend", this._upEvent, true);
        }

        event.preventDefault();
        if (event.touches)
        {
            event.screenX = event.touches[0].screenX;
            event.screenY = event.touches[0].screenY;
        }

        this._dragX = event.screenX;
        this._dragY = event.screenY;
        this._shiftX = null;
        this._rotationSpeedX = 0;
        this._lastRotationX = this._rotationX;
        this._rotationSpeedY = 0;
        this._lastRotationY = this._rotationY;

        if (event.touches)
        {
            if (event.touches.length == 1)
            {
                const now = new Date().getTime();
                const timesince = now - this._lastTap;
                if ((timesince < 300) && (timesince > 0))
                {
                    this._lastRotationX = 0;
                    this._lastRotationY = 0;
                    this._doReset = true;
                }
                this._lastTap = new Date().getTime();
            }
        }
    }

    /**
     * Measures the rotation of the mouse for the current events
     * @private
     */
    _MeasureRotation()
    {
        this._lastRotationX = this._rotationX;
        this._lastRotationY = this._rotationY;
        this._measureRotation = setTimeout(() =>
        {
            this._MeasureRotation();
        }, 500);
    }

    _DragMove(event)
    {

        if (this.onShift && (event.touches && event.touches.length > 2 || !event.touches && event.button != 0))
        {
            this.shiftStage = 0;
            event.preventDefault();
            if (event.touches)
            {
                event.screenX = 0;
                event.screenY = 0;
                for (let i = 0; i < event.touches.length; ++i)
                {
                    event.screenX += event.touches[i].screenX;
                    event.screenY += event.touches[i].screenY;
                }
                event.screenX /= event.touches.length;
                event.screenY /= event.touches.length;
            }
            if (this._shiftX !== null)
            {
                this.shift += (event.screenX - this._shiftX) / device.viewportWidth * 2;
            }
            this._shiftX = event.screenX;
            return;
        }

        this._shiftX = null;
        if (event.touches)
        {
            if (event.touches.length == 2)
            {
                event.preventDefault();

                const dx = event.touches[0].screenX - event.touches[1].screenX;
                const dy = event.touches[0].screenY - event.touches[1].screenY;
                const scale = Math.sqrt(dx * dx + dy * dy);

                if (this._prevScale != null)
                {
                    const delta = (this._prevScale - scale) * 0.03;
                    this._distance = this._distance + delta * (this.distance + this._distance) * 0.1;

                    if ((this.distance + this._distance) < this.minDistance)
                    {
                        this._distance = this.minDistance - this.distance;
                    }

                    if ((this.distance + this._distance) > this.maxDistance)
                    {
                        this._distance = this.maxDistance - this.distance;
                    }
                }
                this._prevScale = scale;
                return;
            }

            if (event.touches.length == 3)
            {
                event.preventDefault();
                const dTranslationX = -(this._dragX - event.touches[0].screenX) * (this.distance + this._distance) / 850; // TODO: identify this magic number
                const dTranslationY = -(this._dragY - event.touches[0].screenY) * (this.distance + this._distance) / 850;

                this._dragX = event.touches[0].screenX;
                this._dragY = event.touches[0].screenY;

                // TODO: Add this to the normal camera
                this._translationX += Math.cos(this.rotationX + this._rotationX) * dTranslationX - Math.sin(this.rotationX + this._rotationX) * Math.sin(this.rotationY + this._rotationY) * dTranslationY;
                this._translationY += Math.sin(this.rotationY + this._rotationY) * Math.cos(this.rotationX + this._rotationX) * dTranslationX + Math.cos(this.rotationY + this._rotationY) * dTranslationY;
                this._translationZ += Math.sin(this.rotationX + this._rotationX) * dTranslationX + Math.cos(this.rotationX + this._rotationX) * Math.sin(this.rotationY + this._rotationY) * dTranslationY;
                return;
            }

            if (event.touches.length > 3)
            {
                event.preventDefault();
                return;
            }

            event.screenX = event.touches[0].screenX;
            event.screenY = event.touches[0].screenY;
        }

        if ((typeof (event.screenX) != "undefined") && (event.touches || (this.button == 0 && !(event.altKey))))
        {
            let dRotation = -(this._dragX - event.screenX) * 0.01;
            this._rotationX += dRotation;

            dRotation = -(this._dragY - event.screenY) * 0.01;
            this._rotationY += dRotation;

            this._dragX = event.screenX;
            this._dragY = event.screenY;

            if ((this.rotationY + this._rotationY) < -Math.PI / 2)
            {
                this._rotationY = (-Math.PI / 2) - this.rotationY;
            }

            if ((this.rotationY + this._rotationY) > Math.PI / 2)
            {
                this._rotationY = (Math.PI / 2) - this.rotationY;
            }
        }

        const isRightMouseButton = (typeof (event.screenX) != "undefined") && ((this.button == 2));

        if (this.button == 0 && event.altKey)
        {
            const dTranslationX = -(this._dragX - event.screenX) * (this.distance + this._distance) / 850;
            const dTranslationY = -(this._dragY - event.screenY) * (this.distance + this._distance) / 850;
            this._dragX = event.screenX;
            this._dragY = event.screenY;

            if (!this.record)
            {
                this._translationX += Math.cos(this.rotationX + this._rotationX) * dTranslationX - Math.sin(this.rotationX + this._rotationX) * Math.sin(this.rotationY + this._rotationY) * dTranslationY;
                this._translationY += Math.sin(this.rotationY + this._rotationY) * Math.cos(this.rotationX + this._rotationX) * dTranslationX + Math.cos(this.rotationY + this._rotationY) * dTranslationY;
                this._translationZ += Math.sin(this.rotationX + this._rotationX) * dTranslationX + Math.cos(this.rotationX + this._rotationX) * Math.sin(this.rotationY + this._rotationY) * dTranslationY;
            }
            else
            {
                this.recorded[0] = Math.cos(this.rotationX + this._rotationX) * dTranslationX - Math.sin(this.rotationX + this._rotationX) * Math.sin(this.rotationY + this._rotationY) * dTranslationY;
                this.recorded[1] = Math.sin(this.rotationY + this._rotationY) * Math.cos(this.rotationX + this._rotationX) * dTranslationX + Math.cos(this.rotationY + this._rotationY) * dTranslationY;
                this.recorded[2] = Math.sin(this.rotationX + this._rotationX) * dTranslationX + Math.cos(this.rotationX + this._rotationX) * Math.sin(this.rotationY + this._rotationY) * dTranslationY;
            }
        }

    }

    _DragStop(event)
    {
        event.preventDefault();
        clearTimeout(this._measureRotation);
        document.removeEventListener("mousemove", this._moveEvent, true);
        document.removeEventListener("mouseup", this._upEvent, true);
        document.removeEventListener("touchmove", this._moveEvent, true);
        document.removeEventListener("touchend", this._upEvent, true);
        this._moveEvent = null;
        this._upEvent = null;

        let dRotation = this._rotationX - this._lastRotationX;
        this._rotationSpeedX = dRotation;
        dRotation = this._rotationY - this._lastRotationY;
        this._rotationSpeedY = dRotation;
        this._prevScale = null;

        if (this.onShift)
        {
            if (Math.abs(this.shift) > 0.5)
            {
                this.shiftStage = 2;
                this.onShift(0, this.shift > 0);
            }
            else
            {
                this.shiftStage = 1;
            }
        }

        if (this.record) this.record = false;
    }

    //static deltaModifier = 0.05;

    /**
     * Mouse wheel handler (Should match the original camera)
     * @param event
     * @param element
     * @returns {boolean}
     * @private
     */
    _WheelHandler(event, element)
    {
        var delta = 0;

        /* For IE. */
        if (!event) event = window.event;

        var source = null;
        if (event.srcElement)
        {
            source = event.srcElement;
        }
        else
        {
            source = event.target;
        }

        if (source != element)
        {
            return false;
        }

        if (event.wheelDelta)
        { /* IE/Opera. */
            delta = event.wheelDelta / 120;
            /** In Opera 9, delta differs in sign as compared to IE.
             */
            if (window.opera)
                delta = -delta;
        }
        else if (event.detail)
        { /** Mozilla case. */
            /** In Mozilla, sign of delta is different than in IE.
             * Also, delta is multiple of 3.
             */
            delta = -event.detail / 3;
        }

        /** If delta is nonzero, handle it.
         * Basically, delta is now positive if wheel was scrolled up,
         * and negative, if wheel was scrolled down.
         */
        if (delta)
        {
            if (event.shiftKey)
            {
                this.fov = Math.max(this.minFov, Math.min(this.maxFov, this.fov + delta * 5));
            }
            else
            {
                this._distance = this._distance + delta * (this.distance + this._distance) * 0.1;
                if ((this.distance + this._distance) < this.minDistance)
                {
                    this._distance = this.minDistance - this.distance;
                }
                if ((this.distance + this._distance) > this.maxDistance)
                {
                    this._distance = this.maxDistance - this.distance;
                }
            }
        }
        /** Prevent default actions caused by mouse wheel.
         * That might be ugly, but we handle scrolls somehow
         * anyway, so don't bother here..
         */
        /*if (event.preventDefault)
            event.preventDefault();
        event.returnValue = false;
        return false;*/
    }

    /**
     * Fetches a camera async
     * TODO: Load geometry to represent the camera
     * @param {Object} options
     * @return {Promise<WrappedTestCamera>}
     */
    static async fetch(options = {})
    {
        if (!isPlain(options))
        {
            options = { canvas: options };
        }

        let { canvas, ...values } = options;
        if (isString(canvas)) canvas = document.getElementById(canvas);
        return new this(canvas, values);
    }

    static isCamera = true;
}