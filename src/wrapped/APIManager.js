import { resMan } from "global";
import { ErrSOFDNAFormatInvalid } from "sof/EveSOFData";

const
    ESI_ROOT = "https://esi.evetech.net",
    ESI_VERSION = "latest",
    ESI_DATA_SOURCE = "tranquility",
    ESI_LANGUAGE = "en-us";

const Esi = {
    CHARACTERS: "characters",
    ALLIANCES: "alliances",
    CORPORATIONS: "corporations"
};

const EsiUniverse = {
    ASTEROID_BELTS: "universe/asteroid_belts",
    CATEGORIES: "universe/categories",
    CONSTELLATIONS: "universe/constellations",
    FACTIONS: "universe/factions",
    GRAPHICS: "universe/graphics",
    GROUPS: "universe/groups",
    MOONS: "universe/moons",
    PLANETS: "universe/planets",
    RACES: "universe/races",
    REGIONS: "universe/regions",
    STARGATES: "universe/stargates",
    STARS: "universe/stars",
    STATIONS: "universe/stations",
    STRUCTURES: "universe/structures",
    SYSTEM_KILLS: "universe/system_kills",
    SYSTEMS: "universe/systems",
    TYPES: "universe/types",
    NAMES: "universe/names",
};

const APIEndpoints = {
    MOONS: "cdn:/static/moons",
    PLANETS: "cdn:/static/planets",
    SUNS: "cdn:/static/sunTypes"
};

/**
 * Builds an esi url
 * @param {String} endpoint
 * @param {*} [params]
 * @returns {String}
 */
function buildESIUrlString(endpoint, params)
{
    params = Object.assign({ language: ESI_LANGUAGE, datasource: ESI_DATA_SOURCE }, params);

    let keys = Object.keys(params).sort(),
        url_string = `${ESI_ROOT}/${ESI_VERSION}/${endpoint}`;

    if (url_string.lastIndexOf("/") !== url_string.length - 1) url_string += "/";

    for (let i = 0; i < keys.length; i++)
    {
        url_string += `${i === 0 ? "?" : "&"}${keys[i]}=${params[keys[i]]}`;
    }

    return url_string.toLowerCase();
}

/**
 * Cache all responses for now
 * @type {Map<String, Promise>}
 */
const cache = new Map();

/**
 * Clears cache
 */
export function clearCache()
{
    cache.clear();
}

/**
 * Gets an id'd data from an api route
 * @param {String} route
 * @param {Number} id
 * @param {*} [params]
 * @param {String} [post]
 * @param {Function} [onAfter]
 * @returns {Promise<Object>}
 */
async function getIDFromESIRoute(route, id, params, post, onAfter)
{
    let root = `${route}/${id}`;

    if (post)
    {
        if (post.charAt(0) !== "/") post = "/" + post;
        root += `${post}`;
    }

    const url = buildESIUrlString(root, params);
    if (!cache.has(url))
    {
        cache.set(url, resMan.Fetch(url, "json"));
    }
    return await cache.get(url);
}


export async function getCharacterID(characterID, params)
{
    return getIDFromESIRoute(Esi.CHARACTERS, characterID, params);
}

export async function getCharacterPortraits(characterID, params)
{
    return getIDFromESIRoute(Esi.CHARACTERS, characterID, params, "portrait");
}

export async function getCorporationID(corporationID, params)
{
    return getIDFromESIRoute(Esi.CORPORATIONS, corporationID, params);
}

export async function getCorporationLogos(corporationID, params)
{
    return getIDFromESIRoute(Esi.CORPORATIONS, corporationID, params, "icons");
}

export async function getAllianceID(allianceID, params)
{
    return getIDFromESIRoute(Esi.ALLIANCES, allianceID, params);
}

export async function getAllianceLogos(allianceID, params)
{
    return getIDFromESIRoute(Esi.ALLIANCES, allianceID, params, "icons");
}

/**
 * Gets type from it's id
 * @param {Number} typeID
 * @param {Object} [params]
 * @returns {Promise<Object>}
 */
export async function getTypeID(typeID, params)
{
    return await getIDFromESIRoute(EsiUniverse.TYPES, typeID, params);
}

/**
 * Gets graphic by it's id
 * @param {Number} graphicID
 * @param {Object} [params]
 * @returns {Promise<Object>}
 */
export async function getGraphicID(graphicID, params)
{
    return await getIDFromESIRoute(EsiUniverse.GRAPHICS, graphicID, params);
}

/**
 * Gets a resPath from a graphic id
 * @param {Number} graphicID
 * @param {Object} [params]
 * @returns {Promise<String>}
 */
export async function getResPathFromGraphicID(graphicID, params)
{
    if (!graphicID) throw new Error("Graphic ID not found");
    const { sof_dna, graphic_file } = await getIDFromESIRoute(EsiUniverse.GRAPHICS, graphicID, params);
    return (sof_dna || graphic_file || "");
}

/**
 * Gets a resPath from a type id
 * @param {Number} typeID
 * @param {Object} [params]
 * @returns {Promise<String>}
 */
