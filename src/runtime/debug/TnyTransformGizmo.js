import { WglTransform } from "core";
import { EveCurveLineSet } from "eve/item";
import { device, tw2 } from "global";
import { mat4, quat, ray3, vec3, vec4 } from "math";
import { meta } from "utils";


const AXIS_INDICES = { x: 0, y: 1, z: 2 };

const AXES = [
    {
        name: "x",
        vector: vec3.X_AXIS,
        color: vec4.fromValues(1, 0.12, 0.08, 1)
    },
    {
        name: "y",
        vector: vec3.Y_AXIS,
        color: vec4.fromValues(0.2, 1, 0.18, 1)
    },
    {
        name: "z",
        vector: vec3.Z_AXIS,
        color: vec4.fromValues(0.22, 0.45, 1, 1)
    }
];

const
    COLOR_WHITE = vec4.fromValues(1, 1, 1, 0.74),
    COLOR_YELLOW = vec4.fromValues(1, 0.84, 0.16, 1),
    COLOR_GREY = vec4.fromValues(0.55, 0.6, 0.66, 0.45),
    vec3_0 = vec3.create(),
    vec3_1 = vec3.create(),
    vec3_2 = vec3.create(),
    vec3_3 = vec3.create(),
    vec3_4 = vec3.create(),
    vec3_5 = vec3.create(),
    vec3_6 = vec3.create(),
    vec3_7 = vec3.create(),
    vec3_8 = vec3.create(),
    vec3_9 = vec3.create(),
    vec3_10 = vec3.create(),
    vec3_11 = vec3.create(),
    vec3_12 = vec3.create(),
    vec4_0 = vec4.create(),
    quat_0 = quat.create(),
    quat_1 = quat.create(),
    mat4_0 = mat4.create(),
    mat4_1 = mat4.create(),
    mat4_2 = mat4.create(),
    ray3_0 = ray3.create();


/**
 * Renderable 3D transform gizmo made from EveCurveLineSet parts.
 */
@meta.tny.type("TnyTransformGizmo")
@meta.tny.define("TnyTransformGizmo")
export class TnyTransformGizmo extends WglTransform
{

    @meta.boolean
    display = true;

    @meta.boolean
    active = false;

    @meta.string
    mode = "all";

    @meta.float
    size = 100;

    @meta.float
    width = 2;

    @meta.uint
    rotationSegments = 96;

    @meta.boolean
    additive = false;

    @meta.boolean
    enableDepth = true;

    @meta.boolean
    pickable = false;

    @meta.boolean
    intersectable = true;

    @meta.boolean
    keyboardShortcuts = true;

    @meta.boolean
    captureShiftCamera = true;

    @meta.boolean
    activateOnShortcut = true;

    @meta.boolean
    requireTargetForActivation = true;

    @meta.boolean
    deactivateOnTargetClear = true;

    @meta.float
    pickRadius = 0;

    target = null;

    @meta.boolean
    inheritTargetRotation = true;

    @meta.boolean
    useTargetScale = false;

    @meta.boolean
    autoSize = true;

    @meta.float
    targetSizeFactor = 1.35;

    @meta.float
    minAutoSize = 20;

    @meta.float
    maxAutoSize = 0;

    @meta.float
    baseSensitivity = 1;

    @meta.float
    translationSensitivity = 1;

    @meta.float
    rotationSensitivity = 1;

    @meta.float
    scalingSensitivity = 1;

    @meta.float
    shiftSensitivity = 0.1;

    @meta.boolean
    invertX = false;

    @meta.boolean
    invertY = false;

    @meta.boolean
    invertZ = false;

    @meta.boolean
    invertView = false;

    lineSets = [];
    _lineSetModes = [];
    _hitProxies = [];
    wrapped = this;
    isLensflare = false;
    isPlanet = false;
    _installedGizmoScene = null;
    _installedClient = null;
    _installedBackgroundScene = null;
    _installedScene = null;
    _drag = null;
    _controls = null;
    _queuedMode = null;
    _viewRingProxy = null;

    constructor(options = {})
    {
        super();
        this.SetOptions(options);
        this.Rebuild();
    }

    /**
     * Sets gizmo options.
     * @param {Object} options
     * @returns {TnyTransformGizmo}
     */
    SetOptions(options = {})
    {
        for (const key of [
            "display", "active", "additive", "enableDepth", "pickable",
            "intersectable", "keyboardShortcuts", "captureShiftCamera",
            "activateOnShortcut", "requireTargetForActivation", "deactivateOnTargetClear",
            "inheritTargetRotation", "useTargetScale", "autoSize",
            "invertX", "invertY", "invertZ", "invertView"
        ])
        {
            if (key in options) this[key] = !!options[key];
        }

        for (const key of [
            "size", "width", "rotationSegments", "pickRadius",
            "targetSizeFactor", "minAutoSize", "maxAutoSize",
            "baseSensitivity", "translationSensitivity", "rotationSensitivity",
            "scalingSensitivity", "shiftSensitivity"
        ])
        {
            if (Number.isFinite(options[key]))
            {
                this[key] = Math.max(key === "rotationSegments" ? 8 : 0, options[key]);
            }
        }

        if (options.mode) this.mode = options.mode;
        if (options.name) this.name = options.name;
        if (options.target) this.SetTarget(options.target);
        if (options.translation) this.SetTranslation(options.translation);
        if (options.rotation) this.SetRotation(options.rotation);
        if (options.scaling) this.SetScale(options.scaling);
        return this;
    }

    /**
     * Sets the visible transform gizmo mode.
     * @param {String} mode
     * @returns {TnyTransformGizmo}
     */
    SetMode(mode = "all")
    {
        mode = mode || "all";
        this._queuedMode = null;
        if (this.mode === mode) return this;
        this.mode = mode;
        this.ApplyModeVisibility();
        return this;
    }

    /**
     * Queues a mode change for the next update/frame boundary.
     * @param {String} mode
     * @returns {TnyTransformGizmo}
     */
    QueueMode(mode = "all")
    {
        mode = mode || "all";
        if (this.mode !== mode)
        {
            this._queuedMode = mode;
        }
        return this;
    }

    /**
     * Applies a queued mode change.
     * @returns {Boolean}
     */
    FlushQueuedMode()
    {
        if (!this._queuedMode) return false;

        const mode = this._queuedMode;
        this._queuedMode = null;
        this.SetMode(mode);
        return true;
    }

    /**
     * Sets the target transform to follow.
     * @param {*} target
     * @returns {TnyTransformGizmo}
     */
    SetTarget(target)
    {
        this.target = target || null;
        if (!this.target && this.deactivateOnTargetClear)
        {
            this.Deactivate();
        }
        else if (this.target && !this.activateOnShortcut)
        {
            this.Activate();
        }
        this.SyncToTarget();
        return this;
    }

    /**
     * Checks if the gizmo has a valid activation target.
     * @returns {Boolean}
     */
    HasActivationTarget()
    {
        return !!(this.target && (this.target.wrapped || this.target));
    }

    /**
     * Checks if the gizmo can be activated.
     * @returns {Boolean}
     */
    CanActivate()
    {
        return !this.requireTargetForActivation || this.HasActivationTarget();
    }

    /**
     * Checks if the gizmo is currently active.
     * @returns {Boolean}
     */
    IsActive()
    {
        return !!(this.active && this.CanActivate());
    }

    /**
     * Activates the gizmo, optionally changing mode.
     * @param {String} [mode]
     * @returns {Boolean}
     */
    Activate(mode)
    {
        if (!this.CanActivate()) return false;
        this.active = true;
        if (mode) this.SetMode(mode);
        this.SyncToTarget();
        return true;
    }

    /**
     * Deactivates the gizmo.
     * @returns {TnyTransformGizmo}
     */
    Deactivate()
    {
        this.active = false;
        this._queuedMode = null;
        this.EndDrag();
        return this;
    }

    /**
     * Syncs the gizmo transform to its target when one is available.
     * @returns {Boolean}
     */
    SyncToTarget()
    {
        const target = this.target && (this.target.wrapped || this.target);
        if (!target) return false;

        if (target.GetWorldTransform)
        {
            target.GetWorldTransform(mat4_0);
        }
        else if (target._worldTransform)
        {
            mat4.copy(mat4_0, target._worldTransform);
        }
        else if (target.transform)
        {
            mat4.copy(mat4_0, target.transform);
        }
        else
        {
            return false;
        }

        mat4.getTranslation(this.translation, mat4_0);

        if (this.inheritTargetRotation)
        {
            mat4.getRotation(this.rotation, mat4_0);
        }

        const autoSized = this.autoSize && this.ApplyTargetAutoSize(target);

        if (!autoSized && this.useTargetScale)
        {
            mat4.getScaling(this.scaling, mat4_0);
        }

        this._rebuildLocal = true;
        return true;
    }

    /**
     * Applies an automatic uniform scale from the target's bounding sphere.
     * @param {*} target
     * @returns {Boolean}
     */
    ApplyTargetAutoSize(target)
    {
        const radius = this.GetTargetBoundingSphereRadius(target);
        if (!Number.isFinite(radius) || radius <= 0)
        {
            return false;
        }

        let targetSize = radius * this.targetSizeFactor;
        if (this.minAutoSize > 0) targetSize = Math.max(this.minAutoSize, targetSize);
        if (this.maxAutoSize > 0) targetSize = Math.min(this.maxAutoSize, targetSize);

        const scale = targetSize / Math.max(this.size, 1e-6);
        vec3.set(this.scaling, scale, scale, scale);
        return true;
    }

