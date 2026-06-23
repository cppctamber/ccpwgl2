import { device } from "global";
import { vec3, mat4 } from "math";
import { meta } from "utils";
export class OrbitCameraController
{
    enabled = true;

    invertX = false;
    invertY = false;

    orbitSensitivity = 1;
    panSensitivity   = 5;
    zoomSensitivity  = 1000;

    extraResponsiveness = 0.35;

    constructor(camera, canvas, opts = {})
    {
        this.camera = camera;
        this.canvas = canvas;

        const { attachEvents = true, ...rest } = opts;
        Object.assign(this, rest);

        this.dragging = false;
        this.button = 0;
        this.lastX = 0;
        this.lastY = 0;

        if (attachEvents && canvas)
        {
            canvas.addEventListener("mousedown", e => this.onDown(e));
            window.addEventListener("mousemove", e => this.onMove(e));
            window.addEventListener("mouseup",   () => this.onUp());
            canvas.addEventListener("wheel",     e => this.onWheel(e), { passive:false });
            canvas.addEventListener("contextmenu", e => e.preventDefault());
        }
    }

    // Router-facing aliases (clearer intent)
    handleDown(e)  { return this.onDown(e); }
    handleMove(e)  { return this.onMove(e); }
    handleUp(e)    { return this.onUp(e); }
    handleWheel(e) { return this.onWheel(e); }

    onDown(e)
    {
        if (!this.enabled) return;

        this.dragging = true;
        this.button = e.button;
        this.lastX = e.clientX;
        this.lastY = e.clientY;

        if (this.camera && typeof this.camera.damping === "number")
        {
            const d = this.camera.damping;
            const target = Math.max(0.25, Math.min(0.95, d - this.extraResponsiveness));
            this.camera.damping = target;
        }
    }

    onUp()
    {
        if (!this.enabled) return;
        this.dragging = false;
    }

    onMove(e)
    {
        if (!this.enabled) return;
        if (!this.dragging) return;

        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;

        if (this.button === 0 && !e.altKey && this.camera.allowOrbit)
        {
            const sx = (this.invertX ? -1 : 1);
            const sy = (this.invertY ? -1 : 1);

            this.camera.yawVel   += sx * dx * this.orbitSensitivity;
            this.camera.pitchVel += sy * dy * this.orbitSensitivity;
            return;
        }

        if (this.button === 2 || (this.button === 0 && e.altKey))
        {
            this.camera.PanPixels(dx * this.panSensitivity, dy * this.panSensitivity);
        }
    }

    onWheel(e)
    {
        if (!this.enabled) return;
        e.preventDefault();

        const delta = Math.sign(e.deltaY);

        if (e.shiftKey && typeof this.camera.fov === "number")
        {
            const minFov = this.camera.minFov ?? 2;
            const maxFov = this.camera.maxFov ?? 180;
            this.camera.fov = Math.max(minFov, Math.min(maxFov, this.camera.fov + delta * 5));
            return;
        }

        const step = this.camera.GetZoomScale() * this.zoomSensitivity;
        this.camera.zoomVel += delta * step;
    }
}


/* ============================================================================
 * Base Orbit Camera (shared math & helpers)
 * ============================================================================
 */

class BaseOrbitCamera extends meta.Model
{
    @meta.vector3 poi = vec3.create();

    @meta.float rotationX = 0; // yaw
    @meta.float rotationY = 0; // pitch

    yawVel   = 0;
    pitchVel = 0;
    zoomVel  = 0;
    panVel   = vec3.create();

    damping = 0.88;

    allowOrbit = true;

    _view   = mat4.create();
    _world  = mat4.create();
    _aspect = 1;

    GetView(out)      { return mat4.copy(out, this._view); }
    GetWorldMatrix() { return this._world; }

    GetWorldPosition(out = vec3.create())
    {
        return mat4.getTranslation(out, this._world);
    }

