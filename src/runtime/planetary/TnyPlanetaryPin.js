import { mat4, num, quat, vec3 } from "math";
import { PlacePin, PinDirection } from "eve/pi/piColony";
import { meta } from "utils";
import { TnySpaceObject } from "../objects/TnySpaceObject";


/**
 * Editable runtime view of one PI installation or extractor head.
 *
 * A pin is composite: its icon, gauge and progress are separate sphere-pin
 * children, while its optional 3D presentation is a normal TnySpaceObject.
 * The wrapper keeps those pieces together without making any of them the
 * owner of colony links or commodity routes.
 */
@meta.define("TnyPlanetaryPin")
export class TnyPlanetaryPin extends meta.Model
{

    colony = null;
    record = null;
    point = null;
    source = null;
    layers = new Map();

    /** Inspector label; PI ids remain strings because ESI ids can be large. */
    @meta.string
    name = "";

    /** Normalized fill amount displayed by the pin's circular progress layer. */
    @meta.float
    progress = 0;

    /** Optional 3D presentation attached to this pin. */
    @meta.struct("TnySpaceObject")
    geometry = null;
    geometryOptions = null;
    _geometryBaseScale = vec3.fromValues(1, 1, 1);
    _geometryAltitude = 0;
    _geometryRotationSpeed = 0;
    _geometryRotationAxis = vec3.fromValues(0, 1, 0);
    _geometryAnimation = null;
    _progressAnimation = null;

    /**
     * Creates a wrapper for one rendered colony point.
     * @param {TnyPlanetaryColony} colony - Owning colony
     * @param {Object} point - Normalized facility or extractor-head position
     * @param {Object} source - Source ESI pin record
     */
    constructor(colony, point, source)
    {
        super();
        this.colony = colony || null;
        this.point = { ...point };
        this.name = point.isHead ? `Extractor head ${point.id}` : `PI pin ${point.id}`;
        this.source = source || null;
        const heads = source && source.extractor_details && source.extractor_details.heads;
        this.record = point.isHead && heads
            ? heads.find(x => String(point.parentId) + ":" + x.head_id === point.id) || null
            : source;
    }

    /**
     * @returns {String} Stable facility id, or the synthetic extractor-head id
     */
    get id()
    {
        return this.point.id;
    }

    /**
     * @returns {Number} EVE type id inherited from the facility record
     */
    get typeId()
    {
        return this.point.typeId;
    }

    /**
     * @returns {String|Number|null} Parent facility id for an extractor head
     */
    get parentId()
    {
        return this.point.parentId;
    }

    /**
     * @returns {Boolean} Whether this point is an ECU extractor head
     */
    get isExtractorHead()
    {
        return !!this.point.isHead;
    }

    /**
     * Registers one visual sphere-pin layer.
     * @param {String} role - Layer role such as `icon` or `progress`
     * @param {EveChildSpherePin} layer
     * @returns {TnyPlanetaryPin}
     */
    AddLayer(role, layer)
    {
        if (!role || !layer) return this;
        this.layers.set(role, layer);
        layer.pi = this.point;
        if (role === "progress") this.progress = layer.pinAlphaThreshold ?? 0;
        return this;
    }

    /**
     * @param {String} role
     * @returns {EveChildSpherePin|null}
     */
    GetLayer(role)
    {
        return this.layers.get(role) || null;
    }

    /**
     * @param {Array} [out=[]]
     * @returns {Array<EveChildSpherePin>}
     */
    GetLayers(out = [])
    {
        out.push(...this.layers.values());
        return out;
    }

    /**
     * @param {Boolean} value
     * @returns {TnyPlanetaryPin}
     */
    SetVisible(value)
    {
        value = !!value;
        for (const layer of this.layers.values()) layer.display = value;
        if (this.geometry) this.geometry.SetDisplay(value);
        return this;
    }

    /**
     * Sets the normalized circular gauge fill and cancels its active tween.
     * The decorated `progress` field can also be changed with `SetValues`.
     * @param {Number} value - Fill amount, clamped to 0..1
     * @returns {TnyPlanetaryPin}
     */
    SetProgress(value)
    {
        this._CancelProgressAnimation();
        this.SetValues({ progress: num.clamp(Number(value) || 0, 0, 1) });
        return this;
    }

    /**
     * Writes the normalized gauge value to the wrapper and rendered threshold.
     * This does not cancel an animation, allowing the update pass to use it.
     * @param {Number} value
     * @returns {TnyPlanetaryPin}
     * @private
     */
    _SetProgress(value)
    {
        value = num.clamp(Number(value) || 0, 0, 1);
        this.progress = value;
        const layer = this.GetLayer("progress");
        if (layer) layer.pinAlphaThreshold = value;
        return this;
    }