    /**
     * Gets a target's best known world bounding sphere radius.
     * @param {*} target
     * @returns {Number}
     */
    GetTargetBoundingSphereRadius(target)
    {
        target = target && (target.wrapped || target);
        if (!target) return 0;

        if (typeof target.GetWorldBoundingSphereRadius === "function")
        {
            const radius = target.GetWorldBoundingSphereRadius();
            if (Number.isFinite(radius) && radius > 0) return radius;
        }

        if (typeof target.GetWorldBoundingSphere === "function")
        {
            const sphere = target.GetWorldBoundingSphere(vec4_0);
            if (sphere && Number.isFinite(sphere[3]) && sphere[3] > 0) return sphere[3];
        }

        if (typeof target.GetBoundingSphereRadius === "function")
        {
            const radius = target.GetBoundingSphereRadius();
            if (Number.isFinite(radius) && radius > 0) return radius;
        }

        if (typeof target.GetBoundingSphere === "function")
        {
            const sphere = target.GetBoundingSphere(vec4_0);
            if (sphere && Number.isFinite(sphere[3]) && sphere[3] > 0) return sphere[3];
        }

        const radius = target.boundingSphereRadius || target.bounds?.radius || target.boundingSphere?.radius;
        return Number.isFinite(radius) && radius > 0 ? radius : 0;
    }

    /**
     * Per-frame update.
     * @param {Number} dt
     * @returns {TnyTransformGizmo}
     */
    Update(dt)
    {
        return this.UpdateViewDependentData(null, dt);
    }

    /**
     * Updates the gizmo's world transform and all line-set parts.
     * @param {mat4} parentTransform
     * @param {Number} dt
     * @returns {TnyTransformGizmo}
     */
    UpdateViewDependentData(parentTransform, dt)
    {
        this.FlushQueuedMode();

        if (this.SyncToTarget())
        {
            this.SetParentTransform(null);
        }
        else if (parentTransform)
        {
            this.SetParentTransform(parentTransform);
        }

        this.RebuildTransforms({ skipUpdate: true });

        for (let i = 0; i < this.lineSets.length; i++)
        {
            this.lineSets[i].UpdateViewDependentData(this._worldTransform);
            this.lineSets[i].Update(dt);
        }

        return this;
    }

    /**
     * Gets batches from all visible gizmo parts.
     * @param {Number} mode
     * @param {*} accumulator
     * @param {*} perObjectData
     * @returns {Boolean}
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || !this.IsActive()) return false;

        let accumulated = false;
        for (let i = 0; i < this.lineSets.length; i++)
        {
            accumulated = this.lineSets[i].GetBatches(mode, accumulator, perObjectData) || accumulated;
        }
        return accumulated;
    }

    /**
     * Intersects the gizmo's invisible hit proxies.
     * @param {Tw2RayCaster} ray
     * @param {Array} intersects
     * @returns {*}
     */
    Intersect(ray, intersects = [])
    {
        if (!this.display || !this.IsActive() || !this.intersectable || !this._hitProxies.length)
        {
            return false;
        }

        if (this.SyncToTarget())
        {
            this.SetParentTransform(null);
        }

        this.RebuildTransforms({ skipUpdate: true });
        if (!mat4.invert(mat4_1, this._worldTransform)) return false;

        ray3.transformMat4(ray3_0, ray.ray, mat4_1);

        const internal = [];
        for (let i = 0; i < this._hitProxies.length; i++)
        {
            const proxy = this._hitProxies[i];
            switch (proxy.type)
            {
                case "box":
                    this.IntersectBoxProxy(proxy, ray, ray3_0, internal);
                    break;

                case "ring":
                    this.IntersectRingProxy(proxy, ray, ray3_0, internal);
                    break;
            }
        }

        internal.sort(this.constructor.SortIntersections);
        for (let i = 0; i < internal.length; i++)
        {
            intersects.push(internal[i]);
        }

        return internal[0] || false;
    }

    /**
     * Intersects a local-space box proxy.
     * @param {Object} proxy
     * @param {Tw2RayCaster} ray
     * @param {ray3} localRay
     * @param {Array} out
     * @returns {Boolean}
     */
    IntersectBoxProxy(proxy, ray, localRay, out)
    {
        if (!ray3.getIntersectBounds(vec3_4, localRay, proxy.min, proxy.max))
        {
            return false;
        }

        vec3.transformMat4(vec3_5, vec3_4, this._worldTransform);
        const distance = vec3.squaredDistance(ray.ray, vec3_5);
        if (distance <= ray.nearSquared || distance >= ray.farSquared)
        {
            return false;
        }

        out.push(this.CreateIntersection(proxy, ray, distance, vec3_4, vec3_5));
        return true;
    }

    /**
     * Intersects a local-space ring proxy as a sampled tube.
     * @param {Object} proxy
     * @param {Tw2RayCaster} ray
     * @param {ray3} localRay
     * @param {Array} out
     * @returns {Boolean}
     */
    IntersectRingProxy(proxy, ray, localRay, out)
    {
        const
            step = Math.PI * 2 / proxy.segments,
            radiusSquared = proxy.tubeRadius * proxy.tubeRadius;

        let
            bestPickDistance = Infinity,
            bestRayDistance = Infinity,
            found = false;

        const isViewRing = proxy.plane === "view";
        if (isViewRing && !this.GetViewRingLocalBasis(vec3_10, vec3_11, vec3_12))
        {
            return false;
        }

        for (let i = 0; i < proxy.segments; i++)
        {
            if (isViewRing)
            {
                this.constructor.SetCircleBasisPoint(vec3_4, vec3_10, vec3_11, proxy.radius, step * i);
                this.constructor.SetCircleBasisPoint(vec3_5, vec3_10, vec3_11, proxy.radius, step * (i + 1));
            }
            else
            {
                this.constructor.SetCirclePoint(vec3_4, proxy.plane, proxy.radius, step * i);
                this.constructor.SetCirclePoint(vec3_5, proxy.plane, proxy.radius, step * (i + 1));
            }

            const closest = this.constructor.GetRaySegmentClosestPoints(localRay, vec3_4, vec3_5, vec3_6, vec3_7);
            if (
                closest.distanceSquared <= radiusSquared &&
                (
                    closest.distanceSquared < bestPickDistance ||
                    (
                        closest.distanceSquared === bestPickDistance &&
                        closest.rayDistance < bestRayDistance
                    )
                )
            )
            {
                found = true;
                bestPickDistance = closest.distanceSquared;
                bestRayDistance = closest.rayDistance;
                vec3.copy(vec3_8, vec3_6);
                vec3.copy(vec3_9, vec3_7);
            }
        }

        if (!found) return false;

        vec3.transformMat4(vec3_5, vec3_8, this._worldTransform);
        vec3.transformMat4(vec3_7, vec3_9, this._worldTransform);

        const distance = vec3.squaredDistance(ray.ray, vec3_5);
        if (distance <= ray.nearSquared || distance >= ray.farSquared)
        {
            return false;
        }

        out.push(this.CreateIntersection(proxy, ray, distance, vec3_8, vec3_5, {
            handlePoint: vec3_7,
            handlePointLocal: vec3_9,
            pickDistanceSquared: bestPickDistance
        }));
        return true;
    }

    /**
     * Creates a gizmo intersection.
     * @param {Object} proxy
     * @param {Tw2RayCaster} ray
     * @param {Number} distance
     * @param {vec3} pointLocal
     * @param {vec3} point
     * @param {Object} [extra]
     * @returns {Object}
     */
    CreateIntersection(proxy, ray, distance, pointLocal, point, extra = {})
    {
        const intersection = {
            name: proxy.name,
            distance,
            distanceSquared: distance,
            point: vec3.clone(point),
            pointLocal: vec3.clone(pointLocal),
            item: proxy,
            root: this,
            type: ray.constructor.Type.SET_ITEM,
            typeName: "SET_ITEM",
            isGizmo: true,
            mode: proxy.mode,
            axis: proxy.axis,
            handle: proxy.handle,
            priority: proxy.priority || 0,
            pickDistanceSquared: extra.pickDistanceSquared || 0
        };

        if (extra.handlePoint)
        {
            intersection.handlePoint = vec3.clone(extra.handlePoint);
        }

        if (extra.handlePointLocal)
        {
            intersection.handlePointLocal = vec3.clone(extra.handlePointLocal);
        }

        return intersection;
    }

    /**
     * Previews managed input before browser propagation reaches lower-priority controls.
     * @param {Object} event
     * @returns {Number}
     */
    PreviewInputEvent(event)
    {
        const Result = event.input.constructor.Result;

        switch (event.type)
        {
            case "keydown":
            {
                const mode = this.GetKeyboardModeFromInputEvent(event);
                if (mode && this.CanActivate())
                {
                    event.Consume();
                    return Result.CONSUME;
                }
                break;
            }

            case "mousedown":
            {
                if (!this.IsActive())
                {
                    return Result.PASS;
                }

                if (event.button !== undefined && event.button !== 0)
                {
                    return Result.PASS;
                }

                const hit = this.GetControlHitFromInputEvent(event);
                if (hit)
                {
                    event.gizmoHit = hit;
                    event.Consume();
                    return Result.CONSUME;
                }

                if (this.captureShiftCamera && event.shiftKey)
                {
                    event.Consume();
                    return Result.CONSUME;
                }
                break;
            }

            case "mousemove":
            case "mouseup":
                if (this._drag)
                {
                    event.Consume();
                    return Result.CONSUME;
                }
                break;
        }

        return Result.PASS;
    }

