import { meta, isNumber, isString } from "utils";
import { vec3 } from "math";
import { EvePlanet } from "eve/object";
import { TnySpaceObject } from "./TnySpaceObject";
import { getApiService } from "../api";


/**
 * A celestial - planet, moon or sun. There is only one of these.
 *
 * Carbon has exactly one celestial class, `EvePlanet : EveEffectRoot2`
 * (`trinity/trinity/Eve/EvePlanet.h:36`). There is no `EveSun`, `EveStar`,
 * `EveMoon` or `EveAsteroid` anywhere in the engine, and a sun IS an
 * `EvePlanet` - `EvePlanet.cpp:101` says so outright, "Used for audio for
 * suns". Nothing on the class names its kind: no type enum, no kind field, not
 * even a res-path member. The visual is whatever `effectChildren` the data
 * assembles, so a moon and a planet are indistinguishable to the engine.
 *
 * The scene identifies the sun by POINTER IDENTITY of its destiny ball -
 * `planet->GetTranslationCurve() == m_sunBall` (`EveSpaceScene.cpp:2327`) -
 * used to size the sun for volumetrics and, inverted, to keep it out of the
 * shadow casters. Being a sun is a ROLE in a scene, not a class, which is why
 * there is no `TnySun` here either.
 *
 * This replaces the former `TnyMoon` / `TnyPlanet` pair, which differed only by
 * which SDE id they read and whether they kept the aurora child - content
 * assembly, not taxonomy.
 *
 * Note the branch: `EvePlanet` descends from `EveEffectRoot2`, NOT
 * `EveSpaceObject2`. So this extends `TnySpaceObject` for its wrapper and
 * transform surface only, and deliberately not `TnyMobile` - a celestial has
 * no slots. Before the slot arrays moved to `TnyMobile`, every planet carried
 * six of them.
 */
@meta.define("TnyPlanet")
export class TnyPlanet extends TnySpaceObject
{

    /** The id option a bare number is read as. */
    static celestialKey = "planetID";

    /**
     * Whether the model keeps its aurora child by default.
     *
     * `aurora.fx` reads screen-space derivatives an ESSL1 shader cannot do on
     * WebGL2, so it is dropped when not wanted. Moons default it off, which is
     * what the retired `TnyMoon` did - see `Fetch`.
     */
    static aurora = true;

    get isPlanet()
    {
        return true;
    }

    /** True when this celestial was asked for by `moonID`. */
    get isMoon()
    {
        return this._isMoon;
    }

    _isMoon = false;

    SetWrapped(wrapped)
    {
        if (wrapped && !(wrapped instanceof EvePlanet))
        {
            throw new TypeError("Invalid wrapped celestial");
        }

        return super.SetWrapped(wrapped);
    }

    GetLongAxis()
    {
        const worldScale = this.GetWorldScaling(TnySpaceObject.global.vec3_1);
        return Math.max(worldScale[0], worldScale[1], worldScale[2]);
    }

    GetSize(out = vec3.create())
    {
        return this.GetScale(out);
    }