    GetWorldDirection(out = vec3.create())
    {
        out[0] = -this._view[8];
        out[1] = -this._view[9];
        out[2] = -this._view[10];
        return vec3.normalize(out, out);
    }

    ClampPitch()
    {
        const limit = Math.PI * 0.499;
        this.rotationY = Math.max(-limit, Math.min(limit, this.rotationY));
    }

    ApplyInertia(dt)
    {
        this.rotationX += this.yawVel   * dt;
        this.rotationY += this.pitchVel * dt;

        this.yawVel   *= this.damping;
        this.pitchVel *= this.damping;
        this.zoomVel  *= this.damping;
        vec3.scale(this.panVel, this.panVel, this.damping);

        this.ClampPitch();
    }

    ApplyPan()
    {
        vec3.add(this.poi, this.poi, this.panVel);
    }

    /* ---------------------------
     * Focus helpers
     * --------------------------- */

    FocusObject(obj, multiplier = 1)
    {
        const center = vec3.create();
        let radius = 1;

        if (obj.wrapped?.boundingSphereCenter && obj.wrapped?.boundingSphereRadius)
        {
            vec3.copy(center, obj.wrapped.boundingSphereCenter);
            radius = obj.wrapped.boundingSphereRadius;
        }
        else if (obj.GetWidth && obj.GetHeight)
        {
            radius = Math.max(obj.GetWidth(), obj.GetHeight()) * 0.5;
            obj.wrapped?.GetTranslation?.(center);
        }
        else if (obj.wrapped?.GetTranslation)
        {
            obj.wrapped.GetTranslation(center);
        }

        vec3.copy(this.poi, center);
        this.SetFitDistance(radius * multiplier);
        return this;
    }

    FocusRect(width, height, center, multiplier = 1)
    {
        vec3.copy(this.poi, center);
        this.SetFitRect(width, height, multiplier);
        return this;
    }
}

/* ============================================================================
 * Perspective Orbit Camera
 * ============================================================================
 */

@meta.type("WrappedTestOrbitCamera")
export class WrappedTestOrbitCamera extends BaseOrbitCamera
{
    @meta.float distance = 10;
    @meta.float minDistance = 0.1;
    @meta.float maxDistance = 1e9;

    @meta.float fov = 50;
    @meta.float nearPlane = 1;
    @meta.float farPlane  = 0; // auto

    GetNearPlane() { return this.nearPlane; }

    GetFarPlane()
    {
        if (this.farPlane > 0) return this.farPlane;
        return Math.max(this.distance * 4, this.nearPlane + 1);
    }

    GetProjection(out, aspect)
    {
        this._aspect = aspect;
        const f = Math.tan((this.fov * Math.PI) / 360) * this.nearPlane;
        const w = f * aspect;

        return mat4.frustum(out, -w, w, -f, f, this.nearPlane, this.GetFarPlane());
    }

    GetZoomScale()
    {
        return this.distance * 0.1;
    }

    PanPixels(dx, dy, viewport)
    {
        // viewport can be:
        // - { viewportHeight, viewportWidth }
        // - { h, w }
        // - [x, y, w, h]
        // - undefined (fallbacks to canvas size)
        let viewportH = 0, viewportW = 0;

        if (viewport)
        {
            if (Array.isArray(viewport))
            {
                viewportW = viewport[2] || 0;
                viewportH = viewport[3] || 0;
            }
            else
            {
                viewportH = viewport.viewportHeight ?? viewport.h ?? 0;
                viewportW = viewport.viewportWidth ?? viewport.w ?? 0;
            }
        }

        // IMPORTANT: never use device.viewportHeight (changes per scissor)
        if (!viewportH || viewportH <= 0)
        {
            viewportH = (this.controller?.canvas?.height) || device.canvas?.height || 1;
        }
        if (!viewportW || viewportW <= 0)
        {
            viewportW = (this.controller?.canvas?.width) || device.canvas?.width || 1;
        }

        // Convert pixels to world units at the POI depth (distance)
        const fovY = this.fov * Math.PI / 180;
        const unitsPerPixel = (2 * this.distance * Math.tan(fovY * 0.5)) / Math.max(1, viewportH);

        const panX = -dx * unitsPerPixel;
        const panY =  dy * unitsPerPixel;

        // Camera basis from world matrix (camera->world)
        const w = this._world;

        const right = vec3.alloc();
        const up    = vec3.alloc();

        right[0] = w[0]; right[1] = w[1]; right[2] = w[2];   // camera +X in world
        up[0]    = w[4]; up[1]    = w[5]; up[2]    = w[6];   // camera +Y in world

        vec3.normalize(right, right);
        vec3.normalize(up, up);

        vec3.scaleAndAdd(this.panVel, this.panVel, right, panX);
        vec3.scaleAndAdd(this.panVel, this.panVel, up,    panY);

        vec3.unalloc(right);
        vec3.unalloc(up);
    }

