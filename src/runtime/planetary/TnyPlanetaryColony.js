import { Tw2Mesh } from "core";
import { vec3 } from "math";
import { EveCurveLineSet } from "eve/item";
import { EveChildSpherePin } from "eve/pi/EveChildSpherePin";
import { AddColonyLinks, CollectColonyPoints, PlacePin, SurfacePosition } from "eve/pi/piColony";
import { meta } from "utils";
import { TnySpaceObject } from "../objects/TnySpaceObject";
import { TnyPlanetaryPin } from "./TnyPlanetaryPin";


/**
 * Editable, rendered view of one planetary colony JSON document.
 *
 * The API layer owns fetching. This class accepts plain data, owns the pin
 * wrappers and connection graph, and can serialize edits back to plain JSON.
 */
@meta.define("TnyPlanetaryColony")
export class TnyPlanetaryColony extends meta.Model
{

    planet = null;
    scene = null;
    service = null;
    data = { pins: [], links: [], routes: [] };
    options = {};

    /** Inspector-facing list of the rendered facility and extractor-head pins. */
    @meta.list("TnyPlanetaryPin")
    items = [];

    pins = new Map();
    links = new Map();
    routes = new Map();
    lineSets = new Map();
    _children = [];
    _pinMeshes = new Map();
    _generation = 0;

    /**
     * @param {TnyPlanet} planet - Loaded planet that receives the visual children
     * @param {Object} [options]
     */
    constructor(planet, options = {})
    {
        super();
        if (!planet?.wrapped) throw new TypeError("A planetary colony requires a loaded TnyPlanet");
        this.planet = planet;
        this.service = options.service || null;
        this.scene = options.scene || null;
    }

    /**
     * Replaces the colony from plain ESI-shaped JSON and rebuilds its visuals.
     * Input data is cloned so edits made through this wrapper are isolated.
     * @param {Object} data
     * @param {Array<Object>} data.pins
     * @param {Array<Object>} [data.links]
     * @param {Array<Object>} [data.routes]
     * @param {Object} [options]
     * @returns {Promise<TnyPlanetaryColony>}
     */
    async SetData(data, options = {})
    {
        if (!data || !Array.isArray(data.pins)) throw new TypeError("Invalid planetary colony JSON");

        this.Clear();
        const generation = ++this._generation;
        this.scene = options.scene || this.scene || null;
        this.options = {
            ...TnyPlanetaryColony.defaults,
            ...options,
            scene: null,
            service: null
        };
        this.data = CloneData({
            ...data,
            pins: data.pins || [],
            links: data.links || [],
            routes: data.routes || []
        });

        this._IndexConnections();
        this._BuildPins();
        this.RebuildLines();
        await this._BuildGeometry(generation);

        if (generation !== this._generation) return this;
        this.planet.wrapped._boundsDirty = true;
        return this;
    }

    /** @param {String|Number} id @returns {TnyPlanetaryPin|null} */
    GetPin(id)
    {
        return this.pins.get(String(id)) || null;
    }

    /** @param {Array} [out=[]] @returns {Array<TnyPlanetaryPin>} */
    GetPins(out = [])
    {
        out.push(...this.items);
        return out;
    }

    /** @param {String|Number} id @param {Array} [out=[]] @returns {Array<Object>} */
    GetLinksForPin(id, out = [])
    {
        id = String(id);
        for (const link of this.links.values())
        {
            if (String(link.source_pin_id) === id || String(link.destination_pin_id) === id) out.push(link);
        }
        return out;
    }

    /** @param {String|Number} id @param {Array} [out=[]] @returns {Array<Object>} */
    GetRoutesForPin(id, out = [])
    {
        id = String(id);
        for (const route of this.routes.values())
        {
            if (String(route.source_pin_id) === id || String(route.destination_pin_id) === id ||
                route.waypoints?.some(x => String(x) === id))
            {
                out.push(route);
            }
        }
        return out;
    }