    /**
     * Fetches a celestial.
     *
     * One needs an id, a shader preset and two height maps, plus an optional
     * atmosphere; all four are .black resources. Pass them directly, or pass
     * `moonID`/`planetID` and let the api service resolve them from the SDE —
     * the SDE is the only place the correct celestial data lives.
     *
     * Carbon's own `EvePlanet` has none of these members - no height maps, no
     * atmosphere, no shader preset, no aurora; its visual is entirely
     * `effectChildren`. They are here because assembling that content from the
     * SDE is exactly the game-layer job this class stands in for.
     *
     * @param {Number|Object} options
     * @param {Number} [options.moonID]        - SDE celestial id
     * @param {Number} [options.planetID]      - SDE celestial id
     * @param {Number} [options.itemID]        - id passed to the wrapped model
     * @param {String} [options.resPath]       - shader preset res path
     * @param {String} [options.heightMap1]
     * @param {String} [options.heightMap2]
     * @param {String} [options.atmospherePath]
     * @param {Number} [options.radius]        - metres
     * @param {Boolean} [options.aurora]       - defaults to the class's own
     * @returns {Promise<TnyPlanet>}
     */
    static async fetch(options = {})
    {
        if (isNumber(options)) options = { [this.celestialKey]: options };

        let {
            planetID,
            moonID,
            itemID,
            resPath,
            heightMap1,
            heightMap2,
            atmospherePath,
            aurora,
            ...values
        } = options;

        // The retired TnyMoon defaulted aurora OFF and TnyPlanet ON. That was
        // the only behavioural difference between the two classes, so it
        // survives as a default keyed on which id was asked for - content
        // assembly, which is this layer's job, rather than a second class.
        if (aurora === undefined) aurora = moonID ? false : this.aurora;

        if (moonID) values._isMoon = true;

        if (planetID || moonID)
        {
            const api = getApiService();
            const data = moonID ? await api.GetMoon(moonID) : await api.GetPlanet(planetID);

            itemID = itemID ?? (moonID || planetID);
            if (values.radius === undefined && data.radius !== undefined) values.radius = data.radius;
            if (!values.name && data.name) values.name = data.name;

            const [ shader, hm1, hm2 ] = await Promise.all([
                api.GetGraphic(GetAttribute(data, "shaderPreset", "shader_preset")),
                Fetchable(api, GetAttribute(data, "heightMap1", "height_map_1")),
                Fetchable(api, GetAttribute(data, "heightMap2", "height_map_2"))
            ]);

            resPath = resPath || shader?.graphicFile;
            heightMap1 = heightMap1 || hm1?.graphicFile;
            heightMap2 = heightMap2 || hm2?.graphicFile;
        }

        if (!resPath) throw new ReferenceError("Could not identify a celestial resource path");

        const wrapped = new EvePlanet();
        await wrapped.Fetch({
            itemID: itemID || 0,
            name: values.name || "",
            radius: values.radius || 0,
            // Everything ccpwgl reads is the .black container; the SDE's
            // graphic files are authored with the legacy .red extension.
            resPath: ToBlack(resPath),
            heightMap1: ToBlack(heightMap1),
            heightMap2: ToBlack(heightMap2),
            atmospherePath: ToBlack(atmospherePath)
        });
        wrapped._resPath = resPath;
        wrapped._atmospherePath = atmospherePath;

        if (!aurora) this.removeAurora(wrapped);

        return new this(wrapped, values);
    }

    /**
     * Drops the aurora child from a celestial's model.
     *
     * Every planet template carries one, whatever the type — a ribbon mesh on
     * `res:/graphics/effect/managed/space/planet/aurora.fx`. That effect reads
     * screen-space derivatives, which a compiled (ESSL1) shader cannot do on a
     * WebGL2 context, so its fragment stage fails to compile. A moonID fetch
     * drops it by default; a planet drops it when asked.
     *
     * @param {EvePlanet} wrapped
     * @returns {Number} how many children were removed
     */
    static removeAurora(wrapped)
    {
        let removed = 0;

        // Three list names, because the aurora's home moved with the EvePlanet
        // rewrite. The old class hung a template under `highDetail.children`;
        // the Carbon one adopts the template's own `effectChildren`, and a
        // container nests further children under `objects`. Walking all three
        // keeps this working against either shape rather than betting on one.
        const LISTS = [ "effectChildren", "objects", "children" ];

        const prune = (node, seen) =>
        {
            if (!node || typeof node !== "object" || seen.has(node)) return;
            seen.add(node);

            for (const key of LISTS)
            {
                const list = node[key];
                if (!Array.isArray(list)) continue;

                for (let i = list.length - 1; i >= 0; i--)
                {
                    const child = list[i];
                    if (/aurora/i.test(child?.name || ""))
                    {
                        list.splice(i, 1);
                        removed++;
                        continue;
                    }
                    prune(child, seen);
                }
            }
        };

        prune(wrapped, new Set());
        return removed;
    }

}

function ToBlack(path)
{
    return isString(path) ? path.replace(/\.red$/i, ".black") : "";
}

function GetAttribute(data, ...names)
{
    for (const name of names)
    {
        if (data?.[name] !== undefined && data[name] !== null) return data[name];
        if (data?.attributes?.[name] !== undefined && data.attributes[name] !== null)
        {
            return data.attributes[name];
        }
    }
    return null;
}

function Fetchable(api, graphicID)
{
    return graphicID ? api.GetGraphic(graphicID) : null;
}