    SetFitDistance(radius)
    {
        const vFov = (this.fov * Math.PI) / 180;
        this.distance = Math.max(this.minDistance, radius / Math.tan(vFov * 0.5));
    }

    SetFitRect(width, height, multiplier)
    {
        const aspect = this._aspect || 1;
        const vFov = (this.fov * Math.PI) / 180;
        const hFov = 2 * Math.atan(Math.tan(vFov * 0.5) * aspect);

        const distV = (height * 0.5) / Math.tan(vFov * 0.5);
        const distH = (width  * 0.5) / Math.tan(hFov * 0.5);

        this.distance = Math.max(distV, distH) * multiplier;
    }

    Update(dt)
    {
        this.ApplyInertia(dt);
        this.distance += this.zoomVel * dt;
        this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
        this.ApplyPan();

        mat4.identity(this._view);
        mat4.translate(this._view, this._view, [ 0, 0, -this.distance ]);
        mat4.rotateX(this._view, this._view, this.rotationY);
        mat4.rotateY(this._view, this._view, this.rotationX);
        mat4.translate(this._view, this._view, vec3.negate(vec3.create(), this.poi));
        mat4.invert(this._world, this._view);
    }

    static async fetch(options = {})
    {
        // options can be a canvas element or { canvas, ...values }
        if (!meta.isPlain?.(options) && typeof options === "object" && options instanceof HTMLCanvasElement)
        {
            options = { canvas: options };
        }

        let { canvas = null, controller = true, ...values } = options;

        if (typeof canvas === "string") canvas = document.getElementById(canvas);

        const cam = new this();

        // Apply any provided values (meta.Model usually supports SetValues)
        if (typeof cam.SetValues === "function") cam.SetValues(values);
        else Object.assign(cam, values);

        // Attach controller (matches old behavior)
        if (controller && canvas)
        {
            cam.controller = new OrbitCameraController(cam, canvas);
        }

        return cam;
    }

    static isCamera = true;
}

/* ============================================================================
 * Orthographic Orbit Camera
 * ============================================================================
 */

@meta.type("WrappedTestOrthoOrbitCamera")
export class WrappedTestOrthoOrbitCamera extends BaseOrbitCamera
{
    @meta.float orthoHeight = 10;
    @meta.float minOrthoHeight = 0.01;
    @meta.float maxOrthoHeight = 1e9;

    @meta.float nearPlane = -1e9;
    @meta.float farPlane  =  1e9;

    // CAD-style orientation (explicit)
    @meta.vector3 direction = vec3.fromValues(0, 0, -1);  // forward (from eye towards poi)
    @meta.vector3 up        = vec3.fromValues(0, 1,  0);  // screen up

    _right = vec3.create();
    _tmp0  = vec3.create();
    _tmp1  = vec3.create();
    _tmpM  = mat4.create();

    GetNearPlane() { return this.nearPlane; }
    GetFarPlane()  { return this.farPlane; }

    GetProjection(out, aspect)
    {
        this._aspect = aspect;

        const h = this.orthoHeight * 0.5;
        const w = h * aspect;

        return mat4.ortho(out, -w, w, -h, h, this.nearPlane, this.farPlane);
    }

