import { resMan, tw2 } from "global";
import { vec3, vec4, mat4, quat, num } from "math";
import { FilterMode, MipFilterMode, WrapMode } from "constant/d3d";

import {
    meta,
    isDNA,
    isArray,
    get,
    findElementByPropertyValue,
    isString,
    isObject
} from "utils";

import {
    Tw2Error,
    Tw2Effect,
    Tw2Mesh,
    Tw2MeshArea,
    Tw2InstancedMesh,
    Tw2GeometryRes,
    Tw2GeometryMesh,
    Tw2VertexDeclaration,
} from "core";

import {
    EveBoosterSet,
    EveCustomMask,
    EveLocator2,
    EvePlaneSet,
    EveSpaceObjectDecal,
    EveSpotlightSet,
    EveSpriteSet,
    EveSpriteSetItem,
    EveShip2,
    EveChildMesh,
    EveChildContainer, EveBanner
} from "eve";

import { EveStation2 } from "../unsupported/eve/object";
import { EveSOFDataPatternLayer } from "sof/pattern";
import { EveSOFDataFaction, EveSOFDataFactionColorSet } from "sof/faction";
import { EveSOFDataRace } from "sof/race";
import { EveLocatorSetItem, EveLocatorSets } from "eve/item/EveLocatorSets";
import { EveSOFDataHullBannerSetItem } from "sof/hull/EveSOFDataHullBannerSetItem";


@meta.type("EveSOFData")
export class EveSOFData extends meta.Model
{

    @meta.boolean
    @meta.uiDescription("Custom property")
    enableChildren = false;

    @meta.list("EveSOFDataFaction")
    faction = [];

    @meta.struct("EveSOFDataGeneric")
    generic = null;

    @meta.list("EveSOFDataHull")
    hull = [];

    @meta.list("EveSOFDataLayout")
    layout = [];

    @meta.list("EveSOFDataMaterial")
    material = [];

    @meta.list("EveSOFDataPattern")
    pattern = [];

    @meta.list("EveSOFDataRace")
    race = [];

    @meta.list("EveSOFDataFaction")
    factionOverride = [];

    @meta.list("EveSOFDataRace")
    raceOverride = [];

    /**
     * Temporary build options
     * @type {*}
     * @private
     */
    _options = {

        // Simplifies mesh parameters
        simplifyParameters: true,

        // Allow reverting to old spotlight sets
        useSpotlightPool: true,

        devColor: [ 0, 0, 0, 0 ],

        banners: {
            defaultBorderMap: "cdn:/texture/global/white.png",
            defaultImageMap: "cdn:/texture/global/white.png",
            defaultHorizontalImageMap: "cdn:/texture/global/white.png",
            defaultVerticalImageMap: "cdn:/texture/global/white.png",
            Type: {
                SQUARE: 0,
                VERTICAL: 1,
                HORIZONTAL: 2
            },
            Usage: EveSOFDataHullBannerSetItem.Usage
        },

        wreckArea: {
            fallbackGeneralGlowColor: [ 67, 9, 0, 1 ],
            minMapScaleUV: 2,
            minGlowIntensity: 50,
            maxGlowFlicker: 0.005,
            minSharpness: 2.1,
            // Decal wreck area only
            maxGlowFlickerDecalAreas: 0.004,
            minSharpnessDecalAreas: 3.5
        },

        multiplier: {
            spriteScale: 0.5,
            // Boost lights
            generalGlowColor: [ 10, 10, 10, 1 ],
            generalHeatGlowColor: [ 100, 100, 100, 1 ],
            boosterGlowScale: 0.125,
            boosterHaloScale: 0.5,
            boosterSymHalo: 0.125,
            boosterBrightness: 1,
            boosterScale: [ 0.9, 0.9, 0.9 ],
            boosterAlpha: 0.5,
            maxDistortionOffset: 1 / 1000
        },

        effect: {
            sprite: null,
            banner: null,
            shadow: null,
            shadowSkinned: null
        },

        // Override standard materials
        materialOverrides: {
            orange_neon01: { FresnelColor: [ 0, 0, 0, 1 ] }
        },

        billboardsURL: "cdn:/billboards",
        billboards: null,

        effectPath: {
            plane: "cdn:/graphics/effect/managed/space/spaceobject/fx/planeglow.fx",
            spotlightCone: "res:/graphics/effect/managed/space/spaceobject/fx/spotlightcone.fx",
            spotlightGlow: "res:/graphics/effect/managed/space/spaceobject/fx/spotlightglow.fx",

            // TODO: Fix weird artifacts
            spotlightConePool: "cdn:/graphics/effect/managed/space/spaceobject/fx/spotlightconepool.fx",
            spotlightGlowPool: "cdn:/graphics/effect/managed/space/spaceobject/fx/spotlightglowpool.fx",
            boosterVolumetric: "cdn:/graphics/effect/managed/space/booster/boostervolumetric.fx",
            boosterGlow: "cdn:/graphics/effect/managed/space/booster/boosterglowanimated.fx",
            spriteSet: "cdn:/graphics/effect/managed/space/spaceobject/fx/blinkinglightspool.fx",
            banner: "cdn:/graphics/effect/managed/space/spaceobject/v5/fx/banner/unpacked_fxbannerv5.fx",
            shadow: "cdn:/graphics/effect/managed/space/spaceobject/shadow/shadow.fx"
        },

        texturePath: {
            noise: "res:/Texture/global/noise.dds.0.png",
            noise32: "res:/Texture/Global/noise32cube_volume.dds.0.png",
            whiteSharp: "res:/Texture/Particle/whitesharp.dds.0.png",
            hologramNoise: "cdn:/texture/fx/hologram/hologram_noise.dds",
            hologramPulse: "cdn:/texture/fx/hologram/hologram_pulse.dds",
            hologramInterlace: "cdn:/texture/fx/hologram/hologram_interlace_p.dds",
        },

        decalUsage: [
            "decalv5.fx",              // Standard
            "decalcounterv5.fx",       // Killmark
            "decalholev5.fx",          // Hole
            "decalcylindricv5.fx",     // Cylindrical
            "decalglowcylindricv5.fx", // Glow Cylindrical
            "decalglowv5.fx",          // Glow
            "decalv5.fx"               // Logo
        ],

        resFiles: null,
        resPathInserts: {},
        modelDirectory: "cdn:/dx9/model/"

    };

    static TrigBalls = {
        "tgb01": [ 0, -57.502, 151.432, 2.5, 2.5, 2.5 ],
        "tgbc01": [ 0, 0, -22.64, 1.5, 1.5, 1.5 ],
        "tgc01": [ 0, -4.1, -0.278, .8, .8, .8 ],
        "tgc02": [ 0, -17.35, 125.826, .8, .8, .8 ],
        "tgde01": [ 0, 1.85, 0, .4, .4, .4 ],
        "tgdn01": [ 0, 47.343, 421.454, 6, 6, 6 ],
        "tgf01": [ 0, -3.969, -0.633, .25, .25, .25 ],
        "tgi1": [ 0, 37.754, -110.305, 1, 1, 1 ],
        "tgi2": [ 0, 37.754, -110.305, 1, 1, 1 ],
        "tgi3": [ 0, 37.754, -110.305, 1, 1, 1 ],
    };


    /**
     * Creates a Triglavian ball child container
     * @param {vec3|Array} translation
     * @param {vec3|Array} scaling
     * @returns {EveChildContainer}
     */
    static createTriglavianBall = function (translation, scaling)
    {
        const container = EveChildContainer.from({
            name: "TempTrigSphereContainer",
            translation,
            scaling
        });

        const meshContainer = EveChildMesh.from({
            name: "Sphere",
            minScreenSize: 2,
            rotation: [ 0.7069846391677856, 0, 0, 0.70722895860672 ],
            scaling: [ 22.5, 22.5, 22.5 ],
            useSpaceObjectData: false
        });

        meshContainer.mesh = Tw2Mesh.from({
            name: "SphereMesh",
            geometryResPath: "cdn:/graphics/generic/unitsphere/unitsphere_4k_01a.gr2_json",
            additiveAreas: [
                {
                    name: "Additive effect",
                    effect: {
                        effectFilePath: "cdn:/graphics/effect.gles2/managed/space/specialfx/ubershader.sm_hi",
                        parameters: {
                            FresnelFactors: [ 2.5, 12, 0, 0 ],
                            DiffuseColor: [ 1, 0.1411765068769455, 0.047058798372745514, 1 ],
                            TextureScroll1: [ -0.10000000149011612, 0.30000001192092896, 0, 0 ],
                            TextureScroll2: [ 0.10000000149011612, 0.20000000298023224, 0, 0 ],
                            TextureTransform1: [ 0, 0, 1, 1 ],
                            TextureTransform2: [ 0, 0, 1, 1.25 ]
                        },
                        textures: {
                            DiffuseMap1: "cdn:/texture/fx/caustics/caustic_13.png",
                            DiffuseMap2: "cdn:/texture/fx/caustics/caustic_16b.png",
                            MaskMap: "cdn:/texture/fx/gradients/capmask_tight_01c.png"
                        }
                    }
                }
            ],
            transparentAreas: [
                {
                    name: "Transparent effect",
                    effect: {
                        effectFilePath: "cdn:/graphics/effect.gles2/managed/space/specialfx/ubershader.sm_hi",
                        parameters: {
                            DiffuseColor: [ 1, 0.1411765068769455, 0.047058798372745514, 1 ],
                            TextureScroll1: [ 0, 0, 0, 0 ],
                            TextureScroll2: [ 0, 0, 0, 0 ],
                            TextureTransform1: [ 0, 0, 1, 1 ],
                            TextureTransform2: [ 0, 0, 1, 1 ],
                            FresnelFactors: [ 4, 1, 0, 0 ]
                        },
                        textures: {
                            DiffuseMap1: "cdn:/texture/global/white.png",
                            DiffuseMap2: "cdn:/texture/global/white.png",
                            MaskMap: "cdn:/texture/global/white.png"
                        }
                    }
                }
            ]
        });

        container.objects.push(meshContainer);
        return container;
    };

    /**
     * Creates a banner
     * Temporary
     * @param {Object} options
     * @param {Object} [options.textures]
     * @param {Object} [options.parameters]
     * @param {vec3} [options.scaling]
     * @param {vec3} [options.position]
     * @param {quat} [options.rotation]
     * @returns {EveBanner}
     */
    CreateBanner(options = {})
    {
        const {
            textures = {},
            parameters = {},
            scaling,
            position,
            rotation
        } = options;

        if (!parameters.BaseColor) parameters.BaseColor = [ 0, 0, 0, 1 ];

        const banner = EveBanner.from({ scaling, position, rotation });
        banner.effect.SetValues({ textures, parameters });
        return banner;
    }

    /**
     * Checks if a respathinsert is valid for a hull
     * @param {String} hull
     * @param {String} resPathInsert
     * @returns {boolean}
     */
    IsValidHullResPathInsert(hull, resPathInsert)
    {
        resPathInsert = resPathInsert ? resPathInsert.toLowerCase() : "";
        if (!resPathInsert || resPathInsert === "none" || resPathInsert === "base") return true;
        return this.GetHullResPathInserts(hull).includes(resPathInsert);
    }