    /**
     * Sets or animates one pin's normalized circular gauge fill.
     * @param {String|Number} id
     * @param {Number} value - Fill amount, clamped to 0..1
     * @param {Object} [options]
     * @param {Number} [options.duration=0] - Tween duration in seconds
     * @param {String|Function} [options.easing]
     * @returns {TnyPlanetaryPin|Promise<TnyPlanetaryPin>}
     */
    SetPinProgress(id, value, options = {})
    {
        const pin = this.GetPin(id);
        if (!pin) throw new ReferenceError(`Unknown PI pin: ${id}`);
        return options.duration ? pin.AnimateProgress(value, options) : pin.SetProgress(value);
    }

    /** @param {Object} record @returns {Promise<TnyPlanetaryPin>} */
    async AddPin(record)
    {
        if (!record || record.pin_id === undefined) throw new TypeError("A PI pin requires pin_id");
        if (this.GetPin(record.pin_id)) throw new TypeError(`Duplicate PI pin: ${record.pin_id}`);
        const data = this.ToJSON();
        data.pins.push(CloneData(record));
        await this.SetData(data, { ...this.options, scene: this.scene });
        return this.GetPin(record.pin_id);
    }

    /**
     * Applies changes to a facility record and rebuilds only when its shape changes.
     * @param {String|Number} id
     * @param {Object} [values]
     * @returns {Promise<TnyPlanetaryPin>}
     */
    async UpdatePin(id, values = {})
    {
        const record = this.data.pins.find(x => String(x.pin_id) === String(id));
        if (!record) throw new ReferenceError(`Unknown PI pin: ${id}`);
        const changesType = values.type_id !== undefined && values.type_id !== record.type_id;
        Object.assign(record, CloneData(values));

        if (changesType || values.extractor_details !== undefined || values.schematic_id !== undefined)
        {
            await this.SetData(this.data, { ...this.options, scene: this.scene });
        }
        else
        {
            const pin = this.GetPin(id);
            if (pin && (values.latitude !== undefined || values.longitude !== undefined))
            {
                pin.SetPosition(record.latitude, record.longitude);
            }
        }
        return this.GetPin(id);
    }

    /** @param {String|Number} id @returns {Boolean} Whether the pin existed. */
    RemovePin(id)
    {
        id = String(id);
        const pin = this.GetPin(id);
        if (!pin) return false;

        const recordIndex = this.data.pins.findIndex(x => String(x.pin_id) === id);
        if (recordIndex !== -1) this.data.pins.splice(recordIndex, 1);
        this.data.links = this.data.links.filter(x => String(x.source_pin_id) !== id && String(x.destination_pin_id) !== id);
        this.data.routes = this.data.routes.filter(x => String(x.source_pin_id) !== id && String(x.destination_pin_id) !== id &&
            !x.waypoints?.some(waypoint => String(waypoint) === id));

        const removed = [ pin ];
        for (const candidate of this.pins.values())
        {
            if (String(candidate.parentId) === id) removed.push(candidate);
        }
        for (const candidate of removed) this._RemovePin(candidate);
        this._IndexConnections();
        this.RebuildLines();
        return true;
    }

    /**
     * Adds or updates an undirected facility link.
     * Extractor-head tethers are generated from ECU data and cannot be added here.
     * @param {String|Number} sourcePinId
     * @param {String|Number} destinationPinId
     * @param {Object} [options]
     * @returns {Object} Link record
     */
    Connect(sourcePinId, destinationPinId, options = {})
    {
        const source = this.GetPin(sourcePinId);
        const destination = this.GetPin(destinationPinId);
        if (!source || !destination || source.isExtractorHead || destination.isExtractorHead)
        {
            throw new ReferenceError("A planetary link requires two facility pins");
        }
        const key = LinkKey(sourcePinId, destinationPinId);
        const existing = this.links.get(key);
        if (existing)
        {
            existing.link_level = options.link_level ?? options.level ?? existing.link_level;
        }
        else
        {
            this.data.links.push({
                source_pin_id: sourcePinId,
                destination_pin_id: destinationPinId,
                link_level: options.link_level ?? options.level ?? 0
            });
        }
        this._IndexConnections();
        this.RebuildLines();
        return this.links.get(key);
    }

