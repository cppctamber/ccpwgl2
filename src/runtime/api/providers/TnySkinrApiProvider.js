import { meta } from "utils";
import { quat, vec3 } from "math";
import {
    EveSOFDataPattern,
    EveSOFDataPatternLayer,
    EveSOFDataPatternPerHull,
    EveSOFDataPatternTransform
} from "sof";
import { TnyGeneratedLibraryProvider } from "./TnyGeneratedLibraryProvider";
import { TnySkinApiProvider } from "./TnySkinApiProvider";


/**
 * SKINR (skin designer) API provider.
 *
 * SKINR is a separate system from SKIN - different library, different concepts
 * (components, cosmetic slots, slot configurations) - even though both end in
 * materials on a hull.
 *
 * Parked in the gitignored `src/wrapped` while the material it touches was
 * under NDA, where it ran as a plain browser module off the `tw2` global and
 * delegated library access to an injected api service. Promoted 2026-08-19 once
 * that lifted: it imports the SOF classes directly and rejoins the provider
 * base, so `skinrUrl` / `apiRoot` / `toolsService` work the same way they do
 * for every sibling.
 */
@meta.tny.type("TnySkinrApiProvider")
@meta.tny.define("TnySkinrApiProvider")
export class TnySkinrApiProvider extends TnyGeneratedLibraryProvider
{

    skinrUrl = null;
    apiRoot = null;

    /**
     * Route to the service SKINR design store. Derived from the service origin
     * when absent - see {@link DesignRootFrom}.
     * @type {String|null}
     */
    designUrl = null;

    /**
     * tools-core endpoint that generates a SOF pattern from a SKINR payload.
     * @type {String|null}
     */
    patternUrl = null;

    /**
     * Retained so a caller that already has a service can delegate library
     * reads to it rather than configuring a second route to the same place.
     * @type {TnyApiService|null}
     */
    apiService = null;

    constructor(options = {})
    {
        super(options);

        if (options.hasOwnProperty("skinrUrl")) this.skinrUrl = options.skinrUrl;
        if (options.toolsService) this.SetToolsService(options.toolsService, options);
        if (options.apiRoot) this.apiRoot = String(options.apiRoot).replace(/\/+$/, "");
        if (options.designUrl) this.designUrl = options.designUrl;
        if (options.apiService) this.apiService = options.apiService;
        if (options.patternUrl) this.patternUrl = options.patternUrl;
    }

    /**
     * Points this provider at a tools-core service, the same way the skin and
     * character providers do.
     * @param {Object} bootstrap
     * @param {Object} [options]
     * @returns {TnySkinrApiProvider}
     */
    SetToolsService(bootstrap, options = {})
    {
        // Borrowed rather than duplicated. The helper is a static on the
        // sibling providers instead of on the shared base, and `default.js`
        // already calls it across providers the same way.
        this.apiRoot = TnySkinApiProvider.BuildToolsServiceRoot(bootstrap, options);
        if (!this.patternUrl) this.patternUrl = `${this.apiRoot}/skinr/pattern`;
        return this;
    }

    /**
     * Gets a SKINR library section or record.
     *
     * Reads its own route when one is configured. The delegate to an injected
     * api service is kept for the creator studio, which constructs this
     * provider against an already-configured service rather than a url.
     * @param {String} [section]
     * @param {String|Number} [id]
     * @returns {Promise<*>}
     */
    GetSkinr(section, id)
    {
        const root = this.skinrUrl || (this.apiRoot ? `${this.apiRoot}/skinr` : null);

        if (!root)
        {
            if (this.apiService) return this.apiService.GetSkinr(section, id);
            throw new Error(
                "SKINR library access needs a route; construct TnySkinrApiProvider "
                + "with { skinrUrl }, { apiRoot }, { toolsService } or { apiService }"
            );
        }

        const url = [ root, section, id ]
            .filter(part => part !== undefined && part !== null && part !== "")
            .map((part, i) => i ? encodeURIComponent(part) : part)
            .join("/");

        return this.FetchLibrary
            ? this.FetchLibrary(url)
            : fetch(url).then(response =>
            {
                if (!response.ok) throw new Error(`SKINR library request failed: ${response.status}`);
                return response.json();
            });
    }