    /**
     * Gets hull res path inserts for a hull
     * @param {EveSOFDataHull|String} hull
     * @returns {Array<String>}
     */
    GetHullResPathInserts(hull)
    {
        hull = isString(hull) ? this.GetHull(hull) : hull;

        // Cache the hull's respathinserts
        if (!this._options.resPathInserts[hull.name])
        {
            const
                resFiles = this.GetResFiles(),
                rootDirectory = `${this._options.modelDirectory}${hull.description}`,
                hullFiles = resFiles.filter(x => x.indexOf(rootDirectory) === 0 && EveSOFData.IsResPathInsertCheckRequired(x));

            this._options.resPathInserts[hull.name] = hullFiles
                .reduce((acc, cur) =>
                {
                    cur = cur.replace(rootDirectory, "");
                    const split = cur.split("/");
                    let faction = split[0] || split[1];
                    if (faction.includes(".")) faction = null;
                    if (faction && faction !== "none" && !acc.includes(faction)) acc.push(faction);
                    return acc;
                }, [])
                .sort((a, b) => a.localeCompare(b));

            this._options.resPathInserts[hull.name].unshift("none");
        }


        return this._options.resPathInserts[hull.name];
    }

    /**
     * Gets horizontal banner resource paths
     * @returns {Array<String>}
     */
    GetHorizontalBannerResPaths()
    {
        if (!this._options.resources || !this._options.resources.horizontalBanners)
        {
            this._options.resources = this._options.resources || {};
            const resFileIndex = this.GetResFiles();
            this._options.resources.horizontalBanners = resFileIndex
                .filter(x => x.includes("texture/sprite/banners/") && x.includes(".png"))
                .sort((a, b) => a.localeCompare(b));
        }
        return this._options.resources.horizontalBanners;
    }

    /**
     * Gets billboard resource paths
     * @returns {Array<String>}
     */
    GetBillboardResPaths()
    {
        if (!this._options.resources || !this._options.resources.billboards)
        {
            this._options.resources = this._options.resources || {};
            const resFileIndex = this.GetResFiles();
            this._options.resources.billboards = resFileIndex.index
                .filter(x => x.includes("video/billboards") === 0)
                .sort((a, b) => a.localeCompare(b));
        }
        return this._options.resources.billboards;
    }

    /**
     * Temporary
     * @returns {Object}
     */
    GetResFiles()
    {
        if (!this._options.resFiles) throw new Error("Resfiles not provided");
        return this._options.resFiles;
    }

    /**
     * Gets a res path insert
     * @param {EveSOFDataHull|String} hull
     * @param {EveSOFDataFaction|String} faction
     * @param {String} originalFileName
     * @param {String} resPathInsert
     */
    UpdateResPathInsert(hull, faction, originalFileName, resPathInsert)
    {
        if (!originalFileName) return "";

        // Normalize strings
        originalFileName = originalFileName.toLowerCase();
        resPathInsert = resPathInsert ? resPathInsert.toLowerCase() : "";

        // Normalize sof objects
        hull = isString(hull) ? this.GetHull(hull) : hull;
        faction = isString(faction) ? this.GetFaction(faction) : faction;

        if (!resPathInsert)
        {
            resPathInsert = faction.resPathInsert;
        }

        // Use the base texture (this assumes we were given the base texture as the original file name)
        // TODO: Strip all respathinserts we're using none!
        if (resPathInsert && resPathInsert !== "base" && resPathInsert !== "none" && this.IsValidHullResPathInsert(hull.name, resPathInsert))
        {
            // Try to find a respathinsert version
            const resFiles = this.GetResFiles();

            let path = originalFileName.toLowerCase();
            let index = path.lastIndexOf("/");
            if (index >= 0) path = path.substr(0, index + 1) + resPathInsert + "/" + path.substr(index + 1);
            index = path.lastIndexOf("_");
            if (index >= 0) path = path.substr(0, index) + "_" + resPathInsert + path.substr(index);
            if (resFiles.includes(path.split(":/")[1]) || resFiles.includes(path)) return path;

            // Extra check for faction ships
            if (hull.name.includes("_fn") && !resPathInsert)
            {
                let nonFaction = originalFileName.replace("_fn", "_t1");
                if (resFiles.includes(nonFaction.split(":/")[1]) || resFiles.includes(nonFaction)) return nonFaction;
            }
        }

        // Fallback to the original file name
        return originalFileName;
    }

    /**
     * Registers options
     * @param {Object} options
     */
    Register(options)
    {
        if (options) Object.assign(this._options, options);
    }