    /**
     * Handles managed input at the library frame boundary.
     * @param {Object} event
     * @returns {Number}
     */
    HandleInputEvent(event)
    {
        const Result = event.input.constructor.Result;

        switch (event.type)
        {
            case "keydown":
            {
                const mode = this.GetKeyboardModeFromInputEvent(event);
                if (mode)
                {
                    return this.Activate(mode) ? Result.CONSUME : Result.PASS;
                }
                else if (this.IsKeyboardControlEvent(event))
                {
                    this.Deactivate();
                }
                break;
            }

            case "mousedown":
            {
                if (!this.IsActive())
                {
                    return Result.PASS;
                }

                if (event.button !== undefined && event.button !== 0)
                {
                    return Result.PASS;
                }

                const
                    ray = this.UpdateControlRayFromInputEvent(event),
                    hit = event.gizmoHit || this.GetControlHitFromInputEvent(event);

                if (hit && ray && this.StartDrag(hit, ray, event))
                {
                    return Result.CAPTURE;
                }

                if (hit || this.captureShiftCamera && event.shiftKey)
                {
                    return Result.CONSUME;
                }
                break;
            }

            case "mousemove":
            {
                if (!this._drag) return Result.PASS;
                const ray = this.UpdateControlRayFromInputEvent(event);
                if (ray) this.Drag(ray, event);
                return Result.CAPTURE;
            }

            case "mouseup":
            {
                if (!this._drag) return Result.PASS;
                const ray = this.UpdateControlRayFromInputEvent(event);
                if (ray)
                {
                    this.Drag(ray, event);
                }
                this.EndDrag();
                return Result.RELEASE;
            }
        }

        return Result.PASS;
    }

    /**
     * Gets a keyboard mode from a managed input event.
     * @param {Object} event
     * @returns {String|null}
     */
    GetKeyboardModeFromInputEvent(event)
    {
        if (!this.IsKeyboardControlEvent(event)) return null;

        switch (String(event.key || "").toLowerCase())
        {
            case "w":
                return "translation";

            case "e":
                return "rotation";

            case "r":
                return "scaling";
        }

        return null;
    }

    /**
     * Checks if a keyboard event should affect gizmo tool state.
     * @param {Object} event
     * @returns {Boolean}
     */
    IsKeyboardControlEvent(event)
    {
        return !!this.keyboardShortcuts &&
            !this._drag &&
            !this.constructor.IsEditableInputEvent(event.domEvent || event);
    }

    /**
     * Updates the control scene ray caster from a managed input event.
     * @param {Object} event
     * @returns {*}
     */
    UpdateControlRayFromInputEvent(event)
    {
        const controls = this._controls;
        if (!controls || !controls.scene || !controls.scene._rayCaster || !controls.dom)
        {
            return null;
        }

        controls.scene._rayCaster.UpdateFromEvent(event, controls.dom);
        return controls.scene._rayCaster;
    }

    /**
     * Intersects the gizmo from a managed input event.
     * @param {Object} event
     * @returns {*}
     */
    GetControlHitFromInputEvent(event)
    {
        const ray = this.UpdateControlRayFromInputEvent(event);
        if (!ray) return null;

        const hits = [];
        this.Intersect(ray, hits);
        return hits[0] || null;
    }

    /**
     * Enables simple mouse controls for the gizmo.
     * @param {*} target
     * @param {HTMLElement} [element]
     * @returns {TnyTransformGizmo}
     */
    EnableControls(target = this._installedGizmoScene || this.constructor.ResolveDefaultInstallTarget(), element)
    {
        const
            scene = this.constructor.ResolveControlScene(target),
            dom = element || this.constructor.ResolveControlElement(target),
            keyTarget = this.constructor.ResolveControlKeyTarget(target),
            camera = this.constructor.ResolveControlCamera(target);

        if (!scene || !scene.IntersectFromEvent || !scene._rayCaster)
        {
            throw new Error("TnyTransformGizmo.EnableControls requires a wrapped scene or client");
        }

        if (!dom || !dom.addEventListener)
        {
            throw new Error("TnyTransformGizmo.EnableControls requires a DOM element");
        }

        this.DisableControls();

        const previousIgnoreOnShiftDown = camera && "ignoreOnShiftDown" in camera ? camera.ignoreOnShiftDown : undefined;
        if (camera && "ignoreOnShiftDown" in camera && this.captureShiftCamera)
        {
            camera.ignoreOnShiftDown = true;
        }

        const input = this.constructor.ResolveControlInput(target);
        if (input && input.Register)
        {
            const token = input.Register({
                name: `${this.name || "transformGizmo"}Controls`,
                priority: 1000,
                events: [ "mousedown", "mousemove", "mouseup", "keydown" ],
                context: this,
                PreviewInputEvent: this.PreviewInputEvent,
                HandleInputEvent: this.HandleInputEvent
            });

            if (!input.element && input.BindElement)
            {
                input.BindElement(dom, { keyTarget });
            }

            this._controls = {
                input,
                token,
                scene,
                dom,
                keyTarget,
                camera,
                previousIgnoreOnShiftDown
            };
            return this;
        }

        const
            consume = event =>
            {
                event.preventDefault();
                event.stopPropagation();
                if (event.stopImmediatePropagation) event.stopImmediatePropagation();
            },
            onKeyDown = event =>
            {
                if (!this.IsKeyboardControlEvent(event)) return;

                const mode = this.GetKeyboardModeFromInputEvent(event);
                if (mode && this.Activate(mode))
                {
                    consume(event);
                }
                else
                {
                    this.Deactivate();
                }
            },
            onMouseMove = event =>
            {
                if (!this._drag) return;
                scene._rayCaster.UpdateFromEvent(event, dom);
                this.Drag(scene._rayCaster, event);
                consume(event);
            },
            onMouseUp = event =>
            {
                if (this._drag)
                {
                    scene._rayCaster.UpdateFromEvent(event, dom);
                    this.Drag(scene._rayCaster, event);
                    this.EndDrag();
                    consume(event);
                }

                if (typeof document !== "undefined")
                {
                    document.removeEventListener("mousemove", onMouseMove, true);
                    document.removeEventListener("mouseup", onMouseUp, true);
                }
            },
            onMouseDown = event =>
            {
                if (!this.IsActive()) return;
                if (event.button !== undefined && event.button !== 0) return;

                const
                    hits = [];

                scene._rayCaster.UpdateFromEvent(event, dom);
                this.Intersect(scene._rayCaster, hits);

                const hit = hits[0];

                if (!hit || !this.StartDrag(hit, scene._rayCaster, event))
                {
                    if (this.captureShiftCamera && event.shiftKey) consume(event);
                    return;
                }

                consume(event);

                if (typeof document !== "undefined")
                {
                    document.addEventListener("mousemove", onMouseMove, true);
                    document.addEventListener("mouseup", onMouseUp, true);
                }
            };

        dom.addEventListener("mousedown", onMouseDown, true);
        if (keyTarget && keyTarget.addEventListener)
        {
            keyTarget.addEventListener("keydown", onKeyDown, true);
        }

        this._controls = {
            scene,
            dom,
            keyTarget,
            camera,
            previousIgnoreOnShiftDown,
            onKeyDown,
            onMouseDown,
            onMouseMove,
            onMouseUp
        };
        return this;
    }

    /**
     * Disables mouse controls.
     * @returns {TnyTransformGizmo}
     */
    DisableControls()
    {
        if (!this._controls) return this;

        const {
            input,
            token,
            dom,
            keyTarget,
            camera,
            previousIgnoreOnShiftDown,
            onKeyDown,
            onMouseDown,
            onMouseMove,
            onMouseUp
        } = this._controls;

        if (input && token)
        {
            input.Unregister(token);
        }

        if (dom && dom.removeEventListener && onMouseDown)
        {
            dom.removeEventListener("mousedown", onMouseDown, true);
        }

        if (keyTarget && keyTarget.removeEventListener && onKeyDown)
        {
            keyTarget.removeEventListener("keydown", onKeyDown, true);
        }

        if (camera && previousIgnoreOnShiftDown !== undefined)
        {
            camera.ignoreOnShiftDown = previousIgnoreOnShiftDown;
        }

        if (typeof document !== "undefined" && onMouseMove && onMouseUp)
        {
            document.removeEventListener("mousemove", onMouseMove, true);
            document.removeEventListener("mouseup", onMouseUp, true);
        }

        this._controls = null;
        this.EndDrag();
        return this;
    }

    /**
     * Starts dragging from a gizmo hit.
     * @param {Object} hit
     * @param {Tw2RayCaster} ray
     * @param {Object} [event]
     * @returns {Boolean}
     */
    StartDrag(hit, ray, event)
    {
        if (!hit || !hit.isGizmo || hit.root !== this || !ray) return false;

        switch (hit.mode)
        {
            case "translation":
                return this.BeginTranslationDrag(hit, ray, event);

            case "rotation":
                return this.BeginRotationDrag(hit, ray, event);

            case "scaling":
                return this.BeginScalingDrag(hit, ray, event);
        }

        return false;
    }

