import { vec3, vec4, quat, mat4 } from "../global";
import { get, assignIfExists, isArray, isDNA } from "../global/util";
import {
    Tw2ScalarCurve2,
    Tw2ScalarKey2,
    Tw2CurveSet,
    Tw2ValueBinding
} from "../curve";
import {
    Tw2TextureParameter,
    Tw2Vector4Parameter,
    Tw2Effect,
    Tw2Mesh,
    Tw2MeshArea,
    Tw2InstancedMesh,
    ErrSOFRaceNotFound,
    ErrSOFFactionNotFound,
    ErrSOFMaterialNotFound,
    ErrSOFPatternNotFound,
    ErrSOFHullNotFound,
} from "../core";
import {
    EveBoosterSet,
    EveChildMesh,
    EveLocator2,
    EvePlaneSet,
    EveSpaceObjectDecal,
    EveSpotlightSet,
    EveSpriteSet,
    EveSpaceObject,
    EveShip,
    EveCustomMask
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

    /**
     * Gets an address mode from a projection type
     * @param {Number} projectionType
     * @returns {Number}
     */
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

    function FillMeshAreas(areas, areasName, hull, faction, race, pattern, commands, shaderOverride, masks)
    {
        const hullAreas = get(hull, areasName, []);
        for (let i = 0; i < hullAreas.length; ++i)
        {
            const 
                area = hullAreas[i],
                effect = new Tw2Effect();
            
            // Use references to custom mask parameters - do not recreate them
            for (let i = 0; i < 2; i++)
            {
                const mask = masks[i];
                if (mask)
                {
                    const { PatternMaskMap, DiffuseColor, FresnelColor, Gloss } = mask.parameters;
                    effect.parameters[PatternMaskMap.name] = PatternMaskMap;
                    effect.parameters[DiffuseColor.name] = DiffuseColor;
                    effect.parameters[FresnelColor.name] = FresnelColor;
                    effect.parameters[Gloss.name] = Gloss;
                }
                else
                {
                    console.error("Missing mask " + i);
                }
            }

            effect.effectFilePath = data["generic"]["areaShaderLocation"] + ModifyShaderPath(shaderOverride ? shaderOverride : area.shader, hull["isSkinned"]);
            const names = get(get(data["generic"]["areaShaders"], area.shader, {}), "parameters", []);
            for (let j = 0; j < names.length; ++j)
            {
                const name = names[j];
                let param = GetOverridenParameter(name, area, commands, race);
                param = param || get(get(get(data.generic.hullAreas, area.name, {}), "parameters", {}), name);
                param = param || get(get(get(race.hullAreas, area.name, {}), "parameters", {}), name);
                param = param || get(get(get(faction.areas, area.name, {}), "parameters", {}), name);
                param = param || get(get(area, "parameters", {}), name);

                if (param)
                {
                    if (effect.parameters[name])
                    {
                        effect.parameters[name].SetValue(param);
                    }
                    else
                    {
                        effect.parameters[name] = new Tw2Vector4Parameter(name, param);
                    }
                }
            }

            const hullTextures = get(area, "textures", {});
            for (let name in hullTextures)
            {
                if (hullTextures.hasOwnProperty(name))
                {
                    const path = ModifyTextureResPath(hullTextures[name], name, area, faction, commands);
                    if (effect.parameters[name])
                    {
                        effect.parameters[name].SetValue(path);
                    }
                    else
                    {
                        effect.parameters[name] = new Tw2TextureParameter(name, path);
                    }
                }
            }

            // Only create pattern parameters if they don't already exist
            for (let j = 0; j < pattern.layers.length; ++j)
            {
                const textureName = pattern.layers[j] ? pattern.layers[j].textureName : "";
                if (textureName && !effect.parameters[textureName])
                {
                    const patternTex = new Tw2TextureParameter(pattern.layers[j].textureName);
                    patternTex.resourcePath = pattern.layers[j].textureResFilePath;
                    patternTex.useAllOverrides = true;
                    patternTex.addressUMode = GetAddressMode(get(pattern.layers[j], "projectionTypeU", 0));
                    patternTex.addressVMode = GetAddressMode(get(pattern.layers[j], "projectionTypeV", 0));
                    patternTex.Initialize();
                    effect.parameters[pattern.layers[j].textureName] = patternTex;
                }
            }

            const defaultTextures = get(get(data["generic"]["areaShaders"], area.shader, {}), "defaultTextures", {});
            for (let name in defaultTextures)
            {
                if (defaultTextures.hasOwnProperty(name))
                {
                    if (!(name in effect.parameters))
                    {
                        effect.parameters[name] = new Tw2TextureParameter(name, defaultTextures[name]);
                    }
                }
            }

            effect.Initialize();

            const newArea = new Tw2MeshArea();
            newArea.name = area.name;
            newArea.effect = effect;
            newArea.index = get(area, "index", 0);
            newArea.count = get(area, "count", 1);
            areas.push(newArea);
        }

    }

    function SetupMesh(ship, hull, faction, race, commands, pattern)
    {
        const mesh = ship.mesh || new Tw2Mesh();
        mesh.geometryResPath = hull["geometryResFilePath"];

        if (ship.mesh !== mesh)
        {
            ship.boundingSphereCenter[0] = hull.boundingSphere[0];
            ship.boundingSphereCenter[1] = hull.boundingSphere[1];
            ship.boundingSphereCenter[2] = hull.boundingSphere[2];
            ship.boundingSphereRadius = hull.boundingSphere[3];
        }
        else
        {
            mesh.EmptyAreas();
        }

        const masks = ship.customMasks;
        masks[0] = masks[0] || new EveCustomMask();
        masks[1] = masks[1] || new EveCustomMask();

        const args = [ hull, faction, race, pattern, commands, undefined, masks ];
        FillMeshAreas(get(mesh, "opaqueAreas", []), "opaqueAreas", ...args);
        FillMeshAreas(get(mesh, "transparentAreas", []), "transparentAreas", ...args);
        FillMeshAreas(get(mesh, "additiveAreas", []), "additiveAreas", ...args);
        FillMeshAreas(get(mesh, "decalAreas", []), "decalAreas", ...args);
        FillMeshAreas(get(mesh, "depthAreas", []), "depthAreas", ...args);

        if (ship.mesh !== mesh)
        {
            if ("shapeEllipsoidCenter" in hull)
            {
                ship.shapeEllipsoidCenter = hull.shapeEllipsoidCenter;
            }
            if ("shapeEllipsoidRadius" in hull)
            {
                ship.shapeEllipsoidRadius = hull.shapeEllipsoidRadius;
            }
        }

        ship.mesh = mesh;
        mesh.Initialize();
    }

    function SetupPattern(hull, race, commands)
    {
        const pattern = {
            patterns: [],
            layers: []
        };

        // Requested pattern
        if ("pattern" in commands)
        {
            // Layers
            let l = {};
            for (let i = 0; i < data.pattern.length; ++i)
            {
                if (data.pattern[i].name === commands.pattern[0])
                {
                    l = data.pattern[i];
                    break;
                }
            }
            pattern.layers.push(get(l, "layer1", {}));
            pattern.layers.push(get(l, "layer2", {}));
            const projections = get(l, "projections", []);

            // Projections
            let p = {};
            for (let i = 0; i < projections.length; ++i)
            {
                if (projections[i].name === hull.name)
                {
                    p = projections[i];
                    break;
                }
            }
            pattern.patterns.push(get(p, "transformLayer1", {}));
            pattern.patterns.push(get(p, "transformLayer2", {}));
        }
        // Default pattern
        else
        {
            // Layers
            const l = get(race, "defaultPattern", {});
            pattern.layers.push(get(l, "layer1", {}));
            pattern.layers.push(get(l, "layer2", {}));

            // Projections
            const p = get(hull, "defaultPattern", {});
            pattern.patterns.push(get(p, "transformLayer1", {}));
            pattern.patterns.push(get(p, "transformLayer2", {}));
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

    function SetupCustomMasks(ship, pattern = {})
    {
        const { patterns = [], layers = [] } = pattern;

        for (let i = 0; i < 2; ++i)
        {
            const
                p = patterns[i] || {},
                l = layers[i] || {};

            // Default pattern values
            const {
                rotation = quat.create(),
                scaling = vec3.fromValues(1, 1, 1),
                position = vec3.create(),
                isMirrored = false
            } = p;

            // Default layer values
            const {
                display = !!layers[i].textureName,
                materialSource = 0,
                textureName = `PatternMask${i + 1}Map`,
                textureResFilePath = "res:/texture/global/black.dds.0.png",
                projectionTypeU = 0,
                projectionTypeV = 0,
                isTargetMtl1 = true,
                isTargetMtl2 = true,
                isTargetMtl3 = true,
                isTargetMtl4 = true
            } = l;

            const mask = ship.customMasks[i] || new EveCustomMask();
            mask.name = `Pattern${i + 1}`;
            mask.display = display;

            quat.copy(mask.rotation, rotation);
            vec3.copy(mask.scaling, scaling);
            vec3.copy(mask.translation, position);

            vec4.set(mask.targetMaterials,
                isTargetMtl1 ? 1 : 0,
                isTargetMtl2 ? 1 : 0,
                isTargetMtl3 ? 1 : 0,
                isTargetMtl4 ? 1 : 0
            );

            mask.materialIndex = materialSource;
            mask.isMirrored = !!isMirrored;

            const { PatternMaskMap, DiffuseColor, FresnelColor, Gloss } = mask.parameters;

            PatternMaskMap.name = textureName;
            PatternMaskMap.resourcePath = textureResFilePath;
            PatternMaskMap.useAllOverrides = true;
            PatternMaskMap.addressUMode = GetAddressMode(projectionTypeU);
            PatternMaskMap.addressVMode = GetAddressMode(projectionTypeV);
            PatternMaskMap.Initialize();

            const prefix = `PMtl${i + 1}`;
            DiffuseColor.name = `${prefix}DiffuseColor`;
            FresnelColor.name = `${prefix}FresnelColor`;
            Gloss.name = `${prefix}Gloss`;

            mask.Initialize();

            if (ship.customMasks[i] !== mask)
            {
                ship.customMasks.push(mask);
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
                    item = Object.assign({ blinkRate: 0.1, maxScale: 10, minScale: 1 }, hullSetItems[j]),
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
                    assignIfExists(item, factionSet, [ "coneColor", "spriteColor", "flareColor" ]); // [0,0,0,0]
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
                    item = Object.assign({ boneIndex: -1 }, hullSetItems[j]),
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
                            PlaneData: get(hullSet, "planeData", [ 1, 0, 0, 0 ])
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
            zero = [ 0, 0, 0, 0 ],
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
                    ShapeAtlasSize: [ get(raceBooster, "shapeAtlasHeight", 0), get(raceBooster, "shapeAtlasCount", 0), 0, 0 ],
                    BoosterScale: get(raceBooster, "scale", [ 1, 1, 1, 1 ]),
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
            return function(obj)
            {
                if (obj.constructor.__isEffectChild)
                {
                    ship.effectChildren.push(obj);
                }
                else
                {
                    ship.children.push(obj);
                }
                vec3.copy(obj.translation, get(child, "translation", [ 0, 0, 0 ]));
                quat.copy(obj.rotation, get(child, "rotation", [ 0, 0, 0, 1 ]));
                vec3.copy(obj.scaling, get(child, "scaling", [ 1, 1, 1 ]));
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
                tw2.resMan.GetObject(resPath, onChildLoaded(children[i]));
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
        return [ curveSet, id_curves ];
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

    var zeroColor = [ 0, 0, 0, 0 ];

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

    this.SetupTurretMaterial = function(turretSet, parentFactionName, turretFactionName, onResolved, onRejected)
    {
        return this.FetchTurretMaterial(turretSet, parentFactionName, turretFactionName)
            .then(onResolved)
            .catch(onRejected);
    };

    this.FetchTurretMaterial = async function(turretSet, parentFactionName, turretFactionName)
    {
        await this.FetchSOF();
        SetupTurretMaterial(turretSet, parentFactionName, turretFactionName);
        return turretSet;
    };

    /**
     * Fetches sof data
     */
    this.FetchSOF = (function()
    {
        let sofPromise = null;

        /**
         * Gets sof data asynchronously
         * @returns {Promise}
         */
        return async function()
        {
            if (!sofPromise)
            {
                spriteEffect = Tw2Effect.from({
                    effectFilePath: "res:/graphics/effect/managed/space/spaceobject/fx/blinkinglightspool.fx",
                    parameters: {
                        MainIntensity: 1,
                        GradientMap: "res:/texture/particle/whitesharp_gradient.dds.0.png"
                    }
                });

                sofPromise = tw2.FetchObject("res:/dx9/model/spaceobjectfactory/data.red")
                    .then(sof => data = sof)
                    .catch(err =>
                    {
                        tw2.Log({
                            type: "error",
                            name: "Space object factory",
                            message: "Could not load data"
                        });
                    });
            }

            return sofPromise;
        };
    })();

    /**
     * Extends the sof data object with patterns from a space object factory file
     * @param {String} [resPath] - The resource path to a source space object factory file
     * @returns {Promise}
     */
    this.ExtendPatternsFrom = async function(resPath)
    {
        if (!resPath)
        {
            return Promise.reject(new Error("Invalid respath: undefined"));
        }

        const
            currentSof = await this.FetchSOF(),
            extendSof = await tw2.FetchObject(resPath);

        currentSof.pattern = currentSof.pattern.concat(extendSof.pattern);
    };

    /**
     * Extends the sof data object with materials from a space object factory file
     * @param {String} [resPath] - The resource path to a source space object factory file
     * @returns {Promise}
     */
    this.ExtendMaterialsFrom = async function(resPath)
    {
        if (!resPath)
        {
            return Promise.reject(new Error("Invalid respath: undefined"));
        }

        const
            currentSof = await this.FetchSOF(),
            extendSof = await tw2.FetchObject(resPath);

        const materials = extendSof.material;

        if (resPath.includes(".black"))
        {
            extendSof.material.forEach(material =>
            {
                currentSof.material[material.name] = material.Assign();
            });
        }
        else
        {
            Object.assign(currentSof.material, extendSof.material);
        }
    };

    /**
     * Gets a sof object
     * @param {String} name
     * @returns {Promise<{}>}
     */
    const getSofObject = async (name) =>
    {
        const sof = await this.FetchSOF();
        if (sof[name]) return sof[name];
        throw new Error(`Invalid sof object (${name})`);
    };

    /**
     * Gets a sof object's key's value
     * @param {String} name
     * @param {String} key
     * @param {Tw2Error} ErrorConstructor
     * @returns {Promise<{}>}
     */
    const getSofObjectKey = async (name, key, ErrorConstructor) =>
    {
        const sofObject = await getSofObject(name);

        if (isArray(sofObject))
        {
            for (let i = 0; i < sofObject.length; i++)
            {
                if (sofObject[key].name === name)
                {
                    return sofObject[key];
                }
            }
        }
        else if (sofObject[key])
        {
            return sofObject[key];
        }

        if (ErrorConstructor)
        {
            throw new ErrorConstructor({ name: key });
        }

        throw new Error(`Invalid sof object key (${name}:${key})`);
    };

    /**
     * Gets a sof object's value's and descriptions
     * @param {String} name
     * @returns {Promise<{}>}
     */
    const getSofObjectValueDescriptions = async (name) =>
    {
        const
            sofObject = await getSofObject(name),
            out = {};

        if (isArray(sofObject))
        {
            for (let i = 0; i < sofObject.length; i++)
            {
                out[sofObject[i].name] = sofObject[i].description || "";
            }
            return out;
        }

        for (const key in sofObject)
        {
            if (sofObject.hasOwnProperty(key))
            {
                out[key] = sofObject[key].description || "";
            }
        }

        return out;
    };

    /**
     * Helper to get a hull's projection data from a pattern
     * @param {String} hull
     * @param {*} patternData
     */
    const getHullProjection = async (hull, patternData) =>
    {
        await this.FetchHull(hull);

        const { projections = [] } = patternData;
        for (let i = 0; i < projections.length; i++)
        {
            if (projections[i].name === hull)
            {
                const out = {};
                out.name = patternData.name;
                out.layer1 = patternData.layer1;
                out.layer2 = patternData.layer2;
                out.transformLayer1 = projections[i].transformLayer1;
                out.transformLayer2 = projections[i].transformLayer2;
                return out;
            }
        }
    };

    /**
     * Gets a sof object from dna
     * @param {String} dna
     * @returns {Promise<*>}
     */
    this.FetchObject = async (dna) =>
    {
        if (!isDNA(dna))
        {
            throw new Error(`Invalid DNA (${dna})`);
        }

        const
            parts = dna.split(":"),
            commands = {};

        for (let i = 3; i < parts.length; ++i)
        {
            const subParts = parts[i].split("?");
            commands[subParts[0]] = subParts[1].split(";");
        }

        const
            hull = await this.FetchHull(parts[0]),
            faction = await this.FetchFaction(parts[1]),
            race = await this.FetchRace(parts[2]);

        // Ensure we have valid materials
        if (commands.mesh)
        {
            for (let i = 0; i < commands.mesh.length; i++)
            {
                await this.FetchMaterial(commands.mesh[i]);
            }
        }

        // Ensure we have valid materials
        if (commands.pattern && commands.pattern.length > 1)
        {
            for (let i = 1; i < commands.pattern.length; i++)
            {
                await this.FetchMaterial(commands.pattern[i]);
            }
        }

        const
            ship = new (get(hull, "buildClass", 0) === 2 ? EveSpaceObject : EveShip)(),
            pattern = SetupPattern(hull, race, commands);

        SetupCustomMasks(ship, pattern); // Custom masks must be first

        SetupMesh(ship, hull, faction, race, commands, pattern);
        SetupDecals(ship, hull, faction);
        SetupSpriteSets(ship, hull, faction);
        SetupSpotlightSets(ship, hull, faction);
        SetupPlaneSets(ship, hull, faction);
        SetupBoosters(ship, hull, race);
        SetupLocators(ship, hull);

        const curves = SetupAnimations(ship, hull);
        SetupChildren(ship, hull, curves[0], curves[1]);
        SetupInstancedMeshes(ship, hull, faction, race, commands, pattern);

        ship.Initialize();
        return ship;
    };

    /**
     * Gets a sof hull
     * @param {String} hull
     * @returns {Promise<EveSOFDataHull>}
     */
    this.FetchHull = async (hull) =>
    {
        return getSofObjectKey("hull", hull, ErrSOFHullNotFound);
    };

    /**
     * Gets sof hull names and descriptions
     * @returns {Promise<{}>}
     */
    this.FetchHullNames = async () =>
    {
        return getSofObjectValueDescriptions("hull");
    };

    /**
     * Gets a sof hull projection
     * @param {String} hull
     * @param {String} pattern
     * @returns {Promise<*>}
     */
    this.FetchHullPattern = async (hull, pattern) =>
    {
        const
            patternData = await this.FetchPattern(pattern),
            found = getHullProjection(hull, patternData);

        if (found) return found;

        throw new Error(`Invalid pattern for hull (${hull}:${pattern})`);
    };

    /**
     * Gets all hull projections
     * @param {String} hull
     * @returns {Promise<{}>}
     */
    this.FetchHullPatternNames = async (hull) =>
    {
        const patterns = await getSofObject("pattern");

        let out = [];

        patterns.forEach(pattern =>
        {
            for (let i = 0; i < pattern.projections.length; i++)
            {
                if (pattern.projections[i].name === hull)
                {
                    out.push(pattern.name);
                    break;
                }
            }
        });

        out.sort();
        return out;
    };

    /**
     * Gets a sof hull's build class
     * @param {String} dna
     * @returns {Promise<number>}
     */
    this.FetchHullBuildClass = async (dna) =>
    {
        const
            hull = dna.split(":")[0],
            data = await this.FetchHull(hull);

        return data.buildClass === 2 ? 2 : 1;
    };

    /**
     * Gets a sof race
     * @param race
     * @returns {Promise<EveSOFDataRace>}
     */
    this.FetchRace = async (race) =>
    {
        return getSofObjectKey("race", race, ErrSOFRaceNotFound);
    };

    /**
     * Get all sof race names and descriptions
     * @returns {Promise<{}>}
     */
    this.FetchRaceNames = async () =>
    {
        return getSofObjectValueDescriptions("race");
    };

    /**
     * Gets a sof faction
     * @param faction
     * @returns {Promise<EveSOFDataFaction>}
     */
    this.FetchFaction = async (faction) =>
    {
        return getSofObjectKey("faction", faction, ErrSOFFactionNotFound);
    };

    /**
     * Gets all sof faction names and descriptions
     * @returns {Promise<{}>}
     */
    this.FetchFactionNames = async () =>
    {
        return getSofObjectValueDescriptions("faction");
    };

    /**
     * Gets a sof material
     * @param material
     * @returns {Promise<EveSOFDataMaterial>}
     */
    this.FetchMaterial = async (material) =>
    {
        return getSofObjectKey("material", material, ErrSOFMaterialNotFound);
    };

    /**
     * Gets all material names and descriptions
     * @returns {Promise<{}>}
     */
    this.FetchMaterialNames = async () =>
    {
        return getSofObjectValueDescriptions("material");
    };

    /**
     * Gets a sof pattern
     * @param pattern
     * @returns {Promise<EveSOFDataPattern>}
     */
    this.FetchPattern = async (pattern) =>
    {
        return getSofObjectKey("pattern", pattern, ErrSOFPatternNotFound);
    };

    /**
     * Gets all pattern names and descriptions
     * @returns {Promise<{}>}
     */
    this.FetchPatternNames = async () =>
    {
        return getSofObjectValueDescriptions("pattern");
    };

}