    /**
     * Hydrates a generated SOF pattern payload into real SOF classes.
     *
     * The payload is already final-form: tools-core resolved the cosmetic-slot
     * to material-layer conversion, the projection types and the blend mode
     * before serializing it. Nothing here translates anything, because the
     * model classes translate nothing either - they expect the answers.
     *
     * Built explicitly rather than through Model.from: that hydrates a single
     * level, so the nested layers, projections and transforms would arrive as
     * plain objects where the SOF build path expects instances.
     *
     * @param {Object} json - a carbonenginejs.skinrSofPattern pattern
     * @returns {EveSOFDataPattern|null}
     */
    static FromPatternJson(json)
    {
        if (!json) return null;

        const layer = source =>
        {
            if (!source) return null;

            const value = new EveSOFDataPatternLayer(source.textureName || "");
            value.isTargetMtl1 = !!source.isTargetMtl1;
            value.isTargetMtl2 = !!source.isTargetMtl2;
            value.isTargetMtl3 = !!source.isTargetMtl3;
            value.isTargetMtl4 = !!source.isTargetMtl4;
            value.blendMode = source.blendMode || "normal";
            value.materialSource = source.materialSource || 0;
            value.projectionTypeU = source.projectionTypeU || 0;
            value.projectionTypeV = source.projectionTypeV || 0;
            if (source.textureResFilePath) value.textureResFilePath = source.textureResFilePath;
            return value;
        };

        const transform = source =>
        {
            if (!source) return null;

            const value = new EveSOFDataPatternTransform();
            value.isMirrored = !!source.isMirrored;
            if (source.position) vec3.copy(value.position, source.position);
            if (source.rotation) quat.copy(value.rotation, source.rotation);
            if (source.scaling) vec3.copy(value.scaling, source.scaling);
            return value;
        };

        const pattern = new EveSOFDataPattern();
        pattern.name = String(json.name || "").toLowerCase();
        pattern.sof6 = !!json.sof6;
        pattern.layer1 = layer(json.layer1);
        pattern.layer2 = layer(json.layer2);

        for (const projection of json.projections || [])
        {
            const perHull = new EveSOFDataPatternPerHull(projection.name);
            perHull.transformLayer1 = transform(projection.transformLayer1);
            perHull.transformLayer2 = transform(projection.transformLayer2);
            pattern.projections.push(perHull);
        }

        return pattern;
    }

    /**
     * Fetches the generated DNA and SOF pattern for a SKINR skin payload.
     *
     * The translation lives in tools-core, next to the SKINR library that
     * drives it - the cosmetic slot names, the components, the factionID slot
     * conversion and the typeID to factionID join are all its data. Doing it
     * here meant four round trips and a second copy of rules that could not be
     * tested, in a file that cannot even be committed.
     *
     * @param {Object} skin - a SKINR skin payload
     * @returns {Promise<Object>} a carbonenginejs.skinrSofPattern document
     */
    async GetSkinrPattern(skin)
    {
        if (!this.patternUrl)
        {
            throw new Error(
                "SKINR pattern generation needs a tools-core pattern url; "
                + "construct TnySkinrApiProvider with { patternUrl }"
            );
        }

        const response = await fetch(this.patternUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(skin)
        });