    GetZoomScale()
    {
        return this.orthoHeight * 0.1;
    }

    /**
     * CAD panning: pan in view plane using camera right/up.
     * NOTE: This uses device.viewportHeight (global), which is "good enough".
     * If you want per-subview pixel scaling, we can add viewportHeight override.
     */
    PanPixels(dx, dy, viewport)
    {
        let viewportH = 0, viewportW = 0;

        if (viewport)
        {
            if (Array.isArray(viewport))
            {
                viewportW = viewport[2] || 0;
                viewportH = viewport[3] || 0;
            }
            else
            {
                viewportH = viewport.viewportHeight ?? viewport.h ?? 0;
                viewportW = viewport.viewportWidth ?? viewport.w ?? 0;
            }
        }

        // IMPORTANT: never use device.viewportHeight (changes per scissor)
        if (!viewportH || viewportH <= 0)
        {
            viewportH = (this.controller?.canvas?.height) || device.canvas?.height || 1;
        }
        if (!viewportW || viewportW <= 0)
        {
            viewportW = (this.controller?.canvas?.width) || device.canvas?.width || 1;
        }

        // In your ortho projection:
        // h = orthoHeight * 0.5; visible world height = orthoHeight
        const unitsPerPixel = this.orthoHeight / Math.max(1, viewportH);

        const panX = -dx * unitsPerPixel;
        const panY =  dy * unitsPerPixel;

        const w = this._world;

        const right = vec3.alloc();
        const up    = vec3.alloc();

        right[0] = w[0]; right[1] = w[1]; right[2] = w[2];
        up[0]    = w[4]; up[1]    = w[5]; up[2]    = w[6];

        vec3.normalize(right, right);
        vec3.normalize(up, up);

        vec3.scaleAndAdd(this.panVel, this.panVel, right, panX);
        vec3.scaleAndAdd(this.panVel, this.panVel, up,    panY);

        vec3.unalloc(right);
        vec3.unalloc(up);
    }

    SetFitDistance(radius)
    {
        this.orthoHeight = radius * 2;
    }

    SetFitRect(width, height, multiplier = 1)
    {
        this.orthoHeight = height * multiplier;
    }

    /**
     * Rotates a vector around an axis by angle (radians)
     */
    _rotateVecAroundAxis(out, v, axis, angle)
    {
        // Rodrigues' rotation formula
        // out = v*cos + (axis x v)*sin + axis*(axis·v)*(1-cos)
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        const ax = axis[0], ay = axis[1], az = axis[2];
        const vx = v[0], vy = v[1], vz = v[2];

        const dot = ax * vx + ay * vy + az * vz;

        const cx = ay * vz - az * vy;
        const cy = az * vx - ax * vz;
        const cz = ax * vy - ay * vx;

        out[0] = vx * c + cx * s + ax * dot * (1 - c);
        out[1] = vy * c + cy * s + ay * dot * (1 - c);
        out[2] = vz * c + cz * s + az * dot * (1 - c);

        return out;
    }

    /**
     * Orthonormalizes direction/up (CAD stability)
     */
    _orthonormalize()
    {
        vec3.normalize(this.direction, this.direction);

        // right = normalize(direction x up)
        vec3.cross(this._right, this.direction, this.up);
        const rl = vec3.length(this._right);

        // If direction || up, pick a safe up and try again
        if (rl < 1e-6)
        {
            // choose an arbitrary up that isn't parallel
            if (Math.abs(this.direction[1]) < 0.9) vec3.set(this.up, 0, 1, 0);
            else vec3.set(this.up, 0, 0, 1);

            vec3.cross(this._right, this.direction, this.up);
            vec3.normalize(this._right, this._right);
        }
        else
        {
            vec3.scale(this._right, this._right, 1 / rl);
        }

        // up = right x direction
        vec3.cross(this.up, this._right, this.direction);
        vec3.normalize(this.up, this.up);
    }

