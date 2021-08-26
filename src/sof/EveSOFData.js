import { resMan, tw2 } from "global";
import { vec3, vec4, mat4, quat, num } from "math";
import { FilterMode, MipFilterMode, WrapMode } from "constant/d3d";

import {
    meta,
    isDNA,
    isArray,
    get,
    findElementByPropertyValue,
    getPathExtension, isObjectObject
} from "utils";

import {
    ErrFeatureNotImplemented,
    Tw2Error,
    Tw2Effect,
    Tw2Mesh,
    Tw2MeshArea,
    Tw2InstancedMesh,
    Tw2GeometryRes,
    Tw2GeometryMesh,
    Tw2VertexDeclaration, Tw2Vector4Parameter,
    //Tw2AnimationController
} from "core";

//import { Tw2ValueBinding } from "curve/Tw2ValueBinding";

import {
    ErrSOFHullNotFound,
    ErrSOFMaterialNotFound,
    ErrSOFFactionNotFound,
    ErrSOFPatternNotFound,
    ErrSOFRaceNotFound,
} from "sof/EveSOF";

import {
    EveBoosterSet,
    EveCustomMask,
    EveLocator2,
    EvePlaneSet,
    EvePlaneSetItem,
    EveSpaceObjectDecal,
    EveSpotlightSet,
    EveSpriteSet,
    EveSpriteSetItem,
    EveShip2,
    EveChildMesh
} from "eve";

import { EveStation2 } from "../unsupported/eve/object";
import { EveSOFDataPatternLayer } from "sof/pattern";
import { EveSOFDataFaction } from "sof/faction";
import { EveHazeSet, EveHazeSetItem } from "unsupported/eve";
import { EveLocatorSetItem, EveLocatorSets } from "eve/item/EveLocatorSets";

@meta.type("EveSOFData")
export class EveSOFData extends meta.Model
{

    @meta.list("EveSOFDataFaction")
    faction = [];

    @meta.struct("EveSOFDataGeneric")
    generic = null;

    @meta.list("EveSOFDataHull")
    hull = [];

    @meta.list("EveSOFDataMaterial")
    material = [];

    @meta.list("EveSOFDataPattern")
    pattern = [];

    @meta.list("EveSOFDataRace")
    race = [];

    /**
     * Temporary build options
     * @type {*}
     * @private
     */
    _options = {

        // Allow reverting to old spotlight sets
        // new ones have weird artifacts with standard textures
        useSpotlightPool: false,

        devColor: [ 0, 0, 0, 0 ],

        multiplier: {
            // Boost lights
            generalGlowColor: [ 10, 10, 10, 1 ],
            generalHeatGlowColor: [ 100, 100, 100, 1 ],
            boosterGlowScale: 0.125,
            boosterHaloScale: 0.5,
            boosterSymHalo: 0.125,
            boosterBrightness: 1,
            boosterScale: [ 0.9, 0.9, 0.9 ],
            boosterAlpha: 0.5
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

        billboards: [
            "video/billboards/common/divinity_social.webm",
            "video/billboards/common/egonics_immersia.webm",
            "video/billboards/common/eve_cdia_guristas_billboard.webm",
            "video/billboards/common/eve_shipad_abaddon_timeless.webm",
            "video/billboards/common/eve_shipad_astero_timeless.webm",
            "video/billboards/common/eve_shipad_cynabal_timeless.webm",
            "video/billboards/common/eve_shipad_dominix_timeless.webm",
            "video/billboards/common/eve_shipad_drake_timeless.webm",
            "video/billboards/common/genolution.webm",
            "video/billboards/common/ittu_ittu.webm",
            "video/billboards/common/khanid_works.webm",
            "video/billboards/common/laidai.webm",
            "video/billboards/common/mabebu_trading.webm",
            "video/billboards/common/matigu_sushi.webm",
            "video/billboards/common/mirelle_glasses.webm",
            "video/billboards/common/project_discovery_covid.webm",
            "video/billboards/common/quafe.webm",
            "video/billboards/common/sinfina_mondo.webm",
            "video/billboards/fallback.png",
            "video/billboards/takeover/eve_concord_billboard_takeover.webm",
            "video/billboards/triglavianhangar/trigstationbillboard.webm",
            "video/billboards_zn/common/fallback.webm",
            "video/billboards_zn/fallback.png",
            "video/billboards_zn/takeover/zorya4vorbis48.webm",
            "video/billboards_zn/triglavianhangar/trigstationbillboard.webm",
            "video/billboardswide/wreckingmachine.webm"
        ],

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
            noise: "res:/Texture/global/noise.dds.0.png", // "af/afeff2ecb453fd8b_30be7983db3da97153d185227ad4e7ff.png"
            noise32: "res:/Texture/Global/noise32cube_volume.dds.0.png", // 54/54a6d27177108534_0f74da9d040eddbe9d2e650503513ac5.png
            whiteSharp: "res:/Texture/Particle/whitesharp.dds.0.png", // f4/f4be1b6b0b747eab_3a0546e9d35c658c3f126bac79f68c43.png
            hologramNoise: "cdn:/texture/fx/hologram/hologram_noise.dds",
            hologramPulse: "cdn:/texture/fx/hologram/hologram_pulse.dds",
            hologramInterlace: "cdn:/texture/fx/hologram/hologram_interlace_p.dds",
            bannerImage: "",
            bannerBorder: ""
        },

        decalUsage: [
            "decalv5.fx",              // Looks correct, lots of random stuff
            "decalcounterv5.fx",
            "decalholev5.fx",
            "decalcylindricv5.fx",     // Unknown - HAZARD STRIPES  -
            "decalglowcylindricv5.fx", // Unknown - GLOW ROTATION -
            "decalglowv5.fx",
            "decalv5.fx"
        ]

    };

