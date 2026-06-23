import { isString } from "utils";
import { num, vec2, vec3, mat4, quat } from "math";
import { tw2 } from "global";
import { Mouse, Touch } from "constant";
import { meta } from "utils";

const changeEvent = "change";
const startEvent = "start";
const endEvent = "end";

const State = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_PAN: 4,
    TOUCH_DOLLY_PAN: 5,
    TOUCH_DOLLY_ROTATE: 6
};


@meta.type("CameraOrbitControls")
export class CameraOrbitControls extends meta.Model
{

    camera = null;

    domElement = null;

    enabled = true;

    target = vec3.create();
    target0 = vec3.create();
    position0 = vec3.create();  // clone of the camera's position
    zoom0 = null;               // clone of the camera's zoom

    /**
     * Used when capturing key events from an external dom element
     * @type {null|HTMLElement}
     * @private
     */
    _domElementKeyEvents = null;


    minDistance = 0;
    maxDistance = Infinity;
    minZoom = 0;
    maxZoom = Infinity;

    // Range is 0 to Math.PI radians.
    minPolarAngle = 0;
    maxPolarAngle = Math.PI;

    // How far you can orbit horizontally, upper and lower limits.
    // If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
    // In radians
    minAzimuthAngle = -Infinity;
    maxAzimuthAngle = Infinity;

    // Set to true to enable damping (inertia)
    // If damping is enabled, you must call controls.update() in your animation loop
    enableDamping = false;
    dampingFactor = 0.05;

    // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
    enableZoom = true;
    zoomSpeed = 1.0;

    // Set to false to disable rotating
    enableRotate = true;
    rotateSpeed = 1.0;

    enablePan = true;
    panSpeed = 1.0;
    screenSpacePanning = true;

    // if false, pan orthogonal to world-space direction camera.up
    keyPanSpeed = 7.0;     // pixels moved per arrow key push


    // Set to true to automatically rotate around the target
    // If auto-rotate is enabled, you must call controls.update() in your animation loop
    autoRotate = false;
    autoRotateSpeed = 2.0; // 30 seconds per orbit when fps is 60


    keys = {
        LEFT: "ArrowLeft",
        UP: "ArrowUp",
        RIGHT: "ArrowRight",
        BOTTOM: "ArrowDown"
    };

    mouseButtons = {
        LEFT: Mouse.ROTATE,
        MIDDLE: Mouse.DOLLY,
        RIGHT: Mouse.PAN
    };

    touches = {
        ONE: Touch.ROTATE,
        TWO: Touch.DOLLY_PAN
    };

    _dirty = true;
    _state = State.NONE;
    _spherical = vec3.createSpherical();
    _sphericalDelta = vec3.createSpherical();
    _scale = 1;
    _panOffset = vec3.create();
    _zoomChanged = false;
    _rotateStart = vec2.create();
    _rotateEnd = vec2.create();
    _rotateDelta = vec2.create();
    _panStart = vec2.create();
    _panEnd = vec2.create();
    _panDelta = vec2.create();
    _dollyStart = vec2.create();
    _dollyEnd = vec2.create();
    _dollyDelta = vec2.create();
    _pointers = [];
    _pointerPositions = {};

    _offset = vec3.create();
    _lastPosition = vec3.create();
    _quat = quat.create();               // Do we actually need to store this if up is always [0,1,0]
    _quatInverse = quat.create();        // Do we actually need to store this if up is always [0,1,0]
    _lastQuaternion = quat.create();

    _UP = vec3.fromValues(0, 1, 0);



    /**
     * Gets the polar angle
     * @returns {number}
     */
    get polarAngle()
    {
        return this._spherical[0]; // phi
    }

    /**
     * Gets the azimuthal angle
     * @returns {number}
     */
    get azimuthalAngle()
    {
        return this._spherical[1]; // theta
    }

    /**
     * Gets the distances from the camera and the target
     * @returns {Number}
     */
    get distance()
    {
        return vec3.distance(this.camera.translation, this.target);
    }

    /**
     * Gets the automatic rotation angle
     * @returns {number}
     */
    get autoRotationAngle()
    {
        return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
    }

    /**
     * Gets the zoom scale
     * @returns {number}
     */
    get zoomScale()
    {
        return Math.pow(0.95, this.zoomSpeed);
    }