    /**
     * @param {String|Number} sourcePinId
     * @param {String|Number} destinationPinId
     * @returns {Boolean} Whether a link was removed
     */
    Disconnect(sourcePinId, destinationPinId)
    {
        const key = LinkKey(sourcePinId, destinationPinId);
        const before = this.data.links.length;
        this.data.links = this.data.links.filter(x => LinkKey(x.source_pin_id, x.destination_pin_id) !== key);
        if (before === this.data.links.length) return false;
        this._IndexConnections();
        this.RebuildLines();
        return true;
    }

    /** @param {Object} route @returns {Object} Stored route record. */
    AddRoute(route)
    {
        if (!route || route.route_id === undefined) throw new TypeError("A PI route requires route_id");
        const index = this.data.routes.findIndex(x => String(x.route_id) === String(route.route_id));
        if (index === -1) this.data.routes.push(CloneData(route));
        else this.data.routes[index] = CloneData(route);
        this._IndexConnections();
        if (this.options.showRoutes) this.RebuildLines();
        return this.routes.get(String(route.route_id));
    }

    /** @param {String|Number} routeId @returns {Boolean} Whether a route was removed. */
    RemoveRoute(routeId)
    {
        const before = this.data.routes.length;
        this.data.routes = this.data.routes.filter(x => String(x.route_id) !== String(routeId));
        if (before === this.data.routes.length) return false;
        this._IndexConnections();
        if (this.options.showRoutes) this.RebuildLines();
        return true;
    }

    /** @param {Boolean} value @returns {TnyPlanetaryColony} */
    SetRoutesVisible(value)
    {
        this.options.showRoutes = !!value;
        this.RebuildLines();
        return this;
    }

    /** @returns {Object} A detached copy of the editable colony JSON. */
    ToJSON()
    {
        return CloneData(this.data);
    }

    /**
     * Advances every pin's wrapper-owned animations.
     * @param {Number} dt - Elapsed seconds
     * @returns {Boolean} Whether any pin updated
     */
    Update(dt)
    {
        let updated = false;
        for (const pin of this.pins.values()) updated = pin.Update(dt) || updated;
        return updated;
    }

    /** Rebuilds shared facility, extractor and route line sets. @returns {TnyPlanetaryColony} */
    RebuildLines()
    {
        if (!this.planet?.wrapped) return this;
        this._ClearLineSets();

        if (this.data.links.length)
        {
            const set = this._CreateLineSet("links", "PI colony links", {
                texture: this.options.linkTexture,
                additive: this.options.linkAdditive
            });
            const count = AddColonyLinks(set, this.data, {
                convention: this.options.convention,
                radius: this.options.linkRadius,
                width: this.options.linkWidth,
                color: this.options.linkColor,
                endpointTrim: this.options.linkEndpointTrim ??
                    this.options.pinRadius * this.options.pinGaugeRadiusScale * 1.05
            });
            this._CommitLineSet("links", set, count);
        }

        const heads = CollectColonyPoints(this.data).filter(x => x.isHead);
        if (heads.length)
        {
            const set = this._CreateLineSet("extractors", "PI extractor head tethers", {
                texture: this.options.extractorLinkTexture,
                additive: this.options.extractorLinkAdditive
            });
            let count = 0;
            for (const head of heads)
            {
                const parent = this.GetPin(head.parentId)?.point;
                if (!parent) continue;
                const source = SurfacePosition(vec3.create(), parent, this.options.extractorLinkRadius, [ 0, 0, 0 ], this.options.convention);
                const destination = SurfacePosition(vec3.create(), head, this.options.extractorLinkRadius, [ 0, 0, 0 ], this.options.convention);
                set.AddSpheredLineCrt(source, destination, [ 0, 0, 0 ], this.options.extractorLinkWidth,
                    this.options.extractorLinkColor, this.options.extractorLinkColor);
                count++;
            }
            this._CommitLineSet("extractors", set, count);
        }

        if (this.options.showRoutes && this.data.routes.length)
        {
            const set = this._CreateLineSet("routes", "PI commodity routes", {
                texture: this.options.routeTexture,
                additive: this.options.routeAdditive
            });
            let count = 0;
            for (const route of this.data.routes)
            {
                const ids = [ route.source_pin_id, ...(route.waypoints || []), route.destination_pin_id ];
                for (let i = 1; i < ids.length; i++)
                {
                    const a = this.GetPin(ids[i - 1])?.point;
                    const b = this.GetPin(ids[i])?.point;
                    if (!a || !b) continue;
                    const source = SurfacePosition(vec3.create(), a, this.options.routeRadius, [ 0, 0, 0 ], this.options.convention);
                    const destination = SurfacePosition(vec3.create(), b, this.options.routeRadius, [ 0, 0, 0 ], this.options.convention);
                    set.AddSpheredLineCrt(source, destination, [ 0, 0, 0 ], this.options.routeWidth,
                        this.options.routeColor, this.options.routeColor);
                    count++;
                }
            }
            this._CommitLineSet("routes", set, count);
        }

        return this;
    }

