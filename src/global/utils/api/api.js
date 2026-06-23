import {
    transformObjectVectors,
    objectSnakeToCamel,
    objectToArray,
    replaceObjectProperties
} from "./utils/transforms";

import {
    createGetHandlersForESIEndpoint as createESI,
    createGetHandlersForRemoteJSON as createJSON,
} from "./utils/helper";


const EsiFactionWarfareLeaderboard = {
    LEADERBOARDS: "fw/leaderboards",
    CHARACTERS: "fw/leaderboards/characters",
    CORPORATIONS: "fw/leaderboards/corporations",
    STATS: "fw/leaderboards/stats",
    SYSTEMS: "fw/leaderboards/systems"
};

export const factions = createESI({
    endpoint: "universe/factions",
    get: true,
    idProperty: "faction_id"
});

export const fwStats = createESI({
    endpoint: "fw/stats",
    get: true,
    cacheTimer: 30 * 60000
});

export const fwSystems = createESI({
    endpoint: "fw/systems",
    get: true,
    cacheTimer: 30 * 60000
});

export const fwLeaderboardCharacters = createESI({
    endpoint: "fw/leaderboards/characters",
    get: true,
    cacheTimer: 30 * 60000
});

export const fwLeaderboardCorportations = createESI({
    endpoint: "fw/leaderboards/corporations",
    get: true,
    cacheTimer: 30 * 60000
});

export const fwLeaderboardCorporations = createESI({
    endpoint: "fw/leaderboards/characters",
    get: true,
    cacheTimer: 30 * 60000
});

export const dogmaAttributes = createESI({
    endpoint: "dogma/attributes",
    idProperty: "attributeID",
    getOne: true,
    getIDs: false
});

export const types = createESI({
    endpoint: "universe/types",
    idProperty: "typeID",
    getOne: true,
    getIDs: true,
    maxItems: 1000
});

export const graphics = createESI({
    endpoint: "universe/graphics",
    idProperty: "graphicID",
    getOne: true,
    getIDs: true,
    maxItems: 10000
});

export const categories = createESI({
    endpoint: "universe/categories",
    idProperty: "categoryID",
    getOne: true,
    getIDs: true,
    maxItems: 10000
});

export const groups = createESI({
    endpoint: "universe/groups",
    idProperty: "groupID",
    getOne: true,
    getIDs: true,
    maxItems: 10000
});

export const marketGroups = createESI({
    endpoint: "markets/groups",
    idProperty: "marketGroupID",
    getOne: true,
    getIDs: true,
    maxItems: 10000
});


export const universe = createJSON({
    href: "http://sde.zzeve.com/mapUniverse.json",
    idProperty: "universeID",
    getOne: true,
    getIDs: true,
    transformAll: all => all
        .map(item => 
        {
            item.position = [ item.x, item.y, item.z ];
            return item;
        })
});


const regionGraphicIDs = createJSON({
    href: "http://sde.zzeve.com/mapRegions.json",
    idProperty: "regionID", // from regionID
    getOne: true,
    transformAll: all => all.map(item => replaceObjectProperties(item, { nebula : "nebulaID" }))
});


export const regions = createESI({
    endpoint: "universe/regions",
    idProperty: "region_id",
    getOne: true,
    getIDs: true,
    transformItem: async item =>
    {
        const { nebulaID } = await regionGraphicIDs.getOne(item["regionId"]);
        item.nebulaID = nebulaID;
        transformObjectVectors(item, item, "position");
        return item;
    }
});


export const constellations = createESI({
    endpoint: "universe/constellations",
    getOne: true,
    getIDs: true,
    transformItem: async item =>
    {
        const { nebulaID } = await regionGraphicIDs.getOne(item["regionId"]);
        item.nebulaID = nebulaID;
        transformObjectVectors(item, item, "position");
        return item;
    }
});


export const systems = createESI({
    endpoint: "universe/systems",
    getOne: true,
    getIDs: true,
    transformItem: async item =>
    {
        const { nebulaID } = await constellations.getOne(item["constellationId"]);
        item.nebulaID = nebulaID;
        transformObjectVectors(item, item, "position");
        return item;
    }
});

export const systemKills = createESI({
    endpoint: "universe/system_kills",
    get: true,
    cache: 3600,
    maxItems: 10000
});

