import { isPlain, isString, meta } from "utils";
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


    /**
     * Constructor
     * @param {HTMLCanvasElement}  element
     * @param {Object} [values]
     */
    constructor(element, values)
    {
        if (!(element instanceof HTMLCanvasElement))
        {
            throw new ReferenceError("Invalid element");
        }

        super();
        element.addEventListener("mousedown", event => this._DragStart(event), false);
        element.addEventListener("touchstart", event => this._DragStart(event), true);
        window.addEventListener("DOMMouseScroll", e => this._WheelHandler(e, element), false);
        window.addEventListener("mousewheel", e => this._WheelHandler(e, element), false);
        if (values) this.SetValues(values);
    }

    /**
     *
     * @param obj
     * @param,multiplier
     */
    Focus(obj, multiplier = 3)
    {
        if (obj.GetLongAxis)
        {
            this.distance =  obj.GetLongAxis() * multiplier || 1000;
        }

        obj.GetWorldTranslation(this.poi);

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
        mat4.identity(out);
        mat4.rotateY(out, out, -this._shift);
        mat4.translate(out, out, [ 0, 0.0, -this.distance ]);
        mat4.rotateX(out, out, this.rotationY + this._additionalRotationY);
        mat4.rotateY(out, out, this.rotationX + this._additionalRotationX);
        mat4.translate(out, out, [ -this.poi[0], -this.poi[1], -this.poi[2] ]);
        return out;
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

        return mat4.frustum(out, -fW, fW, -fH, fH, this.nearPlane, this.farPlane > 0 ? this.farPlane : this.distance * 2);
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
    _DragStart(event)
    {
        if (!event.touches && !this._onShift && event.button !== 0)
        {
            return;
        }
        if (this._moveEvent || this._upEvent)
        {
            return;
        }

        if (this._moveEvent === null)
        {
            document.addEventListener("mousemove", this._moveEvent = event => this._DragMove(event), true);
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
        this._dragY = event.screenY;
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
    _MeasureRotation()
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
    _DragMove(event)
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
                    event.screenY += event.touches[i].screenY;
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
    _DragStop(event)
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
    _WheelHandler(event, element)
    {
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
            this.distance = this.distance + delta * this.distance * 0.1;
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
        event.returnValue = false;
        return false;
    }

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