    /** Removes all rendered children while retaining the colony owner. @returns {TnyPlanetaryColony} */
    Clear()
    {
        this._generation++;
        for (const pin of this.pins.values()) this._RemovePin(pin);
        this.pins.clear();
        this.items.length = 0;
        this._ClearLineSets();

        if (this.planet?.wrapped)
        {
            for (const child of this._children)
            {
                const index = this.planet.wrapped.effectChildren.indexOf(child);
                if (index !== -1) this.planet.wrapped.effectChildren.splice(index, 1);
                child?.OnDestroy?.();
            }
            this.planet.wrapped._boundsDirty = true;
        }

        this._children.length = 0;
        this.links.clear();
        this.routes.clear();
        return this;
    }

    /** Releases the rendered colony and its owners. @returns {TnyPlanetaryColony} */
    Dispose()
    {
        this.Clear();
        this.data = { pins: [], links: [], routes: [] };
        this.planet = null;
        this.scene = null;
        this.service = null;
        return this;
    }

    /**
     * Rebuilds the link and route lookup maps from the owned JSON document.
     * @private
     */
    _IndexConnections()
    {
        this.links.clear();
        this.routes.clear();
        for (const link of this.data.links) this.links.set(LinkKey(link.source_pin_id, link.destination_pin_id), link);
        for (const route of this.data.routes) this.routes.set(String(route.route_id), route);
    }

    /**
     * Creates wrappers and visual layers for facilities and extractor heads.
     * @private
     */
    _BuildPins()
    {
        const sources = new Map(this.data.pins.map(x => [ String(x.pin_id), x ]));
        for (const point of CollectColonyPoints(this.data))
        {
            const source = sources.get(String(point.isHead ? point.parentId : point.id));
            const pin = new TnyPlanetaryPin(this, point, source);
            this.pins.set(String(point.id), pin);
            this.items.push(pin);
            this._BuildPinLayers(pin);
        }
    }

