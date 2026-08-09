import { meta, isNumber, isString } from "utils";
import { vec3 } from "math";
import { EvePlanet } from "eve/object";
import { TnySpaceObject } from "./TnySpaceObject";
import { getApiService } from "../api";


/**
 * A moon: the plain celestial sphere. Same wrapped EvePlanet and the same
 * resources as a planet — an id, a shader preset and two height maps — with
 * none of the atmospheric extras.
 *
 * TnyPlanet extends this and adds them back.
 */
@meta.tny.type("TnyMoon")
@meta.tny.define("TnyMoon")
export class TnyMoon extends TnySpaceObject
{

    /** The id option a bare number is read as. */
    static celestialKey = "moonID";

    /** Whether the model keeps its aurora child. */
    static aurora = false;

    get isPlanet()
    {
        // Moons render through the scene's planet list like planets do.
        return true;
    }

    get isMoon()
    {
        return true;
    }

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
     * @returns {Promise<TnyMoon>}
     */
    static async Fetch(options = {})
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
            aurora = this.aurora,
            ...values
        } = options;

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

        if (!aurora) this.RemoveAurora(wrapped);

        return new this(wrapped, values);
    }

    /**
     * Drops the aurora child from a celestial's model.
     *
     * Every planet template carries one, whatever the type — a ribbon mesh on
     * `res:/graphics/effect/managed/space/planet/aurora.fx`. That effect reads
     * screen-space derivatives, which a compiled (ESSL1) shader cannot do on a
     * WebGL2 context, so its fragment stage fails to compile. Moons drop it
     * always; planets drop it when asked.
     *
     * @param {EvePlanet} wrapped
     * @returns {Number} how many children were removed
     */
    static RemoveAurora(wrapped)
    {
        let removed = 0;

        const prune = (transform) =>
        {
            const children = transform && transform.children;
            if (!Array.isArray(children)) return;

            for (let i = children.length - 1; i >= 0; i--)
            {
                const child = children[i];
                if (/aurora/i.test(child?.name || ""))
                {
                    children.splice(i, 1);
                    removed++;
                    continue;
                }
                prune(child);
            }
        };

        prune(wrapped?.highDetail);
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