    /**
     * Updates an active drag.
     * @param {Tw2RayCaster} ray
     * @param {Object} [event]
     * @returns {Boolean}
     */
    Drag(ray, event)
    {
        if (!this._drag || !ray) return false;

        switch (this._drag.mode)
        {
            case "translation":
                return this.UpdateTranslationDrag(ray, event);

            case "rotation":
                return this.UpdateRotationDrag(ray, event);

            case "scaling":
                return this.UpdateScalingDrag(ray, event);
        }

        return false;
    }

    /**
     * Ends the active drag.
     * @returns {TnyTransformGizmo}
     */
    EndDrag()
    {
        this._drag = null;
        return this;
    }

    /**
     * Checks if the gizmo is dragging.
     * @returns {Boolean}
     */
    IsDragging()
    {
        return !!this._drag;
    }

    /**
     * Begins a translation drag.
     * @param {Object} hit
     * @param {Tw2RayCaster} ray
     * @param {Object} [event]
     * @returns {Boolean}
     */
    BeginTranslationDrag(hit, ray, event)
    {
        if (!(hit.axis in AXIS_INDICES)) return false;

        const target = this.GetDragTarget();
        if (!target || !this.GetTargetTranslation(vec3_4, target)) return false;

        this.SyncToTarget();
        this.RebuildTransforms({ skipUpdate: true });
        this.GetWorldAxis(vec3_5, hit.axis);
        mat4.getTranslation(vec3_6, this._worldTransform);

        const closest = this.constructor.GetRayLineClosest(ray.ray, vec3_6, vec3_5);
        this._drag = {
            mode: "translation",
            axis: hit.axis,
            handle: hit.handle,
            target,
            startTranslation: vec3.clone(vec3_4),
            currentTranslation: vec3.clone(vec3_4),
            worldAxis: vec3.clone(vec3_5),
            worldOrigin: vec3.clone(vec3_6),
            lastScalar: closest.lineDistance,
            axisSign: this.GetAxisSign(hit.axis),
            sensitivity: this.GetDragSensitivity("translation", event)
        };

        return true;
    }

    /**
     * Updates a translation drag.
     * @param {Tw2RayCaster} ray
     * @param {Object} [event]
     * @returns {Boolean}
     */
    UpdateTranslationDrag(ray, event)
    {
        const drag = this._drag;
        if (!drag) return false;

        const
            closest = this.constructor.GetRayLineClosest(ray.ray, drag.worldOrigin, drag.worldAxis),
            delta = (closest.lineDistance - drag.lastScalar) *
                drag.axisSign *
                this.GetDragSensitivity("translation", event);

        drag.lastScalar = closest.lineDistance;
        vec3.scaleAndAdd(drag.currentTranslation, drag.currentTranslation, drag.worldAxis, delta);
        this.ApplyTargetTranslation(drag.target, drag.currentTranslation);
        this.SyncToTarget();
        return true;
    }

    /**
     * Begins a rotation drag.
     * @param {Object} hit
     * @param {Tw2RayCaster} ray
     * @param {Object} [event]
     * @returns {Boolean}
     */
    BeginRotationDrag(hit, ray, event)
    {
        const
            axis = hit.axis,
            target = this.GetDragTarget();

        if (!target || !this.GetTargetRotation(quat_1, target))
        {
            return false;
        }

        this.SyncToTarget();
        this.RebuildTransforms({ skipUpdate: true });
        if (!mat4.invert(mat4_1, this._worldTransform)) return false;

        if (axis === "view")
        {
            if (!this.GetViewRingLocalBasis(vec3_10, vec3_11, vec3_4))
            {
                return false;
            }
        }
        else
        {
            if (!(axis in AXIS_INDICES)) return false;
            this.constructor.GetAxisPoint(vec3_4, axis, 1);
        }

        if (!this.GetRotationDragVector(vec3_5, ray.ray, mat4_1, vec3_4, hit))
        {
            return false;
        }

        this._drag = {
            mode: "rotation",
            axis,
            handle: hit.handle,
            target,
            startRotation: quat.clone(quat_1),
            currentRotation: quat.clone(quat_1),
            axisLocal: vec3.clone(vec3_4),
            lastVectorLocal: vec3.clone(vec3_5),
            inverseWorldTransform: mat4.clone(mat4_1),
            axisSign: this.GetAxisSign(axis),
            sensitivity: this.GetDragSensitivity("rotation", event)
        };

        return true;
    }

    /**
     * Updates a rotation drag.
     * @param {Tw2RayCaster} ray
     * @param {Object} [event]
     * @returns {Boolean}
     */
    UpdateRotationDrag(ray, event)
    {
        const drag = this._drag;
        if (!drag || !this.GetRotationDragVector(vec3_4, ray.ray, drag.inverseWorldTransform, drag.axisLocal))
        {
            return false;
        }

        vec3.cross(vec3_5, drag.lastVectorLocal, vec3_4);

        const
            sin = vec3.dot(drag.axisLocal, vec3_5),
            cos = vec3.dot(drag.lastVectorLocal, vec3_4),
            angle = Math.atan2(sin, cos) *
                drag.axisSign *
                this.GetDragSensitivity("rotation", event);

        quat.setAxisAngle(quat_0, drag.axisLocal, angle);
        quat.multiply(quat_1, drag.currentRotation, quat_0);
        quat.normalize(quat_1, quat_1);
        quat.copy(drag.currentRotation, quat_1);
        vec3.copy(drag.lastVectorLocal, vec3_4);

        this.ApplyTargetRotation(drag.target, quat_1);
        this.SyncToTarget();
        return true;
    }

    /**
     * Gets a normalized local rotation drag vector from a world ray.
     * @param {vec3} out
     * @param {ray3} worldRay
     * @param {mat4} inverseWorld
     * @param {vec3} axisLocal
     * @param {Object} [fallbackHit]
     * @returns {vec3|null}
     */
    GetRotationDragVector(out, worldRay, inverseWorld, axisLocal, fallbackHit)
    {
        ray3.transformMat4(ray3_0, worldRay, inverseWorld);

        const
            denominator = vec3.dot(axisLocal, ray3_0.subarray(3, 6)),
            fallback = fallbackHit && (fallbackHit.handlePointLocal || fallbackHit.pointLocal);

        if (Math.abs(denominator) > 1e-6)
        {
            const t = -vec3.dot(axisLocal, ray3_0.subarray(0, 3)) / denominator;
            if (t >= 0)
            {
                ray3.get(out, ray3_0, t);
            }
            else if (fallback)
            {
                vec3.copy(out, fallback);
            }
            else
            {
                return null;
            }
        }
        else if (fallback)
        {
            vec3.copy(out, fallback);
        }
        else
        {
            return null;
        }

        vec3.scaleAndAdd(out, out, axisLocal, -vec3.dot(out, axisLocal));
        if (vec3.squaredLength(out) < 1e-8) return null;
        return vec3.normalize(out, out);
    }

    /**
     * Begins a scaling drag.
     * @param {Object} hit
     * @param {Tw2RayCaster} ray
     * @param {Object} [event]
     * @returns {Boolean}
     */
    BeginScalingDrag(hit, ray, event)
    {
        const
            axis = hit.axis,
            target = this.GetDragTarget();

        if (!target || !this.GetTargetScale(vec3_4, target))
        {
            return false;
        }

        this.SyncToTarget();
        this.RebuildTransforms({ skipUpdate: true });
        mat4.getTranslation(vec3_6, this._worldTransform);

        const drag = {
            mode: "scaling",
            axis,
            handle: hit.handle,
            target,
            currentScale: vec3.clone(vec3_4),
            worldOrigin: vec3.clone(vec3_6),
            lastClientX: event && Number.isFinite(event.clientX) ? event.clientX : 0,
            lastClientY: event && Number.isFinite(event.clientY) ? event.clientY : 0
        };

        if (axis === "uniform")
        {
            this._drag = drag;
            return true;
        }

        if (!(axis in AXIS_INDICES))
        {
            return false;
        }

        this.GetWorldAxis(vec3_5, axis);
        const closest = this.constructor.GetRayLineClosest(ray.ray, vec3_6, vec3_5);

        drag.worldAxis = vec3.clone(vec3_5);
        drag.lastScalar = closest.lineDistance;
        drag.axisSign = this.GetAxisSign(axis);
        drag.worldHandleLength = this.GetWorldAxisDistance(axis, this.size * 0.82);

        this._drag = drag;
        return true;
    }

    /**
     * Updates a scaling drag.
     * @param {Tw2RayCaster} ray
     * @param {Object} [event]
     * @returns {Boolean}
     */
    UpdateScalingDrag(ray, event)
    {
        const drag = this._drag;
        if (!drag) return false;

        let factor = 1;

        if (drag.axis === "uniform")
        {
            const movement = this.GetUniformScaleMovement(drag, event);
            factor = this.constructor.ClampScaleFactor(1 + movement * 0.01 * this.GetDragSensitivity("scaling", event));

            vec3.scale(drag.currentScale, drag.currentScale, factor);
            this.ClampScaleVector(drag.currentScale);
        }
        else
        {
            const
                closest = this.constructor.GetRayLineClosest(ray.ray, drag.worldOrigin, drag.worldAxis),
                delta = (closest.lineDistance - drag.lastScalar) *
                    drag.axisSign *
                    this.GetDragSensitivity("scaling", event),
                index = AXIS_INDICES[drag.axis];

            drag.lastScalar = closest.lineDistance;
            factor = this.constructor.ClampScaleFactor(1 + delta / drag.worldHandleLength);
            drag.currentScale[index] = this.constructor.ClampScaleValue(drag.currentScale[index] * factor);
        }

        this.ApplyTargetScale(drag.target, drag.currentScale);
        this.SyncToTarget();
        return factor !== 1;
    }