    /**
     * Builds the composited icon, gauge and progress layers for one pin.
     * @param {TnyPlanetaryPin} pin
     * @private
     */
    _BuildPinLayers(pin)
    {
        const { point, source } = pin;
        const o = this.options;
        let color = o.defaultPinColor;
        if (o.pinColors?.[point.typeId]) color = o.pinColors[point.typeId];
        else if (point.isHead || source?.extractor_details) color = o.extractorPinColor;
        else if (source?.schematic_id !== undefined) color = o.processorPinColor;
        else if (point.typeId === 2524) color = o.commandCenterPinColor;

        let texture = o.defaultPinTexture;
        if (o.pinTextures?.[point.typeId]) texture = o.pinTextures[point.typeId];
        else if (point.isHead) texture = o.extractorHeadPinTexture;
        else if (source?.extractor_details) texture = o.extractorPinTexture;
        else if (source?.schematic_id !== undefined) texture = o.processorPinTexture;
        else if (point.typeId === 2524) texture = o.commandCenterPinTexture;

        if (o.pinGauge && !point.isHead)
        {
            const gaugeTexture = o.pinGaugeTextures?.[point.typeId] ?? o.pinGaugeTexture;
            const maskTexture = o.pinGaugeMaskTextures?.[point.typeId] ?? o.pinGaugeMaskTexture;
            const baseColor = o.pinGaugeBaseColors?.[point.typeId] ?? o.pinGaugeBaseColor;
            const progressColor = o.pinGaugeColors?.[point.typeId] ?? o.pinGaugeColor;
            const backgroundColor = o.pinGaugeBackgroundColors?.[point.typeId] ?? o.pinGaugeBackgroundColor;
            const progress = o.pinProgresses?.[point.id] ?? o.pinProgresses?.[point.typeId] ?? o.pinProgress;

            pin.AddLayer("gaugeBackground", this._AddPinLayer(pin, `PI pin gauge background ${point.id}`,
                o.pinGaugeBackgroundTexture, o.pinRadius * o.pinGaugeBackgroundRadiusScale, backgroundColor));
            pin.AddLayer("gaugeBase", this._AddPinLayer(pin, `PI pin gauge base ${point.id}`,
                gaugeTexture, o.pinRadius * o.pinGaugeRadiusScale, baseColor));
            pin.AddLayer("progress", this._AddPinLayer(pin, `PI pin gauge ${point.id}`,
                gaugeTexture, o.pinRadius * o.pinGaugeRadiusScale, progressColor, maskTexture,
                Math.max(0, Math.min(1, progress))));
        }

        pin.AddLayer("icon", this._AddPinLayer(pin,
            point.isHead ? `PI extractor head ${point.id}` : `PI pin ${point.id}`,
            texture, o.pinRadius, color, null, o.pinAlphaThreshold));
    }

    /**
     * Creates and attaches one sphere-pin visual layer.
     * @param {TnyPlanetaryPin} pin
     * @param {String} name
     * @param {String} texture
     * @param {Number} radius
     * @param {Array<Number>} color
     * @param {String|null} [thresholdTexture=null]
     * @param {Number} [threshold=0]
     * @returns {EveChildSpherePin}
     * @private
     */
    _AddPinLayer(pin, name, texture, radius, color, thresholdTexture = null, threshold = 0)
    {
        const layer = new EveChildSpherePin();
        layer.name = name;
        layer.mesh = this._GetPinMesh(texture, thresholdTexture);
        layer.pinRadius = radius;
        layer.pinMaxRadius = Math.max(radius, this.options.pinMaxRadius);
        layer.pinRotation = this.options.pinRotation;
        layer.pinAlphaThreshold = threshold;
        layer.color = color;
        PlacePin(layer, pin.point, { convention: this.options.convention });

        this.planet.wrapped.effectChildren.push(layer);
        this._children.push(layer);
        return layer;
    }

    /**
     * Gets a service-level or colony-local immutable pin mesh.
     * @param {String} texture
     * @param {String|null} thresholdTexture
     * @returns {Tw2Mesh}
     * @private
     */
    _GetPinMesh(texture, thresholdTexture)
    {
        if (this.service) return this.service.GetPinMesh(texture, thresholdTexture);
        const key = `${texture}\n${thresholdTexture || ""}`;
        if (!this._pinMeshes.has(key)) this._pinMeshes.set(key, CreatePlanetaryPinMesh(texture, thresholdTexture));
        return this._pinMeshes.get(key);
    }