        if (!response.ok)
        {
            throw new Error(`SKINR pattern generation failed: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Gets SOF DNA and the sof pattern for a BAKED skin, by id.
     *
     * A baked skin cannot change, so the id is enough and the service fetches
     * it. Only works for skins the service's own token can read - a private or
     * unbaked design has no path here and must be passed as a payload.
     *
     * @param {String} skinrID
     * @returns {Promise<{name:String, dna:String, pattern:EveSOFDataPattern|null}>}
     */
    async GenerateDnaFromId(skinrID)
    {
        if (!skinrID) throw new TypeError("SKINR DNA generation requires a skinr id");

        // Two steps, on two different roots.
        //
        // This used to GET `${patternUrl}/${id}`, which the service answers by
        // asking ESI for /cosmetics/skinr/{id}. That endpoint serves BAKED
        // designs only, so every design held in tools-core's own SKINR database
        // came back 404 - "SKINR pattern generation failed (404): ESI ... failed
        // (404)" - which reads like a generation failure rather than a lookup
        // against the wrong store.
        //
        // The designs live locally, at /v1/skinr/designs/{id}, off the SERVICE
        // ORIGIN rather than the target-and-build root that patternUrl uses.
        // So fetch the design, then hand it to the same POST the payload path
        // already uses.
        const design = await this.GetDesign(skinrID);
        return this.GenerateDna(design);
    }

    /**
     * Fetches a SKINR design by id from the service's own SKINR database.
     * @param {String} skinrID
     * @returns {Promise<Object>} the raw design payload
     */
    async GetDesign(skinrID)
    {
        const root = this.designUrl || this.constructor.DesignRootFrom(this.apiRoot || this.patternUrl);

        if (!root)
        {
            throw new Error(
                "SKINR design lookup needs a route; construct TnySkinrApiProvider "
                + "with { designUrl }, { apiRoot } or { toolsService }"
            );
        }

        const response = await fetch(`${root}/${encodeURIComponent(skinrID)}?form=raw`);

        if (!response.ok)
        {
            const detail = await response.json().catch(() => null);

            throw new Error(
                `SKINR design ${skinrID} not found (${response.status})`
                + (detail && detail.error ? `: ${detail.error}` : "")
                + ". Unbaked or private designs cannot be fetched - paste the payload instead."
            );
        }

        return response.json();
    }

    /**
     * The design route lives on the service origin, not under /{target}/{build},
     * so it is derived by discarding the path of whatever root we were given.
     * @param {String} url
     * @returns {String|null}
     */
    static DesignRootFrom(url)
    {
        if (!url) return null;

        try
        {
            return `${new URL(url).origin}/v1/skinr/designs`;
        }
        catch (err)
        {
            return null;
        }
    }

    /**
     * Gets SOF DNA and the sof pattern for a SKINR skin payload.
     *
     * The pattern comes back as a real EveSOFDataPattern - named by the skinr
     * skin id so it cannot collide with shipped patterns, carrying one per-hull
     * projection - and is NOT injected anywhere: the caller decides where it
     * goes (e.g. into tw2.eveSof.pattern before building the DNA).
     *
     * @param {Object} skin - a SKINR skin payload
     * @param {Number} skin.ship_type_id - type id of the ship to build
     * @param {String} skin.id - skinr skin id; becomes the sof pattern name
     * @param {Object} skin.layout - slots and pattern_blend_mode
     * @returns {Promise<{name:String, dna:String, pattern:EveSOFDataPattern|null}>}
     */
    async GenerateDna(skin = {})
    {
        const { ship_type_id, id, layout } = skin;

        if (ship_type_id === undefined || ship_type_id === null || !id || !layout || !Array.isArray(layout.slots))
        {
            throw new TypeError("SKINR DNA generation requires ship_type_id, id and layout.slots");
        }

        const generated = await this.GetSkinrPattern(skin);

        return {
            name: generated.name ?? skin.name ?? null,
            dna: generated.dna,
            pattern: this.constructor.FromPatternJson(generated.pattern),
            blendMode: this.constructor.ToBlendMode(layout.pattern_blend_mode)
        };
    }

    /**
     * Translates a SKINR blend mode into the Carbon permutation value
     * EveShip2.SetBlendMode takes.
     *
     * The translation belongs here rather than in the engine: SKINR has its own
     * vocabulary and its own spellings, and EveShip2 deliberately accepts the
     * permutation value and nothing else so a bad one throws instead of quietly
     * becoming OVERLAY.
     *
     * Returns null when SKINR names a mode Carbon has no permutation for -
     * ADD, MULTIPLY, DIVIDE and DIFFERENCE are in SKINR's set but not in
     * Carbon's five - so the caller can decide, and see that it happened,
     * rather than being silently given OVERLAY.
     *
     * @param {String} [value] - e.g. layout.pattern_blend_mode
     * @returns {String|null} e.g. "BLEND_MODE_NESTED"
     */
    static ToBlendMode(value)
    {
        const key = String(value || "normal")
            .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
            .replace(/[\s-]+/g, "_")
            .toUpperCase();

        const name = key === "NORMAL" || key === "NONE" ? "OVERLAY" : key;
        const permutation = `BLEND_MODE_${name}`;

        return TnySkinrApiProvider.BLEND_MODES.includes(permutation) ? permutation : null;
    }

    /**
     * The blend modes Carbon declares a permutation for. Mirrors
     * EveShip2.BLEND_MODES; duplicated rather than imported so this provider
     * does not depend on an eve class.
     * @type {Array<String>}
     */
    static BLEND_MODES = [
        "BLEND_MODE_OVERLAY",
        "BLEND_MODE_SUBTRACT",
        "BLEND_MODE_EXCLUSION",
        "BLEND_MODE_NESTED",
        "BLEND_MODE_NESTED_INVERTED"
    ];


    /**
     * Reads a SKINR skin payload's pattern slot into custom mask values.
     * @param {Object} skin - a SKINR skin payload, or its layout
     * @returns {{patternID:Number, values:Object}|null} null when the skin carries no pattern slot
     */
    static CustomMaskValuesFrom(skin)
    {
        const layout = skin && (skin.layout || skin);
        if (!layout || !Array.isArray(layout.slots)) return null;

        let pattern = null;
        for (let i = 0; i < layout.slots.length; i++)
        {
            const config = layout.slots[i] && layout.slots[i].configuration;
            if (config && config.pattern)
            {
                pattern = config.pattern;
                break;
            }
        }

        if (!pattern) return null;

        const
            { projection, transform, mirrored } = pattern.configuration || {},
            blendMode = layout.pattern_blend_mode;

        const values = {
            blendMode: !blendMode || blendMode === "normal" ? "overlay" : blendMode,
            isMirrored: !!mirrored,
            targetMaterials: projection ? [
                projection.slot1 ? 1 : 0,
                projection.slot2 ? 1 : 0,
                projection.slot3 ? 1 : 0,
                projection.slot4 ? 1 : 0
            ] : [ 1, 1, 1, 1 ]
        };

        if (transform)
        {
            const { position, rotation, scaling } = transform;
            if (position) values.position = [ position.x, position.y, position.z ];
            if (rotation) values.rotation = [ rotation.x, rotation.y, rotation.z, rotation.w ];
            if (scaling) values.scaling = [ scaling.x, scaling.y, scaling.z ];
        }

        return { patternID: pattern.id, values };
    }

}