    /**
     * Gets the combined mouse movement for uniform scaling.
     * @param {Object} drag
     * @param {Object} [event]
     * @returns {Number}
     */
    GetUniformScaleMovement(drag, event)
    {
        if (!event) return 0;

        let
            dx = Number.isFinite(event.movementX) ? event.movementX : 0,
            dy = Number.isFinite(event.movementY) ? event.movementY : 0;

        if (!dx && !dy && Number.isFinite(event.clientX) && Number.isFinite(event.clientY))
        {
            dx = event.clientX - drag.lastClientX;
            dy = event.clientY - drag.lastClientY;
        }

        if (Number.isFinite(event.clientX)) drag.lastClientX = event.clientX;
        if (Number.isFinite(event.clientY)) drag.lastClientY = event.clientY;

        return dx - dy;
    }

    /**
     * Gets the world length of a local axis offset.
     * @param {String} axis
     * @param {Number} distance
     * @returns {Number}
     */
    GetWorldAxisDistance(axis, distance)
    {
        mat4.getTranslation(vec3_9, this._worldTransform);
        this.constructor.GetAxisPoint(vec3_10, axis, distance);
        vec3.transformMat4(vec3_10, vec3_10, this._worldTransform);
        return Math.max(Math.sqrt(vec3.squaredDistance(vec3_9, vec3_10)), 1e-6);
    }

    /**
     * Clamps a scale vector in place.
     * @param {vec3} value
     * @returns {vec3}
     */
    ClampScaleVector(value)
    {
        value[0] = this.constructor.ClampScaleValue(value[0]);
        value[1] = this.constructor.ClampScaleValue(value[1]);
        value[2] = this.constructor.ClampScaleValue(value[2]);
        return value;
    }

    /**
     * Gets the object being manipulated.
     * @returns {*}
     */
    GetDragTarget()
    {
        return this.target && (this.target.wrapped || this.target) || this;
    }

    /**
     * Gets drag sensitivity for a mode and input event.
     * @param {String} mode
     * @param {Object} [event]
     * @returns {Number}
     */
    GetDragSensitivity(mode, event)
    {
        let sensitivity = this.baseSensitivity;

        switch (mode)
        {
            case "translation":
                sensitivity *= this.translationSensitivity;
                break;

            case "rotation":
                sensitivity *= this.rotationSensitivity;
                break;

            case "scaling":
                sensitivity *= this.scalingSensitivity;
                break;
        }

        if (event && event.shiftKey)
        {
            sensitivity *= this.shiftSensitivity;
        }

        return Number.isFinite(sensitivity) ? sensitivity : 1;
    }

    /**
     * Gets the configured direction sign for an axis.
     * @param {String} axis
     * @returns {Number}
     */
    GetAxisSign(axis)
    {
        switch (axis)
        {
            case "x":
                return this.invertX ? -1 : 1;

            case "y":
                return this.invertY ? -1 : 1;

            case "z":
                return this.invertZ ? -1 : 1;

            case "view":
                return this.invertView ? -1 : 1;

            default:
                return 1;
        }
    }

    /**
     * Gets a target's local translation.
     * @param {vec3} out
     * @param {*} target
     * @returns {vec3|null}
     */
    GetTargetTranslation(out, target)
    {
        if (target.GetTranslation) return target.GetTranslation(out);
        if (target.translation) return vec3.copy(out, target.translation);
        if (target.GetWorldTranslation) return target.GetWorldTranslation(out);
        return null;
    }

    /**
     * Applies a local translation to a target.
     * @param {*} target
     * @param {vec3} value
     * @returns {Boolean}
     */
    ApplyTargetTranslation(target, value)
    {
        if (target.SetTranslation)
        {
            target.SetTranslation(value);
        }
        else if (target.translation)
        {
            vec3.copy(target.translation, value);
            target._rebuildLocal = true;
        }
        else
        {
            return false;
        }

        this.constructor.NotifyTargetModified(target);
        return true;
    }

    /**
     * Gets a target's local rotation.
     * @param {quat} out
     * @param {*} target
     * @returns {quat|null}
     */
    GetTargetRotation(out, target)
    {
        if (target.GetRotation) return target.GetRotation(out);
        if (target.rotation) return quat.copy(out, target.rotation);
        return null;
    }

    /**
     * Applies a local rotation to a target.
     * @param {*} target
     * @param {quat} value
     * @returns {Boolean}
     */
    ApplyTargetRotation(target, value)
    {
        if (target.SetRotation)
        {
            target.SetRotation(value);
        }
        else if (target.rotation)
        {
            quat.copy(target.rotation, value);
            target._rebuildLocal = true;
        }
        else
        {
            return false;
        }

        this.constructor.NotifyTargetModified(target);
        return true;
    }

    /**
     * Gets a target's local scale.
     * @param {vec3} out
     * @param {*} target
     * @returns {vec3|null}
     */
    GetTargetScale(out, target)
    {
        if (target.GetScale) return target.GetScale(out);
        if (target.scaling) return vec3.copy(out, target.scaling);
        return null;
    }

    /**
     * Applies a local scale to a target.
     * @param {*} target
     * @param {vec3} value
     * @returns {Boolean}
     */
    ApplyTargetScale(target, value)
    {
        if (target.SetScale)
        {
            target.SetScale(value);
        }
        else if (target.scaling)
        {
            vec3.copy(target.scaling, value);
            target._rebuildLocal = true;
        }
        else
        {
            return false;
        }

        this.constructor.NotifyTargetModified(target);
        return true;
    }

    /**
     * Gets a normalized world axis from the gizmo transform.
     * @param {vec3} out
     * @param {String} axis
     * @returns {vec3}
     */
    GetWorldAxis(out, axis)
    {
        const offset = AXIS_INDICES[axis] * 4;
        vec3.set(out, this._worldTransform[offset], this._worldTransform[offset + 1], this._worldTransform[offset + 2]);
        return vec3.normalize(out, out);
    }

    /**
     * Gets gizmo resources.
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.lineSets.length; i++)
        {
            this.lineSets[i].GetResources(out);
        }
        return out;
    }

    /**
     * Installs the gizmo into a scene's gizmo objects, a client, or a lineSets list.
     * @param {*} target
     * @returns {TnyTransformGizmo}
     */
    Install(target = this.constructor.ResolveDefaultInstallTarget())
    {
        if (target && target.scene && target.scene.AddObject)
        {
            target = target.scene;
        }

        const gizmoObjects = this.constructor.GetSceneGizmoObjects(target);
        if (gizmoObjects)
        {
            if (!gizmoObjects.includes(this))
            {
                gizmoObjects.push(this);
            }
            this._installedGizmoScene = target;
            return this;
        }

        const backgroundObjects = this.constructor.GetSceneBackgroundObjects(target);
        if (backgroundObjects)
        {
            if (!backgroundObjects.includes(this))
            {
                backgroundObjects.push(this);
            }
            this._installedBackgroundScene = target;
            return this;
        }

        if (target && target.AddObject)
        {
            target.AddObject(this);
            this._installedClient = target;
            return this;
        }

        const lineSets = this.constructor.GetSceneLineSets(target);
        if (!lineSets)
        {
            throw new Error("TnyTransformGizmo.Install requires a scene, client, or scene with lineSets");
        }

        for (let i = 0; i < this.lineSets.length; i++)
        {
            if (!lineSets.includes(this.lineSets[i]))
            {
                lineSets.push(this.lineSets[i]);
            }
        }

        this._installedScene = target;
        return this;
    }

    /**
     * Removes the gizmo from its installed scene or client.
     * @param {*} [target]
     * @returns {TnyTransformGizmo}
     */
    Uninstall(target = this._installedGizmoScene || this._installedBackgroundScene || this._installedClient || this._installedScene)
    {
        const gizmoObjects = this.constructor.GetSceneGizmoObjects(target);
        if (gizmoObjects)
        {
            const index = gizmoObjects.indexOf(this);
            if (index !== -1) gizmoObjects.splice(index, 1);
            if (target === this._installedGizmoScene) this._installedGizmoScene = null;
            return this;
        }

        const backgroundObjects = this.constructor.GetSceneBackgroundObjects(target);
        if (backgroundObjects)
        {
            const index = backgroundObjects.indexOf(this);
            if (index !== -1) backgroundObjects.splice(index, 1);
            if (target === this._installedBackgroundScene) this._installedBackgroundScene = null;
            return this;
        }

        if (target && target.RemoveObject)
        {
            target.RemoveObject(this);
            if (target === this._installedClient) this._installedClient = null;
            return this;
        }

        const lineSets = this.constructor.GetSceneLineSets(target);
        if (lineSets)
        {
            for (let i = 0; i < this.lineSets.length; i++)
            {
                const index = lineSets.indexOf(this.lineSets[i]);
                if (index !== -1) lineSets.splice(index, 1);
            }
        }

        this._installedScene = null;
        return this;
    }

