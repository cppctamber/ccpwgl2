import {vec3, vec4, quat, mat4} from "../global";
import {get, assignIfExists} from "../global/util";
import {Tw2ScalarCurve2, Tw2ScalarKey2} from "../curve/legacy";
import {
    Tw2FloatParameter,
    Tw2TextureParameter,
    Tw2Vector4Parameter,
    Tw2Effect,
    Tw2Mesh,
    Tw2MeshArea,
    Tw2InstancedMesh,
    Tw2CurveSet,
    Tw2ValueBinding
} from "../core/index";
import {
    EveBoosterSet,
    EveChildMesh,
    EveLocator2,
    EvePlaneSet,
    EveSpaceObjectDecal,
    EveSpotlightSet,
    EveSpriteSet,
    EveSpaceObject,
    EveShip
} from "../eve";


export function EveSOF(tw2)
{
    const self = this;

    var data = null;
    var spriteEffect = null;

    this.SKIP_EMPTY_ITEMS = true;

    /**
     * @String}
     */
    function GetShaderPrefix(isAnimated)
    {
        return isAnimated ? get(data["generic"], "shaderPrefixAnimated", "") : get(data["generic"], "shaderPrefix", "");
    }

    function ModifyTextureResPath(path, name, area, faction, commands)
    {
        var pathInsert = null;
        if (get(faction, "resPathInsert", "").length)
        {
            pathInsert = faction.resPathInsert;
        }
        if ("respathinsert" in commands && commands.respathinsert.length === 1)
        {
            if (commands.respathinsert[0] === "none")
            {
                return path;
            }
            else
            {
                pathInsert = commands.respathinsert[0];
            }
        }
        if (name === "MaterialMap" || name === "PaintMaskMap" || name === "PmdgMap")
        {
            var index = path.lastIndexOf("/");
            var pathCopy = path;
            if (index >= 0)
            {
                pathCopy = path.substr(0, index + 1) + pathInsert + "/" + path.substr(index + 1);
            }
            index = pathCopy.lastIndexOf("_");
            if (index >= 0)
            {
                pathCopy = pathCopy.substr(0, index) + "_" + pathInsert + pathCopy.substr(index);
                var textureOverrides = get(area, "textureOverrides",
                    {});
                if ((name in textureOverrides) && (faction.name in textureOverrides[name]))
                {
                    return pathCopy;
                }
            }
        }
        return path;
    }

    /**
     * @String}
     */
    function ModifyShaderPath(shader, isSkinned)
    {
        var prefix = GetShaderPrefix(isSkinned);
        shader = "/" + shader;
        var index = shader.lastIndexOf("/");
        return shader.substr(0, index + 1) + prefix + shader.substr(index + 1);
    }

    function FindPrefix(prefixes, name)
    {
        for (var m = 0; m < prefixes.length; ++m)
        {
            if (name.substr(0, prefixes[m].length) === prefixes[m])
            {
                return m;
            }
        }
        return null;
    }

    function GetOverridenParameter(name, area, commands, race)
    {
        var prefixes, materialIndex, materialData, shortName;
        if ("mesh" in commands)
        {
            prefixes = data.generic.materialPrefixes;
            materialIndex = FindPrefix(prefixes, name);
            if (materialIndex !== null && materialIndex < commands.mesh.length && (get(area, "blockedMaterials", 0) & (1 << materialIndex)) === 0)
            {
                materialData = get(data.material, commands.mesh[materialIndex], null);
                if (materialData)
                {
                    shortName = name.substr(prefixes[materialIndex].length);
                    return get(materialData.parameters, shortName, undefined);
                }
            }
        }
        prefixes = data.generic.patternMaterialPrefixes;
        materialIndex = FindPrefix(prefixes, name);
        if ("pattern" in commands)
        {
            if (materialIndex !== null && 1 + materialIndex < commands.pattern.length)
            {
                materialData = get(data.material, commands.pattern[1 + materialIndex], null);
                if (materialData)
                {
                    shortName = name.substr(prefixes[materialIndex].length);
                    return get(materialData.parameters, shortName, undefined);
                }
            }
        }

        if (materialIndex !== null)
        {
            materialData = get(data.material, race.defaultPatternLayer1MaterialName, null);
            if (materialData)
            {
                shortName = name.substr(prefixes[materialIndex].length);
                return get(materialData.parameters, shortName, undefined);
            }
        }
    }

    function GetAddressMode(projectionType)
    {
        switch (projectionType)
        {
            case 2:
                return 4;
            case 1:
                return 3;
            default:
                return 1;
        }
    }

    function FillMeshAreas(areas, areasName, hull, faction, race, pattern, commands, shaderOverride)
    {
        var hullAreas = get(hull, areasName, []);
        for (var i = 0; i < hullAreas.length; ++i)
        {
            var area = hullAreas[i];
            var effect = new Tw2Effect();
            effect.effectFilePath = data["generic"]["areaShaderLocation"] + ModifyShaderPath(shaderOverride ? shaderOverride : area.shader, hull["isSkinned"]);
            var names = get(get(data["generic"]["areaShaders"], area.shader,
                {}), "parameters", []);
            for (var j = 0; j < names.length; ++j)
            {
                var name = names[j];
                var param = GetOverridenParameter(name, area, commands, race);
                param = param || get(get(get(data.generic.hullAreas, area.name, {}), "parameters", {}), name);
                param = param || get(get(get(race.hullAreas, area.name, {}), "parameters", {}), name);
                param = param || get(get(get(faction.areas, area.name, {}), "parameters", {}), name);
                param = param || get(get(area, "parameters", {}), name);
                if (param)
                {
                    effect.parameters[name] = new Tw2Vector4Parameter(name, param);
                }
            }

            var hullTextures = get(area, "textures", []);
            for (j in hullTextures)
            {
                if (hullTextures.hasOwnProperty(j))
                {
                    var path = hullTextures[j];
                    path = ModifyTextureResPath(path, j, area, faction, commands);
                    effect.parameters[j] = new Tw2TextureParameter(j, path);
                }
            }

            for (j = 0; j < pattern.layers.length; ++j)
            {
                if (pattern.layers[j] && !(pattern.layers[j].textureName in effect.parameters))
                {
                    var patternTex = new Tw2TextureParameter(pattern.layers[j].textureName);
                    patternTex.resourcePath = pattern.layers[j].textureResFilePath;
                    patternTex.useAllOverrides = true;
                    patternTex.addressUMode = GetAddressMode(get(pattern.layers[j], "projectionTypeU", 0));
                    patternTex.addressVMode = GetAddressMode(get(pattern.layers[j], "projectionTypeV", 0));
                    patternTex.Initialize();
                    effect.parameters[pattern.layers[j].textureName] = patternTex;
                }
            }

            var defaultTextures = get(get(data["generic"]["areaShaders"], area.shader, {}), "defaultTextures", {});
            for (var texName in defaultTextures)
            {
                if (defaultTextures.hasOwnProperty(texName))
                {
                    if (!(texName in effect.parameters))
                    {
                        effect.parameters[texName] = new Tw2TextureParameter(texName, defaultTextures[texName]);
                    }
                }
            }

            effect.Initialize();

            var newArea = new Tw2MeshArea();
            newArea.name = area.name;
            newArea.effect = effect;
            newArea.index = get(area, "index", 0);
            newArea.count = get(area, "count", 1);
            areas.push(newArea);
        }

    }

    function SetupMesh(ship, hull, faction, race, commands, pattern)
    {
        var mesh = new Tw2Mesh();
        mesh.geometryResPath = hull["geometryResFilePath"];
        ship.boundingSphereCenter[0] = hull.boundingSphere[0];
        ship.boundingSphereCenter[1] = hull.boundingSphere[1];
        ship.boundingSphereCenter[2] = hull.boundingSphere[2];
        ship.boundingSphereRadius = hull.boundingSphere[3];
        FillMeshAreas(get(mesh, "opaqueAreas", []), "opaqueAreas", hull, faction, race, pattern, commands);
        FillMeshAreas(get(mesh, "transparentAreas", []), "transparentAreas", hull, faction, race, pattern, commands);
        FillMeshAreas(get(mesh, "additiveAreas", []), "additiveAreas", hull, faction, race, pattern, commands);
        FillMeshAreas(get(mesh, "decalAreas", []), "decalAreas", hull, faction, race, pattern, commands);
        FillMeshAreas(get(mesh, "depthAreas", []), "depthAreas", hull, faction, race, pattern, commands);
        mesh.Initialize();
        ship.mesh = mesh;
        if ("shapeEllipsoidCenter" in hull)
        {
            ship.shapeEllipsoidCenter = hull.shapeEllipsoidCenter;
        }
        if ("shapeEllipsoidRadius" in hull)
        {
            ship.shapeEllipsoidRadius = hull.shapeEllipsoidRadius;
        }
    }

    function SetupPattern(hull, race, commands)
    {
        var pattern = {
            patterns: [],
            layers: []
        };
        if ("pattern" in commands)
        {
            var p = {};
            for (var k = 0; k < data.pattern.length; ++k)
            {
                if (data.pattern[k].name === commands.pattern[0])
                {
                    p = data.pattern[k];
                    break;
                }
            }
            var layer = get(p, "layer1", null);
            if (layer)
            {
                pattern.layers.push(layer);
            }
            layer = get(p, "layer2", null);
            if (layer)
            {
                pattern.layers.push(layer);
            }
            var projections = get(p, "projections", []);
            for (var i = 0; i < projections.length; ++i)
            {
                if (projections[i].name === hull.name)
                {
                    p = projections[i];
                    layer = get(p, "transformLayer1", null);
                    if (layer)
                    {
                        pattern.patterns.push(layer);
                    }
                    layer = get(p, "transformLayer2", null);
                    if (layer)
                    {
                        pattern.patterns.push(layer);
                    }
                }
            }
        }
        else if (get(hull, "defaultPattern"))
        {
            p = get(hull, "defaultPattern", {});
            layer = get(p, "transformLayer1", null);
            if (layer)
            {
                pattern.patterns.push(layer);
            }
            layer = get(p, "transformLayer2", null);
            if (layer)
            {
                pattern.patterns.push(layer);
            }
            p = get(race, "defaultPattern", {});
            layer = get(p, "layer1", null);
            if (layer)
            {
                pattern.layers.push(layer);
            }
            layer = get(p, "layer2", null);
            if (layer)
            {
                pattern.layers.push(layer);
            }
        }
        return pattern;
    }

    function SetupInstancedMeshes(ship, hull, faction, race, commands, pattern)
    {
        var instancedMeshes = get(hull, "instancedMeshes", []);
        for (var i = 0; i < instancedMeshes.length; ++i)
        {
            var him = instancedMeshes[i];
            var mesh = new Tw2InstancedMesh();
            mesh.instanceGeometryResPath = him.instanceGeometryResPath;
            mesh.geometryResPath = him.geometryResPath;
            mesh.Initialize();

            FillMeshAreas(get(mesh, "opaqueAreas", []), "opaqueAreas", hull, faction, race, pattern, commands, him.shader);

            var child = new EveChildMesh();
            child.mesh = mesh;
            ship.effectChildren.push(child);
        }
    }


    function SetupCustomMasks(ship, pattern)
    {
        for (var i = 0; i < pattern.patterns.length; ++i)
        {
            if (pattern.patterns[i] && pattern.layers[i])
            {
                var p = pattern.patterns[i];
                var l = pattern.layers[i];
                ship.AddCustomMask(
                    get(p, "position", vec3.create()),
                    get(p, "scaling", vec3.fromValues(1, 1, 1)),
                    get(p, "rotation", quat.create()),
                    get(p, "isMirrored", false),
                    get(l, "materialSource", 0),
                    vec4.fromValues(
                        get(l, "isTargetMtl1", true) ? 1 : 0,
                        get(l, "isTargetMtl2", true) ? 1 : 0,
                        get(l, "isTargetMtl3", true) ? 1 : 0,
                        get(l, "isTargetMtl4", true) ? 1 : 0));
            }
        }
    }

    /**
     * Sets up decals
     * @param ship
     * @param hull
     * @param faction
     */
    function SetupDecals(ship, hull, faction = {})
    {
        const hullDecals = get(hull, "hullDecals", []);
        for (let i = 0; i < hullDecals.length; ++i)
        {
            const
                src = hullDecals[i],
                factionDecal = getGroupIndex(faction.decals, src.groupIndex);

            if (factionDecal && !factionDecal.isVisible) continue;

            const shader = factionDecal ? factionDecal.shader || src.shader : src.shader;
            if (!shader) continue;

            const
                effectFilePath = data["generic"]["decalShaderLocation"] + "/" + GetShaderPrefix(false) + shader,
                parameters = Object.assign({}, src.parameters),
                // Should src.shader actually be shader?
                textures = Object.assign(get(get(data["generic"]["decalShaders"], src.shader, {}), "defaultTextures", {}));

            if (factionDecal)
            {
                Object.assign(parameters, factionDecal.parameters);
                Object.assign(textures, factionDecal.textures);
            }

            Object.assign(textures, src.textures);

            ship.decals.push(EveSpaceObjectDecal.from({
                name: src.name,
                groupIndex: src.groupIndex,
                parentBoneIndex: src.boneIndex,
                indexBuffer: src.indexBuffer,
                position: src.position,
                rotation: src.rotation,
                scaling: src.scaling,
                effect: {
                    effectFilePath,
                    parameters,
                    textures
                }
            }));

        }
    }


    /**
     * Gets a group index object
     * @param {*} src
     * @param {Number} [groupIndex=-1]
     * @returns {null|*}
     */
    function getGroupIndex(src, groupIndex = -1)
    {
        if (!src) return null;
        const groupName = `group${groupIndex}`;
        return src[groupName] ? src[groupName] : null;
    }

    /**
     * Sets up sprite sets
     * @param ship
     * @param hull
     * @param faction
     */
    function SetupSpriteSets(ship, hull, faction)
    {
        const
            hullSets = get(hull, "spriteSets", []),
            factionSets = get(faction, "spriteSets", {});

        for (let i = 0; i < hullSets.length; ++i)
        {
            const
                hullSet = hullSets[i],
                hullSetItems = get(hullSet, "items", []),
                items = [];

            for (let j = 0; j < hullSetItems.length; j++)
            {
                const
                    item = Object.assign({blinkRate: 0.1, maxScale: 10, minScale: 1}, hullSetItems[j]),
                    factionSet = getGroupIndex(factionSets, item.groupIndex);

                /*
                // const item = Object.assign({}, hullData[j]);
                // Source data is the same as the input data
                // -- Defaults don't match
                const item = {};
                item.name = src.name;                           // ""
                item.groupIndex = get(src, "groupIndex", -1);   // -1
                item.boneIndex = get(src, "boneIndex", 0);      // 0
                item.blinkPhase = get(src, "blinkPhase", 0);    // 0
                item.blinkRate = get(src, "blinkRate", 0.1);    // 0.1
                item.falloff = get(src, "falloff", 0);          // 0
                item.maxScale = get(src, "maxScale", 10);       // 10
                item.minScale = get(src, "minScale", 1);        // 1
                assignIfExists(item, src, "position");          // [0,0,0]
                */

                if (factionSet)
                {
                    item.groupName = factionSet.name;           // ""
                    assignIfExists(item, factionSet, "color");  // [0,0,0,0]
                }

                if (!self.SKIP_EMPTY_ITEMS || (item.color && !vec3.isEmpty(item.color)))
                {
                    items.push(item);
                }
            }

            if (!self.SKIP_EMPTY_ITEMS || items.length)
            {
                ship.spriteSets.push(EveSpriteSet.from({
                    name: hullSet.name,
                    useQuads: true,
                    skinned: !!(hull.isSkinned && hullSet.skinned),
                    effect: spriteEffect, // Constructed effect can be passed as an option
                    items
                }));
            }
        }
    }

    const EFF_SPOTLIGHT_CONE = "res:/graphics/effect/managed/space/spaceobject/fx/spotlightcone.fx";
    const EFF_SPOTLIGHT_CONE_SKINNED = "res:/graphics/effect/managed/space/spaceobject/fx/skinned_spotlightcone.fx";
    ;
    const EFF_SPOTLIGHT_GLOW = "res:/graphics/effect/managed/space/spaceobject/fx/spotlightglow.fx";
    const EFF_SPOTLIGHT_GLOW_SKINNED = "res:/graphics/effect/managed/space/spaceobject/fx/skinned_spotlightglow.fx";

    /**
     * Sets up spotlight sets
     * @param ship
     * @param hull
     * @param faction
     */
    function SetupSpotlightSets(ship, hull, faction)
    {
        const
            hullSets = get(hull, "spotlightSets", []),
            factionSets = get(faction, "spotlightSets", {});

        for (let i = 0; i < hullSets.length; ++i)
        {
            const
                hullSet = hullSets[i],
                hullSetItems = get(hullSet, "items", []),
                isSkinned = hullSet.skinned,
                items = [];

            // Get spotlight items
            for (let j = 0; j < hullSetItems.length; ++j)
            {
                const
                    item = Object.assign({}, hullSetItems[j]),
                    factionSet = getGroupIndex(factionSets, item.groupIndex);

                /*
                // const item = Object.assign({}, hullData[j]);
                // Source data is the same as the input data
                // -- Defaults match
                const item = {};
                item.name = src.name;                                // ""
                item.groupIndex = src.groupIndex;                    // -1
                item.boneIndex = get(src, "boneIndex", 0);           // 0
                item.boosterGainInfluence = src.boosterGainInfluence;// 0
                item.coneIntensity = src.coneIntensity;              // 0
                item.spriteIntensity = src.spriteIntensity;          // 0
                item.flareIntensity = src.flareIntensity;            // 0
                assignIfExists(item, src, "transform");              // mat4.identity
                */

                if (factionSet)
                {
                    assignIfExists(item, factionSet, ["coneColor", "spriteColor", "flareColor"]); // [0,0,0,0]
                }

                if (!self.SKIP_EMPTY_ITEMS || factionSet)
                {
                    items.push(item);
                }
            }

            if (!self.SKIP_EMPTY_ITEMS || items.length)
            {
                ship.spotlightSets.push(EveSpotlightSet.from({
                    name: hullSet.name,
                    items,
                    coneEffect: {
                        effectFilePath: isSkinned ? EFF_SPOTLIGHT_CONE_SKINNED : EFF_SPOTLIGHT_CONE,
                        parameters: {
                            TextureMap: hullSet.coneTextureResPath,
                            zOffset: get(hullSet, "zOffset", 0)
                        }
                    },
                    glowEffect: {
                        effectFilePath: isSkinned ? EFF_SPOTLIGHT_GLOW_SKINNED : EFF_SPOTLIGHT_GLOW,
                        parameters: {
                            TextureMap: hullSet.glowTextureResPath
                        }
                    }
                }));
            }
        }
    }

    const EFF_PLANE = "res:/graphics/effect/managed/space/spaceobject/fx/planeglow.fx";
    const EFF_PLANE_SKINNED = "res:/graphics/effect/managed/space/spaceobject/fx/skinned_planeglow.fx";

    /**
     * Sets up booster sets
     * @param ship
     * @param hull
     * @param faction
     */
    function SetupPlaneSets(ship, hull, faction)
    {
        const
            hullSets = get(hull, "planeSets", []),
            factionSets = get(faction, "planeSets", {});

        for (let i = 0; i < hullSets.length; ++i)
        {
            const
                hullSet = hullSets[i],
                hullSetItems = get(hullSet, "items", []),
                items = [];

            // Get plane items
            for (let j = 0; j < hullSetItems.length; ++j)
            {
                const
                    item = Object.assign({boneIndex: -1}, hullSetItems[j]),
                    factionSet = getGroupIndex(factionSets, item.groupIndex);

                /*
                const item = {};
                item.name = src.name;                       // ""
                item.groupIndex = src.groupIndex;           // -1
                item.boneIndex = get(src, "boneIndex", -1); // -1
                item.maskAtlasID = src.maskMapAtlasIndex;   // 0
                assignIfExists(item, src, [
                    "position", "rotation", "scaling",
                    "layer1Transform", "layer1Scroll", 
                    "layer2Transform", "layer2Scroll"
                ]);
                */

                if (factionSet)
                {
                    assignIfExists(item, factionSet, "color"); // [0, 0, 0, 0]);
                }

                if (!self.SKIP_EMPTY_ITEMS || (item.color && !vec3.isEmpty(item.color)))
                {
                    items.push(item);
                }
            }

            if (!self.SKIP_EMPTY_ITEMS || items.length)
            {
                ship.planeSets.push(EvePlaneSet.from({
                    name: hullSet.name,
                    items,
                    effect: {
                        effectFilePath: hullSet.skinned ? EFF_PLANE_SKINNED : EFF_PLANE,
                        textures: {
                            Layer1Map: hullSet.layer1MapResPath,
                            Layer2Map: hullSet.layer2MapResPath,
                            MaskMap: hullSet.maskMapResPath,
                            PlaneData: get(hullSet, "planeData", [1, 0, 0, 0])
                        }
                    }
                }));
            }
        }
    }

    const EFF_BOOSTER_VOLUMETRIC = "res:/Graphics/Effect/Managed/Space/Booster/BoosterVolumetric.fx";
    const EFF_BOOSTER_GLOW_SKINNED = "res:/Graphics/Effect/Managed/Space/Booster/BoosterGlowAnimated.fx";
    const TEX_NOISE = "res:/Texture/global/noise.dds.0.png";
    const TEX_NOISE_32_CUBE = "res:/Texture/Global/noise32cube_volume.dds.0.png";
    const TEX_WHITE_SHARP = "res:/Texture/Particle/whitesharp.dds.0.png";

    /**
     * Sets up boosters
     * @param ship
     * @param hull
     * @param race
     */
    function SetupBoosters(ship, hull, race)
    {
        if (!hull.booster) return;

        const
            zero = [0, 0, 0, 0],
            raceBooster = get(race, "booster", {}),
            hullBooster = hull["booster"],
            hullBoosterItems = get(hullBooster, "items", []);

        for (let i = 0; i < hullBoosterItems.length; ++i)
        {
            ship.locators.push(EveLocator2.from({
                name: "locator_booster_" + (i + 1),
                transform: hullBoosterItems[i].transform,
                atlasIndex0: get(hullBoosterItems[i], "atlasIndex0", 0),
                atlasIndex1: get(hullBoosterItems[i], "atlasIndex1", 0)
            }));
        }

        ship.boosters = EveBoosterSet.from({
            glowScale: raceBooster.glowScale,
            symHaloScale: raceBooster.symHaloScale,
            haloScaleX: raceBooster.haloScaleX,
            haloScaleY: raceBooster.haloScaleY,
            haloColor: raceBooster.haloColor,
            glowColor: raceBooster.glowColor,
            warpGlowColor: raceBooster.warpGlowColor,
            warpHaloColor: raceBooster.warpHalpColor,
            trailColor: raceBooster.trailColor,
            trailSize: raceBooster.trailSize,
            effect: {
                effectFilePath: EFF_BOOSTER_VOLUMETRIC,
                parameters: {
                    NoiseFunction0: get(raceBooster.shape0, "noiseFunction", 0),
                    NoiseSpeed0: get(raceBooster.shape0, "noiseSpeed", 0),
                    NoiseAmplitudeStart0: get(raceBooster.shape0, "noiseAmplitureStart", zero),
                    NoiseAmplitudeEnd0: get(raceBooster.shape0, "noiseAmplitureEnd", zero),
                    NoiseFrequency0: get(raceBooster.shape0, "noiseFrequency", zero),
                    Color0: get(raceBooster.shape0, "color", zero),
                    NoiseFunction1: get(raceBooster.shape1, "noiseFunction", 0),
                    NoiseSpeed1: get(raceBooster.shape1, "noiseSpeed", 0),
                    NoiseAmplitudeStart1: get(raceBooster.shape1, "noiseAmplitureStart", zero),
                    NoiseAmplitudeEnd1: get(raceBooster.shape1, "noiseAmplitureEnd", zero),
                    NoiseFrequency1: get(raceBooster.shape1, "noiseFrequency", zero),
                    Color1: get(raceBooster.shape1, "color", zero),
                    WarpNoiseFunction0: get(raceBooster.warpShape0, "noiseFunction", 0),
                    WarpNoiseSpeed0: get(raceBooster.warpShape0, "noiseSpeed", 0),
                    WarpNoiseAmplitudeStart0: get(raceBooster.warpShape0, "noiseAmplitureStart", zero),
                    WarpNoiseAmplitudeEnd0: get(raceBooster.warpShape0, "noiseAmplitureEnd", zero),
                    WarpNoiseFrequency0: get(raceBooster.warpShape0, "noiseFrequency", zero),
                    WarpColor0: get(raceBooster.warpShape0, "color", zero),
                    WarpNoiseFunction1: get(raceBooster.warpShape1, "noiseFunction", 0),
                    WarpNoiseSpeed1: get(raceBooster.warpShape1, "noiseSpeed", 0),
                    WarpNoiseAmplitudeStart1: get(raceBooster.warpShape1, "noiseAmplitureStart", zero),
                    WarpNoiseAmplitudeEnd1: get(raceBooster.warpShape1, "noiseAmplitureEnd", zero),
                    WarpNoiseFrequency1: get(raceBooster.warpShape1, "noiseFrequency", zero),
                    WarpColor1: get(raceBooster.warpShape1, "color", zero),
                    ShapeAtlasSize: [get(raceBooster, "shapeAtlasHeight", 0), get(raceBooster, "shapeAtlasCount", 0), 0, 0],
                    BoosterScale: get(raceBooster, "scale", [1, 1, 1, 1]),
                },
                textures: {
                    ShapeMap: raceBooster.shapeAtlasResPath,
                    GradientMap0: raceBooster.gradient0ResPath,
                    GradientMap1: raceBooster.gradient1ResPath,
                    NoiseMap: TEX_NOISE_32_CUBE
                }
            },
            glows: {
                useQuads: true,
                effect: {
                    effectFilePath: EFF_BOOSTER_GLOW_SKINNED,
                    textures: {
                        DiffuseMap: TEX_WHITE_SHARP,
                        NoiseMap: TEX_NOISE
                    }
                }
            }
        });
    }

    /**
     * Sets up locators
     * @param ship
     * @param hull
     */
    function SetupLocators(ship, hull)
    {
        const hullLocators = get(hull, "locatorTurrets", []);
        for (let i = 0; i < hullLocators.length; ++i)
        {
            ship.locators.push(EveLocator2.from(hullLocators[i]));
        }
    }

    function BindParticleEmitters(obj, curveSet, curve)
    {
        if (Array.isArray(obj.particleEmitters))
        {
            for (var i = 0; i < obj.particleEmitters.length; ++i)
            {
                if ("rate" in obj.particleEmitters[i])
                {
                    var binding = new Tw2ValueBinding();
                    binding.sourceObject = curve;
                    binding.sourceAttribute = "currentValue";
                    binding.destinationObject = obj.particleEmitters[i];
                    binding.destinationAttribute = "rate";
                    binding.Initialize();
                    curveSet.bindings.push(binding);
                }
            }
            for (i = 0; i < obj.children.length; ++i)
            {
                BindParticleEmitters(obj.children[i], curveSet, curve);
            }
        }
        else
        {
            tw2.Log({
                type: "warning",
                name: "Space object factory",
                message: `Unable to bind particle emitters: ${obj.constructor.name}`
            });
        }
    }

    function SetupChildren(ship, hull, curveSet, curves)
    {
        function onChildLoaded(child)
        {
            return function (obj)
            {
                if (obj.constructor.__isEffectChild)
                {
                    ship.effectChildren.push(obj);
                }
                else
                {
                    ship.children.push(obj);
                }
                vec3.copy(obj.translation, get(child, "translation", [0, 0, 0]));
                quat.copy(obj.rotation, get(child, "rotation", [0, 0, 0, 1]));
                vec3.copy(obj.scaling, get(child, "scaling", [1, 1, 1]));
                var id = get(child, "id", -1);
                if (id !== -1 && curves[id])
                {
                    BindParticleEmitters(obj, curveSet, curves[id]);
                }
            };
        }

        const children = get(hull, "children", []);
        for (let i = 0; i < children.length; ++i)
        {
            const resPath = children[i]["redFilePath"];
            if (resPath)
            {
                tw2.GetObject(resPath, onChildLoaded(children[i]));
            }
            else
            {
                tw2.Log({
                    type: "warning",
                    name: "Space object factory",
                    message: `No resource path found for "${hull.name}" child at index ${i}`
                });
            }
        }
    }

    function SetupAnimations(ship, hull)
    {
        var id_curves = [];
        var curveSet = null;
        var animations = get(hull, "animations", []);
        for (var i = 0; i < animations.length; ++i)
        {
            if (get(animations[i], "id", -1) !== -1 && (get(animations[i], "startRate", -1) !== -1))
            {
                if (!curveSet)
                {
                    curveSet = new Tw2CurveSet();
                }
                var curve = new Tw2ScalarCurve2();
                curve.keys.push(new Tw2ScalarKey2());
                curve.keys.push(new Tw2ScalarKey2());
                curve.keys[0].value = get(animations[i], "startRate", -1);
                curve.keys[1].time = 1;
                curve.keys[1].value = get(animations[i], "endRate", -1);
                curve.Initialize();
                curveSet.curves.push(curve);
                ship.curveSets.push(curveSet);
                id_curves[get(animations[i], "id", -1)] = curve;
            }
        }
        if (curveSet)
        {
            curveSet.Initialize();
        }
        return [curveSet, id_curves];
    }

    var dataLoading = false;
    var pendingLoads = [];

    function Build(dna)
    {
        var parts = dna.split(":");
        var commands = {};
        for (var i = 3; i < parts.length; ++i)
        {
            var subparts = parts[i].split("?");
            commands[subparts[0]] = subparts[1].split(";");
        }
        var hull = data["hull"][parts[0]];
        var faction = data["faction"][parts[1]];
        var race = data["race"][parts[2]];
        var ship = new (get(hull, "buildClass", 0) === 2 ? EveSpaceObject : EveShip)();
        var pattern = SetupPattern(hull, race, commands);
        SetupMesh(ship, hull, faction, race, commands, pattern);
        SetupCustomMasks(ship, pattern);
        SetupDecals(ship, hull, faction);
        SetupSpriteSets(ship, hull, faction);
        SetupSpotlightSets(ship, hull, faction);
        SetupPlaneSets(ship, hull, faction);
        SetupBoosters(ship, hull, race);
        SetupLocators(ship, hull);
        var curves = SetupAnimations(ship, hull);
        SetupChildren(ship, hull, curves[0], curves[1]);
        SetupInstancedMeshes(ship, hull, faction, race, commands, pattern);

        ship.Initialize();
        return ship;
    }

    function GetTurretMaterialParameter(name, parentFaction, areaData)
    {
        var materialIdx = -1;
        for (var i = 0; i < data["generic"]["materialPrefixes"].length; ++i)
        {
            if (name.substr(0, data["generic"]["materialPrefixes"][i].length) === data["generic"]["materialPrefixes"][i])
            {
                materialIdx = i;
                name = name.substr(data["generic"]["materialPrefixes"][i].length);
            }
        }
        if (materialIdx !== -1)
        {
            var turretMaterialIndex = get(parentFaction, "materialUsageMtl" + (materialIdx + 1), materialIdx);
            if (turretMaterialIndex >= 0 && turretMaterialIndex < data["generic"]["materialPrefixes"].length)
            {
                name = data["generic"]["materialPrefixes"][turretMaterialIndex] + name;
                if (name in areaData.parameters)
                {
                    return areaData.parameters[name];
                }
            }
        }
    }

    var zeroColor = [0, 0, 0, 0];

    function CombineTurretMaterial(name, parentValue, turretValue, overrideMethod)
    {
        switch (overrideMethod)
        {
            case "overridable":
                return parentValue ? parentValue : turretValue ? turretValue : zeroColor;
            case "half_overridable":
                if (name.indexOf("GlowColor") >= 0)
                {
                    return turretValue ? turretValue : zeroColor;
                }
                return parentValue ? parentValue : turretValue ? turretValue : zeroColor;
            case "not_overridable":
            case "half_overridable_2":
                return turretValue ? turretValue : zeroColor;
        }
        return zeroColor;
    }

    function SetupTurretMaterial(turretSet, parentFactionName, turretFactionName)
    {
        var parentFaction = data["faction"][parentFactionName];
        var turretFaction = data["faction"][turretFactionName];
        var parentArea = null;
        if (parentFaction && parentFaction.areas && ("hull" in parentFaction.areas))
        {
            parentArea = parentFaction.areas.hull;
        }
        var turretArea = null;
        if (turretFaction && turretFaction.areas && ("hull" in turretFaction.areas))
        {
            turretArea = turretFaction.areas.hull;
        }
        if (!parentArea && !turretArea)
        {
            return;
        }
        if (turretSet.turretEffect)
        {
            var params = turretSet.turretEffect.parameters;
            for (var i in params)
            {
                if (params.hasOwnProperty(i))
                {
                    if (params[i].constructor.prototype !== Tw2Vector4Parameter.prototype)
                    {
                        continue;
                    }
                    var parentValue = null;
                    var turretValue = null;
                    if (parentArea)
                    {
                        parentValue = GetTurretMaterialParameter(i, parentFaction, parentArea);
                    }
                    if (turretArea)
                    {
                        turretValue = GetTurretMaterialParameter(i, parentFaction, parentArea);
                    }
                    vec4.copy(params[i].value, CombineTurretMaterial(i, parentValue, turretValue, turretSet.turretEffect.name));
                }
            }
            turretSet.turretEffect.BindParameters();
        }
    }

    this.SetupTurretMaterialAsync = function (turretSet, parentFactionName, turretFactionName)
    {
        return this.GetData().then(() =>
        {
            SetupTurretMaterial(turretSet, parentFactionName, turretFactionName);
            return turretSet;
        });
    };

    this.SetupTurretMaterial = function (turretSet, parentFactionName, turretFactionName, onResolved, onRejected)
    {
        return this.SetupTurretMaterialAsync(turretSet, parentFactionName, turretFactionName)
            .then(onResolved)
            .catch(onRejected);
    };

    function setupSpriteEffect()
    {
        if (!spriteEffect)
        {
            spriteEffect = Tw2Effect.from({
                effectFilePath: "res:/graphics/effect/managed/space/spaceobject/fx/blinkinglightspool.fx",
                parameters: {
                    MainIntensity: 1,
                    GradientMap: "res:/texture/particle/whitesharp_gradient.dds.0.png"
                }
            });
        }
    }

    let dataPromise = null;

    /**
     * Gets sof data asynchronously
     * @returns {Promise}
     */
    this.GetData = function ()
    {
        if (!dataPromise)
        {
            setupSpriteEffect();

            dataPromise = new Promise((resolve, reject) =>
            {
                tw2.GetObject(
                    "res:/dx9/model/spaceobjectfactory/data.red",
                    obj =>
                    {
                        data = obj;
                        resolve(data);
                    },
                    err =>
                    {
                        tw2.Log({
                            type: "error",
                            name: "Space object factory",
                            message: "Could not load data"
                        });

                        reject(err);
                    });
            });
        }

        return dataPromise;
    };

    /**
     * Internal handler for loading sof objects asynchronously
     * @param {String} root   - Root sof object name
     * @param {String} [name] - Root sof object child name (* for all)
     * @returns {Promise}
     */
    function getSofRoot(root, name)
    {
        root = root.toLowerCase();

        return self.GetData().then(data =>
        {
            if (!data[root])
            {
                throw new Error(`Invalid sof root: ${root}`);
            }

            // Select all children
            if (name === "*")
            {
                return data[root];
            }

            if (!name)
            {
                throw new Error(`Invalid sof ${root} child: ${name}`);
            }

            name = name.toLowerCase();

            if (Array.isArray(data[root]))
            {
                for (let i = 0; i < data[root].length; i++)
                {
                    if (data[root][i].name === name)
                    {
                        return data[root][i];
                    }
                }
                throw new Error(`Invalid sof ${root} child: ${name}`);
            }

            if (!data[root][name])
            {
                throw new Error(`Invalid sof ${root} child: ${name}`);
            }

            return data[root][name];
        });
    }

    /**
     * Gets the names and descriptions of a sof root object asynchronously
     * @param {String} root - The root sof object name
     * @returns {Promise}
     */
    function getSofRootNames(root)
    {
        return getSofRoot(root, "*")
            .then(obj =>
            {
                const names = {};

                if (Array.isArray(obj))
                {
                    for (let i = 0; i < obj.length; i++)
                    {
                        names[obj[i].name] = obj[i].description || "";
                    }
                }
                else
                {
                    for (const key in obj)
                    {
                        if (obj.hasOwnProperty(key))
                        {
                            names[key] = obj[key].description || "";
                        }
                    }
                }
                return names;
            });
    }

    /**
     * Builds dna async
     * @param dna
     * @returns {PromiseLike|Promise}
     */
    this.GetObject = function (dna)
    {
        return this.GetData().then(() => Build(dna));
    };

    this.GetHull = function (name)
    {
        return getSofRoot("hull", name);
    };

    this.GetHulls = function ()
    {
        return getSofRoot("hull", "*");
    };

    this.GetHullNames = function ()
    {
        return getSofRootNames("hull");
    };

    this.GetFaction = function (name)
    {
        return getSofRoot("faction", name);
    };

    this.GetFactions = function ()
    {
        return getSofRoot("faction", "*");
    };

    this.GetFactionNames = function ()
    {
        return getSofRootNames("faction");
    };

    this.GetRace = function (name)
    {
        return getSofRoot("race", name);
    };

    this.GetRaces = function ()
    {
        return getSofRoot("race", "*");
    };

    this.GetRaceNames = function ()
    {
        return getSofRootNames("race");
    };

    this.GetMaterial = function (name)
    {
        return getSofRoot("material", name);
    };

    this.GetMaterials = function ()
    {
        return getSofRoot("material", "*");
    };

    this.GetMaterialNames = function ()
    {
        return getSofRootNames("material");
    };

    this.GetPattern = function (name)
    {
        return getSofRoot("pattern", name);
    };

    this.GetPatterns = function (name)
    {
        return getSofRoot("pattern", "*");
    };

    this.GetPatternNames = function ()
    {
        return getSofRootNames("pattern");
    };

    /**
     * Gets hull pattern names
     * @param {String} name
     * @returns {Promise<Array>}
     */
    this.GetHullPatternNames = function (name = null)
    {
        return this.GetHull(name)
            .then(x =>
            {
                return this.GetPatterns()
                    .then(patterns =>
                    {
                        const result = {};
                        for (let i = 0; i < patterns.length; i++)
                        {
                            const pattern = patterns[i];
                            const found = pattern.projections.filter(x => x.name === name).length;
                            if (found) result[pattern.name] = pattern.description || "";
                        }
                        return result;
                    });
            });

    };

    this.GetHullBuildClass = function (name)
    {
        const c = name.indexOf(":");
        if (c > 0) name = name.substr(0, c);
        return getSofRoot("hull", name).then(obj => obj.buildClass === 2 ? 2 : 1);
    };

}