    /**
     * @returns {Number} Current normalized circular gauge fill
     */
    GetProgress()
    {
        return this.progress;
    }

    /** Applies inspector and `SetValues` edits to the rendered progress layer. */
    OnValueChanged({ prop } = {})
    {
        if (!prop || prop === "progress") this._SetProgress(this.progress);
    }

    /**
     * Tweens the circular gauge fill during the Tny wrapper update pass.
     * Starting another progress change resolves and replaces the old tween.
     * @param {Number} value - Destination fill amount, clamped to 0..1
     * @param {Object} [options]
     * @param {Number} [options.duration=0] - Duration in seconds
     * @param {String|Function} [options.easing="easeOut"]
     * @returns {Promise<TnyPlanetaryPin>}
     */
    AnimateProgress(value, options = {})
    {
        this._CancelProgressAnimation();
        const duration = Math.max(0, Number(options.duration) || 0);
        const animation = {
            elapsed: 0,
            duration,
            easing: TnyPlanetaryPin.ResolveEasing(options.easing),
            from: this.GetProgress(),
            to: num.clamp(Number(value) || 0, 0, 1),
            resolve: null
        };

        if (!duration)
        {
            this._SetProgress(animation.to);
            return Promise.resolve(this);
        }

        this._progressAnimation = animation;
        return new Promise(resolve => animation.resolve = resolve);
    }

    /**
     * Sets the RGBA color of one visual layer.
     * @param {String} role
     * @param {Array<Number>} color
     * @returns {TnyPlanetaryPin}
     */
    SetColor(role, color)
    {
        const layer = this.GetLayer(role);
        if (layer && color)
        {
            if (layer.color?.set) layer.color.set(color);
            else layer.color = color;
        }
        return this;
    }