    /**
     * Constructor
     * @param {*} camera
     * @param {HTMLElement|String} el
     */
    constructor(camera, el)
    {
        super();

        this.camera = camera;

        // Todo: UP is always [0,1,0] so probably don't need this
        if (camera.UP) vec3.copy(this._UP, camera.UP);
        quat.rotationTo(this._quat, this._UP, [ 0, 1, 0 ]);
        //quat.fromUnitVectors(this._quat, this._UP, [ 0, 1, 0 ]);
        quat.invert(this._quatInverse, this._quat);

        if (isString(el)) el = document.getElementById(el);
        this.domElement = el;
        this.domElement.style.touchAction = "none";

        this.domElement.addEventListener("contextmenu", this._onContextMenu);
        this.domElement.addEventListener("pointerdown", this._onPointerDown);
        this.domElement.addEventListener("pointercancel", this._onPointerCancel);
        this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: false });

        // force an update at start
        this._dirty = true;
        this.Update();
    }

    /**
     * Destructor
     */
    OnDestroy()
    {
        this.domElement.removeEventListener("contextmenu", this._onContextMenu);
        this.domElement.removeEventListener("pointerdown", this._onPointerDown);
        this.domElement.removeEventListener("pointercancel", this._onPointerCancel);
        this.domElement.removeEventListener("wheel", this._onMouseWheel);
        this.domElement.removeEventListener("pointermove", this._onPointerMove);
        this.domElement.removeEventListener("pointerup", this._onPointerUp);

        if (this._domElementKeyEvents !== null)
        {
            this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown);
        }
    }

    /**
     * Listens to key events from a dom element
     * @param {HTMLElement} domElement
     */
    ListenToKeyEvents(domElement)
    {
        domElement.addEventListener("keydown", this._onKeyDown);
        this._domElementKeyEvents = domElement;
    }

    /**
     * Saves the current state
     */
    SaveState()
    {
        vec3.copy(this.target0, this.target);
        this.camera.GetTranslation(this.position0);
        this.zoom0 = this.camera.zoom;
    }

    /**
     * Resets the controls
     */
    Reset()
    {
        vec3.copy(this.target, this.target0);
        this.camera.SetTranslation(this.position0);
        this.camera.zoom = this.zoom0;
        this.camera.Update();
        this.EmitEvent(changeEvent, this);
        this.InternalUpdate();
        this._state = State.NONE;
        this._dirty = true;
        this.InternalUpdate();
    }

    /**
     * Per frame update
     * @param {Number} dt
     */
    Update(dt)
    {
        if (this._dirty || this.enableDamping || this.autoRotate)
        {
            this.InternalUpdate();
        }
    }

    static TWO_PI = Math.PI * 2;

    static ObjectUp = vec3.fromValues(0,1,0);


    /**
     * Updates the camera controls
     * @returns {boolean}
     */
    InternalUpdate()
    {
        const
            twoPI = CameraOrbitControls.TWO_PI,
            position = this.camera.GetTranslation(vec3.create());


        quat.fromUnitVectors(this._quat, this.constructor.ObjectUp, [ 0,1,0 ]);

        vec3.copy(this._offset, position);
        vec3.subtract(this._offset, this._offset, this.target);
        vec3.transformQuat(this._offset, this._offset, this._quat);
        vec3.getSpherical(this._spherical, this._offset);

        if (this.autoRotate && this._state === State.NONE)
        {
            this._RotateLeft(this.autoRotationAngle);
        }

        // [0] - phi
        // [1] - theta
        // [2] - radius

        if (this.enableDamping)
        {
            this._spherical[1] = this._sphericalDelta[1] * this.dampingFactor; // theta
            this._spherical[0] = this._sphericalDelta[0] * this.dampingFactor; // phi
        }
        else
        {
            this._spherical[1] += this._sphericalDelta[1]; // theta
            this._spherical[0] += this._sphericalDelta[0]; // phi
        }

        let min = this.minAzimuthAngle,
            max = this.maxAzimuthAngle;

        if (isFinite(min) && isFinite(max))
        {
            if (min < -Math.PI)
            {
                min += twoPI;
            }
            else if (min > Math.PI)
            {
                min -= twoPI;
            }

            if (max < -Math.PI)
            {
                max += twoPI;
            }
            else if (max > Math.PI)
            {
                max -= twoPI;
            }

            // theta
            if (min <= max)
            {
                this._spherical[1] = Math.max(min, Math.min(max, this._spherical[1]));
            }
            else
            {
                this._spherical[1] = this._spherical[1] > (min + max) / 2
                    ? Math.max(min, this._spherical[1])
                    : Math.min(max, this._spherical[1]);
            }
        }

        // phi
        this._spherical[0] = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical[0]));

        vec3.makeSphericalSafe(this._spherical, this._spherical);

        // radius
        this._spherical[2] *= this._scale;
        // restrict radius to be between desired limits
        this._spherical[2] = Math.max(this.minDistance, Math.min(this.maxDistance, this._spherical[2]));

        // move target to panned location
        if (this.enableDamping)
        {
            vec3.scaleAndAdd(this.target, this.target, this._panOffset, this.dampingFactor);
        }
        else
        {
            vec3.add(this.target, this.target, this._panOffset);
        }

        // rotate offset back to "camera-up-vector-is-up" space
        vec3.fromSpherical(this._offset, this._spherical);
        vec3.transformQuat(this._offset, this._offset, this._quatInverse);

        // Update position
        vec3.add(position, this.target, this._offset);
        this.camera.SetTranslation(position);

        //mat4.lookAt(this.camera._localTransform, position, this.target, [ 0,1,0 ]);
        this.camera.LookAt(this.target).UpdateValues();



        if (this.enableDamping)
        {
            this._sphericalDelta[1] *= 1 - this.dampingFactor; // theta
            this._sphericalDelta[0] *= 1 - this.dampingFactor; // phi
            vec3.scale(this._panOffset, this._panOffset, 1 - this.dampingFactor);
        }
        else
        {
            vec3.set(this._sphericalDelta, 0, 0, 0);
            vec3.set(this._panOffset, 0, 0, 0);
        }

        this._scale = 1;

        const quaternion = this.camera.GetRotation(quat.create());

        if (
            this._zoomChanged ||
            vec3.squaredDistance(this._lastPosition, position) > num.EPSILON ||
            8 * (1 - quat.dot(this._lastQuaternion, quaternion)) > num.EPSILON)
        {
            this.EmitEvent(changeEvent, this);
            vec3.copy(this._lastPosition, position);
            quat.copy(this._lastQuaternion, quaternion);
            this._zoomChanged = false;
            this._dirty = false;
            return true;
        }

        console.log("(No change)");
        this._dirty = false;
        return false;
    }

    /**
     * Gets the last position
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetLastPosition(out)
    {
        return vec3.copy(out, this._lastPosition);
    }

    /**
     * Gets the last rotation
     * @param {vec3} out
     * @returns {vec3} out
     */
    GetLastRotation(out)
    {
        return quat.copy(out, this._lastQuaternion);
    }

    /**
     * Rotates left
     * @param {Number} angle
     */
    _RotateLeft = (angle) =>
    {
        if (angle == 0) return;
        console.log(`- rotate ${angle < 0 ? "left" : "right"}`);
        this._sphericalDelta[1] -= angle; // theta
        this._dirty = true;
    }

    /**
     * Rotates up
     * @param {Number} angle
     */
    _RotateUp = (angle) =>
    {
        if (angle == 0) return;
        console.log(`- rotate ${angle < 0 ? "up" : "down"}`);
        this._sphericalDelta[0] -= angle; // phi
        this._dirty = true;
    }

    /**
     * Pans left
     * @param {Number} distance
     */
    _PanLeft = (distance) =>
    {
        if (distance === 0) return;
        console.log(`- pan ${distance < 0 ? "left":"right"}`);

        const { vec3_0: v, mat4_0: m } = CameraOrbitControls.global;
        this.camera.GetTransform(m);
        vec3.fromMat4Column(v, m, 0),

            vec3.scale(v, v, -distance);
        vec3.add(this._panOffset, this._panOffset, v);

        this._dirty = true;
    }

    /**
     * Pans up
     * @param {Number} distance
     */
    _PanUp = (distance) =>
    {
        if (distance === 0) return;
        console.log(`- pan ${distance < 0 ? "up": "down"}`);

        const { vec3_0: v, mat4_0: m } = CameraOrbitControls.global;
        this.camera.GetTransform(m);

        if (this.screenSpacePanning)
        {
            vec3.fromMat4Column(v, m, 1);
        }
        else
        {
            vec3.fromMat4Column(v, m, 0);
            vec3.cross(v, this._UP, v);
        }

        vec3.scale(v, v, distance);
        vec3.add(this._panOffset, this._panOffset, v);

        this._dirty = true;
    }

    /**
     * Pans the camera
     * @param {Number} deltaX - pixels, right is positive
     * @param {Number} deltaY - pixels, down is positive
     */
    _Pan = (deltaX, deltaY) =>
    {
        const { vec3_0: offset } = CameraOrbitControls.global;
        const el = this.domElement;

        if (this.camera.isPerspectiveCamera)
        {
            vec3.subtract(offset, this.camera.translation, this.target);
            let targetDistance = vec3.length(offset);
            // we use only clientHeight here so aspect ratio does not distort speed
            targetDistance *= Math.tan(this.camera.fov / 2 * Math.PI / 180);
            this._PanLeft(2 * deltaX * targetDistance / tw2.height); //el.clientHeight);
            this._PanUp(2 * deltaY * targetDistance / tw2.height); //el.clientHeight);
        }
        else if (this.camera.isOrthographicCamera)
        {
            this._PanLeft(deltaX * (this.camera.right - this.camera.left) / this.camera.zoom / tw2.width); //el.clientWidth);
            this._PanUp(deltaY * (this.camera.bottom - this.camera.top) / this.camera.zoom / tw2.height); //el.clientHeight);
        }
        else
        {
            console.log("Unknown camera");
            this.enablePan = false;
        }
    }

    /**
     * Dollys the camera out
     * @param {Number} dollyScale
     */
    _DollyOut = (dollyScale) =>
    {
        if (dollyScale == 0) return;
        console.log("- dolly out");

        if (this.camera.isPerspectiveCamera)
        {
            this._scale /= dollyScale;
        }
        else if (this.camera.isOrthographicCamera)
        {
            this.camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.camera.zoom * dollyScale));
            this.camera.UpdateValues();
            this._zoomChanged = true;
        }
        else
        {
            console.log("Unknown camera");
            this.enableZoom = false;
        }

        this._dirty = true;
    }

    /**
     * Dollys the camera out
     * @param {Number} dollyScale
     */
    _DollyIn = (dollyScale) =>
    {
        if (dollyScale == 0) return;
        console.log("Dolly in");

        if (this.camera.isPerspectiveCamera)
        {
            this._scale *= dollyScale;
            //this._zoomChanged = true;
        }
        else if (this.camera.isOrthographicCamera)
        {
            this.camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.camera.zoom / dollyScale));
            this.camera.UpdateValues();
            this._zoomChanged = true;
        }
        else
        {
            console.log("Unknown camera");
            this.enableZoom = false;
        }

        this._dirty = true;
    }

    _handleMouseDownRotate = e =>
    {
        console.log("rotate");
        vec2.set(this._rotateStart, e.clientX, e.clientY);
        this._dirty = true;
    };

    _handleMouseDownDolly = e =>
    {
        console.log("dolly");
        vec2.set(this._dollyStart, e.clientX, e.clientY);
        this._dirty = true;
    };

    _handleMouseDownPan = e =>
    {
        console.log("pan");
        vec2.set(this._panStart, e.clientX, e.clientY);
        this._dirty = true;
    };

    _handleMouseMoveRotate = e =>
    {
        vec2.set(this._rotateEnd, e.clientX, e.clientY);
        vec2.subtract(this._rotateDelta, this._rotateEnd, this._rotateStart);
        vec2.scale(this._rotateDelta, this._rotateDelta, this.rotateSpeed);
        this._RotateLeft(2 * Math.PI * this._rotateDelta[0] / tw2.height); //this.domElement.clientHeight); // yes, height
        this._RotateUp(2 * Math.PI * this._rotateDelta[1] / tw2.height); //this.domElement.clientHeight);
        vec2.copy(this._rotateStart, this._rotateEnd);
        this.InternalUpdate();
    };

    _handleMouseMoveDolly = e =>
    {
        vec2.set(this._dollyEnd, e.clientX, e.clientY);
        vec2.subtract(this._dollyDelta, this._dollyEnd, this._dollyStart);
        if (this._dollyDelta[1] > 0)
        {
            this._DollyOut(this.zoomScale);
        }
        else if (this._dollyDelta[1] < 0)
        {
            this._DollyIn(this.zoomScale);
        }
        vec2.copy(this._dollyStart, this._dollyEnd);
        this.InternalUpdate();
    };

    _handleMouseMovePan = e =>
    {
        vec2.set(this._panEnd, e.clientX, e.clientY);
        vec2.subtract(this._panDelta, this._panEnd, this._panStart);
        this._Pan(this._panDelta[0], this._panDelta[1]);
        vec2.copy(this._panStart, this._panEnd);
        this.InternalUpdate();
    };

    _handleMouseWheel = e =>
    {
        if (e.deltaY < 0)
        {
            this._DollyIn(this.zoomScale);
        }
        else if (e.deltaY > 0)
        {
            this._DollyOut(this.zoomScale);
        }
        else
        {
            // Nothing
            return;
        }
        this.InternalUpdate();
    };

    _handleKeyDown = e =>
    {
        let needsUpdate = false;
        switch (e.code)
        {
            case this.keys.UP:
                console.log("Key up");
                this._Pan(0, this.keyPanSpeed);
                needsUpdate = true;
                break;

            case this.keys.BOTTOM:
                console.log("Key down");
                this._Pan(0, -this.keyPanSpeed);
                needsUpdate = true;
                break;

            case this.keys.LEFT:
                console.log("Key left");
                this._Pan(this.keyPanSpeed, 0);
                needsUpdate = true;
                break;

            case this.keys.RIGHT:
                console.log("Key right");
                this._Pan(-this.keyPanSpeed, 0);
                needsUpdate = true;
                break;
        }

        if (needsUpdate)
        {
            e.preventDefault(); // prevent the browser from scrolling on cursor keys
            this.InternalUpdate();
        }
    };

    _handleTouchStartRotate = () =>
    {
        let p = this._pointers,
            x = p[0].pageX,
            y = p[0].pageY;

        if (p.length !== 1)
        {
            x = 0.5 * (x + p[1].pageX);
            y = 0.5 * (y + p[1].pageY);
        }

        vec2.set(this._rotateStart, x, y);

        this._dirty = true;
    };

    _handleTouchStartPan = () =>
    {
        let p = this._pointers,
            x = p[0].pageX,
            y = p[0].pageY;

        if (p.length !== 1)
        {
            x = 0.5 * (x + p[1].pageX);
            y = 0.5 * (y + p[1].pageY);
        }

        vec2.set(this._panStart, x, y);

        this._dirty = true;
    };

    _handleTouchStartDolly = () =>
    {
        const
            p = this._pointers,
            dx = p[0].pageX - p[1].pageX,
            dy = p[0].pageY - p[1].pageY,
            distance = Math.sqrt(dx * dx + dy * dy);

        vec2.set(this._dollyStart, 0, distance);

        this._dirty = true;
    };

    _handleTouchStartDollyPan = () =>
    {
        if (this.enableZoom) this._handleTouchStartDolly();
        if (this.enablePan) this._handleTouchStartPan();
    };

    _handleTouchStartDollyRotate = () =>
    {
        if (this.enableZoom) this._handleTouchStartDolly();
        if (this.enablePan) this._handleTouchStartRotate();
    };

    _handleTouchMoveRotate = e =>
    {
        let x = e.pageX,
            y = e.pageY;

        if (this._pointers.length !== 1)
        {
            const position = this._GetSecondPointerPosition(e);
            x = 0.5 * (x + position[0]),
                y = 0.5 * (y + position[1]);
        }

        vec2.set(this._rotateEnd, x, y);

        vec2.subtract(this._rotateDelta, this._rotateEnd, this._rotateStart);
        vec2.scale(this._rotateDelta, this._rotateDelta, this.rotateSpeed);

        const { clientHeight } = this.domElement;
        this._RotateLeft(2 * Math.PI * this._rotateDelta[0] / clientHeight); // yes, height
        this._RotateUp(2 * Math.PI * this._rotateDelta[1] / clientHeight);
        vec2.copy(this._rotateStart, this._rotateEnd);

        this._dirty = true;
    };

    _handleTouchMovePan = e =>
    {
        let x = e.pageX,
            y = e.pageY;

        if (this._pointers.length !== 1)
        {
            const position = this._GetSecondPointerPosition(e);
            x = 0.5 * (x + position[0]);
            y = 0.5 * (y + position[1]);
        }

        vec2.set(this._panEnd, x, y);

        vec2.subtract(this._panDelta, this._panEnd, this._panStart);
        vec2.scale(this._panDelta, this.panSpeed);
        this._Pan(this._panDelta[0], this._panDelta[1]);
        vec2.copy(this._panStart, this._panEnd);

        this._dirty = true;
    };

    _handleTouchMoveDolly = e =>
    {
        const
            position = this._GetSecondPointerPosition(e),
            dx = e.pageX - position[0],
            dy = e.pageY - position[1],
            distance = Math.sqrt(dx * dx + dy * dy);

        vec2.set(this._dollyEnd, 0, distance);
        vec2.set(this._dollyDelta, 0, Math.pow(this._dollyEnd[1] / this._dollyStart[1], this.zoomSpeed));

        this._DollyOut(this._dollyDelta[0]);
        vec2.copy(this._dollyStart, this._dollyEnd);

        this._dirty = true;
    };

    _handleTouchMoveDollyPan = e =>
    {
        if (this.enableZoom) this._handleTouchMoveDolly(e);
        if (this.enablePan) this._handleTouchMovePan(e);
    };

    _handleTouchMoveDollyRotate = e =>
    {
        if (this.enableZoom) this._handleTouchMoveDolly(e);
        if (this.enableRotate) this._handleTouchMoveRotate(e);
    };

    _onPointerDown = e =>
    {
        if (!this.enabled) return;

        if (this._pointers.length === 0)
        {
            this.domElement.setPointerCapture(e.pointerId);
            this.domElement.addEventListener("pointermove", this._onPointerMove);
            this.domElement.addEventListener("pointerup", this._onPointerUp);
        }

        this._AddPointer(e);

        if (e.pointerType === "touch")
        {
            this._onTouchStart(e);
        }
        else
        {
            this._onMouseDown(e);
        }
    };

    _onPointerMove = e =>
    {
        if (!this.enabled) return;

        if (e.pointerType === "touch")
        {
            this._onTouchMove(e);
        }
        else
        {
            this._onMouseMove(e);
        }
    };

    _onPointerUp = e =>
    {
        this._RemovePointer(e);

        if (this._pointers.length === 0)
        {
            this.domElement.releasePointerCapture(e.pointerId);
            this.domElement.removeEventListener("pointermove", this._onPointerMove);
            this.domElement.removeEventListener("pointerup", this._onPointerUp);
        }

        this.EmitEvent(endEvent, this);
        this._state = State.NONE;
    };

    _onPointerCancel = e =>
    {
        if (!this.enabled) return;
        this._RemovePointer(e);
    };

    _onMouseDown = e =>
    {

        if (!this.enabled) return;

        let mouseAction;
        switch (e.button)
        {
            case 0:
                mouseAction = this.mouseButtons.LEFT;
                console.log("mouse left");
                break;

            case 1:
                mouseAction = this.mouseButtons.MIDDLE;
                console.log("mouse middle");
                break;

            case 2:
                mouseAction = this.mouseButtons.RIGHT;
                console.log("mouse right");
                break;

            default:
                mouseAction = -1;
        }

        switch (mouseAction)
        {
            case Mouse.DOLLY:
                if (!this.enableZoom) return;
                this._handleMouseDownDolly(e);
                this._state = State.DOLLY;
                break;

            case Mouse.ROTATE:
                if (e.ctrlKey || e.metaKey || e.shiftKey)
                {
                    if (!this.enablePan) return;
                    this._handleMouseDownPan(e);
                    this._state = State.PAN;
                }
                else
                {
                    if (!this.enableRotate) return;
                    this._handleMouseDownRotate(e);
                    this._state = State.ROTATE;
                }
                break;

            case Mouse.PAN:
                if (e.ctrlKey || e.metaKey || e.shiftKey)
                {
                    if (!this.enableRotate) return;
                    this._handleMouseDownRotate(e);
                    this.state = State.ROTATE;
                }
                else
                {
                    if (!this.enablePan) return;
                    this._handleMouseDownPan(e);
                    this._state = State.PAN;
                }
                break;

            default:
                this._state = State.NONE;
        }

        if (this._state !== State.NONE)
        {
            this.EmitEvent(startEvent, this);
        }
    };

    _onMouseMove = e =>
    {
        if (!this.enabled) return;

        switch (this._state)
        {
            case State.ROTATE:
                if (!this.enableRotate) return;
                this._handleMouseMoveRotate(e);
                break;

            case State.DOLLY:
                if (!this.enableZoom) return;
                this._handleMouseMoveDolly(e);
                break;

            case State.PAN:
                if (!this.enablePan) return;
                this._handleMouseMovePan(e);
                break;
        }

    };

    _onMouseWheel = e =>
    {
        if (!this.enabled || !this.enableZoom || this._state !== State.NONE) return;
        e.preventDefault();
        this.EmitEvent(startEvent, this);
        this._handleMouseWheel(e);
        this.EmitEvent(endEvent, this);
    };

    _onKeyDown = e =>
    {
        if (!this.enabled || !this.enablePan) return;
        this._handleKeyDown(e);
    };

    _onTouchStart = e =>
    {
        this._trackPointer(e);
        switch (this._pointers.length)
        {
            case 1:
                switch (this.touches.ONE)
                {
                    case Touch.ROTATE:
                        if (!this.enableRotate) return;
                        this._handleTouchStartRotate();
                        this._state = State.TOUCH_ROTATE;
                        break;

                    case Touch.PAN:
                        if (!this.enablePan) return;
                        this._handleTouchStartPan();
                        this._state = State.TOUCH_PAN;
                        break;

                    default:
                        this._state = State.NONE;
                }
                break;

            case 2:
                switch (this.touches.TWO)
                {
                    case Touch.DOLLY_PAN:
                        if (!this.enableZoom && !this.enablePan) return;
                        this._handleTouchStartDollyPan();
                        this._state = State.TOUCH_DOLLY_PAN;
                        break;

                    case Touch.DOLLY_ROTATE:
                        if (!this.enableZoom && !this.enableRotate) return;
                        this._handleTouchStartDollyRotate();
                        this._state = State.TOUCH_DOLLY_ROTATE;
                        break;

                    default:
                        this._state = State.NONE;
                }
                break;

            default:
                this._state = State.NONE;
        }

        if (this._state !== State.NONE)
        {
            this.EmitEvent(startEvent, this);
        }
    };

    _onTouchMove = e =>
    {
        this._TrackPointer(e);
        switch (this._state)
        {
            case State.TOUCH_ROTATE:
                if (!this.enableRotate) return;
                this._handleTouchMoveRotate(e);
                this.InternalUpdate();
                break;

            case State.TOUCH_PAN:
                if (!this.enablePan) return;
                this._handleTouchMovePan(e);
                this.InternalUpdate();
                break;

            case State.TOUCH_DOLLY_PAN:
                if (!this.enableZoom && !this.enablePan) return;
                this._handleTouchMoveDollyPan(e);
                this.InternalUpdate();
                break;

            case State.TOUCH_DOLLY_ROTATE:
                if (!this.enableZoom && !this.enableRotate) return;
                this._handleTouchMoveDollyRotate(e);
                this.InternalUpdate();
                break;

            default:
                this._state = State.NONE;
        }
    };

    _onContextMenu = e =>
    {
        if (!this.enabled) return;
        e.preventDefault();
    };

    _AddPointer = (e) =>
    {
        this._pointers.push(e);
        this._dirty = true;
    }

    _RemovePointer = (e) =>
    {
        Reflect.deleteProperty(this._pointerPositions, e.pointerId);
        for (let i = 0; i < this._pointers.length; i++)
        {
            if (this._pointers[i].pointerId === e.pointerId)
            {
                this._pointers.splice(i, 1);

                this._dirty = true;
                return;
            }
        }
    }

    _TrackPointer = (e) =>
    {
        let position = this._pointerPositions[e.pointerId];
        if (!position)
        {
            position = vec2.create();
            this._pointerPositions[e.pointerId] = position;
        }
        vec2.set(position, e.pageX, e.pageY);

        this._dirty = true;
    }

    _GetSecondPointerPosition =(e)=>
    {
        const pointer = e.pointerId === this.pointers[0].pointerId ? this.pointers[1] : this.pointers[0];
        return this._pointerPositions[pointer.pointerId];
    }

    /**
     * Orbit control state
     * @type {Object}
     */
    static State = State;

    /**
     * Internal scratch variables
     * @type {{vec3_0: Float32Array, mat4_0: *}}
     */
    static global = {
        vec3_0: vec3.create(),
        mat4_0: mat4.create()
    };

}