    /**
     * Loads optional 3D facility models and attaches them to their pin wrappers.
     * The generation guard discards results from a colony that was replaced
     * while resources were loading.
     * @param {Number} generation
     * @returns {Promise<void>}
     * @private
     */
    async _BuildGeometry(generation)
    {
        const models = this.options.pinModels;
        if (!models || !this.scene) return;

        await Promise.all(this.GetPins().filter(pin => !pin.isExtractorHead && models[pin.typeId]).map(async pin =>
        {
            const geometry = await TnySpaceObject.fetch({ resPath: models[pin.typeId], awaitResources: true });
            if (generation !== this._generation) return;

            const size = geometry.GetSize(vec3.create());
            const width = Math.max(size[0] || 0, size[2] || 0);
            if (!width) return;
            const scale = this.options.pinRadius * this.options.pinModelSizeScale * 2 / width;
            geometry.SetScale([ scale, scale, scale ]);
            pin.SetGeometry(geometry, {
                scene: this.scene,
                radius: this.options.pinModelRadius,
                display: this.options.pinModelsVisible !== false
            });
            pin.SetGeometryRotation(this.options.pinModelRotationSpeed);
        }));
    }

    /**
     * Detaches and disposes one pin and all of its owned visual layers.
     * @param {TnyPlanetaryPin} pin
     * @private
     */
    _RemovePin(pin)
    {
        const id = pin.id;
        const layers = pin.GetLayers();
        for (const layer of layers)
        {
            const index = this.planet?.wrapped?.effectChildren?.indexOf(layer) ?? -1;
            if (index !== -1) this.planet.wrapped.effectChildren.splice(index, 1);
            const childIndex = this._children.indexOf(layer);
            if (childIndex !== -1) this._children.splice(childIndex, 1);
            layer?.OnDestroy?.();
        }
        pin.Dispose();
        this.pins.delete(String(id));
        const itemIndex = this.items.indexOf(pin);
        if (itemIndex !== -1) this.items.splice(itemIndex, 1);
    }

    /**
     * Creates a configured curve-line set for links or routes.
     * @param {String} key
     * @param {String} name
     * @param {Object} options
     * @returns {EveCurveLineSet}
     * @private
     */
    _CreateLineSet(key, name, options)
    {
        const set = new EveCurveLineSet();
        set.name = name;
        set.additive = options.additive !== false;
        set.pickable = false;
        set.enableDepth = true;
        set.lineEffect.SetTextures({ TexMap: options.texture });
        return set;
    }

    /**
     * Initializes and attaches a non-empty line set beneath the pin layers.
     * @param {String} key
     * @param {EveCurveLineSet} set
     * @param {Number} count
     * @private
     */
    _CommitLineSet(key, set, count)
    {
        if (!count) return;
        set.Initialize();
        this.lineSets.set(key, set);
        this.planet.wrapped.effectChildren.unshift(set);
        this._children.unshift(set);
    }

    /**
     * Detaches and destroys every colony-owned link and route line set.
     * @private
     */
    _ClearLineSets()
    {
        for (const set of this.lineSets.values())
        {
            const index = this.planet?.wrapped?.effectChildren?.indexOf(set) ?? -1;
            if (index !== -1) this.planet.wrapped.effectChildren.splice(index, 1);
            const childIndex = this._children.indexOf(set);
            if (childIndex !== -1) this._children.splice(childIndex, 1);
            set.OnDestroy?.();
        }
        this.lineSets.clear();
    }