systemKills.getOne = async systemID =>
{
    const all = await systemKills.get();
    return all.filter(x => x.systemID === systemID);
};


export const systemJumps = createESI({
    endpoint: "universe/system_jumps",
    get: true,
    cache: 3600,
    maxItems: 10000
});

systemJumps.getOne = async systemID =>
{
    const all = await systemJumps.get();
    return all.filter(x => x.systemID === systemID);
};


export const asteroidBelts = createESI({
    endpoint: "universe/asteroid_belts",
    getOne: true,
    transformItem: item => transformObjectVectors(item, item, "position")
});


export const stars = createESI({
    endpoint: "universe/stars",
    getOne: true
});


async function transformCelestial(item)
{
    const { heightMap1, heightMap2, shaderPreset, radius } = await celestialGraphics.getOne(item["moonID"] || item["planetID"]);
    item.radius = radius;
    item.heightMap1ID = heightMap1;
    item.heightMap2ID = heightMap2;
    item.shaderPresetID = shaderPreset;
    transformObjectVectors(item, item, "position");
    return item;
}

const celestialGraphics = createJSON({
    href: "http://sde.zzeve.com/mapCelestialGraphics.json",
    idProperty: "celestialID", // from celestialID
    getOne: true
});


export const moons = createESI({
    endpoint: "universe/moons",
    getOne: true,
    transformItem: transformCelestial
});


export const planets = createESI({
    endpoint: "universe/planets",
    getOne: true,
    transformItem: transformCelestial
});


export const stargates = createESI({
    endpoint: "universe/stargates",
    getOne: true,
    transformItem: item => transformObjectVectors(item, item, "position")
});


export const stations = createESI({
    endpoint: "universe/stations",
    getOne: true,
    transformItem: item => transformObjectVectors(item, item, "position")
});


export const skinMaterials = createJSON({
    href: "http://sde.zzeve.com/skinMaterials.json",
    idProperty: "skinMaterialID",
    getOne: true,
    getIDs: true,
    transformAll: async all =>
    {
        for (let i = 0; i < all.length; i++)
        {
            all[i].name = await skinMaterialNames.getOne(all[i].skinMaterialID).name;
        }
        return all;
    }
});

export const skinMaterialNames = createJSON({
    href: "https://sde.hoboleaks.space/tq/skinmaterialnames.json",
    idProperty: "skinMaterialID",
    get: true,
    getOne: true,
    transformAll: all => Object
        .keys(all)
        .sort()
        .reduce((acc, cur) =>
        {
            acc.push({ skinMaterialID: Number(cur), name: all[cur] });
            return acc;
        }, [])
});


export const skinLicense = createJSON({
    href: "http://sde.zzeve.com/skinLicense.json",
    idProperty: "licenseTypeID",
    get: true,
    getOne: true,
    getIDs: true
});


const skinShips = createJSON({
    href: "http://sde.zzeve.com/skinShip.json",
    idProperty: "skinID",
    get: true
});

export const skins = createJSON({
    href: "http://sde.zzeve.com/skins.json",
    idProperty: "skinID",
    getOne: true,
    getIDs: true
});

skins.getByLicenseID = async license_typeID => (await skinLicense.getOne(license_typeID))["skinID"];

skins.getManyByTypeID = async typeID => (await skinShips.get()).filter(x => x["typeID"] === typeID).map(x => x["skinID"]);


export const materialSets = createJSON({
    href: "https://sde.hoboleaks.space/tq/graphicmaterialsets.json",
    idProperty: "materialSetID",
    get: true,
    getOne: true,
    getIDs: true,
    transformAll: all => objectToArray(all, "materialSetID")
        .map(item =>
        {
            replaceObjectProperties(item, {
                material1: "sofMaterial1Name",
                material2: "sofMaterial2Name",
                material3: "sofMaterial3Name",
                material4: "sofMaterial4Name",
                custommaterial1: "sofPatternMaterial1Name",
                custommaterial2: "sofPatternMaterial2Name",
                colorPrimary: "iconColorPrimary",
                colorSecondary: "iconColorSecondary",
                colorWindow: "iconColorWindow",
                colorHull: "iconColorHull"
            });

            transformObjectVectors(item, item, [
                "iconColorPrimary",
                "iconColorSecondary",
                "iconColorWindow",
                "iconColorHull"
            ]);

            return item;
        })
});
