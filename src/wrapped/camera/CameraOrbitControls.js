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

/* ============================== DEBUG LOG ============================== */
/**
 * Always resolves the debug log from window so it cannot be duplicated
 * even if this module is accidentally bundled twice.
 */
function createOrbitDebugLog()
{
    const _data = [];
    let _t0 = 0;

    return {
        get data() { return _data; },

        clear()
        {
            _data.length = 0;
            _t0 = performance.now();
            console.log("[Orbit] cleared");
        },

        push(tag, obj = {})
        {
            if (!_t0) _t0 = performance.now();
            const t = +(performance.now() - _t0).toFixed(1);
            const row = { t, tag, ...obj };
            _data.push(row);
            // Keep it lightweight; comment this if too spammy
            console.log("[Orbit]", `${t}ms`, tag, obj);
        },

        copyJSON()
        {
            const json = JSON.stringify(_data, null, 2);
            console.log(json);
            return json;
        }
    };
}

function getOrbitDebugLog()
{
    if (!window.OrbitDebugLog) window.OrbitDebugLog = createOrbitDebugLog();
    return window.OrbitDebugLog;
}

/* ============================ ORBIT CONTROLS ============================ */

@meta.type("CameraOrbitControls")
export class CameraOrbitControls extends meta.Model
{
    camera = null;
    domElement = null;
    enabled = true;

    target = vec3.create();
    target0 = vec3.create();
    position0 = vec3.create();
    zoom0 = null;

    minDistance = 0;
    maxDistance = Infinity;
    minZoom = 0;
    maxZoom = Infinity;

    // phi (polar) range
    minPolarAngle = 0;
    maxPolarAngle = Math.PI;

    // theta (azimuth) range
    minAzimuthAngle = -Infinity;
    maxAzimuthAngle = Infinity;

    enableDamping = false;
    dampingFactor = 0.05;

    enableZoom = true;
    zoomSpeed = 1.0;

    enableRotate = true;
    rotateSpeed = 1.0;

    enablePan = true;
    panSpeed = 1.0;
    screenSpacePanning = true;
    keyPanSpeed = 7.0;

    autoRotate = false;
    autoRotateSpeed = 2.0;

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

    _state = State.NONE;
    _dirty = true;

    _spherical = vec3.createSpherical();       // [phi, theta, radius]
    _sphericalDelta = vec3.createSpherical();  // [dPhi, dTheta, dRadiusUnused]
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

    _offset = vec3.create();
    _lastPosition = vec3.create();
    _lastQuaternion = quat.create();

    // Pointer tracking
    _pointers = [];                 // pointerIds
    _pointerPositions = {};         // pointerId -> vec2
    _capturedPointers = new Set();  // pointerIds captured on dom

    // Optional key event capture
    _domElementKeyEvents = null;

    // Debug toggles
    debug = false;