    /**
     * Rebuilds all line-set parts.
     * @returns {TnyTransformGizmo}
     */
    Rebuild()
    {
        const installedScene = this._installedScene;
        if (installedScene) this.Uninstall(installedScene);

        for (let i = 0; i < this.lineSets.length; i++)
        {
            this.lineSets[i].Unload();
        }
        this.lineSets.splice(0);
        this._lineSetModes.splice(0);
        this._hitProxies.splice(0);
        this._viewRingProxy = null;

        this.AddModeLineSet("translation", this.BuildTranslationLineSet());
        this.AddModeLineSet("rotation", this.BuildRotationLineSet());
        this.AddModeLineSet("rotation", this.BuildViewRotationLineSet());
        this.AddModeLineSet("scaling", this.BuildScalingLineSet());
        this.ApplyModeVisibility();

        this.Update(0);
        if (installedScene) this.Install(installedScene);
        return this;
    }

    /**
     * Adds a line set with its owning gizmo mode.
     * @param {String} mode
     * @param {EveCurveLineSet} set
     * @returns {EveCurveLineSet}
     */
    AddModeLineSet(mode, set)
    {
        this.lineSets.push(set);
        this._lineSetModes.push(mode);
        return set;
    }

    /**
     * Applies current mode visibility and rebuilds hit proxies only.
     * @returns {TnyTransformGizmo}
     */
    ApplyModeVisibility()
    {
        const modes = this.constructor.NormalizeModes(this.mode);

        for (let i = 0; i < this.lineSets.length; i++)
        {
            const mode = this._lineSetModes[i];
            this.lineSets[i].display = !!(this.display && modes[mode]);
        }

        this._hitProxies.splice(0);
        this._viewRingProxy = null;

        if (modes.translation)
        {
            this.BuildTranslationHitProxies(this._hitProxies);
        }

        if (modes.rotation)
        {
            this.BuildRotationHitProxies(this._hitProxies);
        }

        if (modes.scaling)
        {
            this.BuildScalingHitProxies(this._hitProxies);
        }

        return this;
    }

    /**
     * Fires on value changes.
     * @param {Object} [opt]
     */
    OnValueChanged(opt = {})
    {
        super.OnValueChanged(opt);
        if (!opt.skipRebuild)
        {
            this.Rebuild();
        }
    }

    /**
     * Creates a translation line set.
     * @returns {EveCurveLineSet}
     */
    BuildTranslationLineSet()
    {
        const
            set = this.CreateLineSet("translation"),
            size = this.size,
            head = size * 0.16,
            wing = size * 0.06;

        for (let i = 0; i < AXES.length; i++)
        {
            const { vector, color, name } = AXES[i];
            vec3.scale(vec3_0, vector, size);
            vec3.scale(vec3_1, vector, size - head);
            set.AddStraightLine([ 0, 0, 0 ], vec3_0, this.width, color, color).name = `${name} translate`;
            this.AddArrowHead(set, vector, vec3_1, head, wing, this.width, color);
        }

        return this.FinishLineSet(set);
    }

    /**
     * Builds translation hit proxies.
     * @param {Array} out
     * @returns {Array}
     */
    BuildTranslationHitProxies(out)
    {
        const
            size = this.size,
            radius = this.GetPickRadius(),
            head = size * 0.16,
            tipRadius = Math.max(head * 0.45, radius * 1.35);

        for (let i = 0; i < AXES.length; i++)
        {
            const { name } = AXES[i];
            this.AddAxisBoxProxy(out, "translation", name, "axis", size * 0.08, size - head * 0.35, radius, 2);
            this.AddBoxProxy(out, "translation", name, "tip", this.constructor.GetAxisPoint(vec3_0, name, size), tipRadius, 1);
        }

        return out;
    }

    /**
     * Creates a rotation line set.
     * @returns {EveCurveLineSet}
     */
    BuildRotationLineSet()
    {
        const
            set = this.CreateLineSet("rotation"),
            radius = this.size * 0.82,
            segments = Math.floor(this.rotationSegments);

        this.AddCircle(set, "x rotate", "x", radius, segments, this.width, AXES[0].color);
        this.AddCircle(set, "y rotate", "y", radius, segments, this.width, AXES[1].color);
        this.AddCircle(set, "z rotate", "z", radius, segments, this.width, AXES[2].color);

        return this.FinishLineSet(set);
    }

    /**
     * Creates the camera-facing view rotation ring line set.
     * @returns {EveCurveLineSet}
     */
    BuildViewRotationLineSet()
    {
        const
            set = this.CreateLineSet("rotationView"),
            radius = this.size * 0.82 * 1.12,
            segments = Math.floor(this.rotationSegments);

        set.lookAtCamera = true;
        this.AddCircle(set, "view rotate", "z", radius, segments, this.width * 0.8, COLOR_WHITE);
        return this.FinishLineSet(set);
    }

    /**
     * Builds rotation hit proxies.
     * @param {Array} out
     * @returns {Array}
     */
    BuildRotationHitProxies(out)
    {
        const
            radius = this.size * 0.82,
            tubeRadius = Math.max(this.GetPickRadius(), this.width * 2),
            segments = Math.floor(this.rotationSegments);

        this.AddRingProxy(out, "x", "x", radius, tubeRadius, segments, 1);
        this.AddRingProxy(out, "y", "y", radius, tubeRadius, segments, 1);
        this.AddRingProxy(out, "z", "z", radius, tubeRadius, segments, 1);
        this._viewRingProxy = this.AddRingProxy(out, "view", "view", radius * 1.12, tubeRadius, segments, 2);
        return out;
    }

    /**
     * Gets camera-facing local basis vectors for the view rotation ring.
     * @param {vec3} right
     * @param {vec3} up
     * @param {vec3} normal
     * @returns {Boolean}
     */
    GetViewRingLocalBasis(right, up, normal)
    {
        if (!mat4.invert(mat4_0, this._worldTransform))
        {
            return false;
        }

        vec3.set(vec3_4, this._worldTransform[12], this._worldTransform[13], this._worldTransform[14]);
        vec3.transformMat4(vec3_5, vec3_4, mat4_0);

        mat4.lookAt(mat4_2, device.viewInverse.subarray(12), vec3_4, [ 0, 1, 0 ]);
        mat4.transpose(mat4_2, mat4_2);
        mat4.getScaling(vec3_8, this._worldTransform);

        vec3.set(vec3_6, mat4_2[0] * vec3_8[0], mat4_2[1] * vec3_8[0], mat4_2[2] * vec3_8[0]);
        vec3.add(vec3_6, vec3_6, vec3_4);
        vec3.transformMat4(vec3_6, vec3_6, mat4_0);
        vec3.subtract(right, vec3_6, vec3_5);

        vec3.set(vec3_7, mat4_2[4] * vec3_8[1], mat4_2[5] * vec3_8[1], mat4_2[6] * vec3_8[1]);
        vec3.add(vec3_7, vec3_7, vec3_4);
        vec3.transformMat4(vec3_7, vec3_7, mat4_0);
        vec3.subtract(up, vec3_7, vec3_5);

        if (vec3.squaredLength(right) < 1e-8 || vec3.squaredLength(up) < 1e-8)
        {
            return false;
        }

        vec3.cross(normal, right, up);
        if (vec3.squaredLength(normal) < 1e-8)
        {
            return false;
        }

        vec3.normalize(normal, normal);
        return true;
    }

    /**
     * Creates a scaling line set.
     * @returns {EveCurveLineSet}
     */
    BuildScalingLineSet()
    {
        const
            set = this.CreateLineSet("scaling"),
            size = this.size * 0.82,
            box = this.size * 0.065;

        for (let i = 0; i < AXES.length; i++)
        {
            const { vector, color, name } = AXES[i];
            vec3.scale(vec3_0, vector, size);
            set.AddStraightLine([ 0, 0, 0 ], vec3_0, this.width, color, color).name = `${name} scale`;
            this.AddBox(set, vec3_0, box, this.width, color, `${name} scale handle`);
        }

        this.AddBox(set, [ 0, 0, 0 ], box * 0.9, this.width, COLOR_YELLOW, "uniform scale");
        return this.FinishLineSet(set);
    }

    /**
     * Builds scaling hit proxies.
     * @param {Array} out
     * @returns {Array}
     */
    BuildScalingHitProxies(out)
    {
        const
            size = this.size * 0.82,
            radius = this.GetPickRadius(),
            boxRadius = Math.max(this.size * 0.085, radius * 1.35);

        for (let i = 0; i < AXES.length; i++)
        {
            const { name } = AXES[i];
            this.AddAxisBoxProxy(out, "scaling", name, "axis", size * 0.08, size - boxRadius * 0.5, radius, 2);
            this.AddBoxProxy(out, "scaling", name, "handle", this.constructor.GetAxisPoint(vec3_0, name, size), boxRadius, 1);
        }

        this.AddBoxProxy(out, "scaling", "uniform", "handle", [ 0, 0, 0 ], boxRadius * 0.9, 0);
        return out;
    }

    /**
     * Gets the local-space proxy radius.
     * @returns {Number}
     */
    GetPickRadius()
    {
        return this.pickRadius || Math.max(this.size * 0.035, this.width * 2);
    }

    /**
     * Adds a local axis-aligned box proxy.
     * @param {Array} out
     * @param {String} mode
     * @param {String} axis
     * @param {String} handle
     * @param {Number} start
     * @param {Number} end
     * @param {Number} radius
     * @param {Number} priority
     */
    AddAxisBoxProxy(out, mode, axis, handle, start, end, radius, priority)
    {
        const
            index = AXIS_INDICES[axis],
            min = vec3.fromValues(-radius, -radius, -radius),
            max = vec3.fromValues(radius, radius, radius);

        min[index] = Math.min(start, end);
        max[index] = Math.max(start, end);

        out.push({
            type: "box",
            name: `${axis} ${mode} ${handle}`,
            mode,
            axis,
            handle,
            min,
            max,
            priority
        });
    }