    /**
     * CAD orbit update:
     * - Uses yawVel/pitchVel to rotate direction about stable axes
     * - Keeps explicit up stable for Top/Bottom etc.
     * - Uses zoomVel + panVel like before
     */
    Update(dt)
    {
        // Apply zoom + pan inertia (keep the same feel as BaseOrbitCamera)
        this.zoomVel *= this.damping;
        vec3.scale(this.panVel, this.panVel, this.damping);

        // Convert current velocities into angular deltas for this frame
        const yawDelta   = this.yawVel   * dt;
        const pitchDelta = this.pitchVel * dt;

        // Dampen the angular velocities
        this.yawVel   *= this.damping;
        this.pitchVel *= this.damping;

        // Clamp pitch delta to avoid flipping
        const limit = Math.PI * 0.499;
        const clampedPitch = Math.max(-limit, Math.min(limit, pitchDelta));

        // Orthonormalize basis before rotating
        this._orthonormalize();

        // Yaw: rotate direction around the camera's current "up"
        if (yawDelta !== 0)
        {
            this._rotateVecAroundAxis(this.direction, this.direction, this.up, yawDelta);
            this._orthonormalize();
        }

        // Pitch: rotate direction around the camera's "right"
        if (clampedPitch !== 0)
        {
            this._rotateVecAroundAxis(this.direction, this.direction, this._right, clampedPitch);
            this._orthonormalize();
        }

        // Zoom
        this.orthoHeight += (this.zoomVel * dt);
        this.orthoHeight = Math.max(this.minOrthoHeight, Math.min(this.maxOrthoHeight, this.orthoHeight));

        // Pan
        this.ApplyPan();

        // Build view via lookAt (CAD stable up)
        const eye = this._tmp0;
        vec3.scaleAndAdd(eye, this.poi, this.direction, -1000); // big offset; ortho doesn't care about distance

        mat4.lookAt(this._view, eye, this.poi, this.up);
        mat4.invert(this._world, this._view);
    }

    /* ============================================================
     * CAD View helpers / presets (stable up per view)
     * direction points from poi towards eye? (we use eye = poi - direction*1000)
     * With lookAt(eye, poi), direction should be (poi->eye) inverted.
     * Here we define direction as "forward toward scene": eye = poi - direction*k.
     * ============================================================ */

    SetView(dir, up)
    {
        vec3.normalize(this.direction, dir);
        vec3.normalize(this.up, up);
        this._orthonormalize();

        // Stop residual orbit motion
        this.yawVel = 0;
        this.pitchVel = 0;
        return this;
    }

    Front()  { return this.SetView([ 0, 0, -1 ], [ 0, 1,  0 ]); }
    Back()   { return this.SetView([ 0, 0,  1 ], [ 0, 1,  0 ]); }
    Left()   { return this.SetView([ 1, 0,  0 ], [ 0, 1,  0 ]); }
    Right()  { return this.SetView([ -1, 0, 0 ], [ 0, 1,  0 ]); }

    // CAD Top/Bottom: screen-up is +/-Z
    Top()    { return this.SetView([ 0, -1, 0 ], [ 0, 0, -1 ]); }
    Bottom() { return this.SetView([ 0,  1, 0 ], [ 0, 0,  1 ]); }

    // Optional: isometric-ish (stable up = world Y)
    IsoNE()
    {
        // dir normalized([ -1, -1, -1 ]) points "down" toward origin from +XYZ
        return this.SetView([ -1, -1, -1 ], [ 0, 1, 0 ]);
    }

    IsoNW()
    {
        return this.SetView([ 1, -1, -1 ], [ 0, 1, 0 ]);
    }

    IsoSE()
    {
        return this.SetView([ -1, -1, 1 ], [ 0, 1, 0 ]);
    }

    IsoSW()
    {
        return this.SetView([ 1, -1, 1 ], [ 0, 1, 0 ]);
    }