    // Fixed world up (your engine uses vec3.Y_AXIS)
    static ObjectUp = vec3.Y_AXIS;
    static TWO_PI = Math.PI * 2;

    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create(),
        mat4_0: mat4.create(),
        quat_0: quat.create()
    };

    constructor(camera, el)
    {
        super();
        this.camera = camera;

        if (isString(el)) el = document.getElementById(el);
        this.domElement = el;

        // Required for pointer events to behave on touch
        this.domElement.style.touchAction = "none";

        this.domElement.addEventListener("contextmenu", this._onContextMenu);
        this.domElement.addEventListener("pointerdown", this._onPointerDown);
        this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: false });

        // Force a first update
        this._dirty = true;
        this.InternalUpdate(true);
    }

    OnDestroy()
    {
        this._cleanupPointerTracking();

        this.domElement.removeEventListener("contextmenu", this._onContextMenu);
        this.domElement.removeEventListener("pointerdown", this._onPointerDown);
        this.domElement.removeEventListener("wheel", this._onMouseWheel);

        if (this._domElementKeyEvents)
        {
            this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown);
            this._domElementKeyEvents = null;
        }
    }

    ListenToKeyEvents(domElement)
    {
        domElement.addEventListener("keydown", this._onKeyDown);
        this._domElementKeyEvents = domElement;
    }

    SaveState()
    {
        vec3.copy(this.target0, this.target);
        this.camera.GetTranslation(this.position0);
        this.zoom0 = this.camera.zoom;
    }

    Reset()
    {
        vec3.copy(this.target, this.target0);
        this.camera.SetTranslation(this.position0);
        if ("zoom" in this.camera) this.camera.zoom = this.zoom0;
        this.camera.UpdateValues?.();

        this._state = State.NONE;
        this._dirty = true;
        this.InternalUpdate(true);
        this.EmitEvent(changeEvent, this);
    }

    get distance()
    {
        return vec3.distance(this.camera.translation, this.target);
    }

    get autoRotationAngle()
    {
        return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed;
    }

    get zoomScale()
    {
        return Math.pow(0.95, this.zoomSpeed);
    }

    Update()
    {
        if (this._dirty || this.enableDamping || this.autoRotate)
        {
            this.InternalUpdate(false);
        }
    }

    /**
     * The core orbit math
     * @param {boolean} forceEmit - emit change even if epsilon says "no"
     */
    InternalUpdate(forceEmit)
    {
        const g = CameraOrbitControls.global;
        const position = this.camera.GetTranslation(g.vec3_0);

        // offset = position - target
        vec3.subtract(this._offset, position, this.target);

        // spherical = from offset (phi, theta, radius)
        vec3.getSpherical(this._spherical, this._offset);

        // auto rotate only when idle
        if (this.autoRotate && this._state === State.NONE)
        {
            this._RotateLeft(this.autoRotationAngle);
        }

        // Apply deltas
        if (this.enableDamping)
        {
            this._spherical[0] += this._sphericalDelta[0] * this.dampingFactor; // phi
            this._spherical[1] += this._sphericalDelta[1] * this.dampingFactor; // theta
        }
        else
        {
            this._spherical[0] += this._sphericalDelta[0];
            this._spherical[1] += this._sphericalDelta[1];
        }

        // Clamp theta (azimuth)
        const twoPI = CameraOrbitControls.TWO_PI;
        let minTheta = this.minAzimuthAngle;
        let maxTheta = this.maxAzimuthAngle;

        if (isFinite(minTheta) && isFinite(maxTheta))
        {
            // Normalize into [-PI, PI] style range like three.js does
            if (minTheta < -Math.PI) minTheta += twoPI;
            else if (minTheta > Math.PI) minTheta -= twoPI;

            if (maxTheta < -Math.PI) maxTheta += twoPI;
            else if (maxTheta > Math.PI) maxTheta -= twoPI;

            if (minTheta <= maxTheta)
            {
                this._spherical[1] = Math.max(minTheta, Math.min(maxTheta, this._spherical[1]));
            }
            else
            {
                this._spherical[1] = this._spherical[1] > (minTheta + maxTheta) / 2
                    ? Math.max(minTheta, this._spherical[1])
                    : Math.min(maxTheta, this._spherical[1]);
            }
        }

        // Clamp phi (polar) then make safe (avoid poles -> flipping)
        this._spherical[0] = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical[0]));
        vec3.makeSphericalSafe(this._spherical, this._spherical);

        // Radius / dolly (perspective uses _scale)
        this._spherical[2] *= this._scale;
        this._spherical[2] = Math.max(this.minDistance, Math.min(this.maxDistance, this._spherical[2]));

        // Pan target
        if (this.enableDamping)
        {
            vec3.scaleAndAdd(this.target, this.target, this._panOffset, this.dampingFactor);
        }
        else
        {
            vec3.add(this.target, this.target, this._panOffset);
        }

        // Back to cartesian
        vec3.fromSpherical(this._offset, this._spherical);
        vec3.add(position, this.target, this._offset);

        // Apply
        this.camera.SetTranslation(position);
        this.camera.LookAt(this.target).UpdateValues();

        // Decay / clear
        if (this.enableDamping)
        {
            this._sphericalDelta[0] *= (1 - this.dampingFactor);
            this._sphericalDelta[1] *= (1 - this.dampingFactor);
            vec3.scale(this._panOffset, this._panOffset, (1 - this.dampingFactor));
        }
        else
        {
            vec3.set(this._sphericalDelta, 0, 0, 0);
            vec3.set(this._panOffset, 0, 0, 0);
        }

        this._scale = 1;

        // Change detection
        const q = this.camera.GetRotation(g.quat_0);
        const moved =
            this._zoomChanged ||
            vec3.squaredDistance(this._lastPosition, position) > num.EPSILON ||
            8 * (1 - quat.dot(this._lastQuaternion, q)) > num.EPSILON;

        if (forceEmit || moved)
        {
            this.EmitEvent(changeEvent, this);
            vec3.copy(this._lastPosition, position);
            quat.copy(this._lastQuaternion, q);
            this._zoomChanged = false;
            this._dirty = false;

            if (this.debug)
            {
                getOrbitDebugLog().push("update", {
                    state: this._state,
                    phi: +this._spherical[0].toFixed(6),
                    theta: +this._spherical[1].toFixed(6),
                    r: +this._spherical[2].toFixed(6),
                    tx: +this.target[0].toFixed(4),
                    ty: +this.target[1].toFixed(4),
                    tz: +this.target[2].toFixed(4),
                    px: +position[0].toFixed(4),
                    py: +position[1].toFixed(4),
                    pz: +position[2].toFixed(4)
                });
            }

            return true;
        }

        this._dirty = false;
        return false;
    }

    /* ============================== ROTATE ============================== */

    _RotateLeft(angle)
    {
        if (angle === 0) return;
        this._sphericalDelta[1] -= angle; // theta
        this._dirty = true;
    }

    _RotateUp(angle)
    {
        if (angle === 0) return;
        this._sphericalDelta[0] -= angle; // phi
        this._dirty = true;
    }

    /* =============================== PAN =============================== */

    _PanLeft(distance)
    {
        if (distance === 0) return;

        const g = CameraOrbitControls.global;
        const v = g.vec3_1;
        const m = g.mat4_0;

        this.camera.GetTransform(m);
        vec3.fromMat4Column(v, m, 0); // camera right
        vec3.scaleAndAdd(this._panOffset, this._panOffset, v, -distance);

        this._dirty = true;
    }

    _PanUp(distance)
    {
        if (distance === 0) return;

        const g = CameraOrbitControls.global;
        const v = g.vec3_1;
        const m = g.mat4_0;

        this.camera.GetTransform(m);

        if (this.screenSpacePanning)
        {
            vec3.fromMat4Column(v, m, 1); // camera up
        }
        else
        {
            // world-up based
            vec3.fromMat4Column(v, m, 0);
            vec3.cross(v, CameraOrbitControls.ObjectUp, v);
        }

        vec3.scaleAndAdd(this._panOffset, this._panOffset, v, distance);

        this._dirty = true;
    }

    /**
     * deltaX/deltaY in pixels (right/down positive)
     */
    _Pan(deltaX, deltaY)
    {
        if (!this.enablePan) return;

        if (this.camera.isPerspectiveCamera)
        {
            // Scale pan by distance + fov (classic orbit)
            const g = CameraOrbitControls.global;
            const offset = g.vec3_2;

            vec3.subtract(offset, this.camera.translation, this.target);
            let targetDistance = vec3.length(offset);

            // Convert to "screen height at distance"
            targetDistance *= Math.tan((this.camera.fov * Math.PI / 180) * 0.5);

            const h = (tw2 && tw2.height) ? tw2.height : (this.domElement.clientHeight || 1);

            this._PanLeft((2 * deltaX * targetDistance / h) * this.panSpeed);
            this._PanUp((2 * deltaY * targetDistance / h) * this.panSpeed);
        }
        else if (this.camera.isOrthographicCamera)
        {
            const w = (tw2 && tw2.width) ? tw2.width : (this.domElement.clientWidth || 1);
            const h = (tw2 && tw2.height) ? tw2.height : (this.domElement.clientHeight || 1);

            this._PanLeft((deltaX * (this.camera.right - this.camera.left) / this.camera.zoom / w) * this.panSpeed);
            this._PanUp((deltaY * (this.camera.bottom - this.camera.top) / this.camera.zoom / h) * this.panSpeed);
        }
        else
        {
            // Unknown camera type
            this.enablePan = false;
        }
    }

    /* =============================== DOLLY =============================== */

    _DollyOut(dollyScale)
    {
        if (dollyScale === 0) return;

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
            this.enableZoom = false;
        }

        this._dirty = true;
    }

    _DollyIn(dollyScale)
    {
        if (dollyScale === 0) return;

        if (this.camera.isPerspectiveCamera)
        {
            this._scale *= dollyScale;
        }
        else if (this.camera.isOrthographicCamera)
        {
            this.camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.camera.zoom / dollyScale));
            this.camera.UpdateValues();
            this._zoomChanged = true;
        }
        else
        {
            this.enableZoom = false;
        }

        this._dirty = true;
    }

    /* ============================ INPUT HANDLERS ============================ */

    _handleMouseDownRotate = e =>
    {
        vec2.set(this._rotateStart, e.clientX, e.clientY);
        this._dirty = true;
        if (this.debug) getOrbitDebugLog().push("md_rotate", { x: e.clientX, y: e.clientY });
    };

    _handleMouseDownDolly = e =>
    {
        vec2.set(this._dollyStart, e.clientX, e.clientY);
        this._dirty = true;
        if (this.debug) getOrbitDebugLog().push("md_dolly", { x: e.clientX, y: e.clientY });
    };

    _handleMouseDownPan = e =>
    {
        vec2.set(this._panStart, e.clientX, e.clientY);
        this._dirty = true;
        if (this.debug) getOrbitDebugLog().push("md_pan", { x: e.clientX, y: e.clientY });
    };

    _handleMouseMoveRotate = e =>
    {
        vec2.set(this._rotateEnd, e.clientX, e.clientY);
        vec2.subtract(this._rotateDelta, this._rotateEnd, this._rotateStart);

        const h = (tw2 && tw2.height) ? tw2.height : (this.domElement.clientHeight || 1);
        const rotX = (2 * Math.PI * this._rotateDelta[0] / h) * this.rotateSpeed;
        const rotY = (2 * Math.PI * this._rotateDelta[1] / h) * this.rotateSpeed;

        this._RotateLeft(rotX);
        this._RotateUp(rotY);

        vec2.copy(this._rotateStart, this._rotateEnd);

        if (!this.enableDamping) this.InternalUpdate(false);
        else this._dirty = true;

        if (this.debug) getOrbitDebugLog().push("mm_rotate", { dx: this._rotateDelta[0], dy: this._rotateDelta[1] });
    };

    _handleMouseMoveDolly = e =>
    {
        vec2.set(this._dollyEnd, e.clientX, e.clientY);
        vec2.subtract(this._dollyDelta, this._dollyEnd, this._dollyStart);

        if (this._dollyDelta[1] > 0) this._DollyOut(this.zoomScale);
        else if (this._dollyDelta[1] < 0) this._DollyIn(this.zoomScale);

        vec2.copy(this._dollyStart, this._dollyEnd);

        if (!this.enableDamping) this.InternalUpdate(false);
        else this._dirty = true;

        if (this.debug) getOrbitDebugLog().push("mm_dolly", { dy: this._dollyDelta[1] });
    };

    _handleMouseMovePan = e =>
    {
        vec2.set(this._panEnd, e.clientX, e.clientY);
        vec2.subtract(this._panDelta, this._panEnd, this._panStart);

        this._Pan(this._panDelta[0], this._panDelta[1]);

        vec2.copy(this._panStart, this._panEnd);

        if (!this.enableDamping) this.InternalUpdate(false);
        else this._dirty = true;

        if (this.debug) getOrbitDebugLog().push("mm_pan", { dx: this._panDelta[0], dy: this._panDelta[1] });
    };

    _handleMouseWheel = e =>
    {
        if (e.deltaY < 0) this._DollyIn(this.zoomScale);
        else if (e.deltaY > 0) this._DollyOut(this.zoomScale);
        else return;

        if (!this.enableDamping) this.InternalUpdate(false);
        else this._dirty = true;

        if (this.debug) getOrbitDebugLog().push("wheel", { dy: e.deltaY });
    };

    _handleKeyDown = e =>
    {
        let needsUpdate = false;

        switch (e.code)
        {
            case this.keys.UP:
                this._Pan(0, this.keyPanSpeed);
                needsUpdate = true;
                break;
            case this.keys.BOTTOM:
                this._Pan(0, -this.keyPanSpeed);
                needsUpdate = true;
                break;
            case this.keys.LEFT:
                this._Pan(this.keyPanSpeed, 0);
                needsUpdate = true;
                break;
            case this.keys.RIGHT:
                this._Pan(-this.keyPanSpeed, 0);
                needsUpdate = true;
                break;
        }

        if (needsUpdate)
        {
            e.preventDefault();
            this.InternalUpdate(false);
        }
    };

    /* ============================ POINTER TRACKING ============================ */

    _onPointerDown = e =>
    {
        if (!this.enabled) return;

        // capture this pointer
        try
        {
            this.domElement.setPointerCapture(e.pointerId);
            this._capturedPointers.add(e.pointerId);
        }
        catch 
        {
            //empty
        }

        // ensure listeners are attached while interacting
        this.domElement.addEventListener("pointermove", this._onPointerMove);
        this.domElement.addEventListener("pointerup", this._onPointerUp);
        this.domElement.addEventListener("pointercancel", this._onPointerCancel);

        this._AddPointer(e);

        if (e.pointerType === "touch") this._onTouchStart(e);
        else this._onMouseDown(e);

        if (this._state !== State.NONE) this.EmitEvent(startEvent, this);

        if (this.debug) getOrbitDebugLog().push("pd", { id: e.pointerId, type: e.pointerType, btn: e.button });
    };

    _onPointerMove = e =>
    {
        if (!this.enabled) return;

        this._TrackPointer(e);

        if (e.pointerType === "touch") this._onTouchMove(e);
        else this._onMouseMove(e);
    };

    _onPointerUp = e =>
    {
        this._RemovePointer(e);
        this._releasePointer(e.pointerId);

        if (this._pointers.length === 0)
        {
            this._cleanupPointerTracking();
            this.EmitEvent(endEvent, this);
        }

        if (this.debug) getOrbitDebugLog().push("pu", { id: e.pointerId });
    };

    _onPointerCancel = e =>
    {
        this._RemovePointer(e);
        this._releasePointer(e.pointerId);

        if (this._pointers.length === 0)
        {
            this._cleanupPointerTracking();
            this.EmitEvent(endEvent, this);
        }

        if (this.debug) getOrbitDebugLog().push("pc", { id: e.pointerId });
    };

    _cleanupPointerTracking = () =>
    {
        for (const id of this._capturedPointers)
        {
            try { this.domElement.releasePointerCapture(id); }
            catch 
            {
                //empty
            }
        }
        this._capturedPointers.clear();

        this.domElement.removeEventListener("pointermove", this._onPointerMove);
        this.domElement.removeEventListener("pointerup", this._onPointerUp);
        this.domElement.removeEventListener("pointercancel", this._onPointerCancel);

        this._pointers.length = 0;
        this._pointerPositions = {};
        this._state = State.NONE;
    };

    _releasePointer = id =>
    {
        if (this._capturedPointers.has(id))
        {
            try { this.domElement.releasePointerCapture(id); }
            catch 
            {
                // empty
            }
            this._capturedPointers.delete(id);
        }
    };

    _AddPointer = e =>
    {
        if (this._pointers.indexOf(e.pointerId) === -1) this._pointers.push(e.pointerId);
        this._TrackPointer(e);
        this._dirty = true;
    };

    _RemovePointer = e =>
    {
        delete this._pointerPositions[e.pointerId];

        const i = this._pointers.indexOf(e.pointerId);
        if (i !== -1) this._pointers.splice(i, 1);

        this._dirty = true;
    };

    _TrackPointer = e =>
    {
        let p = this._pointerPositions[e.pointerId];
        if (!p) p = this._pointerPositions[e.pointerId] = vec2.create();
        vec2.set(p, e.pageX, e.pageY);
        this._dirty = true;
    };

    _GetSecondPointerPosition = e =>
    {
        const a = this._pointers[0];
        const b = this._pointers[1];
        const otherId = (e.pointerId === a) ? b : a;
        return this._pointerPositions[otherId];
    };

    /* ============================ MOUSE / TOUCH ROUTING ============================ */

    _onMouseDown = e =>
    {
        if (!this.enabled) return;

        let mouseAction;
        switch (e.button)
        {
            case 0: mouseAction = this.mouseButtons.LEFT; break;
            case 1: mouseAction = this.mouseButtons.MIDDLE; break;
            case 2: mouseAction = this.mouseButtons.RIGHT; break;
            default: mouseAction = -1;
        }

        switch (mouseAction)
        {
            case Mouse.DOLLY:
                if (!this.enableZoom) { this._state = State.NONE; return; }
                this._handleMouseDownDolly(e);
                this._state = State.DOLLY;
                break;

            case Mouse.ROTATE:
                if (e.ctrlKey || e.metaKey || e.shiftKey)
                {
                    if (!this.enablePan) { this._state = State.NONE; return; }
                    this._handleMouseDownPan(e);
                    this._state = State.PAN;
                }
                else
                {
                    if (!this.enableRotate) { this._state = State.NONE; return; }
                    this._handleMouseDownRotate(e);
                    this._state = State.ROTATE;
                }
                break;

            case Mouse.PAN:
                if (e.ctrlKey || e.metaKey || e.shiftKey)
                {
                    if (!this.enableRotate) { this._state = State.NONE; return; }
                    this._handleMouseDownRotate(e);
                    this._state = State.ROTATE;
                }
                else
                {
                    if (!this.enablePan) { this._state = State.NONE; return; }
                    this._handleMouseDownPan(e);
                    this._state = State.PAN;
                }
                break;

            default:
                this._state = State.NONE;
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
        // already tracked by pointerdown
        switch (this._pointers.length)
        {
            case 1:
                if (this.touches.ONE === Touch.ROTATE)
                {
                    if (!this.enableRotate) { this._state = State.NONE; return; }
                    this._handleTouchStartRotate();
                    this._state = State.TOUCH_ROTATE;
                }
                else if (this.touches.ONE === Touch.PAN)
                {
                    if (!this.enablePan) { this._state = State.NONE; return; }
                    this._handleTouchStartPan();
                    this._state = State.TOUCH_PAN;
                }
                else
                {
                    this._state = State.NONE;
                }
                break;

            case 2:
                if (this.touches.TWO === Touch.DOLLY_PAN)
                {
                    if (!this.enableZoom && !this.enablePan) { this._state = State.NONE; return; }
                    this._handleTouchStartDollyPan();
                    this._state = State.TOUCH_DOLLY_PAN;
                }
                else if (this.touches.TWO === Touch.DOLLY_ROTATE)
                {
                    if (!this.enableZoom && !this.enableRotate) { this._state = State.NONE; return; }
                    this._handleTouchStartDollyRotate();
                    this._state = State.TOUCH_DOLLY_ROTATE;
                }
                else
                {
                    this._state = State.NONE;
                }
                break;

            default:
                this._state = State.NONE;
        }

        if (this.debug) getOrbitDebugLog().push("ts", { n: this._pointers.length, state: this._state });
    };

    _onTouchMove = e =>
    {
        // already tracked by pointermove
        switch (this._state)
        {
            case State.TOUCH_ROTATE:
                if (!this.enableRotate) return;
                this._handleTouchMoveRotate(e);
                this.InternalUpdate(false);
                break;

            case State.TOUCH_PAN:
                if (!this.enablePan) return;
                this._handleTouchMovePan(e);
                this.InternalUpdate(false);
                break;

            case State.TOUCH_DOLLY_PAN:
                if (!this.enableZoom && !this.enablePan) return;
                this._handleTouchMoveDollyPan(e);
                this.InternalUpdate(false);
                break;

            case State.TOUCH_DOLLY_ROTATE:
                if (!this.enableZoom && !this.enableRotate) return;
                this._handleTouchMoveDollyRotate(e);
                this.InternalUpdate(false);
                break;
        }
    };

    _onContextMenu = e =>
    {
        if (!this.enabled) return;
        e.preventDefault();
    };

    /* ============================ TOUCH MATH ============================ */

    _handleTouchStartRotate = () =>
    {
        const p0 = this._pointerPositions[this._pointers[0]];
        vec2.set(this._rotateStart, p0[0], p0[1]);
        this._dirty = true;
    };

    _handleTouchStartPan = () =>
    {
        const p0 = this._pointerPositions[this._pointers[0]];
        vec2.set(this._panStart, p0[0], p0[1]);
        this._dirty = true;
    };

    _handleTouchStartDolly = () =>
    {
        const p0 = this._pointerPositions[this._pointers[0]];
        const p1 = this._pointerPositions[this._pointers[1]];
        const dx = p0[0] - p1[0];
        const dy = p0[1] - p1[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        vec2.set(this._dollyStart, 0, dist);
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
        if (this.enableRotate) this._handleTouchStartRotate();
    };

    _handleTouchMoveRotate = e =>
    {
        const p0 = this._pointerPositions[e.pointerId];
        let x = p0[0];
        let y = p0[1];

        if (this._pointers.length !== 1)
        {
            const p = this._GetSecondPointerPosition(e);
            x = 0.5 * (x + p[0]);
            y = 0.5 * (y + p[1]);
        }

        vec2.set(this._rotateEnd, x, y);
        vec2.subtract(this._rotateDelta, this._rotateEnd, this._rotateStart);
        vec2.scale(this._rotateDelta, this._rotateDelta, this.rotateSpeed);

        const h = this.domElement.clientHeight || 1;
        this._RotateLeft(2 * Math.PI * this._rotateDelta[0] / h);
        this._RotateUp(2 * Math.PI * this._rotateDelta[1] / h);

        vec2.copy(this._rotateStart, this._rotateEnd);
        this._dirty = true;
    };

    _handleTouchMovePan = e =>
    {
        const p0 = this._pointerPositions[e.pointerId];
        let x = p0[0];
        let y = p0[1];

        if (this._pointers.length !== 1)
        {
            const p = this._GetSecondPointerPosition(e);
            x = 0.5 * (x + p[0]);
            y = 0.5 * (y + p[1]);
        }

        vec2.set(this._panEnd, x, y);
        vec2.subtract(this._panDelta, this._panEnd, this._panStart);
        vec2.scale(this._panDelta, this._panDelta, this.panSpeed);

        this._Pan(this._panDelta[0], this._panDelta[1]);

        vec2.copy(this._panStart, this._panEnd);
        this._dirty = true;
    };

    _handleTouchMoveDolly = e =>
    {
        const p0 = this._pointerPositions[e.pointerId];
        const p1 = this._GetSecondPointerPosition(e);

        const dx = p0[0] - p1[0];
        const dy = p0[1] - p1[1];
        const dist = Math.sqrt(dx * dx + dy * dy);

        vec2.set(this._dollyEnd, 0, dist);

        // scale factor between frames
        const s = Math.pow(this._dollyEnd[1] / this._dollyStart[1], this.zoomSpeed);

        this._DollyOut(s);
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
}