    /**
     * Moves the pin on the unit planet and rebuilds colony connections.
     * @param {Number} latitude - ESI latitude in radians
     * @param {Number} longitude - ESI longitude in radians
     * @returns {TnyPlanetaryPin}
     */
    SetPosition(latitude, longitude)
    {
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude))
        {
            throw new TypeError("A PI pin position requires finite latitude and longitude");
        }

        this.point.latitude = latitude;
        this.point.longitude = longitude;
        if (this.record)
        {
            this.record.latitude = latitude;
            this.record.longitude = longitude;
        }

        for (const layer of this.layers.values())
        {
            PlacePin(layer, this.point, { convention: this.colony?.options?.convention });
        }

        this._PlaceGeometry();
        this.colony?.RebuildLines();
        return this;
    }

    /**
     * @param {Array} [out=[]]
     * @returns {Array<Object>} Connected facility links
     */
    GetLinks(out = [])
    {
        return this.colony ? this.colony.GetLinksForPin(this.id, out) : out;
    }

    /**
     * @param {Array} [out=[]]
     * @returns {Array<Object>} Commodity routes using this pin
     */
    GetRoutes(out = [])
    {
        return this.colony ? this.colony.GetRoutesForPin(this.id, out) : out;
    }

    /**
     * Attaches a normal runtime space object as this pin's 3D presentation.
     * @param {TnySpaceObject|null} geometry
     * @param {Object} [options]
     * @returns {TnyPlanetaryPin}
     */
    SetGeometry(geometry, options = {})
    {
        if (geometry && !(geometry instanceof TnySpaceObject))
        {
            throw new TypeError("Planetary pin geometry must be a TnySpaceObject");
        }

        if (this.geometry === geometry)
        {
            this.geometryOptions = { ...(this.geometryOptions || {}), ...options };
            this._PlaceGeometry();
            return this;
        }

        this.ClearGeometry();
        this.geometry = geometry || null;
        this.geometryOptions = { radius: 1.0015, altitude: 0, ...options };

        if (!geometry) return this;

        vec3.copy(this._geometryBaseScale, geometry.scaling);
        this._geometryAltitude = Number(this.geometryOptions.altitude) || 0;
        geometry.SetDisplay(this.geometryOptions.display !== false);
        this._PlaceGeometry();

        const scene = this.geometryOptions.scene || this.colony?.scene;
        if (scene && !scene.GetObjects().includes(geometry)) scene.AddObject(geometry);
        return this;
    }

    /**
     * Detaches and forgets the optional 3D presentation.
     * @returns {TnyPlanetaryPin}
     */
    ClearGeometry()
    {
        this._CancelGeometryAnimation();
        if (this.geometry)
        {
            const scene = this.geometryOptions?.scene || this.colony?.scene;
            if (scene) scene.RemoveObject(this.geometry);
        }
        this.geometry = null;
        this.geometryOptions = null;
        return this;
    }

    /**
     * Sets continuous local rotation for the optional 3D presentation.
     * @param {Number} [speed=0] - Radians per second
     * @param {Array<Number>} [axis=[0,1,0]]
     * @returns {TnyPlanetaryPin}
     */
    SetGeometryRotation(speed = 0, axis = [ 0, 1, 0 ])
    {
        this._geometryRotationSpeed = Number(speed) || 0;
        vec3.copy(this._geometryRotationAxis, axis);
        vec3.normalize(this._geometryRotationAxis, this._geometryRotationAxis);
        return this;
    }

    /**
     * @param {Object} [options]
     * @returns {Promise<TnyPlanetaryPin>}
     */
    ShowGeometry(options = {})
    {
        if (!this.geometry) return Promise.resolve(this);
        const { duration = 0.35, easing = "easeOut", fromScale = 0 } = options;
        const target = vec3.clone(this._geometryBaseScale);
        this.geometry.SetDisplay(true);
        if (fromScale !== null)
        {
            const start = TnyPlanetaryPin.ToScale(fromScale, TnyPlanetaryPin.global.vec3_0);
            this.geometry.SetScale(start);
        }
        return this.AnimateGeometry({ scaling: target }, { duration, easing });
    }

    /**
     * @param {Object} [options]
     * @returns {Promise<TnyPlanetaryPin>}
     */
    HideGeometry(options = {})
    {
        if (!this.geometry) return Promise.resolve(this);
        const { duration = 0.25, easing = "easeIn" } = options;
        return this.AnimateGeometry({ scale: 0 }, { duration, easing }).then(() =>
        {
            if (this.geometry) this.geometry.SetDisplay(false);
            return this;
        });
    }

    /**
     * Lerps the geometry's local scaling, rotation and surface altitude.
     * Additional channels can be added without changing colony or line APIs.
     * @param {Object} [target]
     * @param {Object} [options]
     * @returns {Promise<TnyPlanetaryPin>}
     */
    AnimateGeometry(target = {}, options = {})
    {
        if (!this.geometry) return Promise.resolve(this);
        this._CancelGeometryAnimation();

        const duration = Math.max(0, Number(options.duration) || 0);
        const animation = {
            elapsed: 0,
            duration,
            easing: TnyPlanetaryPin.ResolveEasing(options.easing),
            fromScale: vec3.clone(this.geometry.scaling),
            toScale: target.scaling || target.scale !== undefined
                ? vec3.clone(TnyPlanetaryPin.ToScale(target.scaling ?? target.scale, TnyPlanetaryPin.global.vec3_0))
                : vec3.clone(this.geometry.scaling),
            fromRotation: quat.clone(this.geometry.rotation),
            toRotation: target.rotation ? quat.clone(target.rotation) : quat.clone(this.geometry.rotation),
            fromAltitude: this._geometryAltitude,
            toAltitude: target.altitude === undefined ? this._geometryAltitude : Number(target.altitude) || 0,
            resolve: null
        };

        if (!duration)
        {
            this._ApplyGeometryAnimation(animation, 1);
            return Promise.resolve(this);
        }

        this._geometryAnimation = animation;
        return new Promise(resolve => animation.resolve = resolve);
    }

    /**
     * Advances wrapper-owned gauge and geometry animation.
     * Raw EVE children are updated separately by EveSpaceScene.
     * @param {Number} dt - Elapsed seconds
     * @returns {Boolean} Whether wrapper state was updated
     */
    Update(dt)
    {
        let updated = false;

        const progress = this._progressAnimation;
        if (progress)
        {
            progress.elapsed += Math.max(0, Number(dt) || 0);
            const linear = Math.min(1, progress.elapsed / progress.duration);
            const t = progress.easing(linear);
            this._SetProgress(progress.from + (progress.to - progress.from) * t);
            this._progressAnimation = progress;
            updated = true;
            if (linear >= 1)
            {
                this._progressAnimation = null;
                const resolve = progress.resolve;
                progress.resolve = null;
                resolve?.(this);
            }
        }

        if (!this.geometry) return updated;

        const animation = this._geometryAnimation;
        if (animation)
        {
            animation.elapsed += Math.max(0, Number(dt) || 0);
            const linear = Math.min(1, animation.elapsed / animation.duration);
            this._ApplyGeometryAnimation(animation, animation.easing(linear));
            if (linear >= 1)
            {
                this._geometryAnimation = null;
                const resolve = animation.resolve;
                animation.resolve = null;
                resolve?.(this);
            }
        }

        if (this._geometryRotationSpeed)
        {
            this.geometry.RotateOnAxisAngle(this._geometryRotationAxis, this._geometryRotationSpeed * dt);
        }

        this._SyncGeometry();
        return true;
    }

    /**
     * Releases layers, geometry and pending animations.
     * @returns {TnyPlanetaryPin}
     */
    Dispose()
    {
        this._CancelProgressAnimation();
        this.ClearGeometry();
        this.layers.clear();
        this.colony = null;
        return this;
    }

    /**
     * Samples a geometry tween into the wrapped transform.
     * @param {Object} animation
     * @param {Number} t - Eased interpolation amount in the range 0..1
     * @private
     */
    _ApplyGeometryAnimation(animation, t)
    {
        vec3.lerp(this.geometry.scaling, animation.fromScale, animation.toScale, t);
        quat.slerp(this.geometry.rotation, animation.fromRotation, animation.toRotation, t);
        this.geometry._rebuildLocal = true;
        this._geometryAltitude = animation.fromAltitude + (animation.toAltitude - animation.fromAltitude) * t;
        this._SetGeometryTranslation();
    }

    /**
     * Aligns geometry to the planet surface and optionally flushes it to EVE.
     * @param {Boolean} [sync=true]
     * @private
     */
    _PlaceGeometry(sync = true)
    {
        if (!this.geometry || !this.colony?.planet) return;

        const normal = this._SetGeometryTranslation();
        quat.rotationTo(this.geometry.rotation, TnyPlanetaryPin.UP, normal);
        this.geometry._rebuildLocal = true;
        this.geometry.SetParentTransform(this.colony.planet.GetTransform(TnyPlanetaryPin.global.mat4_0));
        if (sync) this._SyncGeometry();
    }

    /**
     * Derives the geometry's local translation from the pin coordinates.
     * @returns {vec3} The outward unit normal
     * @private
     */
    _SetGeometryTranslation()
    {
        const normal = PinDirection(
            TnyPlanetaryPin.global.vec3_0,
            this.point.latitude,
            this.point.longitude,
            this.colony.options.convention
        );
        const radius = Number(this.geometryOptions?.radius) || 1.0015;
        vec3.scale(this.geometry.translation, normal, radius + this._geometryAltitude);
        this.geometry._rebuildLocal = true;
        return normal;
    }

    /**
     * Copies the wrapper's computed world transform into its EVE object.
     * @private
     */
    _SyncGeometry()
    {
        const wrapped = this.geometry?.wrapped;
        if (!wrapped) return;

        const world = this.geometry.GetWorldTransform(TnyPlanetaryPin.global.mat4_1);
        if (wrapped.SetTransform)
        {
            wrapped.SetTransform(world);
        }
        else
        {
            if (wrapped.translation) mat4.getTranslation(wrapped.translation, world);
            if (wrapped.rotation) mat4.getRotation(wrapped.rotation, world);
            if (wrapped.scaling) mat4.getScaling(wrapped.scaling, world);
            wrapped._rebuildLocal = true;
        }
    }

    /**
     * Resolves and clears the active geometry tween.
     * @private
     */
    _CancelGeometryAnimation()
    {
        if (this._geometryAnimation)
        {
            const animation = this._geometryAnimation;
            this._geometryAnimation = null;
            animation.resolve?.(this);
        }
    }

    /**
     * Resolves and clears the active progress tween.
     * @private
     */
    _CancelProgressAnimation()
    {
        if (this._progressAnimation)
        {
            const animation = this._progressAnimation;
            this._progressAnimation = null;
            animation.resolve?.(this);
        }
    }

    /**
     * Converts scalar or vector input to a vec3 using the shared math helpers.
     * @param {Number|Array<Number>} value
     * @param {vec3} out
     * @returns {vec3}
     */
    static ToScale(value, out)
    {
        if (typeof value === "number") return vec3.setScalar(out, value);
        return vec3.copy(out, value || [ 1, 1, 1 ]);
    }

    /**
     * Resolves the public easing names to the shared cumulative functions.
     * @param {String|Function} value
     * @returns {Function}
     */
    static ResolveEasing(value)
    {
        if (typeof value === "function") return value;
        if (value === "easeIn") return t => num.biCumulative(t, 3);
        if (value === "easeInOut") return t => num.biCumulative(t, 2);
        if (value === "linear") return t => t;
        return t => num.biCumulative(t, 1);
    }

    static global = {
        vec3_0: vec3.create(),
        mat4_0: mat4.create(),
        mat4_1: mat4.create()
    };

}

TnyPlanetaryPin.UP = vec3.fromValues(0, 1, 0);