    /**
     * Initializes the sof data
     */
    Initialize()
    {
        const { effect, effectPath, texturePath } = this._options;

        if (!effect.sprite)
        {
            effect.sprite = Tw2Effect.from({
                name: "Shared sprite set effect",
                effectFilePath: effectPath.spriteSet,
                parameters: {
                    MainIntensity: 1,
                    GradientMap: texturePath.whiteSharp
                }
            });
        }

        if (!effect.shadow)
        {
            // TODO: Implement shadows
            effect.shadow = Tw2Effect.from({
                name: "Shared shadow effect",
                effectFilePath: effectPath.shadow
            });
        }

        if (!effect.shadowSkinned)
        {
            effect.shadowSkinned = Tw2Effect.from({
                name: "Shared shadow skinned effect",
                effectFilePath: this.GetShaderPath(effectPath.shadow, true)
            });
        }

        // Fix any provided materials
        const { materialOverrides } = this._options;
        if (materialOverrides)
        {
            for (const name in materialOverrides)
            {
                if (materialOverrides.hasOwnProperty(name) && Object.keys(materialOverrides[name]).length)
                {
                    const material = this.material.find(x => x.name === name);
                    if (material)
                    {
                        const overrides = materialOverrides[name];
                        for (const paramName in overrides)
                        {
                            if (overrides.hasOwnProperty(paramName))
                            {
                                const parameter = material.parameters.find(x => x.name === paramName);
                                if (parameter) vec4.copy(parameter.value, overrides[paramName]);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Gets an override faction by its name
     * @param {string} name
     * @returns {EveSOFDataFactionOverride|null}
     */
    GetFactionOverride(name)
    {
        return findElementByPropertyValue(this.factionOverride, "name", name, ErrSOFFactionOverrideNotFound);
    }

    /**
     * Gets a list of override faction names
     * @param {Array} [out=[]]
     * @returns {Array<String>}
     */
    GetFactionOverrideNames(out)
    {
        return EveSOFData.GetNames(this.factionOverride, out);
    }

    /**
     * Checks if an override faction exists
     * @param {String} name
     * @returns {boolean}
     */
    HasFactionOverride(name)
    {
        return !!findElementByPropertyValue(this.factionOverride, "name", name);
    }

    /**
     * Gets an override race by its name
     * @param {string} name
     * @returns {EveSOFDataRaceOverride|null}
     */
    GetRaceOverride(name)
    {
        return findElementByPropertyValue(this.raceOverride, "name", name, ErrSOFRaceOverrideNotFound);
    }

    /**
     * Gets a list of override race names
     * @param {Array} [out=[]]
     * @returns {Array<String>}
     */
    GetRaceOverrideNames(out)
    {
        return EveSOFData.GetNames(this.raceOverride, out);
    }

    /**
     * Checks if an override race exists
     * @param {String} name
     * @returns {boolean}
     */
    HasRaceOverride(name)
    {
        return !!findElementByPropertyValue(this.raceOverride, "name", name);
    }

    /**
     * Gets a hull by its name
     * @param {String} name
     * @returns {EveSOFDataHull|null}
     */
    GetHull(name)
    {
        return findElementByPropertyValue(this.hull, "name", name, ErrSOFHullNotFound);
    }

    /**
     * Gets hull names
     * @param {Object|Array} [out={}]
     * @returns {Object|Array} out
     */
    GetHullNames(out)
    {
        return EveSOFData.GetNames(this.hull, out);
    }

    /**
     * Checks if a hull exists
     * @param {String} name
     * @returns {boolean}
     */
    HasHull(name)
    {
        return !!findElementByPropertyValue(this.hull, "name", name);
    }

    /**
     * Gets a hull's build class
     * @param {String} name
     * @returns {Number}
     */
    GetHullBuildClass(name)
    {
        return this.GetHull(name).buildClass === 2 ? 2 : 1;
    }

    /**
     * Gets a hull's pattern names
     * @param {String} name
     */
    GetHullPatternNames(name)
    {
        this.GetHull(name);

        let patternNames = [];
        for (let i = 0; i < this.pattern.length; i++)
        {
            if (this.pattern[i].Has(name))
            {
                patternNames.push(this.pattern[i].name);
            }
        }

        return patternNames.sort();
    }

    /**
     * Checks if a hull has a given pattern
     * @param {String} hullName
     * @param {String} patternName
     * @returns {boolean}
     */
    HasHullPattern(hullName, patternName)
    {
        const hull = this.GetHull(hullName);
        return this.HasPattern(patternName) ? this.GetPattern(patternName).Has(hull.name) : false;
    }

    /**
     * Gets a hull pattern
     * @param {String} hullName
     * @param {String} patternName
     * @returns {*}
     */
    GetHullPattern(hullName, patternName)
    {
        const hull = this.GetHull(hullName);
        return this.GetPattern(patternName).Get(hullName);
    }

    /**
     * Gets a faction by it's name
     * @param {String} name
     * @returns {EveSOFDataFaction|null}
     */
    GetFaction(name)
    {
        return findElementByPropertyValue(this.faction, "name", name, ErrSOFFactionNotFound);
    }

    /**
     * Gets faction names
     * @param {Object|Array} [out={}]
     * @returns {Object|Array} out
     */
    GetFactionNames(out)
    {
        return EveSOFData.GetNames(this.faction, out);
    }

    /**
     * Checks if a faction exists
     * @param {String} name
     * @returns {boolean}
     */
    HasFaction(name)
    {
        return !!findElementByPropertyValue(this.faction, "name", name);
    }

    /**
     * Gets a race
     * @param {String} name
     * @returns {EveSOFDataRace|null}
     */
    GetRace(name)
    {
        return findElementByPropertyValue(this.race, "name", name, ErrSOFRaceNotFound);
    }

    /**
     * Gets race names
     * @param {Object|Array} [out={}]
     * @returns {Object|Array} out
     */
    GetRaceNames(out)
    {
        return EveSOFData.GetNames(this.race, out);
    }

    /**
     * Checks if a race exists
     * @param {String} name
     * @returns {boolean}
     */
    HasRace(name)
    {
        return !!findElementByPropertyValue(this.race, "name", name);
    }

    /**
     * Gets a material
     * @param {String} name
     * @returns {EveSOFDataMaterial|null}
     */
    GetMaterial(name)
    {
        return findElementByPropertyValue(this.material, "name", name, ErrSOFMaterialNotFound);
    }

    /**
     * Gets material names
     * @param {Object|Array} [out={}]
     * @returns {Object|Array} out
     */
    GetMaterialNames(out)
    {
        return EveSOFData.GetNames(this.material, out);
    }

    /**
     * Checks if a material exists
     * @param {String} name
     * @returns {boolean}
     */
    HasMaterial(name)
    {
        return !!findElementByPropertyValue(this.material, "name", name);
    }

    /**
     * Gets a pattern
     * @param {String} name
     * @returns {EveSOFDataPattern|null}
     */
    GetPattern(name)
    {
        return findElementByPropertyValue(this.pattern, "name", name, ErrSOFPatternNotFound);
    }

    /**
     * Gets pattern names
     * @param {Object|Array} [out={}]
     * @returns {Object|Array} out
     */
    GetPatternNames(out)
    {
        return EveSOFData.GetNames(this.pattern, out);
    }

    /**
     * Checks if a pattern exists
     * @param {String} name
     * @returns {boolean}
     */
    HasPattern(name)
    {
        return !!findElementByPropertyValue(this.pattern, "name", name);
    }

    /**
     * Gets a shader's path
     * @param {String} path
     * @param {Boolean} [isAnimated]
     * @returns {string}
     */
    GetShaderPath(path, isAnimated)
    {
        const
            prefix = this.generic.GetShaderPrefix(isAnimated),
            index = path.lastIndexOf("/");

        return path.substring(0, index + 1) + prefix + path.substring(index + 1);
    }

    /**
     * Parses a dna string into  a dna object
     * TODO: Remove defaults from here
     * @param {String} dna
     * @returns {Object}
     */
    ParseDNA(dna)
    {
        if (!isDNA(dna))
        {
            throw new ErrSOFDNAFormatInvalid({ dna });
        }

        dna = dna.toLowerCase();

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

        let hull = this.GetHull(parts[0]),
            faction = this.GetFaction(parts[1]),
            race = this.GetRace(parts[2]),
            area = {},
            resPathInsert = null,
            pattern = null;

        const m = commands["MESH"] || commands["MATERIAL"];
        if (m)
        {
            for (let i = 0; i < m.length; i++)
            {
                this.generic.GetMaterialPrefix(i + 1); // off by one
                if (m[i] && m[i] !== "none")
                {
                    try
                    {
                        area[`material${i + 1}`] = this.GetMaterial(m[i]).name;
                    }
                    catch (err)
                    {
                        console.dir({ err, m, i });
                    }
                }
            }
        }

        const p = commands["PATTERN"];
        if (p)
        {
            pattern = p[0] && p[0] !== "none" ? this.GetHullPattern(hull.name, p[0]) : null;

            for (let i = 1; i < p.length; i++)
            {
                this.generic.GetPatternMaterialPrefix(i);
                if (p[i] && p[i] !== "none")
                {
                    area[`patternMaterial${i}`] = this.GetMaterial(p[i]).name;
                }
            }
        }

        // Why are the faction defaults in here?
        if (!pattern)
        {
            if (faction.defaultPattern)
            {
                pattern = { layer1: faction.defaultPattern };
            }
            else if (hull.defaultPattern)
            {
                pattern = { layer1: hull.defaultPattern };
            }
        }

        // Why are the faction defaults in here?
        if (!area.patternMaterial1 && faction.defaultPatternLayer1MaterialName)
        {
            area.patternMaterial1 = this.GetMaterial(faction.defaultPatternLayer1MaterialName).name;
        }

        resPathInsert = commands["RESPATHINSERT"] ? commands["RESPATHINSERT"][0] : faction.resPathInsert || null;

        // Validate the res path insert
        if (!this.IsValidHullResPathInsert(hull, resPathInsert))
        {
            tw2.Warning({
                type: "Space Object Factory",
                message: `Invalid respathinsert ${resPathInsert} for hull ${hull}`
            });
            //resPathInsert = "none";
        }

        const o = commands["OVERRIDE"];
        let factionOverride = null,
            raceOverride = null;

        if (o)
        {
            if (o[0] && o[0].toUpperCase() !== "NONE")
            {
                factionOverride = this.GetFactionOverride(o[0]);
                //const { override } = factionOverride;
                //if (override !== parts[1]) throw new Error(`Invalid override faction source: ${parts[1]}`);
                //const sourceFaction = this.GetFaction(override);
                //faction = EveSOFDataFaction.combine(sourceFaction, factionOverride);
                //faction.overridden = true;
                //console.dir(faction);
            }

            if (o[1] && o[1].toUpperCase() !== "NONE")
            {
                raceOverride = this.GetRaceOverride(o[1]);
                //const { override } = raceOverride;
                //if (override !== parts[2]) throw new Error(`Invalid override race source: ${parts[2]}`);
                //const sourceRace = this.GetRace(override);
                //race = EveSOFDataRace.combine(sourceRace, raceOverride);
                //race.overridden = true;
                //console.dir(race);
            }
        }

        return { hull, faction, race, area, resPathInsert, pattern, dna, factionOverride, raceOverride };
    }

    /**
     * Converts from dna object to dna
     * @param {*} options
     * @return {string}
     * @constructor
     */
    StringifyDNA(options)
    {
        let { hull, faction, race, area, resPathInsert, pattern, factionOverride, raceOverride } = options;


        if (isObject(hull)) hull = hull.name;
        if (isObject(faction)) faction = faction.name;
        if (isObject(race)) race = race.name;
        if (isObject(pattern)) pattern = pattern.name;
        if (isObject(raceOverride)) raceOverride = raceOverride.name;
        if (isObject(factionOverride)) factionOverride = factionOverride.name;

        if (!hull || !faction || !race)
        {
            throw new ReferenceError("Invalid dna object");
        }

        let str = `${hull}:${faction}:${race}`;

        if (resPathInsert) str += `:respathinsert?${resPathInsert}`;

        if (!area)
        {
            area = {};
            area.material1 = options.material1;
            area.material2 = options.material2;
            area.material3 = options.material3;
            area.material4 = options.material4;
            area.patternMaterial1 = options.patternMaterial1;
            area.patternMaterial2 = options.patternMaterial2;
        }

        if (area)
        {
            const materialString = `${area.material1 || "none"};${area.material2 || "none"};${area.material3 || "none"};${area.material4 || "none"}`.toLowerCase();
            if (materialString !== "none;none;none;none") str += `:mesh?${materialString}`;
        }

        if (pattern)
        {
            str += `:pattern?${pattern}`;
            if (area)
            {
                const patternString = `;${area.patternMaterial1 || "none"};${area.patternMaterial2 || "none"}`.toLowerCase();
                if (patternString !== ";none;none") str += patternString;
            }
        }

        if (raceOverride || factionOverride)
        {
            str += `:override?${factionOverride || "none"};${raceOverride || "none"}`;
        }

        return str.toLowerCase();
    }

    /**
     *  TEMPORARY
     * @param {Object} m
     * @param {String} [m.material1]
     * @param {String} [m.material2]
     * @param {String} [m.material3]
     * @param {String} [m.material4]
     * @param {String} [m.patternMaterial1]
     * @param {String} [m.patternMaterial2]
     * @param {Object} [out={}]
     * @returns {Object} out
     */
    AssignMaterialParameters(m = {}, out = {})
    {
        if (m.material1) this.GetMaterial(m.material1).AssignParameters(out, "Mtl1");
        if (m.material2) this.GetMaterial(m.material2).AssignParameters(out, "Mtl2");
        if (m.material3) this.GetMaterial(m.material3).AssignParameters(out, "Mtl3");
        if (m.material4) this.GetMaterial(m.material4).AssignParameters(out, "Mtl4");
        if (m.patternMaterial1) this.GetMaterial(m.patternMaterial1).AssignParameters(out, "PMtl1");
        if (m.patternMaterial2) this.GetMaterial(m.patternMaterial2).AssignParameters(out, "PMtl2");
        return out;
    }

    /**
     * Gets a parameter object from an array of material names
     * @param {Array<String>} arr
     * @return Object
     */
    GetParametersFromMaterials(arr)
    {
        let values = {};

        for (let i = 0; i < 5; i++)
        {
            if (arr[i])
            {
                const material = this.GetMaterial(arr[i]);

                let prefix;
                switch (i)
                {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        prefix = "Mtl" + (i + 1);
                        break;

                    case 4:
                    case 5:
                        prefix = "PMtl" + (i - 3);
                        break;
                }

                material.parameters.forEach(p =>
                {
                    values[prefix + p.name] = Array.from(p.value);
                });
            }
        }

        return values;
    }

    /**
     * Gets the names from a sof array
     * - If passed an array for out, returns names only in an array
     * - If passed an object for out, returns names and descriptions
     * @param {Array} arr
     * @param {Object|Array} [out={}]
     * @returns {Object|Array} out
     */
    static GetNames(arr, out = {})
    {
        const isArr = isArray(out);

        for (let i = 0; i < arr.length; i++)
        {
            if (isArr)
            {
                out.push(arr[i].name);
            }
            else
            {
                out[arr[i].name] = arr[i].description || "";
            }
        }

        if (isArr)
        {
            out.sort();
        }

        return out;
    }

    /**
     * Builds an object from dna
     * @param {String} dna
     * @returns {EveStation2|EveShip2}
     */
    async Build(dna)
    {
        const
            sof = this.ParseDNA(dna),
            object = sof.hull.buildClass === 2 ? new EveStation2() : new EveShip2();

        object.dna = dna;
        await EveSOFData.Build(this, object, sof, this._options);
        if (object.Initialize) object.Initialize();
        return object;
    }

    /**
     * Rebuilds an object's dna
     * - TODO: Redo to ensure no duplicates when rebuilding
     * @param {EveStation2|EveShip2} object
     * @param {String} dna
     * @returns {EveStation2|EveShip2}
     */
    async Rebuild(object, dna)
    {
        const sof = this.ParseDNA(dna);
        object.dna = dna;
        await EveSOFData.Build(this, object, sof, this._options);
        return object;
    }

    /**
     * Builds an object from dna
     * @param {EveSOFData } data
     * @param {*} obj
     * @param {object} sof
     * @param {object} [options={}]
     * @returns {EveStation2|EveShip2}
     */
    static async Build(data, obj, sof, options)
    {
        const args = [ data, obj, sof, options ];

        if (options.billboardsURL && !options.billboards)
        {
            try
            {
                const response = await fetch(resMan.BuildUrl(options.billboardsURL));
                options.billboards = await response.json();
            }
            catch (err)
            {
                //Fall back to defaults
            }
        }

        // Custom
        this.SetupSOFOverrides(...args);


        // TODO: DELETE THIS WHEN TESTING FINISHED!
        if (obj._sofFactionColorSetHandler && obj.sofFactionColorSet)
        {
            obj.sofFactionColorSet.OffEvent("modified", obj._sofFactionColorSetHandler);
        }

        // Temporary for controlling faction colors?
        obj.sofFactionColorSet = sof.faction.colorSet;

        obj._sofFactionColorSetHandler = () =>
        {
            for (let i = 0; i < EveSOFDataFactionColorSet.Type.length; i++)
            {
                const colorName = EveSOFDataFactionColorSet.Type[i];
                const color = sof.faction.colorSet[colorName];
                if (color)
                {
                    console.log(`Updating ${i} ${colorName}`);
                    obj.UpdateColorType(i, color);
                }
            }
        };

        obj.sofFactionColorSet.OnEvent("modified", obj._sofFactionColorSetHandler);

        // Supported
        this.SetupCustomMasks(...args);
        await this.SetupMesh(...args);
        this.SetupBounds(...args);
        this.SetupBanners(...args);
        this.SetupSpotlightSets(...args);
        this.SetupPlaneSets(...args);
        this.SetupSpriteSets(...args);
        this.SetupDecals(...args);
        this.SetupBoosters(...args);
        this.SetupLocators(...args);
        this.SetupInstancedMesh(...args);
        this.SetupLocatorSets(...args);
        // partial support
        await this.SetupChildren(...args);
        // Unsupported
        await this.SetupShadows(...args);
        this.SetupHazeSets(...args);
        this.SetupSpriteLineSets(...args);
        this.SetupAudio(...args);
        this.SetupModelCurves(...args);
        this.SetupLights(...args);
        this.SetupObservers(...args);
        this.SetupControllers(...args);

        // Temporarily add triglavian balls
        if (sof.hull.name.indexOf("tg") === 0 && !obj.effectChildren.find(x => x.name === "TempTrigSphereContainer"))
        {
            const cfg = this.TrigBalls[sof.hull.name.split("_")[0]];
            if (cfg) obj.effectChildren.push(EveSOFData.createTriglavianBall([ cfg[0], cfg[1], cfg[2] ], [ cfg[3], cfg[4], cfg[5] ]));
        }

        return obj;
    }

    /**
     * Custom overrides
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupSOFOverrides(data, obj, sof, options)
    {
        if (sof.raceOverride)
        {
            sof.race = EveSOFDataRace.combine(sof.race, sof.raceOverride);
            console.dir(sof.race);
        }

        if (sof.factionOverride)
        {
            sof.faction = EveSOFDataFaction.combine(sof.faction, sof.factionOverride);
            console.dir(sof.faction);
        }
    }


    /**
     * Sets up a custom mask (or empties it)
     * @param {EveCustomMask} mask
     * @param {EveSOFDataPatternLayer} layer
     * @param {EveSOFDataPatternTransform} transformLayer
     * @param {EveSOFDataMaterial} material
     */
    static SetupCustomMask(mask, layer, transformLayer, material)
    {
        if (transformLayer)
        {
            mask.isMirrored = transformLayer.isMirrored;
            mask.Compose(transformLayer.rotation, transformLayer.position, transformLayer.scaling);
        }
        else
        {
            mask.isMirrored = false;
            mask.Identity();
        }

        mask.RebuildTransforms();

        let pU = 0,
            pV = 0;

        if (layer)
        {
            //ext = getPathExtension(layer.textureResFilePath);

            // Todo: figure out why there are solid white textures that are visible
            mask.display = !layer.textureResFilepath || layer.textureResFilepath.includes("solid_white");
            mask.materialIndex = layer.materialSource;
            mask.parameters.PatternMaskMap.SetValue(layer.textureResFilePath);
            vec4.set(mask.targetMaterials,
                layer.isTargetMtl1 ? 1 : 0,
                layer.isTargetMtl2 ? 1 : 0,
                layer.isTargetMtl3 ? 1 : 0,
                layer.isTargetMtl4 ? 1 : 0
            );
            pU = layer.projectionTypeU;
            pV = layer.projectionTypeV;
        }
        else
        {
            mask.display = false;
            mask.materialIndex = 0;
            mask.parameters.PatternMaskMap.SetValue("cdn:/texture/projection/solid_white.png");
            vec4.set(mask.targetMaterials, 0, 0, 0, 0);
        }

        mask.parameters.PatternMaskMap.SetOverrides({
            addressUMode: EveSOFDataPatternLayer.ToAddressMode(pU),
            addressVMode: EveSOFDataPatternLayer.ToAddressMode(pV),
        });

        if (material)
        {
            const values = material.AssignParameters({});
            mask.parameters.DiffuseColor.SetValue(values["DiffuseColor"]);
            mask.parameters.FresnelColor.SetValue(values["FresnelColor"]);
            mask.parameters.DustDiffuseColor.SetValue(values["DustDiffuseColor"]);
            mask.parameters.Gloss.SetValue(values["Gloss"]);
        }
        else
        {
            //mask.parameters.DiffuseColor.SetValue([ 0, 0, 0, 1 ]);
            //mask.parameters.FresnelColor.SetValue([ 0, 0, 0, 1 ]);
            //mask.parameters.DustDiffuseColor.SetValue([ 0, 0, 0, 1 ]);
            //mask.parameters.Gloss.SetValue([ 0, 0, 0, 0 ]);
        }

        // mask.UpdateValues({ controller: this });
    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupCustomMasks(data, obj, sof, options)
    {
        if (obj.customMasks)
        {
            if (!obj.customMasks[0])
            {
                obj.customMasks[0] = new EveCustomMask();
                obj.customMasks[0].name = "Pattern1";
            }

            if (!obj.customMasks[1])
            {
                obj.customMasks[1] = new EveCustomMask();
                obj.customMasks[1].name = "Pattern2";
            }
        }

        const
            patternMaterial1 = sof.area.patternMaterial1 ? data.GetMaterial(sof.area.patternMaterial1) : null,
            patternMaterial2 = sof.area.patternMaterial2 ? data.GetMaterial(sof.area.patternMaterial2) : null,
            pattern = sof.pattern || {};

        this.SetupCustomMask(obj.customMasks[0], pattern.layer1, pattern.transformLayer1, patternMaterial1);
        this.SetupCustomMask(obj.customMasks[1], pattern.layer2, pattern.transformLayer2, patternMaterial2);
    }

    /**
     *
     * TODO: Generate missing bounds
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupBounds(data, obj, sof, options)
    {
        try
        {
            const bounds = get(sof.hull, "boundingSphere", [ 0, 0, 0, 0 ]);
            obj.boundingSphereRadius = bounds[3];
            vec3.copy(obj.boundingSphereCenter, bounds);

            const
                center = vec3.copy(obj.shapeEllipsoidCenter, get(sof.hull, "shapeEllipsoidCenter", [ 0, 0, 0 ])),
                radii = vec3.copy(obj.shapeEllipsoidRadius, get(sof.hull, "shapeEllipsoidRadius", [ 0, 0, 0 ]));

            if (radii[0] <= 0)
            {
                const { maxBounds, minBounds } = obj.mesh.geometryResource;
                vec3.subtract(center, maxBounds, minBounds);
                vec3.scale(center, center, 0.5 * 1.732050807);
                vec3.add(radii, maxBounds, minBounds);
                vec3.scale(radii, radii, 0.5);
            }
        }
        catch (err)
        {
            tw2.Error({
                name: "Space object factory",
                message: "Failed to generate bounds",
                error: err
            });
        }

    }

    static assignMaterialNamesIfUsable(dest, src)
    {
        [ "material1", "material2", "material3", "material4", "patternMaterial1", "patternMaterial2" ].forEach(key =>
        {
            if (src[key] && src[key].toLowerCase() !== "none" && src[key].toLowerCase() !== "base")
            {
                dest[key] = src[key];
            }
        });
    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     * @param {Boolean} [opaqueAreasOnly]
     */
    static async SetupMesh(data, obj, sof, options, opaqueAreasOnly)
    {
        const
            mesh = obj.mesh = obj.mesh || new Tw2Mesh(),
            { hull } = sof;

        // Testing: Allow rewiring res path inserts
        // const sofHullActualRace = sof.hull.description.split("/")[1];
        //sof.resPathInsert = sof.faction.GetRewiredRespathInsert(sofHullActualRace, sof.resPathInsert);

        // Load the ship's geometry
        let resPath = get(sof.hull, "geometryResFilePath", "");
        if (!resPath) throw new TypeError("Hull has no geometry");
        await mesh.FetchGeometryResPath(resPath);

        let cachedParameters = {};

        /**
         * Setup a mesh area
         * TODO: Handle extra mesh areas that are already defined
         * @param {String} areasName
         */
        const setupMeshArea = (areasName) =>
        {

            const toRemove = Array.from(obj.mesh[areasName]);

            get(hull, areasName, []).forEach(hullArea =>
            {
                let { name = "", index = 0, count = 1, shader = "", areaType = -1 } = hullArea;

                // Check if already exists
                let area = obj.mesh.FindMeshAreaByTypeAndIndex(areasName, index);
                if (area)
                {
                    toRemove.splice(toRemove.indexOf(area, 1));
                }
                else
                {
                    area = new Tw2MeshArea();
                    area.name = name;
                    area.index = index;
                    area.count = count;
                    mesh[areasName].push(area);

                    // Keep track of area type
                    area.areaType = areaType;
                    area.colorType = -1;
                }

                const eff = data.generic.GetShaderConfig(shader, sof.hull.isSkinned);
                eff.autoParameter = true;

                // Get hull Area values
                hullArea.Assign(eff);

                // Area parameters
                const areaData = sof.faction.AssignAreaType(areaType);

                // Temporarily keep track of the hull area nane
                area._sofMeta = area._sofMeta || {};
                area._sofMeta.areaData = Object.assign({}, areaData);
                this.assignMaterialNamesIfUsable(area._sofMeta.areaData, sof.area);

                // Get custom values
                Object.assign(areaData, sof.area);

                data.AssignMaterialParameters(areaData, eff.parameters);

                // Handle res path inserts
                for (const key in eff.textures)
                {
                    if (eff.textures.hasOwnProperty(key) && EveSOFData.IsResPathInsertCheckRequired(eff.textures[key]))
                    {
                        eff.textures[key] = data.UpdateResPathInsert(sof.hull, sof.faction, eff.textures[key], sof.resPathInsert);
                    }
                }

                // Handle heat colour
                if (data.generic.HasShaderUsage(shader, "GeneralHeatGlowColor") && sof.race.booster && sof.race.booster.glowColor)
                {
                    eff.parameters.GeneralHeatGlowColor = vec4.multiply(
                        [ 1, 1, 1, 1 ],
                        sof.race.booster.glowColor,
                        options.multiplier.generalHeatGlowColor
                    );
                }

                // Area lights colour
                if (data.generic.HasShaderUsage(shader, "GeneralGlowColor"))
                {
                    const glowColor = [ 1, 1, 1, 1 ];

                    // Custom override to get wrecks looking correct in webgl
                    // todo: Update the shaders so that this isn't required
                    if (shader.toLowerCase().includes("wreck"))
                    {
                        const {
                            fallbackGeneralGlowColor = [ 4, 1.0140079259872437, 0, 1 ],
                            minMapScaleUV = 8, // Default
                            minGlowIntensity,
                            maxGlowFlicker,
                            minSharpness,
                            minSharpnessDecalAreas,
                            maxGlowFlickerDecalAreas
                        } = options.wreckArea;

                        // Use fire color if it exists
                        // TODO: Replace this with SOF6 controls
                        if (sof.faction.HasColorType(11))
                        {
                            sof.faction.GetColorType(11, glowColor);
                            area.colorType = 11;
                        }
                        else
                        {
                            vec4.copy(glowColor, fallbackGeneralGlowColor);
                        }

                        const { WreckFactors = [ 0, 0, 0, 0 ] } = eff.parameters;

                        WreckFactors[0] = Math.min(minMapScaleUV, WreckFactors[0]);

                        if (minSharpness !== undefined)
                        {
                            WreckFactors[1] = Math.max(minSharpness, WreckFactors[1]);
                        }

                        if (minGlowIntensity !== undefined)
                        {
                            WreckFactors[2] = Math.max(minGlowIntensity, WreckFactors[2]);
                        }

                        if (maxGlowFlicker !== undefined)
                        {
                            WreckFactors[3] = Math.min(maxGlowFlicker, WreckFactors[3]);
                        }

                        if (areasName === "decalAreas")
                        {
                            if (minSharpnessDecalAreas !== undefined)
                            {
                                WreckFactors[1] = Math.max(minSharpnessDecalAreas, WreckFactors[1]);
                            }
                            if (maxGlowFlickerDecalAreas !== undefined)
                            {
                                WreckFactors[3] = Math.min(maxGlowFlickerDecalAreas, WreckFactors[3]);
                            }
                        }

                        eff.parameters.WreckFactors = WreckFactors;

                    }
                    else
                    {
                        area.colorType = sof.faction.HasColorType(areaData.colorType) ? areaData.colorType : 0;
                        sof.faction.GetColorType(area.colorType, glowColor);
                    }

                    vec4.multiply(glowColor, glowColor, options.multiplier.generalGlowColor);
                    eff.parameters.GeneralGlowColor = glowColor;
                }

                // Ensure we have an effect
                if (!area.effect)
                {
                    area.effect = new Tw2Effect();
                    area.effect.name = area.name + "_effect";
                }

                // Handle distortion
                // Todo: Update shaders so this isn't required
                if (eff.parameters.MAX_DISTORTION_OFFSET || areasName === "distortionAreas")
                {
                    const value = eff.parameters.MAX_DISTORTION_OFFSET || [ 128, 0, 0, 0 ];
                    value[0] *= options.multiplier.maxDistortionOffset;
                    eff.parameters.MAX_DISTORTION_OFFSET = value;
                }

                // Update effect
                area.effect.SetValues(eff, { controller: this });

                //  Update from custom masks
                for (let i = 0; i < obj.customMasks.length; i++)
                {
                    EveCustomMask.ApplyMaterials(area.effect, obj.customMasks[i], i);
                }

                // Add white ambient occlusion texture if an AO map doesn't exist and is required
                const params = area.effect.GetTextures();
                if (params.AoMap)
                {
                    area.effect.SetTextures({ AoMap: params.AoMap || "cdn:/graphics/shared_texture/global/white.png" });
                }

                // Reuse parameters that are the same
                if (options.simplifyParameters)
                {
                    let updated = false;
                    for (const name in area.effect.parameters)
                    {
                        if (area.effect.parameters.hasOwnProperty(name))
                        {
                            if (!cachedParameters[areaType])
                            {
                                cachedParameters[areaType] = {};
                            }

                            if (!cachedParameters[areaType][name])
                            {
                                cachedParameters[areaType][name] = area.effect.parameters[name];
                            }
                            else if (cachedParameters[areaType][name].EqualsValue(area.effect.parameters[name].GetValue()))
                            {
                                area.effect.parameters[name] = cachedParameters[areaType][name];
                                updated = true;
                            }
                        }
                    }

                    // Testing: Rewire if required
                    // sof.faction.RewireEffectMaterials(sofHullActualRace, area.effect);

                    if (updated)
                    {
                        area.effect.BindParameters();
                    }
                }

            });

            toRemove.forEach(area =>
            {
                area.Destroy();
                obj.mesh[areasName].splice(obj.mesh[areasName].indexOf(area), 1);
            });

            obj.mesh[areasName].sort((a, b) => a.index - b.index);
        };

        setupMeshArea("opaqueAreas");

        if (!opaqueAreasOnly)
        {
            setupMeshArea("additiveAreas");
            setupMeshArea("decalAreas");
            setupMeshArea("depthAreas");
            setupMeshArea("distortionAreas");
            setupMeshArea("transparentAreas");
        }

        obj.mesh = mesh;
    }

    /**
     * Finds an  attachment by it's constructor and name
     * @param {Array} arr
     * @param {Function} Ctor
     * @param {String} name
     * @param {Boolean} isSof6
     * @return {*} attachment
     */
    static FindAttachmentByConstructorAndName(arr, Ctor, name, isSof6)
    {

        if (isSof6) tw2.Log({
            name: "Space object factory - SOF 6 Update",
            message: "Finding items by name will not work with the latest SOF 6 updates"
        });

        const found = arr.filter(x => x.constructor === Ctor && x.name === name);
        if (found.length > 1) throw new ReferenceError(`Found ${found.length} attachments, expected 1`);
        return found[0] ? found[0] : null;
    }


    /**
     * Sets up banners using pre SOF 6 methods
     * @param data
     * @param obj
     * @param sof
     * @param options
     */
    static SetupBanners(data, obj, sof, options)
    {
        const
            sof6 = sof.hull.sof6 && data.enableSof6;

        let banners;
        if (sof6)
        {
            banners = sof.hull.bannerSets
                .filter(x => sof.faction.visibilityGroupSet.IsObjectVisible(x))
                .flatMap(x => x.banners);
        }
        else
        {
            banners = sof.hull.banners.filter(x => sof.faction.visibilityGroupSet.IsObjectVisible(x));
        }

        const
            { banners: opt } = options,
            arr = obj.attachments,
            toRemove = EveSOFData.FindObjectsByConstructor(arr, EveBanner);

        banners.forEach(srcSet =>
        {
            let set = this.FindAttachmentByConstructorAndName(arr, EveBanner, srcSet.name, sof6);
            if (set)
            {
                toRemove.splice(toRemove.indexOf(set), 1);
                return;
            }

            set = new EveBanner();
            arr.push(set);

            // Setup base banner
            const { lightOverride, ...options } = srcSet;
            set.SetValues(options);
            if (lightOverride)
            {
                tw2.Debug({
                    name: "Space object factor",
                    message: "Banner light overrides not supported"
                });
            }

            // This isn't a requirement of the space object factory
            // TODO: Remove this...
            let ImageMap = set.effect ? set.imageMapResPath : "";
            if (!ImageMap)
            {
                switch (srcSet.usage)
                {
                    case EveSOFDataHullBannerSetItem.Usage.ALLIANCE_LOGO:
                        ImageMap = data.generic.resPathDefaultAlliance;
                        break;

                    case EveSOFDataHullBannerSetItem.Usage.VERTICAL_BANNER:
                        ImageMap = opt.defaultVerticalImageMap;
                        break;

                    case EveSOFDataHullBannerSetItem.usage.HORIZONTAL_BANNER:
                        ImageMap = opt.defaultHorizontalImageMap;
                        break;

                    case EveSOFDataHullBannerSetItem.Usage.CORP_LOGO:
                        ImageMap = data.generic.resPathDefaultCorp;
                        break;

                    case EveSOFDataHullBannerSetItem.Usage.CEO_PORTRAIT:
                        ImageMap = data.generic.resPathDefaultCeo;
                        break;
                }
                // Turn off until explicitly turned on?
                set.display = false;
            }

            if (ImageMap)
            {
                set.effect.SetParameters({ ImageMap });
            }

            /*
            // Setup effect
            if (!set.effect) set.effect = new Tw2Effect();
            const
                { bannerShader } = data.generic,
                effectSettings = {
                    effectFilePath: bannerShader.shader,
                    autoParameter: true,
                    parameters: {
                        BaseColor: [ 0, 0, 0, 1 ]
                    },
                    textures: {
                        BorderMap: opt.defaultBorderMap,
                        ImageMap
                    }
                };

            bannerShader.Assign(effectSettings);
            set.effect.SetValues(effectSettings);
             */

            set.UpdateValues();

        });

        toRemove.forEach(set =>
        {
            set.Destroy();
            arr.splice(arr.indexOf(set), 1);
        });

    }

    /**
     * Debugging sof6
     * @type {boolean}
     */
    enableSof6 = false;

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupSpriteSets(data, obj, sof, options)
    {

        const sof6 = sof.hull.sof6 && data.enableSof6;

        const
            { isSkinned = false } = sof.hull,
            arr = obj.attachments || obj.spriteSets,
            toRemove = EveSOFData.FindObjectsByConstructor(arr, EveSpriteSet);

        const spriteSets = sof.hull.spriteSets
            .filter(x => sof.faction.visibilityGroupSet.IsObjectVisible(x));


        spriteSets.forEach(srcSet =>
        {
            /*
            //  If they aren't visible, don't bother to create them
            if (srcSet.visibilityGroup && !sof.faction.HasVisibilityGroup(srcSet.visibilityGroup))
            {
                return;
            }
             */

            let set = this.FindAttachmentByConstructorAndName(arr, EveSpriteSet, srcSet.name, sof6);
            if (set)
            {
                set.ClearItems();
                toRemove.splice(toRemove.indexOf(set), 1);
            }
            else
            {
                set = new EveSpriteSet();
                arr.push(set);
            }

            set.name = srcSet.name;
            set.display = true;
            set.useQuads = true;
            set.skinned = srcSet.skinned && isSkinned;
            set.effect = options.effect.sprite;

            const color = vec4.alloc();
            color[0] = color[1] = color[2] = 0;
            color[3] = 1;

            srcSet.items.forEach(srcItem =>
            {
                //srcItem.colorType = sof.faction.HasColorType(srcItem.colorType) ? srcItem.colorType : 0;
                sof.faction.GetColorType(srcItem.colorType, color, 0);
                const spriteItem = EveSpriteSetItem.from(Object.assign({}, srcItem, { color }));

                // Turn off lights which don't have a colour
                if (vec3.equals(color, [ 0, 0, 0 ])) spriteItem.display = false;

                // Something is wrong here...
                if (!spriteItem.minScale) spriteItem.minScale = spriteItem.maxScale * 0.25;
                spriteItem.minScale *= options.multiplier.spriteScale;
                spriteItem.maxScale *= options.multiplier.spriteScale;
                set.items.push(spriteItem);
            });

            vec4.unalloc(color);

            set.Initialize();
        });

        toRemove.forEach(set =>
        {
            set.Destroy();
            arr.splice(arr.indexOf(set), 1);
        });
    }

    static FindObjectsByConstructor(arr, Ctor)
    {
        return arr.filter(x => x.constructor === Ctor);
    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupSpotlightSets(data, obj, sof, options)
    {

        const
            sof6 = sof.hull.sof6 && data.enableSof6;

        const
            { isSkinned = false } = sof.hull,
            arr = obj.attachments || obj["spotlightSets"],
            toRemove = EveSOFData.FindObjectsByConstructor(arr, EveSpotlightSet);

        const spotlightSets = sof.hull.spotlightSets
            .filter(x => sof.faction.visibilityGroupSet.IsObjectVisible(x));

        spotlightSets.forEach(srcSet =>
        {
            // This will no longer work with SOF 6 as src set item names are the visibility group name
            let set = this.FindAttachmentByConstructorAndName(arr, EveSpotlightSet, srcSet.name, sof6);
            if (set)
            {
                set.ClearItems();
                toRemove.splice(toRemove.indexOf(set), 1);
            }
            else
            {
                set = EveSpotlightSet.from({ name: srcSet.name });
                arr.push(set);
            }

            let coneShader,
                glowShader;

            set.skinned = isSkinned && srcSet.skinned;

            if (options.useSpotlightPool)
            {
                set.useQuads = true;
                coneShader = options.effectPath.spotlightConePool;
                glowShader = options.effectPath.spotlightGlowPool;
            }
            else
            {
                coneShader = data.GetShaderPath(options.effectPath.spotlightCone, set.skinned);
                glowShader = data.GetShaderPath(options.effectPath.spotlightGlow, set.skinned);
            }

            set.SetValues({
                display: true,
                /*
                items: srcSet.items,
                coneEffect: {
                    effectFilePath: coneShader,
                    parameters: { zOffset: srcSet.zOffset },
                    textures: { TextureMap: srcSet.coneTextureResPath }
                },
                glowEffect: {
                    effectFilePath: glowShader,
                    textures: { TextureMap: srcSet.glowTextureResPath }
                }
                */
            });

            // Temporary
            set.coneEffect = set.coneEffect || new Tw2Effect();
            set.coneEffect.SetValues({
                effectFilePath: coneShader,
                parameters: { zOffset: srcSet.zOffset },
                textures: { TextureMap: srcSet.coneTextureResPath }
            });
            set.glowEffect = set.glowEffect || new Tw2Effect();
            set.glowEffect.SetValues({
                effectFilePath: glowShader,
                textures: { TextureMap: srcSet.glowTextureResPath }
            });
            srcSet.items.forEach(item => set.CreateItem(item));

            const color = vec4.alloc();

            // Update factions...
            set.items.forEach(item =>
            {

                color[0] = color[1] = color[2] = 0;
                color[3] = 1;

                if (sof6)
                {
                    sof.faction.GetColorType(item.colorType, color, 0);

                    item.SetValues({
                        coneColor: color,
                        flareColor: color,
                        spriteColor: color
                    });

                    console.dir({ colorType: item.colorType, color });
                }
                else
                {
                    const faction = sof.faction.FindSpotlightSetByGroupIndex(item.groupIndex);
                    if (faction)
                    {
                        item.SetValues({
                            coneColor: faction.coneColor,
                            flareColor: faction.flareColor,
                            spriteColor: faction.spriteColor
                        });
                    }
                }

                // Disable lights which aren't visible
                if (
                    vec3.equals(item.coneColor, [ 0, 0, 0 ]) ||
                    vec3.equals(item.flareColor, [ 0, 0, 0 ]) ||
                    vec3.equals(item.spriteColor, [ 0, 0, 0 ]))
                {
                    item.SetValues({ display: false });
                }
            });

            vec4.unalloc(color);
        });

        toRemove.forEach(set =>
        {
            set.Destroy();
            arr.splice(arr.indexOf(set), 1);
        });

    }

    /**
     * Temporary billboard handler
     * @param {*} obj
     * @param {Object} options
     */
    static HandleBillboards(obj, options)
    {
        const
            found = [],
            arr = obj.attachments || obj.planeSets;

        arr.forEach(set =>
        {
            if (set.constructor === EvePlaneSet)
            {
                // Try to guess billboards
                const nameUpper = set.name.split(" ").join("").toUpperCase();
                if (nameUpper.includes("BILLBOARD") || nameUpper.includes("VIDEOS"))
                {
                    found.push(set);
                }
            }
        });

        // Temp add billboard randomizer
        if (found.length)
        {
            obj.RandomizeBillboards = function ()
            {
                found.forEach(billboard =>
                {
                    const { billboards = [] } = options;
                    let bb = billboards[num.randomInt(0, billboards.length - 1)];
                    if (bb.indexOf(":") === -1) bb = "cdn:/" + bb;
                    billboard.effect.parameters.MaskMap.SetValue(bb);
                });
            };

            obj.RandomizeBillboards();
        }
        else
        {
            obj.RandomizeBillboards = () =>
            {

            };
        }
    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupPlaneSets(data, obj, sof, options)
    {

        const
            sof6 = sof.hull.sof6 && data.enableSof6;

        const
            { isSkinned } = sof.hull,
            arr = obj.attachments || obj.planeSets,
            toRemove = EveSOFData.FindObjectsByConstructor(arr, EvePlaneSet);

        let planeSets;

        if (sof6)
        {
            planeSets = sof.hull.planeSets
                .filter(x => sof.faction.visibilityGroupSet.IsObjectVisible(x));
        }
        else
        {
            // Should be filtering out those group indices that aren't visible
            planeSets = sof.hull.planeSets;
        }

        planeSets.forEach(srcSet =>
        {
            let set = this.FindAttachmentByConstructorAndName(arr, EvePlaneSet, srcSet.name, sof6);

            if (set)
            {
                set.ClearItems();
                toRemove.splice(toRemove.indexOf(set), 1);
            }
            else
            {
                set = EvePlaneSet.from({ name: srcSet.name });
                arr.push(set);
            }

            set.SetValues({
                // TODO: handle missing properties
                // TODO: handle usage
                display: true,
                /*
                items: srcSet.items,
                effect: {
                    effectFilePath: data.GetShaderPath(options.effectPath.plane, isSkinned && srcSet.skinned),
                    autoParameter: true,
                    parameters: {
                        PlaneData: [
                            0,  // Power of Fade Angle
                            srcSet.atlasSize || 1,
                            0,  // Unused
                            0   // Unused
                        ]
                    },
                    textures: {
                        Layer1Map: srcSet.layer1MapResPath,
                        Layer2Map: srcSet.layer2MapResPath,
                        MaskMap: srcSet.maskMapResPath
                    }
                }
                 */
            });

            // Temporary
            set.effect = set.effect || new Tw2Effect();
            set.effect.SetValues({
                effectFilePath: data.GetShaderPath(options.effectPath.plane, isSkinned && srcSet.skinned),
                autoParameter: true,
                parameters: { PlaneData: [ 0, srcSet.atlasSize || 1, 0, 0 ] },
                textures: {
                    Layer1Map: srcSet.layer1MapResPath,
                    Layer2Map: srcSet.layer2MapResPath,
                    MaskMap: srcSet.maskMapResPath
                }
            });
            srcSet.items.forEach(item => set.CreateItem(item));

            // Update faction colours
            set.items.forEach(item =>
            {
                if (sof6)
                {
                    vec4.copy(item.color, [ 0, 0, 0, 1 ]);
                    sof.faction.GetColorType(item.colorType, item.color, 0);
                }
                else
                {
                    const faction = sof.faction.FindPlaneSetByGroupIndex(item.groupIndex);
                    if (faction) vec4.copy(item.color, faction.color);
                }

                if (EveSOFData.isZeroColor(item.color)) item.display = false;
                item.UpdateValues();
            });

        });

        this.HandleBillboards(obj, options);

        toRemove.forEach(set =>
        {
            set.Destroy();
            arr.splice(arr.indexOf(set), 1);
        });
    }

    /**
     * Checks if a color is zero
     * @param {vec4|Array} color
     * @return {boolean}
     */
    static isZeroColor(color)
    {
        return color[0] === 0 && color[1] === 0 && color[2] === 0 && color[3] === 0;
    }

    /**
     *
     * TODO: Migrate decal usage to consts
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupDecals(data, obj, sof, options)
    {
        const { hull, faction } = sof;

        // Get this properly...
        const toRemove = Array.from(obj.decals);

        hull.decalSets.forEach(srcSet =>
        {
            const setVisible = !srcSet.visibilityGroup || faction.HasVisibilityGroup(srcSet.visibilityGroup);
            console.log(srcSet.name, setVisible ? "visible" : "not visible");
            if (!setVisible) return;

            srcSet.items.forEach(srcItem =>
            {
                const name = `${srcSet.name}_${srcItem.name}`;
                let decal = this.FindAttachmentByConstructorAndName(obj.decals, EveSpaceObjectDecal, name);

                const { logoType, usage, meshIndex } = srcItem;
                let { glowColorType } = srcItem;

                // Check visibility
                let itemVisible = true;

                // Logos must have a faction logo set
                if (usage === 6 && !faction.HasLogoType(logoType))
                {

                    console.dir({
                        usage: 6,
                        factionHasLogoType: faction.HasLogoType(logoType)
                    });

                    itemVisible = false;
                }

                if (!itemVisible)
                {
                    console.log("Decal", srcSet.name, ">", srcItem.name || srcSet.indexOf(srcItem), "not visible", `(logoType ${logoType}, usage ${usage})`);
                    //return;
                }

                if (decal)
                {
                    toRemove.splice(toRemove.indexOf(decal), 1);
                }
                else
                {
                    decal = EveSpaceObjectDecal.from({ name });
                    obj.decals.push(decal);
                }

                const
                    mesh = obj.mesh.opaqueAreas.find(x => x.meshIndex === meshIndex),
                    provided = { textures: mesh ? mesh.effect.GetTextures() : {} },
                    effect = data.generic.GetShaderConfig(options.decalUsage[usage], false, provided);

                switch (usage)
                {
                    case 1:
                        // killmarks
                        effect.overrides.DecalAtMap = {
                            addressUMode: WrapMode.REPEAT,
                            addressVMode: WrapMode.REPEAT,
                            filterMode: FilterMode.LINEAR,
                            mipFilterMode: MipFilterMode.NONE
                        };
                        break;

                    case 5:
                        // Glows
                        effect.overrides.DecalAtMap = {
                            addressUMode: WrapMode.CLAMP_TO_EDGE,
                            addressVMode: WrapMode.CLAMP_TO_EDGE,
                            filterMode: FilterMode.LINEAR,
                            mipFilterMode: MipFilterMode.NONE
                        };
                        break;
                }

                // TODO: Handle usage as that dicates where textures come from.

                // Factions don't necessarily contain the default information for a decal
                // So don't bother overwriting if it doesn't exist
                if (faction.HasLogoType(logoType))
                {
                    faction.AssignLogoType(logoType, effect, srcItem.meshIndex);
                }

                const { DecalGlowColor } = effect.parameters;


                if (DecalGlowColor)
                {
                    glowColorType = faction.HasLogoType(logoType) ? logoType : 0;
                    faction.GetColorType(glowColorType, DecalGlowColor);
                }
                else
                {
                    // Non glow decals still have glow colors for some reason
                    glowColorType = -1;
                }

                // Item's values override faction
                srcItem.Assign(effect);

                //  Temporary
                decal.decalEffect = decal.decalEffect || new Tw2Effect();
                decal.decalEffect.SetValues(effect);

                // Override the default
                if (decal.decalEffect.parameters.NormalMap)
                {
                    const found = sof.hull.opaqueAreas.find(x => x.index === srcItem.meshIndex);
                    if (found)
                    {
                        const NormalMap = found.textures.find(x => x.name === "NormalMap");
                        if (NormalMap)
                        {
                            decal.decalEffect.parameters.NormalMap.SetValue(NormalMap.resFilePath);
                        }
                    }
                }


                decal.decalEffect.PopulateParameters();

                // Keep track of the original logo type
                decal._logoType = logoType;

                const values = {
                    display: itemVisible, // faction.HasLogoType(logoType), // Remove this and identify earlier and maybe don't create?
                    rotation: srcItem.rotation,
                    position: srcItem.position,
                    scaling: srcItem.scaling,
                    parentBoneIndex: srcItem.boneIndex,
                    name: srcItem.name,
                    indexBuffers: srcItem.GetIndexBuffers(),
                    meshIndex: srcItem.meshIndex,
                    logoType: srcItem.logoType,
                    colorType: glowColorType
                };

                //console.dir(values);

                decal.SetValues(values);
                //decal.SetValues(Object.assign({ display: true,  decalEffect: effect }, srcItem));
            });
        });

        toRemove.forEach(item =>
        {
            item.Destroy();
            obj.decals.splice(obj.decals.indexOf(item), 1);
        });

    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupBoosters(data, obj, sof, options)
    {
        const { hull, race } = sof;
        if (!hull.booster || !race.booster) return;

        const src = race.booster;
        const { shape0, shape1, warpShape0, warpShape1 } = src;
        const {
            boosterGlowScale = 1,
            boosterHaloScale = 1,
            boosterSymHalo = 1,
            boosterBrightness = 1,
            boosterAlpha = 1
        } = options.multiplier;

        // Adjust booster colours so they look better
        const
            Color0 = vec4.multiplyScalar([], shape0.color, boosterBrightness),
            Color1 = vec4.multiplyScalar([], shape1.color, boosterBrightness);

        Color0[3] = boosterAlpha;
        Color1[3] = boosterAlpha;

        if (obj.boosters)
        {
            obj.boosters.effect.SetValues({
                effectFilePath: options.effectPath.boosterVolumetric,
                autoParameter: true,
                parameters: {
                    NoiseFunction0: shape0.noiseFunction,
                    NoiseSpeed0: shape0.noiseSpeed,
                    NoiseAmplitudeStart0: shape0.noiseAmplitureStart,
                    NoiseAmplitudeEnd0: shape0.noiseAmplitureEnd,
                    NoiseFrequency0: shape0.noiseFrequency,
                    Color0,
                    NoiseFunction1: shape1.noiseFunction,
                    NoiseSpeed1: shape1.noiseSpeed,
                    NoiseAmplitudeStart1: shape1.noiseAmplitureStart,
                    NoiseAmplitudeEnd1: shape1.noiseAmplitureEnd,
                    NoiseFrequency1: shape1.noiseFrequency,
                    Color1,
                    WarpNoiseFunction0: warpShape0.noiseFunction,
                    WarpNoiseSpeed0: warpShape0.noiseSpeed,
                    WarpNoiseAmplitudeStart0: warpShape0.noiseAmplitureStart,
                    WarpNoiseAmplitudeEnd0: warpShape0.noiseAmplitureEnd,
                    WarpNoiseFrequency0: warpShape0.noiseFrequency,
                    WarpColor0: warpShape0.color,
                    WarpNoiseFunction1: warpShape1.noiseFunction,
                    WarpNoiseSpeed1: warpShape1.noiseSpeed,
                    WarpNoiseAmplitudeStart1: warpShape1.noiseAmplitureStart,
                    WarpNoiseAmplitudeEnd1: warpShape1.noiseAmplitureEnd,
                    WarpNoiseFrequency1: warpShape1.noiseFrequency,
                    WarpColor1: warpShape1.color,
                    ShapeAtlasSize: [ src.shapeAtlasHeight, src.shapeAtlasCount, 0, 0 ],
                    BoosterScale: src.scale,
                },
                textures: {
                    ShapeMap: src.shapeAtlasResPath,
                    GradientMap0: src.gradient0ResPath,
                    GradientMap1: src.gradient1ResPath,
                    NoiseMap: options.texturePath.noise32
                }
            });
            return;
        }


        // obj.boosters = obj.boosters || new EveBoosterSet();
        // obj.boosters.SetValues({
        // TODO: Update to eve booster set 2
        // TODO: Boosters are slightly too big

        obj.boosters = EveBoosterSet.from({
            name: src.name,
            glowColor: src.glowColor,
            glowScale: src.glowScale * boosterGlowScale,
            haloColor: src.haloColor,
            haloScaleX: 0, //src.haloScaleX * boosterHaloScale,
            haloScaleY: 0, //src.haloScaleY * boosterHaloScale,
            // TODO: Add support for new booster parameters
            // lightColor vec4
            // lightFlickerAmplitude float
            // lightFlickerFrequency float
            // lightRadius float
            // lightWarpColor vec4
            // lightWarpRadius float
            // hasTrails boolean
            // alwaysOn boolean
            symHaloScale: src.symHaloScale * boosterSymHalo,
            trailColor: src.trailColor,
            trailSize: src.trailSize,
            warpGlowColor: src.warpGlowColor,
            warpHaloColor: src.warpHalpColor,
            effect: {
                effectFilePath: options.effectPath.boosterVolumetric,
                autoParameter: true,
                parameters: {
                    NoiseFunction0: shape0.noiseFunction,
                    NoiseSpeed0: shape0.noiseSpeed,
                    NoiseAmplitudeStart0: shape0.noiseAmplitureStart,
                    NoiseAmplitudeEnd0: shape0.noiseAmplitureEnd,
                    NoiseFrequency0: shape0.noiseFrequency,
                    Color0,
                    NoiseFunction1: shape1.noiseFunction,
                    NoiseSpeed1: shape1.noiseSpeed,
                    NoiseAmplitudeStart1: shape1.noiseAmplitureStart,
                    NoiseAmplitudeEnd1: shape1.noiseAmplitureEnd,
                    NoiseFrequency1: shape1.noiseFrequency,
                    Color1,
                    WarpNoiseFunction0: warpShape0.noiseFunction,
                    WarpNoiseSpeed0: warpShape0.noiseSpeed,
                    WarpNoiseAmplitudeStart0: warpShape0.noiseAmplitureStart,
                    WarpNoiseAmplitudeEnd0: warpShape0.noiseAmplitureEnd,
                    WarpNoiseFrequency0: warpShape0.noiseFrequency,
                    WarpColor0: warpShape0.color,
                    WarpNoiseFunction1: warpShape1.noiseFunction,
                    WarpNoiseSpeed1: warpShape1.noiseSpeed,
                    WarpNoiseAmplitudeStart1: warpShape1.noiseAmplitureStart,
                    WarpNoiseAmplitudeEnd1: warpShape1.noiseAmplitureEnd,
                    WarpNoiseFrequency1: warpShape1.noiseFrequency,
                    WarpColor1: warpShape1.color,
                    ShapeAtlasSize: [ src.shapeAtlasHeight, src.shapeAtlasCount, 0, 0 ],
                    BoosterScale: src.scale,
                },
                textures: {
                    ShapeMap: src.shapeAtlasResPath,
                    GradientMap0: src.gradient0ResPath,
                    GradientMap1: src.gradient1ResPath,
                    NoiseMap: options.texturePath.noise32
                }
            },
            glows: {
                useQuads: true,
                effect: {
                    effectFilePath: options.effectPath.boosterGlow,
                    textures: {
                        DiffuseMap: options.texturePath.whiteSharp,
                        NoiseMap: options.texturePath.noise
                    }
                }
            }
        });

    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupLocators(data, obj, sof, options)
    {
        const
            { locatorTurrets = [], booster } = sof.hull,
            toRemove = Array.from(obj.locators);

        locatorTurrets.forEach(item =>
        {
            let locator = EveSOFData.FindAttachmentByConstructorAndName(obj.locators, EveLocator2, item.name);
            if (locator)
            {
                toRemove.splice(toRemove.indexOf(locator), 1);
            }
            else
            {
                locator = new EveLocator2();
                obj.locators.push(locator);
            }
            locator.SetValues(item);
        });

        const items = booster && booster.items ? booster.items : [];
        for (let i = 0; i < items.length; ++i)
        {
            const name = "locator_booster_" + (i + 1);

            let locator = obj.FindLocatorByName(name);
            if (locator)
            {
                toRemove.splice(toRemove.indexOf(locator), 1);
            }
            else
            {
                locator = EveLocator2.from({ name });
                obj.locators.push(locator);
            }

            locator.SetValues({
                transform: mat4.scale([], items[i].transform, options.multiplier.boosterScale),
                atlasIndex0: items[i].atlasIndex0,
                atlasIndex1: items[i].atlasIndex1,
                // TODO: Add support for new locator parameters
                hasTrail: items[i].hasTrail,
                lightScale: items[i].lightScale,
                functionality: items[i].functionality
            });
        }

        toRemove.forEach(item =>
        {
            item.Destroy();
            obj.locators.splice(obj.locators.indexOf(item), 1);
        });
    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupInstancedMesh(data, obj, sof, options)
    {
        console.log("Creating instanced meshes");
        // TODO: Update if there are any changes
        if (obj.mesh && obj.mesh.constructor === Tw2InstancedMesh)
        {
            //return;
        }

        if (!sof.hull.instancedMeshes || !sof.hull.instancedMeshes.length)
        {
            console.log("No instanced meshes found...");
            return;
        }

        const
            { gl } = tw2,
            { hull } = sof,
            { instancedMeshes = [] } = hull;

        const
            m = mat4.create(),
            q = quat.create(),
            p = vec3.create(),
            s = vec3.create(),
            v = vec3.create();

        const container = new EveChildContainer();
        container.name = "Instanced meshes";
        obj.effectChildren.push(container);

        console.dir(container);

        for (let h = 0; h < instancedMeshes.length; h++)
        {
            const
                him = instancedMeshes[h],
                mesh = new Tw2InstancedMesh(),
                iMesh = new Tw2GeometryMesh();

            iMesh.declaration = Tw2VertexDeclaration.from([
                { usage: "TEXCOORD", usageIndex: 8, elements: 4, attr: "attr3" },
                { usage: "TEXCOORD", usageIndex: 9, elements: 4, attr: "attr4" },
                { usage: "TEXCOORD", usageIndex: 10, elements: 4, attr: "attr5" },
            ]);

            iMesh.declaration.stride = 12 * 4;
            iMesh.name = him.name;

            const vertices = [];
            for (let i = 0; i < him.instances.length; i++)
            {
                const { data } = him.instances[i];

                q[0] = data[0];
                q[1] = data[1];
                q[2] = data[2];
                q[3] = data[3];
                s[0] = data[4];
                s[1] = data[5];
                s[2] = data[6];
                p[0] = data[7];
                p[1] = data[8];
                p[2] = data[9];
                mat4.fromRotationTranslationScale(m, q, p, s);
                mat4.transpose(m, m);

                vertices.push(m[0]);
                vertices.push(m[1]);
                vertices.push(m[2]);
                vertices.push(m[3]);
                vertices.push(m[4]);
                vertices.push(m[5]);
                vertices.push(m[6]);
                vertices.push(m[7]);
                vertices.push(m[8]);
                vertices.push(m[9]);
                vertices.push(m[10]);
                vertices.push(m[11]);
            }

            iMesh.bufferData = new Float32Array(vertices);
            iMesh.bufferLength = iMesh.bufferData.length;
            iMesh.buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, iMesh.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, iMesh.bufferData, gl.STATIC_DRAW);
            // Do not retain in memory unless asked to
            if (!tw2.systemMirror) iMesh.bufferData = null;

            // Setup resource to hold results
            const res = new Tw2GeometryRes();
            res.meshes[0] = iMesh;
            res.OnPrepared();

            // Complete mesh
            mesh.geometryResPath = him.geometryResPath;
            mesh.instanceGeometryResource = res;
            mesh.Initialize();

            // Setup child
            const child = new EveChildMesh();
            child.useSpaceObjectData = true;
            child.useSRT = true;
            child.mesh = mesh;

            // Setup mesh area
            const area = new Tw2MeshArea();
            area.name = "instance";
            area.index = 0;
            area.count = 1;
            child.mesh.opaqueAreas.push(area);

            // Setup effect
            const config = data.generic.GetShaderConfig(him.shader, sof.hull.isSkinned);

            const effect = area.effect = new Tw2Effect();
            effect.name = area.name + "_effect";
            effect.effectFilePath = config.effectFilePath;
            effect.autoParameter = true;

            // Get textures
            config.textures = him.AssignTextures(config.textures);

            // Area parameters
            const areaData = sof.faction.AssignAreaType(0, {});

            // Get custom materials
            Object.assign(areaData, sof.area);
            data.AssignMaterialParameters(areaData, config.parameters);

            // Area lights colour
            const glowColor = config.parameters["GeneralGlowColor"] || vec4.fromValues(1, 1, 1, 1); // Temp
            if (glowColor)
            {
                sof.faction.GetColorType(areaData.colorType, glowColor);
                vec4.multiply(glowColor, glowColor, options.multiplier.generalGlowColor);
                config.parameters.GeneralGlowColor = glowColor; //temp
            }

            // Update effect
            effect.SetParameters(config.parameters);
            effect.SetTextures(config.textures);
            effect.SetOverrides(config.overrides);
            effect.Initialize();

            // Add to container
            container.objects.push(child);
        }
    }

    /**
     * Sets up shadow shader
     * @param data
     * @param obj
     * @param sof
     * @param options
     * @return {Promise<void>}
     * @constructor
     */
    static async SetupShadows(data, obj, sof, options)
    {
        if (!obj.shadowEffect)
        {
            obj.shadowEffect = sof.hull.isSkinned ? options.effect.shadowSkinned : options.effect.shadow;
        }
    }


    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupLocatorSets(data, obj, sof, options)
    {
        const { hull } = sof;

        hull.locatorSets.forEach(srcSet =>
        {
            const set = new EveLocatorSets();
            set.name = srcSet.name;

            srcSet.locators.forEach(srcItem =>
            {
                const locator = new EveLocatorSetItem();
                locator.boneIndex = srcItem.boneIndex;
                vec3.copy(locator.scaling, srcItem.scaling);
                vec3.copy(locator.position, srcItem.position);
                quat.copy(locator.rotation, srcItem.rotation);
                set.locators.push(locator);
            });

            obj.locatorSets.push(set);
        });

    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupModelCurves(data, obj, sof, options)
    {
        tw2.Debug({ name: "Space object factory", message: "Model curves not implemented" });
    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupLights(data, obj, sof, options)
    {
        tw2.Debug({ name: "Space object factory", message: "Lights not implemented" });
    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupObservers(data, obj, sof, options)
    {
        tw2.Debug({ name: "Space object factory", message: "Observers not implemented" });
    }

    /**
     * Sets up haze sets
     * // TODO: Share haze sets...
     * // TODO: Animated haze sets...
     * @param data
     * @param obj
     * @param sof
     * @param options
     */
    static SetupHazeSets(data, obj, sof, options)
    {
        tw2.Debug({ name: "Space object factory", message: "Haze sets not implemented" });
    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     * @returns {Array}
     */
    static SetupSpriteLineSets(data, obj, sof, options)
    {
        tw2.Debug({
            name: "Space object factory",
            message: "Sprite line sets not implemented"
        });
    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupAudio(data, obj, sof, options)
    {
        tw2.Debug({ name: "Space object factory", message: "Audio not implemented" });
    }


    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     * @returns {Array}
     */
    static SetupAnimations(data, obj, sof, options)
    {
        tw2.Debug({ name: "Space object factory", message: "Animations not implemented" });
    }

    /**
     * Roots model path
     * @type {string}
     */
    static modelPath = "cdn:/dx9/model/";


    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static async SetupChildren(data, obj, sof, options)
    {

        if (!data.enableChildren)
        {
            tw2.Debug({
                name: "Space object factory",
                message: "Child objects disabled"
            });
            return;
        }

        tw2.Debug({
            name: "Space object factory",
            message: "Child objects partially implemented"
        });

        const effects = sof.hull.children.filter(x => sof.faction.children.find(c => c.isVisible && c.groupIndex === x.groupIndex));

        // Remove all children except temp trig spheres
        for (let i = 0; i < obj.effectChildren.length; i++)
        {
            if (obj.effectChildren.name !== "TempTrigSphereContainer")
            {
                obj.effectChildren.splice(i, 1);
                i--;
            }
        }

        for (let i = 0; i < effects.length; i++)
        {
            const effect = await tw2.Fetch(effects[i].redFilePath);

            // Disable curve sets for now
            effect.Traverse(x =>
            {
                if (x.struct.curveSets)
                {
                    x.struct.curveSets.forEach(x => x.Stop());
                }
            });

            quat.copy(effect.rotation, effects[i].rotation);
            vec3.copy(effect.translation, effects[i].translation);
            vec3.copy(effect.scaling, effects[i].scaling);
            effect.UpdateValues();

            obj.effectChildren.push(effect);
        }


        /*
        const [ curveSet, curves ] = this.SetupAnimations(data, obj, sof, options);

        function onChildLoaded(child)
        {
            return function(loaded)
            {
                loaded.name = child.name;

                if (loaded.isEffectChild)
                {
                    obj.effectChildren.push(loaded);
                }
                else
                {
                    obj.children.push(loaded);
                }

                vec3.copy(loaded.translation, get(child, "translation", [ 0, 0, 0 ]));
                quat.copy(loaded.rotation, get(child, "rotation", [ 0, 0, 0, 1 ]));
                vec3.copy(loaded.scaling, get(child, "scaling", [ 1, 1, 1 ]));

                const id = get(child, "id", -1);
                if (id !== -1 && curves[id])
                {
                    EveSOFData.BindParticleEmitters(data, loaded, curveSet, curves[id]);
                }
            };
        }

        const { children = [] } = sof.hull;
        for (let i = 0; i < children.length; ++i)
        {
            const { redFilePath } = children[i];
            if (redFilePath)
            {
                tw2.Fetch(redFilePath).then(EveSOFData.OnChildLoaded(children[i]));
            }
            else
            {
                tw2.Debug({
                    name: "Space object factory",
                    message: `No resource path found for "${sof.hull.name}" child at index ${i}`
                });
            }
        }
         */
    }

    /**
     *
     * @param {EveSOFData} data
     * @param {*} obj
     * @param {Tw2CurveSet} curveSet
     * @param {Tw2Curve} curve
     */
    static BindParticleEmitters(data, obj, curveSet, curve)
    {
        tw2.Debug({ name: "Space object factory", message: "Binding child particle emitters not implemented" });

        /*
        if (isArray(obj.particleEmitters))
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
                this.BindParticleEmitters(obj.children[i], curveSet, curve);
            }
        }
        else
        {
            tw2.Debug({
                name: "Space  object factory",
                message: `Unable to bind particle emitters: ${obj.constructor.name}`
            });
        }
         */
    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupControllers(data, obj, sof, options)
    {
        tw2.Debug({ name: "Space object factory", message: "Animation controllers not implemented" });
    }

    /**
     * Sets up a turret's materials
     * @param turretSet
     * @param pFactionName
     * @param tFactionName
     * @param parentParameters
     * @param rerouteMaterials
     * @returns {Promise<void>}
     */
    async SetupTurretMaterial(turretSet, pFactionName, tFactionName, parentParameters, rerouteMaterials)
    {
        const
            pFaction = pFactionName ? this.GetFaction(pFactionName) : null,
            tFaction = tFactionName ? this.GetFaction(tFactionName) : null;

        if (!pFaction || !tFaction) return;

        const
            pAreaType = pFaction ? pFaction.GetAreaType(0) : null,
            tAreaType = tFaction ? tFaction.GetAreaType(0) : null,
            pGlowColor = pFaction ? pFaction.GetColorType(pAreaType.colorType, [ 0, 0, 0, 1 ]) : null,
            tGlowColor = tFaction ? tFaction.GetColorType(tAreaType.colorType, [ 0, 0, 0, 1 ]) : null;

        const
            { turretEffect: effect } = turretSet,
            { name } = effect;

        const temp = {
            glowColor: null,
            material1: null,
            material2: null,
            material3: null,
            material4: null
        };

        function set(key, first, second)
        {
            if (first && first[key] !== undefined && first[key] !== "none")
            {
                temp[key] = first[key];
            }
            else if (second && second[key] !== undefined && second[key] !== "none")
            {
                temp[key] = second[key];
            }

            if (temp[key] === "none")
            {
                temp[key] = null;
            }
        }

        let useParent = false;

        switch (name)
        {
            case "overridable":
            case "half_overridable":
                set("material1", pAreaType, tAreaType);
                set("material2", pAreaType, tAreaType);
                set("material3", pAreaType, tAreaType);
                set("material4", pAreaType, tAreaType);
                temp.glowColor = tGlowColor;
                if (name === "overrideable" && pGlowColor) temp.glowColor = pGlowColor;
                if (parentParameters) useParent = true;
                break;

            case "not_overridable":
            case "half_overridable_2":
                set("material1", tAreaType);
                set("material2", tAreaType);
                set("material3", tAreaType);
                set("material4", tAreaType);
                temp.glowColor = tGlowColor;
                break;
        }

        let {
            materialUsageMtl1 = 0,
            materialUsageMtl2 = 1,
            materialUsageMtl3 = 2,
            materialUsageMtl4 = 3
        } = pFaction || {};

        if (rerouteMaterials)
        {
            if (rerouteMaterials[0] !== -1) materialUsageMtl1 = rerouteMaterials[0];
            if (rerouteMaterials[1] !== -1) materialUsageMtl2 = rerouteMaterials[1];
            if (rerouteMaterials[2] !== -1) materialUsageMtl3 = rerouteMaterials[2];
            if (rerouteMaterials[3] !== -1) materialUsageMtl4 = rerouteMaterials[3];
        }

        if (!useParent)
        {
            const parameters = effect.GetParameters();

            if (temp.glowColor)
            {
                vec4.multiply(temp.glowColor, temp.glowColor, this._options.multiplier.generalGlowColor);

                // Lower the brightness slightly
                vec4.multiply(temp.glowColor, temp.glowColor, [ 0.5, 0.5, 0.5, 1 ]);

                parameters.GeneralGlowColor = temp.glowColor;
            }

            const mats = {
                material1: temp[`material${[ materialUsageMtl1 + 1 ]}`],
                material2: temp[`material${[ materialUsageMtl2 + 1 ]}`],
                material3: temp[`material${[ materialUsageMtl3 + 1 ]}`],
                material4: temp[`material${[ materialUsageMtl4 + 1 ]}`]
            };

            this.AssignMaterialParameters(mats, parameters);
            effect.SetParameters(parameters);
        }
        else
        {
            const
                Mtl1 = `Mtl${materialUsageMtl1 + 1}`,
                Mtl2 = `Mtl${materialUsageMtl2 + 1}`,
                Mtl3 = `Mtl${materialUsageMtl3 + 1}`,
                Mtl4 = `Mtl${materialUsageMtl4 + 1}`;

            effect.parameters.GeneralGlowColor = parentParameters.GeneralGlowColor;

            effect.parameters.Mtl1DiffuseColor = parentParameters[`${Mtl1}DiffuseColor`];
            effect.parameters.Mtl1FresnelColor = parentParameters[`${Mtl1}FresnelColor`];
            effect.parameters.Mtl1DustDiffuseColor = parentParameters[`${Mtl1}DustDiffuseColor`];
            effect.parameters.Mtl1Gloss = parentParameters[`${Mtl1}Gloss`];

            effect.parameters.Mtl2DiffuseColor = parentParameters[`${Mtl2}DiffuseColor`];
            effect.parameters.Mtl2FresnelColor = parentParameters[`${Mtl2}FresnelColor`];
            effect.parameters.Mtl2DustDiffuseColor = parentParameters[`${Mtl2}DustDiffuseColor`];
            effect.parameters.Mtl2Gloss = parentParameters[`${Mtl2}Gloss`];

            effect.parameters.Mtl3DiffuseColor = parentParameters[`${Mtl3}DiffuseColor`];
            effect.parameters.Mtl3FresnelColor = parentParameters[`${Mtl3}FresnelColor`];
            effect.parameters.Mtl3DustDiffuseColor = parentParameters[`${Mtl3}DustDiffuseColor`];
            effect.parameters.Mtl3Gloss = parentParameters[`${Mtl3}Gloss`];

            effect.parameters.Mtl4DiffuseColor = parentParameters[`${Mtl4}DiffuseColor`];
            effect.parameters.Mtl4FresnelColor = parentParameters[`${Mtl4}FresnelColor`];
            effect.parameters.Mtl4DustDiffuseColor = parentParameters[`${Mtl4}DustDiffuseColor`];
            effect.parameters.Mtl4Gloss = parentParameters[`${Mtl4}Gloss`];

            effect.BindParameters();
        }

        // Override the shader if one exists
        effect.SetValue(effect.effectFilePath);

    }

    /**
     * List of texture codes that could possibly be swapped out for different factions
     */
    static resFileResPathInsertSuffixes = [
        "pmdg",
        "ar",
        "no",
        "a",  // albedo
        "o",  // occlusion (no longer required)
        "m",  // material
        "m2", // material 2
        "p3", // paint mask
        "r",  // roughness
        "g",  // glow mask
        "d",  // dirt mask
        "n",  // normal
    ];

    /**
     * Checks if a res path insert check is required
     * @param {String} path
     * @returns {boolean}
     */
    static IsResPathInsertCheckRequired(path = "")
    {
        path = path.toLowerCase();
        const index = path.lastIndexOf("_") + 1;
        if (!index) return false;

        const suffix = path.substring(index).split(".")[0];
        return this.resFileResPathInsertSuffixes.includes(suffix);
    }

    /**
     * Builds classes
     * @type {Object<Number:String>}
     */
    static BuildClass = {
        0: "EveShip2",
        1: "EveMobile",
        2: "EveStation2",
        3: "EveSwarm",
        4: "Extension"
    };
}


/**
 * Fires when a sof hull is not found
 */
export class ErrSOFHullNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Hull not found (%name%)");
    }
}

/**
 * Fires when a sof faction is not found
 */
export class ErrSOFFactionNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Faction not found (%name%)");
    }
}

/**
 * Fires when a sof race is not found
 */
export class ErrSOFRaceNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Race not found (%name%)");
    }
}

/**
 * Fires when a sof material is not found
 */
export class ErrSOFMaterialNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Material not found (%name%)");
    }
}

/**
 * Fires when a sof pattern is not found
 */
export class ErrSOFPatternNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Pattern not found (%name%)");
    }
}


/**
 * Fires when a sof pattern is not found
 */
export class ErrSOFDNAFormatInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "DNA format invalid (%dnaString%)");
    }
}

/**
 * Fires when a sof resource path insert is invalid is not found
 */
export class ErrSOFResPathInsertInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "Resource path insert is invalid for hull (%hull%:%resPathInsert%)");
    }
}

/**
 * Fires when a sof override is not found
 */
export class ErrSOFOverrideNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Override not found (%name%)");
    }
}

/**
 * Fires when a sof override faction is not found
 */
export class ErrSOFFactionOverrideNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Override Faction not found (%name%)");
    }
}

/**
 * Fires when a sof override race is not found
 */
export class ErrSOFRaceOverrideNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF Override Race not found (%name%)");
    }
}