    static defaults = {
        convention: undefined,
        pinRadius: 0.0045,
        pinMaxRadius: 0.025,
        pinRotation: 0,
        pinAlphaThreshold: 0,
        defaultPinColor: [ 1, 0.82, 0.1, 1 ],
        processorPinColor: [ 0.05, 0.72, 1, 1 ],
        commandCenterPinColor: [ 1, 0.16, 0.1, 1 ],
        extractorPinColor: [ 1, 0.52, 0.08, 1 ],
        pinColors: null,
        defaultPinTexture: "res:/ui/texture/planet/pin_base.dds",
        processorPinTexture: "res:/ui/texture/planet/process.dds",
        commandCenterPinTexture: "res:/ui/texture/planet/command.dds",
        extractorPinTexture: "res:/ui/texture/planet/extractor.dds",
        extractorHeadPinTexture: "res:/ui/texture/planet/extraction_head.dds",
        pinTextures: null,
        pinGauge: true,
        pinGaugeRadiusScale: 1.55,
        pinGaugeTexture: "res:/ui/texture/planet/gauge_15px.dds",
        pinGaugeTextures: null,
        pinGaugeMaskTexture: "res:/ui/texture/planet/cycle_15px.dds",
        pinGaugeMaskTextures: null,
        pinGaugeBaseColor: [ 0.42, 0.38, 0.06, 0.9 ],
        pinGaugeBaseColors: null,
        pinGaugeColor: [ 1, 0.86, 0.08, 1 ],
        pinGaugeColors: null,
        pinGaugeBackgroundRadiusScale: 1.3,
        pinGaugeBackgroundTexture: "res:/ui/texture/planet/gauge_10px.dds",
        pinGaugeBackgroundColor: [ 0.72, 0.72, 0.72, 0.9 ],
        pinGaugeBackgroundColors: null,
        pinProgress: 1,
        pinProgresses: null,
        linkRadius: 1.0015,
        linkWidth: 2,
        linkColor: [ 0.15, 0.85, 1, 0.85 ],
        linkTexture: "res:/ui/texture/planet/link_0.dds",
        linkAdditive: true,
        linkEndpointTrim: null,
        extractorLinkRadius: 1.0016,
        extractorLinkWidth: 2,
        extractorLinkColor: [ 0.15, 0.85, 1, 0.75 ],
        extractorLinkTexture: "res:/ui/texture/planet/link_0.dds",
        extractorLinkAdditive: true,
        showRoutes: false,
        routeRadius: 1.0017,
        routeWidth: 3,
        routeColor: [ 1, 0.75, 0.1, 0.9 ],
        routeTexture: "res:/ui/texture/planet/link_0.dds",
        routeAdditive: true,
        pinModels: null,
        pinModelsVisible: false,
        pinModelRadius: 1.0015,
        pinModelSizeScale: 1.4,
        pinModelRotationSpeed: 0
    };

}

/**
 * Produces an order-independent key for one undirected facility link.
 * @param {String|Number} source
 * @param {String|Number} destination
 * @returns {String}
 * @private
 */
function LinkKey(source, destination)
{
    const a = String(source), b = String(destination);
    return a < b ? `${a}:${b}` : `${b}:${a}`;
}

/**
 * Deep-clones the JSON-compatible colony document owned by the wrapper.
 * @param {*} value
 * @returns {*}
 * @private
 */
function CloneData(value)
{
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

/**
 * Creates the immutable mesh shared by equivalent planetary pin layers.
 * @param {String} texture
 * @param {String|null} [thresholdTexture]
 * @returns {Tw2Mesh}
 */
export function CreatePlanetaryPinMesh(texture, thresholdTexture)
{
    const textures = { Layer1Map: texture };
    if (thresholdTexture) textures.Layer2Map = thresholdTexture;
    return Tw2Mesh.from({
        name: `PI sphere pin mesh (${texture})`,
        geometryResPath: "res:/dx9/model/worldobject/planet/PlanetSphere.gr2",
        transparentAreas: [ {
            name: "PI sphere pin",
            index: 0,
            count: 1,
            effect: {
                effectFilePath: thresholdTexture
                    ? "res:/Graphics/Effect/Managed/Space/UI/SpherePinThreshold.fx"
                    : "res:/Graphics/Effect/Managed/Space/UI/SpherePin1.fx",
                textures
            }
        } ]
    });
}