    static async fetch(options = {})
    {
        let { canvas = null, controller = true, ...values } = options;
        if (typeof canvas === "string") canvas = document.getElementById(canvas);

        const cam = new this();
        if (typeof cam.SetValues === "function") cam.SetValues(values);
        else Object.assign(cam, values);

        if (controller && canvas)
        {
            cam.controller = new OrbitCameraController(cam, canvas);
        }

        return cam;
    }

    static isCamera = true;
}

@meta.type("_WrappedTestOrthoOrbitCamera")
export class _WrappedTestOrthoOrbitCamera extends BaseOrbitCamera
{
    @meta.float orthoHeight = 10;
    @meta.float minOrthoHeight = 0.01;
    @meta.float maxOrthoHeight = 1e9;

    @meta.float nearPlane = -1e9;
    @meta.float farPlane  =  1e9;

    GetNearPlane() { return this.nearPlane; }
    GetFarPlane()  { return this.farPlane; }

    GetProjection(out, aspect)
    {
        this._aspect = aspect;
        const h = this.orthoHeight * 0.5;
        const w = h * aspect;

        return mat4.ortho(out, -w, w, -h, h, this.nearPlane, this.farPlane);
    }

    GetZoomScale()
    {
        return this.orthoHeight * 0.1;
    }

    PanPixels(dx, dy)
    {
        const unitsPerPixel = this.orthoHeight / device.viewportHeight;

        const panX = -dx * unitsPerPixel;
        const panY =  dy * unitsPerPixel;

        const right = vec3.fromValues(Math.cos(this.rotationX), 0, -Math.sin(this.rotationX));
        const up    = vec3.fromValues(0, 1, 0);

        vec3.scaleAndAdd(this.panVel, this.panVel, right, panX);
        vec3.scaleAndAdd(this.panVel, this.panVel, up,    panY);
    }

    SetFitDistance(radius)
    {
        this.orthoHeight = radius * 2;
    }

    SetFitRect(width, height, multiplier)
    {
        this.orthoHeight = height * multiplier;
    }

    Update(dt)
    {
        this.ApplyInertia(dt);
        this.orthoHeight += this.zoomVel * dt;
        this.orthoHeight = Math.max(this.minOrthoHeight, Math.min(this.maxOrthoHeight, this.orthoHeight));
        this.ApplyPan();

        mat4.identity(this._view);
        mat4.rotateX(this._view, this._view, this.rotationY);
        mat4.rotateY(this._view, this._view, this.rotationX);
        mat4.translate(this._view, this._view, vec3.negate(vec3.create(), this.poi));
        mat4.invert(this._world, this._view);
    }

    /* ============================================================
 * View helpers / presets
 * rotationX = yaw   (around Y axis)
 * rotationY = pitch (around X axis)
 * ClampPitch() already prevents exact +/-90 (good)
 * ============================================================ */

    SetView(yaw, pitch = 0)
    {
        this.rotationX = yaw;
        this.rotationY = pitch;
        this.ClampPitch();
        this.yawVel = 0;
        this.pitchVel = 0;
        return this;
    }

    Front()  { return this.SetView(0, 0); }
    Back()   { return this.SetView(Math.PI, 0); }
    Left()   { return this.SetView(-Math.PI * 0.5, 0); }
    Right()  { return this.SetView(Math.PI * 0.5, 0); }

    // "Top" means looking down onto the scene
    // With your math: +pitch rotates camera down (so top view is +90 pitch)
    Top()    { return this.SetView(0,  Math.PI * 0.5); }
    Bottom() { return this.SetView(0, -Math.PI * 0.5); }

    // Common isometric-ish helpers (optional but handy)
    IsoNE(pitchDeg = 35.264, yawDeg = 45)
    {
        const p = (pitchDeg * Math.PI) / 180;
        const y = (yawDeg   * Math.PI) / 180;
        return this.SetView(y, p);
    }