    /**
     * Adds a local box proxy centered on a point.
     * @param {Array} out
     * @param {String} mode
     * @param {String} axis
     * @param {String} handle
     * @param {vec3|Array} center
     * @param {Number} radius
     * @param {Number} priority
     */
    AddBoxProxy(out, mode, axis, handle, center, radius, priority)
    {
        out.push({
            type: "box",
            name: `${axis} ${mode} ${handle}`,
            mode,
            axis,
            handle,
            min: vec3.fromValues(center[0] - radius, center[1] - radius, center[2] - radius),
            max: vec3.fromValues(center[0] + radius, center[1] + radius, center[2] + radius),
            priority
        });
    }

    /**
     * Adds a sampled local ring proxy.
     * @param {Array} out
     * @param {String} axis
     * @param {String} plane
     * @param {Number} radius
     * @param {Number} tubeRadius
     * @param {Number} segments
     * @param {Number} priority
     */
    AddRingProxy(out, axis, plane, radius, tubeRadius, segments, priority)
    {
        const proxy = {
            type: "ring",
            name: `${axis} rotation ring`,
            mode: "rotation",
            axis,
            handle: "ring",
            plane,
            radius,
            tubeRadius,
            segments,
            priority
        };

        out.push(proxy);
        return proxy;
    }

    /**
     * Creates a configured line set.
     * @param {String} name
     * @returns {EveCurveLineSet}
     */
    CreateLineSet(name)
    {
        const set = new EveCurveLineSet();
        set.name = this.name ? `${this.name}_${name}` : `tnyTransformGizmo_${name}`;
        set.additive = this.additive;
        set.enableDepth = this.enableDepth;
        set.pickable = this.pickable;
        set.display = this.display;
        return set;
    }

    /**
     * Initializes a line set.
     * @param {EveCurveLineSet} set
     * @returns {EveCurveLineSet}
     */
    FinishLineSet(set)
    {
        set.Initialize();
        return set;
    }

    /**
     * Adds arrow head lines.
     * @param {EveCurveLineSet} set
     * @param {vec3} axis
     * @param {vec3} base
     * @param {Number} length
     * @param {Number} width
     * @param {Number} lineWidth
     * @param {vec4} color
     */
    AddArrowHead(set, axis, base, length, width, lineWidth, color)
    {
        this.constructor.GetPerpendicularBasis(axis, vec3_2, vec3_3);

        vec3.scaleAndAdd(vec3_0, base, axis, length);
        for (let i = 0; i < 4; i++)
        {
            const side = i < 2 ? vec3_2 : vec3_3;
            vec3.scaleAndAdd(vec3_1, base, side, i % 2 ? -width : width);
            set.AddStraightLine(vec3_1, vec3_0, lineWidth, color, color);
        }
    }

    /**
     * Adds a wire box centered on a position.
     * @param {EveCurveLineSet} set
     * @param {vec3|Array} center
     * @param {Number} radius
     * @param {Number} width
     * @param {vec4} color
     * @param {String} name
     */
    AddBox(set, center, radius, width, color, name)
    {
        const
            min = vec3.set(vec3_0, center[0] - radius, center[1] - radius, center[2] - radius),
            max = vec3.set(vec3_1, center[0] + radius, center[1] + radius, center[2] + radius),
            lines = set.AddBoxLinesFromBounds(min, max, width, color, color);

        for (let i = 0; i < lines.length; i++)
        {
            lines[i].name = name;
        }
    }

    /**
     * Adds a circle on a principal plane.
     * @param {EveCurveLineSet} set
     * @param {String} name
     * @param {String} plane
     * @param {Number} radius
     * @param {Number} segments
     * @param {Number} width
     * @param {vec4} color
     */
    AddCircle(set, name, plane, radius, segments, width, color)
    {
        const
            step = Math.PI * 2 / segments,
            lines = [];

        for (let i = 0; i < segments; i++)
        {
            this.constructor.SetCirclePoint(vec3_0, plane, radius, step * i);
            this.constructor.SetCirclePoint(vec3_1, plane, radius, step * (i + 1));
            const line = set.AddStraightLine(vec3_0, vec3_1, width, color, color);
            line.name = name;
            lines.push(line);
        }

        return lines;
    }

    /**
     * Creates a translation gizmo.
     * @param {Object} [options]
     * @returns {TnyTranslationGizmo}
     */
    static Translation(options = {})
    {
        return new TnyTranslationGizmo(options);
    }

    /**
     * Creates a rotation gizmo.
     * @param {Object} [options]
     * @returns {TnyRotationGizmo}
     */
    static Rotation(options = {})
    {
        return new TnyRotationGizmo(options);
    }

    /**
     * Creates a scaling gizmo.
     * @param {Object} [options]
     * @returns {TnyScalingGizmo}
     */
    static Scaling(options = {})
    {
        return new TnyScalingGizmo(options);
    }

    /**
     * Creates and installs a transform gizmo.
     * @param {Object} [options]
     * @returns {TnyTransformGizmo}
     */
    static Install(options = {})
    {
        const gizmo = new this(options);
        return gizmo.Install(options.client || options.scene || options.targetScene);
    }

    /**
     * Gets a scene's line set list.
     * @param {*} scene
     * @returns {Array|null}
     */
    static GetSceneLineSets(scene)
    {
        const wrapped = scene && (scene.wrapped || scene);
        return wrapped && wrapped.lineSets || scene && scene.lineSets || null;
    }

    /**
     * Gets a scene's gizmo object list.
     * @param {*} scene
     * @returns {Array|null}
     */
    static GetSceneGizmoObjects(scene)
    {
        const wrapped = scene && (scene.wrapped || scene);
        return wrapped && wrapped.gizmoObjects || scene && scene.gizmoObjects || null;
    }

    /**
     * Gets a scene's background object list.
     * @param {*} scene
     * @returns {Array|null}
     */
    static GetSceneBackgroundObjects(scene)
    {
        const wrapped = scene && (scene.wrapped || scene);
        return wrapped && wrapped.backgroundObjects || scene && scene.backgroundObjects || null;
    }

    /**
     * Resolves the default debug install target.
     * @returns {*}
     */
    static ResolveDefaultInstallTarget()
    {
        if (typeof window === "undefined" || !window.tiny) return null;
        return window.tiny;
    }

    /**
     * Resolves a wrapped scene for controls.
     * @param {*} target
     * @returns {*}
     */
    static ResolveControlScene(target)
    {
        if (!target) target = this.ResolveDefaultInstallTarget();
        if (!target) return null;
        if (target.IntersectFromEvent) return target;
        if (target.scene && target.scene.IntersectFromEvent) return target.scene;
        if (target.wrapped && target.wrapped.IntersectFromEvent) return target.wrapped;
        if (target.scene && target.scene.wrapped && target.scene.wrapped.IntersectFromEvent) return target.scene.wrapped;
        return null;
    }

    /**
     * Resolves a DOM element for controls.
     * @param {*} target
     * @returns {*}
     */
    static ResolveControlElement(target)
    {
        if (target)
        {
            if (target.canvas2d) return target.canvas2d;
            if (target.canvas) return target.canvas;
            if (target.element) return target.element;
            if (target.domElement) return target.domElement;
        }

        if (typeof window !== "undefined")
        {
            if (window.tw2 && window.tw2.canvas2d) return window.tw2.canvas2d;
            if (window.tiny)
            {
                return window.tiny.canvas2d || window.tiny.canvas || window.tiny.domElement || null;
            }
        }

        return null;
    }

    /**
     * Resolves a keyboard event target for controls.
     * @param {*} target
     * @returns {*}
     */
    static ResolveControlKeyTarget(target)
    {
        if (target)
        {
            if (target.keyTarget) return target.keyTarget;
            if (target.document) return target.document;
        }

        if (typeof window !== "undefined") return window;
        if (typeof document !== "undefined") return document;
        return null;
    }

    /**
     * Resolves an input manager from a control target.
     * @param {*} target
     * @returns {*}
     */
    static ResolveControlInput(target)
    {
        if (!target) target = this.ResolveDefaultInstallTarget();
        if (target)
        {
            if (target.input) return target.input;
            if (target.tw2 && target.tw2.input) return target.tw2.input;
            if (target.wrapped && target.wrapped.input) return target.wrapped.input;
            if (target.scene && target.scene.input) return target.scene.input;
            if (target.scene && target.scene.wrapped && target.scene.wrapped.input) return target.scene.wrapped.input;
        }

        if (tw2 && tw2.input) return tw2.input;

        if (typeof window !== "undefined")
        {
            if (window.tw2 && window.tw2.input) return window.tw2.input;
            if (window.tiny && window.tiny.input) return window.tiny.input;
        }

        return null;
    }

    /**
     * Resolves a camera from a control target.
     * @param {*} target
     * @returns {*}
     */
    static ResolveControlCamera(target)
    {
        if (!target) target = this.ResolveDefaultInstallTarget();
        if (!target) return null;
        if (target.camera) return target.camera;
        if (target.wrapped && target.wrapped.camera) return target.wrapped.camera;
        if (target.scene && target.scene.camera) return target.scene.camera;
        return null;
    }