    /**
     * Initializes the sof data
     * @param {Object}  options
     */
    Initialize(options)
    {
        if (options)
        {
            Object.assign(this._options, options);
        }

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

        if (!effect.banner)
        {
            effect.banner = Tw2Effect.from({
                name: "Shared banner effect",
                effectFilePath: effectPath.banner,
                autoParameter: true,
                parameters: {
                    // TODO: Figure out defaults
                    Layer1Transform: [
                        1.5, // Scale U
                        1.5, // Scale V
                        0.0, // Offset U
                        0.0  // Offset V
                    ],
                    Layer2Transform: [
                        1.0,
                        1.0,
                        0.0,
                        0.0
                    ],
                    Layer1Scroll: [
                        0.1,// Scroll speed U
                        0.1,// Scroll speed V
                        0.1,// Scroll offset U
                        0.1 // Scroll offset U
                    ],
                    Layer2Scroll: [
                        0.2,
                        0.2,
                        0.0,
                        0.0
                    ],
                    BaseColor: [ 1.388235330581665, 1.4980392456054688, 1.7882353067398071, 1 ]
                },
                textures: {
                    BorderMap: texturePath.bannerBorder,
                    ImageMap: texturePath.bannerImage,
                    Layer1Map: texturePath.hologramNoise,
                    Layer2Map: texturePath.hologramPulse,
                    MaskMap: texturePath.hologramInterlace
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
     * Gets a hull by it's name
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
     * Gets a hull's res path inserts
     * @param {String} hull
     * @return {Array<String>}
     */
    GetHullResPathInserts(hull)
    {
        this.GetHull(hull);
        return EveSOFDataFaction.GetHullResPathInserts(hull);
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
                if (m[i] && m[i].toUpperCase() !== "NONE")
                {
                    area[`material${i + 1}`] = this.GetMaterial(m[i]).name;
                }
            }
        }

        const p = commands["PATTERN"];
        if (p)
        {
            pattern = !p[0] || p[0].toUpperCase() === "NONE" ? null : this.GetHullPattern(hull.name, p[0]);

            for (let i = 1; i < p.length; i++)
            {
                this.generic.GetPatternMaterialPrefix(i);
                if (p[i] && p[i].toUpperCase() !== "NONE")
                {
                    area[`patternMaterial${i}`] = this.GetMaterial(p[i]).name;
                }
            }
        }

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

        if (!area.patternMaterial1 && faction.defaultPatternLayer1MaterialName)
        {
            area.patternMaterial1 = this.GetMaterial(faction.defaultPatternLayer1MaterialName).name;
        }

        resPathInsert = commands["RESPATHINSERT"] ? commands["RESPATHINSERT"][0] : faction.resPathInsert || null;
        if (!EveSOFDataFaction.IsValidResPathInsert(hull.name, resPathInsert))
        {
            resPathInsert = "none";
            //throw new ErrSOFResPathInsertInvalid({ hull: hull.name, resPathInsert });
        }

        return { hull, faction, race, area, resPathInsert, pattern, dna };
    }

    /**
     * Converts from dna object to dna
     * @param {*} options
     * @return {string}
     * @constructor
     */
    ToDNA(options)
    {
        let { hull, faction, race, area, resPathInsert, pattern } = options;

        if (isObjectObject(hull)) hull = hull.name;
        if (isObjectObject(faction)) faction = faction.name;
        if (isObjectObject(race)) race = race.name;
        if (isObjectObject(pattern)) pattern = pattern.name;

        if (!hull || !faction || !race)
        {
            throw new ReferenceError("Invalid dna object");
        }

        let str = `${hull}:${faction}:${race}`.toLowerCase();

        if (resPathInsert) str += ":respathinsert?resPathInsert";

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

        return str;
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

        if (options.billboardsURL)
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

        this.SetupBounds(...args);
        this.SetupCustomMasks(...args);

        // Temporary
        await this.SetupMesh(...args);

        // Supported
        this.SetupSpotlightSets(...args);
        this.SetupPlaneSets(...args);
        this.SetupSpriteSets(...args);
        this.SetupDecals(...args);
        this.SetupBoosters(...args);
        this.SetupLocators(...args);
        this.SetupInstancedMesh(...args);
        // Unsupported
        this.SetupShadows(...args);
        this.SetupLocatorSets(...args);
        this.SetupHazeSets(...args);
        this.SetupSpriteLineSets(...args);
        this.SetupAudio(...args);
        this.SetupModelCurves(...args);
        this.SetupLights(...args);
        this.SetupObservers(...args);
        await this.SetupChildren(...args);
        this.SetupControllers(...args);
        return obj;
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

        let ext;

        if (layer)
        {
            ext = getPathExtension(layer.textureResFilePath);

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
            mask.parameters.PatternMaskMap.SetValue("res:/texture/global/black.dds.0.png");
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
        const bounds = get(sof.hull, "boundingSphere", [ 0, 0, 0, 0 ]);
        obj.boundingSphereRadius = bounds[3];
        vec3.copy(obj.boundingSphereCenter, bounds);

        const
            center = vec3.copy(obj.shapeEllipsoidCenter, get(sof.hull, "shapeEllipsoidCenter", [ 0, 0, 0 ])),
            radii = vec3.copy(obj.shapeEllipsoidRadius, get(sof.hull, "shapeEllipsoidRadius", [ 0, 0, 0 ]));

        /*
        if (radii[0] <= 0)
        {
            const { maxBounds, minBounds } = obj.mesh.geometryResource;
            vec3.subtract(center, maxBounds, minBounds);
            vec3.scale(center, center, 0.5 * 1.732050807);
            vec3.add(radii, maxBounds, minBounds);
            vec3.scale(radii, radii, 0.5);
        }
         */
    }

    /**
     * Temporary
     * @type {{}}
     */
    static knownGeometryResPath = {};

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static async SetupMesh(data, obj, sof, options)
    {
        let doInitialize = false;

        // Setup mesh
        if (!obj.mesh)
        {
            obj.mesh = new Tw2Mesh();
            doInitialize = true;
        }

        const mesh = obj.mesh;

        // Get the meshes' resource path
        let resPath = get(sof.hull, "geometryResFilePath", "");
        if (!resPath) throw new TypeError("Hull has no geometry");

        // Only set if not already correct
        if (mesh.geometryResPath !== resPath)
        {
            try
            {
                await tw2.Fetch(resPath);
            }
            catch (err)
            {
                // If a cake file, try to fall back to wbg file
                if (getPathExtension(resPath) === "cake")
                {
                    resPath = "res:/" + resPath.substring(resPath.indexOf(":") + 2).replace(".cake", ".wbg");
                    // Update the sof so it doesn't bother doing this again
                    sof.hull.geometryResFilePath = resPath;
                    sof.hull.skinned = !!sof.hull._wasSkinned;
                }
            }

            mesh.geometryResPath = resPath;
            doInitialize = true;
        }

        const { hull } = sof;

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
                let { name = "", index = 0, count = 1, shader = "", areaType } = hullArea;

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
                }

                // Get default shader values
                const eff = data.generic.GetShaderConfig(shader, sof.hull.isSkinned);
                eff.autoParameter = true;

                // Get hull Area values
                hullArea.Assign(eff);

                // Heat colours
                const heatGlowColor = eff.parameters["GeneralHeatGlowColor"] || vec4.fromValues(1, 1, 1, 1); // Temp
                if (heatGlowColor && sof.race.booster.glowColor)
                {
                    vec4.multiply(heatGlowColor, sof.race.booster.glowColor, options.multiplier.generalHeatGlowColor);
                    eff.parameters.GeneralHeatGlowColor = heatGlowColor; // temp
                }

                // Area parameters
                const areaData = { colorType: 0 };
                sof.faction.AssignAreaType(areaType, areaData, 0);

                // Get custom values
                Object.assign(areaData, sof.area);
                data.AssignMaterialParameters(areaData, eff.parameters);

                // Handle res path inserts
                if (eff.textures.PmdgMap)
                {
                    eff.textures.PmdgMap = sof.faction.GetResPathInsert(sof.hull.name, eff.textures.PmdgMap, sof.resPathInsert);
                }

                // Area lights colour
                const glowColor = eff.parameters["GeneralGlowColor"] || vec4.fromValues(1, 1, 1, 1); // Temp
                if (glowColor)
                {
                    sof.faction.GetColorType(areaData.colorType, glowColor, 0);
                    vec4.multiply(glowColor, glowColor, options.multiplier.generalGlowColor);
                    eff.parameters.GeneralGlowColor = glowColor; //temp
                }

                // Ensure we have an effect
                if (!area.effect)
                {
                    area.effect = new Tw2Effect();
                    area.effect.name = area.name + "_effect";
                }

                // Update effect
                area.effect.SetValues(eff, { controller: this });

                //  Update from custom masks
                for (let i = 0; i < obj.customMasks.length; i++)
                {
                    EveCustomMask.ApplyMaterials(area.effect, obj.customMasks[i], i);
                }
            });

            toRemove.forEach(area =>
            {
                area.Destructor();
                obj.mesh[areasName].splice(obj.mesh[areasName].indexOf(area), 1);
            });

        };

        setupMeshArea("additiveAreas");
        setupMeshArea("decalAreas");
        setupMeshArea("depthAreas");
        setupMeshArea("distortionAreas");
        setupMeshArea("opaqueAreas");
        setupMeshArea("transparentAreas");

        if (doInitialize) mesh.Initialize();
        obj.mesh = mesh;
    }