    IsoNW(pitchDeg = 35.264, yawDeg = -45)
    {
        const p = (pitchDeg * Math.PI) / 180;
        const y = (yawDeg   * Math.PI) / 180;
        return this.SetView(y, p);
    }

    IsoSE(pitchDeg = 35.264, yawDeg = 135)
    {
        const p = (pitchDeg * Math.PI) / 180;
        const y = (yawDeg   * Math.PI) / 180;
        return this.SetView(y, p);
    }

    IsoSW(pitchDeg = 35.264, yawDeg = -135)
    {
        const p = (pitchDeg * Math.PI) / 180;
        const y = (yawDeg   * Math.PI) / 180;
        return this.SetView(y, p);
    }

    static isCamera = true;
}

@meta.type("WrappedShadowCameraDirectional")
export class WrappedShadowCameraDirectional extends WrappedTestOrthoOrbitCamera
{
    constructor()
    {
        super();
        this.allowOrbit = false;
        this.rotationY = -Math.PI * 0.5;
    }

    FitToBounds(center, radius)
    {
        vec3.copy(this.poi, center);
        this.orthoHeight = radius * 2;
    }
}

@meta.type("WrappedShadowCameraSpot")
export class WrappedShadowCameraSpot extends WrappedTestOrbitCamera
{
    constructor()
    {
        super();
        this.allowOrbit = false;

        this.fov = 45;
        this.nearPlane = 0.1;
        this.farPlane = 1000;
    }

    /**
     * Align shadow camera to a spotlight
     * @param {vec3} position
     * @param {vec3} direction (normalized)
     * @param {number} angleDeg
     * @param {number} range
     */
    SetFromSpotLight(position, direction, angleDeg, range)
    {
        vec3.copy(this.poi, position);

        // Look down the light direction
        this.rotationY = Math.asin(-direction[1]);
        this.rotationX = Math.atan2(direction[0], direction[2]);

        this.fov = angleDeg * 2;
        this.distance = 0;
        this.nearPlane = 0.1;
        this.farPlane = range;
    }
}

const CUBE_FACES = [
    { dir:[ 1, 0, 0 ], up:[ 0,-1, 0 ] }, // +X
    { dir:[ -1, 0, 0 ], up:[ 0,-1, 0 ] }, // -X
    { dir:[ 0, 1, 0 ], up:[ 0, 0, 1 ] }, // +Y
    { dir:[ 0,-1, 0 ], up:[ 0, 0,-1 ] }, // -Y
    { dir:[ 0, 0, 1 ], up:[ 0,-1, 0 ] }, // +Z
    { dir:[ 0, 0,-1 ], up:[ 0,-1, 0 ] }, // -Z
];

@meta.type("WrappedShadowCameraPoint")
export class WrappedShadowCameraPoint
{
    constructor()
    {
        this.cameras = [];

        for (let i = 0; i < 6; i++)
        {
            const cam = new WrappedTestOrbitCamera();
            cam.allowOrbit = false;
            cam.fov = 90;
            cam.nearPlane = 0.1;
            cam.farPlane = 1000;
            this.cameras.push(cam);
        }
    }

    /**
     * Position all 6 cameras
     * @param {vec3} position
     * @param {number} range
     */
    SetFromPointLight(position, range)
    {
        for (let i = 0; i < 6; i++)
        {
            const cam = this.cameras[i];
            vec3.copy(cam.poi, position);
            cam.distance = 0;
            cam.farPlane = range;

            const f = CUBE_FACES[i];
            cam.rotationY = Math.asin(-f.dir[1]);
            cam.rotationX = Math.atan2(f.dir[0], f.dir[2]);
        }
    }
}


/**
 * switch (light.type)
 * {
 *     case "directional":
 *         renderShadow(light.shadowCamera);
 *         break;
 *
 *     case "spot":
 *         renderShadow(light.shadowCamera);
 *         break;
 *
 *     case "point":
 *         for (const cam of light.shadowCamera.cameras)
 *             renderShadow(cam);
 *         break;
 * }
 */