export async function getResPathFromTypeID(typeID, params)
{
    const { graphic_id } = await getIDFromESIRoute(EsiUniverse.TYPES, typeID, params);
    return await getResPathFromGraphicID(graphic_id);
}

//------------------------------[ The below function require a custom api to work]----------------------------------//


export async function getResPathFromTypeIDAndSkinMaterialID(typeID, skinMaterialID, name)
{
    const
        dna = await getResPathFromTypeID(typeID),
        { materialSetID } = await getSkinMaterialID(skinMaterialID),
        set = await getSkinMaterialSetID(materialSetID);

    // Can't get a name...
    name = name || set.description.split("(")[0];

    const
        parts = dna.split(":"),
        commands = {};

    for (let i = 3; i < parts.length; ++i)
    {
        try
        {
            const subParts = parts[i].split("?");
            commands[subParts[0].toUpperCase()] = subParts[1].split(";");
        }
        catch (err)
        {
            throw new ErrSOFDNAFormatInvalid({ dna });
        }
    }

    let hull = parts[0],
        faction = set.sof_faction_name || parts[1],
        race = parts[2],
        mesh = commands["MESH"] || commands["MATERIAL"],
        pattern = commands["PATTERN"],
        resPathInsert = set.res_path_insert ? set.res_path_insert : commands["RESPATHINSERT"];

    if (set.sof_pattern_name || set.pattern_material_1 || set.pattern_material_2)
    {
        pattern = [
            set.sof_pattern_name || "none",
            set.pattern_material_1 || "none",
            set.pattern_material_2 || "none"
        ];
    }

    if (set.material_1 || set.material_2 || set.material_3 || set.material_4)
    {
        mesh = [
            set.material_1 || "none",
            set.material_2 || "none",
            set.material_3 || "none",
            set.material_4 || "none"
        ];
    }

    //console.dir(mesh);
    //console.dir(pattern);

    // Build string
    let sof = `${hull}:${faction}:${race}`;
    if (mesh) sof += `:material?${mesh.join(";")}`;
    if (pattern) sof += `:pattern?${pattern.join(";")}`;

    if (resPathInsert && resPathInsert.toLowerCase() !== "none")
    {
        sof += `:respathinsert?${resPathInsert}`;
    }

    return { name, dna: sof.toLowerCase() };
}

export async function getResPathFromTypeIDAndSkinID(typeID, skinID)
{
    const { skinMaterialID, internalName } = await getSkinID(skinID);
    return getResPathFromTypeIDAndSkinMaterialID(typeID, skinMaterialID, internalName);
}

export async function getSkinMaterialID(materialTypeID)
{
    const url = resMan.BuildUrl(`cdn:/static/skinMaterials/${materialTypeID}`);
    if (!cache.has(url)) cache.set(url, resMan.Fetch(url, "json"));
    return await cache.get(url);
}

export async function getSkinMaterialTypeIDs(skinMaterialID)
{
    const url = resMan.BuildUrl(`cdn:/static/skinMaterialsToTypes/${skinMaterialID}`);
    if (!cache.has(url)) cache.set(url, resMan.Fetch(url, "json").catch(err => []));
    return await cache.get(url);
}

export async function getTypeIDSkinIDs(typeID)
{
    const url = resMan.BuildUrl(`cdn:/static/typesToSkins/${typeID}`);
    if (!cache.has(url)) cache.set(url, resMan.Fetch(url, "json").catch(err => []));
    return await cache.get(url);
}

export async function getSkinMaterialSetID(skinMaterialID)
{
    const url = resMan.BuildUrl(`cdn:/static/skinMaterialSets/${skinMaterialID}`);
    if (!cache.has(url)) cache.set(url, resMan.Fetch(url, "json"));
    return await cache.get(url);
}

export async function getSkinID(skinID)
{
    const url = resMan.BuildUrl(`cdn:/static/skins/${skinID}`);
    if (!cache.has(url)) cache.set(url, resMan.Fetch(url, "json"));
    return await cache.get(url);
}

export async function getSkinMaterialSetFromSkinID(skinID)
{
    const { skinMaterialID } = await getSkinID(skinID);
    const { materialSetID } = await getSkinMaterialID(materialSetID);
    return await getSkinMaterialSetID(skinMaterialID);
}

export async function getMoonID(moonID, params)
{
    const url = resMan.BuildUrl(`${APIEndpoints.MOONS}/${moonID}`);

    const [ esi, extras ] = await Promise.all([
        getIDFromESIRoute(EsiUniverse.MOONS, moonID, params),
        resMan.Fetch(url, "json")
    ]);

    return Object.assign({}, esi, extras);
}

export async function getPlanetID(planetID, params)
{
    const url = resMan.BuildUrl(`${APIEndpoints.PLANETS}/${planetID}`);

    const [ esi, extras ] = await Promise.all([
        getIDFromESIRoute(EsiUniverse.PLANETS, planetID, params),
        resMan.Fetch(url, "json")
    ]);

    return Object.assign({}, esi, extras);
}


export async function getSystemID(systemID, params)
{
    return getIDFromESIRoute(EsiUniverse.SYSTEMS, systemID, params);
}