    /**
     * Finds an  attachment by it's constructor and name
     * @param {Array} arr
     * @param {Function} Ctor
     * @param {String} name
     * @return {*} attachment
     */
    static FindAttachmentByConstructorAndName(arr, Ctor, name)
    {
        const found = arr.filter(x => x.constructor === Ctor && x.name === name);
        if (found.length > 1) throw new ReferenceError(`Found ${found.length} attachments, expected 1`);
        return found[0] ? found[0] : null;
    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupSpriteSets(data, obj, sof, options)
    {
        const
            { isSkinned = false, spriteSets = [] } = sof.hull,
            arr = obj.attachments || obj.spriteSets,
            toRemove = EveSOFData.FindObjectsByConstructor(arr, EveSpriteSet);

        spriteSets.forEach(srcSet =>
        {
            let set = this.FindAttachmentByConstructorAndName(arr, EveSpriteSet, srcSet.name);

            //  If they aren't visible, don't bother to create them
            if (srcSet.visibilityGroup && !sof.faction.HasVisibilityGroup(srcSet.visibilityGroup))
            {
                return;
            }

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

            srcSet.items.forEach(srcItem =>
            {
                const color = vec4.fromValues(1, 1, 1, 1);
                sof.faction.GetColorType(srcItem.colorType, color, 0);
                set.items.push(EveSpriteSetItem.from(Object.assign({}, srcItem, { color })));
            });

            set.Initialize();
        });

        toRemove.forEach(set =>
        {
            set.Destructor();
            arr.splice(arr.indexOf(set), 1);
        });
    }


    static FindObjectsByConstructor(arr, Ctor)
    {
        return arr.filter(x => x.constructor === Ctor);
    }

    /**
     *
     * TODO: Handle extra sets...
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupSpotlightSets(data, obj, sof, options)
    {
        const
            { isSkinned = false, spotlightSets = [] } = sof.hull,
            arr = obj.attachments || obj.spotlightSets,
            toRemove = EveSOFData.FindObjectsByConstructor(arr, EveSpotlightSet);

        spotlightSets.forEach(srcSet =>
        {
            let set = this.FindAttachmentByConstructorAndName(arr, EveSpotlightSet, srcSet.name);
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

            if (options.useSpotlightPool)
            {
                coneShader = options.effectPath.spotlightConePool;
                glowShader = options.effectPath.spotlightGlowPool;
            }
            else
            {
                const animated = isSkinned && srcSet.skinned;
                coneShader = data.GetShaderPath(options.effectPath.spotlightCone, animated);
                glowShader = data.GetShaderPath(options.effectPath.spotlightGlow, animated);
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

            // Update factions...
            set.items.forEach(item =>
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
            });
        });

        toRemove.forEach(set =>
        {
            set.Destructor();
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
            obj.RandomizeBillboards = function()
            {
                found.forEach(billboard =>
                {
                    const { billboards = [] } = options;
                    let bb =  billboards[num.randomInt(0, billboards.length - 1)];
                    if (bb.indexOf(":") === -1) bb = "cdn:/" + bb;
                    billboard.effect.parameters.MaskMap.SetValue(bb);
                });
            };

            obj.RandomizeBillboards();
        }
        else
        {
            obj.RandomizeBillboards = () => {};
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
            { isSkinned, planeSets } = sof.hull,
            arr = obj.attachments || obj.planeSets,
            toRemove = EveSOFData.FindObjectsByConstructor(arr, EvePlaneSet);

        planeSets.forEach(srcSet =>
        {
            let set = this.FindAttachmentByConstructorAndName(arr, EvePlaneSet, srcSet.name);

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
                const faction = sof.faction.FindPlaneSetByGroupIndex(item.groupIndex);
                if (faction) item.SetValues({ color: faction.color });
                // Hide plane sets that are invisible???
                if (EveSOFData.isZeroColor(item.color)) item.SetValues({ display: false });
            });
        });

        this.HandleBillboards(obj, options);

        toRemove.forEach(set =>
        {
            set.Destructor();
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
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupDecals(data, obj, sof, options)
    {
        const { hull, faction } = sof;

        // Get this properly...
        const
            PmdgMaps = obj.mesh.FindParameters("PmdgMap"),
            NoMaps = obj.mesh.FindParameters("NoMap"),
            PmdgMap = PmdgMaps[0] ? PmdgMaps[0].resourcePath : "",
            NoMap = NoMaps[0] ? NoMaps[0].resourcePath : "",
            provided = { textures: { PmdgMap, NoMap } },
            toRemove = Array.from(obj.decals);

        hull.decalSets.forEach(srcSet =>
        {
            const setVisible = !srcSet.visibilityGroup || faction.HasVisibilityGroup(srcSet.visibilityGroup);

            srcSet.items.forEach(srcItem =>
            {
                const name = `${srcSet.name}_${srcItem.name}`;
                let decal = this.FindAttachmentByConstructorAndName(obj.decals, EveSpaceObjectDecal, name);

                const { visibilityGroup, logoType, usage, glowColorType } = srcItem;

                // Check visibility
                let itemVisible = !visibilityGroup || faction.HasVisibilityGroup(visibilityGroup);
                if (!faction.HasLogoType(logoType))
                {
                    tw2.Debug({
                        name: "Space object factory",
                        message: `Could not find logo type for decal: ${name} (${logoType})`
                    });
                    itemVisible = false;
                }
                if (!setVisible || !itemVisible) return;

                if (decal)
                {
                    toRemove.splice(toRemove.indexOf(decal), 1);
                }
                else
                {
                    decal = EveSpaceObjectDecal.from({ name });
                    obj.decals.push(decal);
                }

                // How to tell what kind of effect to load??
                const effect = data.generic.GetShaderConfig(options.decalUsage[usage], false, provided);

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

                // Faction
                faction.AssignLogoType(logoType, effect);
                const { DecalGlowColor } = effect.parameters;
                if (DecalGlowColor) faction.GetColorType(glowColorType, DecalGlowColor, 0);

                // Item's values override faction
                srcItem.Assign(effect);

                //  Temporary
                decal.decalEffect = decal.decalEffect || new Tw2Effect();
                decal.decalEffect.SetValues(effect);
                decal.SetValues(Object.assign({ display: true }, {
                    rotation: srcItem.rotation,
                    position: srcItem.position,
                    scaling: srcItem.scaling,
                    parentBoneIndex: srcItem.boneIndex,
                    name: srcItem.name,
                    indexBuffer: srcItem.indexBuffer
                }));
                //decal.SetValues(Object.assign({ display: true,  decalEffect: effect }, srcItem));
            });
        });

        toRemove.forEach(item =>
        {
            item.Destructor();
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
        const { boosterGlowScale = 1, boosterHaloScale = 1, boosterSymHalo = 1, boosterBrightness = 1, boosterAlpha = 1 } = options.multiplier;

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
            haloScaleX: src.haloScaleX * boosterHaloScale,
            haloScaleY: src.haloScaleY * boosterHaloScale,
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
                    effectFilePath: options.texturePath.boosterGlow,
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
            item.Destructor();
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

        // TODO: Update if there are any changes
        if (obj.mesh && obj.mesh.constructor === Tw2InstancedMesh)
        {
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
            iMesh.declaration.name = him.name;

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
            child.useSRT = false;
            child.mesh = mesh;
            obj.effectChildren.push(child);


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
            const areaData = { colorType: 0 };
            sof.faction.AssignAreaType(0, areaData);

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
        tw2.Debug({ name: "Space object factory", message: "Shadows not supported" });

        /*
        if (!obj.shadowEffect === null)
        {
            obj.shadowEffect = sof.hull.isSkinned ? options.effect.shadowSkinned : options.effect.shadow;
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
        tw2.Debug({ name: "Space object factory", message: "Child objects partially implemented" });

        const effects = sof.hull.children.filter(x => sof.faction.children.find(c => c.isVisible && c.groupIndex === x.groupIndex));

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
     *
     * @param {EveSOFData} data
     * @param {EveTurretSet} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupTurretMaterial(data, obj, sof, options)
    {
        tw2.Debug({ name: "Space  object factory", message: "Turret materials not implemented" });
    }

    /*
    GetTurretMaterialParameter(name, parentFaction, areaData)
    {
        const { materialPrefixes } = this.generic;

        let materialIdx = -1;
        for (let i = 0; i < materialPrefixes.length; ++i)
        {
            if (name.substr(0, materialPrefixes[i].length) === materialPrefixes[i])
            {
                materialIdx = i;
                name = name.substr(materialPrefixes[i].length);
            }
        }

        if (materialIdx !== -1)
        {
            let turretMaterialIndex = get(parentFaction, "materialUsageMtl" + (materialIdx + 1), materialIdx);
            if (turretMaterialIndex >= 0 && turretMaterialIndex < materialPrefixes.length)
            {
                name = materialPrefixes[turretMaterialIndex] + name;
                if (name in areaData.parameters)
                {
                    return areaData.parameters[name];
                }
            }
        }
    }


    static CombineTurretMaterial(name, parentValue, turretValue, overrideMethod)
    {
        const zeroColor = [ 0, 0, 0, 0 ];

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

    SetupTurretMaterial(turretSet, parentFactionName, turretFactionName)
    {

        const
            parentFaction = this.GetFaction(parentFactionName),
            turretFaction = turretFactionName ? this.GetFaction(turretFactionName) : null;

        let parentArea = null;
        if (parentFaction && parentFaction.areas && ("hull" in parentFaction.areas))
        {
            parentArea = parentFaction.areas.hull;
        }

        let turretArea = null;
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
            const params = turretSet.turretEffect.parameters;
            for (let name in params)
            {
                if (params.hasOwnProperty(name))
                {
                    if (params[name].constructor.prototype !== Tw2Vector4Parameter.prototype) continue;
                    
                    let
                        parentValue = null,
                        turretValue = null;

                    if (parentArea) parentValue = this.GetTurretMaterialParameter(name, parentFaction, parentArea);
                    if (turretArea) turretValue = this.GetTurretMaterialParameter(name, parentFaction, parentArea);

                    vec4.copy(params[name].value, this.constructor.CombineTurretMaterial(name, parentValue, turretValue, turretSet.turretEffect.name));
                }
            }
            turretSet.turretEffect.BindParameters();
        }
    }
     */

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

export class ErrSOFResPathInsertInvalid extends Tw2Error
{
    constructor(data)
    {
        super(data, "Resource path insert is invalid for hull (%hull%:%resPathInsert%)");
    }
}