    /**
     * Checks if a keyboard event came from an editable element.
     * @param {KeyboardEvent} event
     * @returns {Boolean}
     */
    static IsEditableInputEvent(event)
    {
        const element = event && event.target;
        if (!element) return false;

        const tag = element.tagName && element.tagName.toLowerCase();
        return !!(
            element.isContentEditable ||
            tag === "input" ||
            tag === "textarea" ||
            tag === "select"
        );
    }

    /**
     * Notifies a target after direct transform edits.
     * @param {*} target
     */
    static NotifyTargetModified(target)
    {
        if (target.RebuildTransforms)
        {
            target.RebuildTransforms({ force: true, skipUpdate: true });
        }
    }

    /**
     * Clamps an incremental scale factor.
     * @param {Number} value
     * @returns {Number}
     */
    static ClampScaleFactor(value)
    {
        if (!Number.isFinite(value)) return 1;
        return Math.max(0.001, Math.min(1000, value));
    }

    /**
     * Clamps a scale component while preserving sign.
     * @param {Number} value
     * @returns {Number}
     */
    static ClampScaleValue(value)
    {
        if (!Number.isFinite(value)) return 1;

        const min = 1e-5;
        if (Math.abs(value) >= min) return value;
        return value < 0 ? -min : min;
    }

    /**
     * Normalizes a mode string.
     * @param {String} mode
     * @returns {{translation:Boolean, rotation:Boolean, scaling:Boolean}}
     */
    static NormalizeModes(mode = "all")
    {
        const
            normalized = String(mode || "all").toLowerCase(),
            tokens = normalized.split(/[\s,|+_-]+/).filter(Boolean),
            shortcut = tokens.length === 1 && /^[trs]+$/.test(tokens[0]) ? tokens[0] : "",
            all = normalized === "all" || normalized === "transform";

        function has(...names)
        {
            return tokens.some(token => names.includes(token));
        }

        return {
            translation: all || has("translation", "translate", "move") || shortcut.includes("t"),
            rotation: all || has("rotation", "rotate") || shortcut.includes("r"),
            scaling: all || has("scaling", "scale") || shortcut.includes("s")
        };
    }

    /**
     * Sorts gizmo intersections.
     * @param {Object} a
     * @param {Object} b
     * @returns {Number}
     */
    static SortIntersections(a, b)
    {
        return a.distance - b.distance ||
            a.priority - b.priority ||
            a.pickDistanceSquared - b.pickDistanceSquared;
    }

    /**
     * Gets a local point on an axis.
     * @param {vec3} out
     * @param {String} axis
     * @param {Number} distance
     * @returns {vec3}
     */
    static GetAxisPoint(out, axis, distance)
    {
        vec3.set(out, 0, 0, 0);
        out[AXIS_INDICES[axis]] = distance;
        return out;
    }

    /**
     * Gets closest points between a ray and a segment.
     * @param {ray3} ray
     * @param {vec3} start
     * @param {vec3} end
     * @param {vec3} outRay
     * @param {vec3} outSegment
     * @returns {{distanceSquared:Number, rayDistance:Number, segmentFactor:Number}}
     */
    static GetRaySegmentClosestPoints(ray, start, end, outRay, outSegment)
    {
        const
            ux = ray[3],
            uy = ray[4],
            uz = ray[5],
            vx = end[0] - start[0],
            vy = end[1] - start[1],
            vz = end[2] - start[2],
            wx = ray[0] - start[0],
            wy = ray[1] - start[1],
            wz = ray[2] - start[2],
            a = ux * ux + uy * uy + uz * uz,
            b = ux * vx + uy * vy + uz * vz,
            c = vx * vx + vy * vy + vz * vz,
            d = ux * wx + uy * wy + uz * wz,
            e = vx * wx + vy * wy + vz * wz,
            denominator = a * c - b * b;

        let rayDistance, segmentFactor;

        if (c <= 1e-8)
        {
            segmentFactor = 0;
            rayDistance = Math.max(0, -d / a);
        }
        else if (denominator < 1e-8)
        {
            segmentFactor = Math.max(0, Math.min(1, e / c));
            rayDistance = Math.max(0, (b * segmentFactor - d) / a);
        }
        else
        {
            rayDistance = (b * e - c * d) / denominator;
            segmentFactor = (a * e - b * d) / denominator;

            if (rayDistance < 0)
            {
                rayDistance = 0;
                segmentFactor = Math.max(0, Math.min(1, e / c));
            }
            else if (segmentFactor < 0)
            {
                segmentFactor = 0;
                rayDistance = Math.max(0, -d / a);
            }
            else if (segmentFactor > 1)
            {
                segmentFactor = 1;
                rayDistance = Math.max(0, (b - d) / a);
            }
        }

        ray3.get(outRay, ray, rayDistance);
        outSegment[0] = start[0] + vx * segmentFactor;
        outSegment[1] = start[1] + vy * segmentFactor;
        outSegment[2] = start[2] + vz * segmentFactor;

        return {
            distanceSquared: vec3.squaredDistance(outRay, outSegment),
            rayDistance,
            segmentFactor
        };
    }

    /**
     * Gets closest parameters between a ray and an infinite line.
     * @param {ray3} ray
     * @param {vec3} lineOrigin
     * @param {vec3} lineDirection
     * @returns {{rayDistance:Number, lineDistance:Number}}
     */
    static GetRayLineClosest(ray, lineOrigin, lineDirection)
    {
        const
            ux = ray[3],
            uy = ray[4],
            uz = ray[5],
            vx = lineDirection[0],
            vy = lineDirection[1],
            vz = lineDirection[2],
            wx = ray[0] - lineOrigin[0],
            wy = ray[1] - lineOrigin[1],
            wz = ray[2] - lineOrigin[2],
            a = ux * ux + uy * uy + uz * uz,
            b = ux * vx + uy * vy + uz * vz,
            c = vx * vx + vy * vy + vz * vz,
            d = ux * wx + uy * wy + uz * wz,
            e = vx * wx + vy * wy + vz * wz,
            denominator = a * c - b * b;

        let rayDistance, lineDistance;

        if (denominator < 1e-8)
        {
            rayDistance = 0;
            lineDistance = e / c;
        }
        else
        {
            rayDistance = (b * e - c * d) / denominator;
            lineDistance = (a * e - b * d) / denominator;

            if (rayDistance < 0)
            {
                rayDistance = 0;
                lineDistance = e / c;
            }
        }

        return { rayDistance, lineDistance };
    }

    /**
     * Gets two vectors perpendicular to an axis.
     * @param {vec3} axis
     * @param {vec3} outA
     * @param {vec3} outB
     */
    static GetPerpendicularBasis(axis, outA, outB)
    {
        if (Math.abs(axis[0]) > 0.5)
        {
            vec3.copy(outA, vec3.Y_AXIS);
        }
        else
        {
            vec3.copy(outA, vec3.X_AXIS);
        }

        vec3.cross(outB, axis, outA);
        vec3.normalize(outB, outB);
        vec3.cross(outA, outB, axis);
        vec3.normalize(outA, outA);
    }

    /**
     * Sets a circle point on a principal plane.
     * @param {vec3} out
     * @param {String} plane
     * @param {Number} radius
     * @param {Number} radians
     * @returns {vec3}
     */
    static SetCirclePoint(out, plane, radius, radians)
    {
        const
            s = Math.sin(radians) * radius,
            c = Math.cos(radians) * radius;

        switch (plane)
        {
            case "x":
                return vec3.set(out, 0, c, s);

            case "y":
                return vec3.set(out, c, 0, s);

            default:
                return vec3.set(out, s, c, 0);
        }
    }

    /**
     * Sets a point on a circle from two local basis vectors.
     * @param {vec3} out
     * @param {vec3} right
     * @param {vec3} up
     * @param {Number} radius
     * @param {Number} radians
     * @returns {vec3}
     */
    static SetCircleBasisPoint(out, right, up, radius, radians)
    {
        const
            s = Math.sin(radians) * radius,
            c = Math.cos(radians) * radius;

        out[0] = right[0] * s + up[0] * c;
        out[1] = right[1] * s + up[1] * c;
        out[2] = right[2] * s + up[2] * c;
        return out;
    }

}


@meta.tny.type("TnyTranslationGizmo")
@meta.tny.define("TnyTranslationGizmo")
export class TnyTranslationGizmo extends TnyTransformGizmo
{
    constructor(options = {})
    {
        super({ ...options, mode: "translation" });
    }
}


@meta.tny.type("TnyRotationGizmo")
@meta.tny.define("TnyRotationGizmo")
export class TnyRotationGizmo extends TnyTransformGizmo
{
    constructor(options = {})
    {
        super({ ...options, mode: "rotation" });
    }
}


@meta.tny.type("TnyScalingGizmo")
@meta.tny.define("TnyScalingGizmo")
export class TnyScalingGizmo extends TnyTransformGizmo
{
    constructor(options = {})
    {
        super({ ...options, mode: "scaling" });
    }
}


TnyTransformGizmo.Modes = {
    ALL: "all",
    TRANSLATION: "translation",
    ROTATION: "rotation",
    SCALING: "scaling"
};

TnyTransformGizmo.Colors = {
    x: AXES[0].color,
    y: AXES[1].color,
    z: AXES[2].color,
    white: COLOR_WHITE,
    yellow: COLOR_YELLOW,
    grey: COLOR_GREY
};

TnyTransformGizmo.Axes = AXES;
