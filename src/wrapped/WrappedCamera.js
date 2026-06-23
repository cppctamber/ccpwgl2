import { isPlain, isString, meta, toArray } from "utils";
import { device } from "global/tw2";
import { mat4, vec3 } from "math";


@meta.type("WrappedCamera")
export class WrappedCamera extends meta.Model
{

    @meta.uint
    distance = 1;

    @meta.uint
    minDistance = -1;

    @meta.uint
    maxDistance = 1000000;

    @meta.uint
    fov = 60;

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

    ignoreOnShiftDown = true;
    ignoreOnCtrlDown = true;
    ignoreOnAltDown = true;

    _aspect = 0;
    _onShift = null;
    _shift = 0;
    _shiftStage = 0;
    _shiftX = null;
    _dragX = 0;
    _dragY = 0;
    _lastRotationX = 0;
    _lastRotationY = 0;
    _rotationSpeedX = 0;
    _rotationSpeedY = 0;
    _additionalRotationX = 0;
    _additionalRotationY = 0;
    _measureRotation = null;
    _moveEvent = null;
    _upEvent = null;
    _prevScale = null;

    _worldTransform = mat4.create();
    _worldInverseTransform = mat4.create();

    get isCamera()
    {
        return true;
    }

    /**
     * Constructor
     * @param {HTMLCanvasElement}  element
     * @param {Object} [values]
     */
    constructor(element, values)
    {
        if (element !== null && !(element instanceof HTMLCanvasElement))
        {
            throw new ReferenceError("Invalid element");
        }

        super();

        if (element)
        {
            element.addEventListener("mousedown", this._DragStart, false);
            element.addEventListener("touchstart", this._DragStart, true);
            window.addEventListener("DOMMouseScroll", this._WheelHandler, false);
            window.addEventListener("mousewheel", this._WheelHandler, false);
            this._element = element;
        }

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

    Destroy()
    {
        this._element.removeEventListener("mousedown", this._DragStart);
        this._element.removeEventListener("touchstart", this._DragStart);
        window.removeEventListener("DOMMouseScroll", this._WheelHandler);
        window.removeEventListener("mousewheel", this._WheelHandler);
        document.removeEventListener("mousemove", this._moveEvent);
        document.removeEventListener("touchmove", this._moveEvent);
        document.removeEventListener("mouseup", this._upEvent);
        document.removeEventListener("touchend", this._upEvent);
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


            const { radians } = WrappedCamera.getFovFromHorizontalDegrees(this.fov, this._aspect);

            if (objectAspect <= this._aspect)
            {
                distance = WrappedCamera.distanceToFitObjectInView(height, radians.vertical);
            }
            else
            {
                distance = WrappedCamera.distanceToFitObjectInView(width, radians.horizontal);
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

        vec3.copy(this.poi, center);
        this.distance = distance * multiplier;
        return this;
    }

    /**
     * Adds a on shift handler
     * @param {Function} func
     */
    OnShift(func)
    {
        this._onShift = func;
    }

    /**
     * Gets the camera's view matrix
     * @param {mat4} [out=mat4.create()]
     * @return {mat4} out
     */
    GetView(out = mat4.create())
    {
        return mat4.copy(out, this._worldInverseTransform);
    }


    /**
     * Gets the world direction
     * @param out
     * @return {vec3}
     */
    GetWorldDirection(out = vec3.create())
    {
        const view = this.GetView(this.constructor.global.mat4_0);
        out[0] = view[8];
        out[1] = view[9];
        out[2] = view[10];
        return out;
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

    /**
     * Gets the cameras projection matrix
     * @param  {mat4} [out=mat4.create()]
     * @param {number} aspect - The canvas's aspect ratio
     * @returns {mat4}
     */
    GetProjection(out = mat4.create(), aspect)
    {
        const
            fH = Math.tan(this.fov / 360 * Math.PI) * this.nearPlane,
            fW = fH * aspect;

        this._aspect = aspect;

        return mat4.frustum(out, -fW, fW, -fH, fH, this.nearPlane, this.farPlane > 0 ? this.farPlane : this.distance * 2); // Double the distance?
    }

    /**
     * Per frame update
     * @param {Number} dt
     */
    Update(dt)
    {
        this.rotationX += this._rotationSpeedX * dt;
        this._rotationSpeedX *= 0.9;
        this.rotationY += this._rotationSpeedY * dt;
        this._rotationSpeedY *= 0.9;
        if (this.rotationY < -Math.PI / 2) this.rotationY = -Math.PI / 2;
        if (this.rotationY > Math.PI / 2) this.rotationY = Math.PI / 2;

        if (this._shiftStage === 2)
        {
            this._shift += this._shift * dt * 5;
            if (Math.abs(this._shift) > 2)
            {
                this._onShift(1, this._shift > 0);
                //this.shift = -this.shift;
                //this._shiftOut = false;
            }
        }
        else if (this._shiftStage === 1)
        {
            this._shift -= this._shift * Math.min(dt, 0.5) * 2;
        }


        this.EmitEvent("update", dt);

        const it = this._worldInverseTransform;
        mat4.identity(it);
        mat4.rotateY(it, it, -this._shift);
        mat4.translate(it, it, [ 0, 0.0, -this.distance ]);
        mat4.rotateX(it, it, this.rotationY + this._additionalRotationY);
        mat4.rotateY(it, it, this.rotationX + this._additionalRotationX);
        mat4.translate(it, it, [ -this.poi[0] , -this.poi[1], -this.poi[2] ]);
        mat4.invert(this._worldTransform, it);

        if (this.post) this.post.Update(dt);
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

    /**
     * Drag start handler
     * @param event
     * @private
     */
    _DragStart = (event) =>
    {

        if (event.altKey && this.ignoreOnAltDown) return;
        if (event.ctrlKey && this.ignoreOnCtrlDown) return;
        if (event.shiftKey && this.ignoreOnShiftDown) return;

        if (event.altKey) return;

        let noVertical = !!event.ctrlKey;

        if (!event.touches && !this._onShift && event.button !== 0)
        {
            return;
        }
        if (this._moveEvent || this._upEvent)
        {
            return;
        }

        this.button = event.button;

        if (this._moveEvent === null)
        {
            document.addEventListener("mousemove", this._moveEvent = event => this._DragMove(event, noVertical), true);
            document.addEventListener("touchmove", this._moveEvent, true);
        }

        if (this._upEvent === null)
        {
            document.addEventListener("mouseup", this._upEvent = event => this._DragStop(event), true);
            document.addEventListener("touchend", this._upEvent, true);
        }

        event.preventDefault();

        if (event.touches)
        {
            event.screenX = event.touches[0].screenX;
            event.screenY = event.touches[0].screenY;
        }

        this._dragX = event.screenX;
        this._dragY = noVertical ? this._dragY : event.screenY;
        this._shiftX = null;
        this._rotationSpeedX = 0;
        this._lastRotationX = this.rotationX;
        this._rotationSpeedY = 0;
        this._lastRotationY = this.rotationY;

        this._measureRotation = setTimeout(() => this._MeasureRotation(), 500);

    }

    /**
     * Measures rotation
     * @private
     */
    _MeasureRotation = () =>
    {
        this._lastRotationX = this.rotationX;
        this._lastRotationY = this.rotationY;
        this._measureRotation = setTimeout(() => this._MeasureRotation(), 500);
    }

    /**
     * Drag move handler
     * @param event
     * @private
     */
    _DragMove = (event, noVertical) =>
    {
        if (this._onShift && (event.touches && event.touches.length > 2 || !event.touches && event.button !== 0))
        {
            this._shiftStage = 0;
            event.preventDefault();

            if (event.touches)
            {
                event.screenX = event.screenY = 0;
                for (let i = 0; i < event.touches.length; ++i)
                {
                    event.screenX += event.touches[i].screenX;
                    if (!noVertical) event.screenY += event.touches[i].screenY;
                }
                event.screenX /= event.touches.length;
                event.screenY /= event.touches.length;
            }

            if (this._shiftX !== null)
            {
                this._shift += (event.screenX - this._shiftX) / device.viewportWidth * 2;
            }

            this._shiftX = event.screenX;
            return;
        }

        this._shiftX = null;

        if (event.touches)
        {

            if (event.touches.length > 1)
            {
                event.preventDefault();

                const
                    dx = event.touches[0].screenX - event.touches[1].screenX,
                    dy = event.touches[0].screenY - event.touches[1].screenY,
                    scale = Math.sqrt(dx * dx + dy * dy);

                if (this._prevScale != null)
                {
                    const delta = (this._prevScale - scale) * 0.03;
                    this.distance = this.distance + delta * this.distance * 0.1;
                    if (this.distance < this.minDistance) this.distance = this.minDistance;
                    if (this.distance > this.maxDistance) this.distance = this.maxDistance;
                }
                this._prevScale = scale;
                return;
            }

            event.screenX = event.touches[0].screenX;
            event.screenY = event.touches[0].screenY;
        }

        if (typeof (event.screenX) !== "undefined")
        {
            let dRotation = -(this._dragX - event.screenX) * 0.01;
            this.rotationX += dRotation;
            this._dragX = event.screenX;
            dRotation = -(this._dragY - event.screenY) * 0.01;
            this.rotationY += dRotation;
            this._dragY = event.screenY;
            if (this.rotationY < -Math.PI / 2) this.rotationY = -Math.PI / 2;
            if (this.rotationY > Math.PI / 2) this.rotationY = Math.PI / 2;
        }
    }

    /**
     * Drag stop handler
     * @param event
     * @private
     */
    _DragStop = (event) =>
    {
        clearTimeout(this._measureRotation);

        document.removeEventListener("mousemove", this._moveEvent, true);
        document.removeEventListener("mouseup", this._upEvent, true);
        document.removeEventListener("touchmove", this._moveEvent, true);
        document.removeEventListener("touchend", this._upEvent, true);

        this._moveEvent = null;
        this._upEvent = null;
        let dRotation = this.rotationX - this._lastRotationX;
        this._rotationSpeedX = dRotation * 0.5;
        dRotation = this.rotationY - this._lastRotationY;
        this._rotationSpeedY = dRotation * 0.5;
        this._prevScale = null;

        if (this._onShift)
        {
            if (Math.abs(this._shift) > 0.5)
            {
                this._shiftStage = 2;
                this.onShift(0, this._shift > 0);
            }
            else
            {
                this._shiftStage = 1;
            }
        }
    }

    /**
     * Mouse wheel handler
     * @param event
     * @param element
     * @returns {boolean}
     * @private
     */
    _WheelHandler = (event, element) =>
    {

        if (!element) element = this._element;

        /* For IE. */
        if (!event) event = window.event;

        let source = event.srcElement ? event.srcElement : event.target;
        if (source !== element) return false;

        let delta = 0;

        /* IE/Opera. */
        if (event.wheelDelta)
        {
            delta = event.wheelDelta / 120;
            /** In Opera 9, delta differs in sign as compared to IE.*/
            if (window.opera) delta = -delta;
        }
        /* Mozilla case. In Mozilla, sign of delta is different than in IE. Also, delta is multiple of 3. */
        else if (event.detail)
        {
            delta = -event.detail / 3;
        }

        /** If delta is nonzero, handle it.
         * Basically, delta is now positive if wheel was scrolled up,
         * and negative, if wheel was scrolled down.
         */
        if (delta)
        {
            this.distance = this.distance + delta * this.distance * WrappedCamera.deltaModifier;
            if (this.distance < this.minDistance)
            {
                this.distance = this.minDistance;
            }
        }

        /** Prevent default actions caused by mouse wheel.
         * That might be ugly, but we handle scrolls somehow
         * anyway, so don't bother here..
         */
        //if (event.preventDefault) event.preventDefault();
        //event.returnValue = false;

        return false;
    }

    static deltaModifier = 0.05;

    /**
     * Fetches a camera async
     * TODO: Load geometry to represent the camera
     * @param {Object} options
     * @return {Promise<WrappedCamera>}
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
}
