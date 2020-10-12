import { meta, vec3, vec4, quat, mat4, tw2 } from "global";

import {
    isDNA,
    isArray,
    get,
    findElementByPropertyValue, isString, getPathExtension, assignIfExists
} from "global/util";

import {
    ErrFeatureNotImplemented,
    Tw2Error,
    Tw2Effect,
    Tw2Mesh, Tw2MeshArea, Tw2ResMan, Tw2AnimationController
} from "core";

import { Tw2ValueBinding } from "curve/Tw2ValueBinding";

import {
    ErrSOFHullNotFound,
    ErrSOFMaterialNotFound,
    ErrSOFFactionNotFound,
    ErrSOFPatternNotFound,
    ErrSOFRaceNotFound, EveSOF
} from "sof/EveSOF";

import {
    EveBoosterSet,
    EveCustomMask,
    EveLocator2,
    EvePlaneSet,
    EvePlaneSetItem, EveSpaceObjectDecal,
    EveSpotlightSet,
    EveSpriteSet,
    EveSpriteSetItem
} from "eve/item";

import {
    EveShip2,
    EveStation2
} from "../unsupported/eve/object";
import { EveSOFDataPatternLayer } from "sof/pattern";


@meta.ctor("EveSOFData")
export class EveSOFData
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

        multiplier: {
            // Boost lights
            generalGlowColor: [ 10, 10, 10, 1 ],
            generalHeatGlowColor: [ 100, 100, 100, 1 ],
            boosterGlowScale: 0.125,
            boosterHaloScale: 0.5,
            boosterSymHalo: 0.125,
            boosterBrightness: 0.8,
            boosterScale: [ 0.9, 0.9, 0.9 ]
        },

        effect: {
            sprite: null,
            banner: null,
            shadow: null
        },

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
            hologramNoise: "cdn:/texture/fx/hologram/hologram_noise.png",
            hologramPulse: "cdn:/texture/fx/hologram/hologram_pulse.png",
            hologramInterlace: "cdn:/texture/fx/hologram/hologram_interlace_p.png",
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

    Log(type, options = {})
    {
        if (isString(options))
        {
            options = { message: options };
        }

        if (!options.name)
        {
            options.name = "Space object factory";
        }

        return tw2.Log(type, options);
    }

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
     * Parses a dna string
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

        const m = commands["MESH"];
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

        if (!pattern && faction.defaultPattern)
        {
            pattern = this.GetHullPattern(hull.name, faction.defaultPattern);

            if (!area.patternMaterial1 && faction.defaultPatternLayer1MaterialName)
            {
                area.patternMaterial1 = this.GetMaterial(faction.defaultPatternLayer1MaterialName).name;
            }
        }

        // TODO: Check if the faction.resPathInsert actually exists...
        resPathInsert = commands["RESPATHINSERT"] || faction.resPathInsert || null;

        return { hull, faction, race, area, resPathInsert, pattern, dna };
    }

    /**
     * Builds an object from dna
     * @param {String} dna
     * @returns {EveStation2|EveShip2}
     */
    Build(dna)
    {
        const
            sof = this.ParseDNA(dna),
            object = sof.hull.buildClass === 2 ? new EveStation2() : new EveShip2();

        object.dna = dna;
        EveSOFData.Build(this, object, sof, this._options);
        if (object.Initialize) object.Initialize();
        return object;
    }

    /**
     * Rebuilds an object's dna
     * @param {EveStation2|EveShip2} object
     * @param {Object} [opt]
     * @returns {EveStation2|EveShip2}
     */
    Rebuild(object, opt)
    {
        throw new ErrFeatureNotImplemented({ feature: "Rebuilding existing sof object" });

        /*
        const sof = this.ParseDNA(object.dna);
        EveSOFData.Build(this, object, sof, this._options);
        object.UpdateValues(opt);
        return object;
         */
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
     * @param {EveSOFData } data
     * @param {*} obj
     * @param {object} sof
     * @param {object} [options={}]
     * @returns {EveStation2|EveShip2}
     */
    static Build(data, obj, sof, options)
    {
        this.SetupBounds(data, obj, sof, options);
        this.SetupCustomMasks(data, obj, sof, options);
        this.SetupMesh(data, obj, sof, options);

        this.SetupSpotlightSets(data, obj, sof, options);
        this.SetupPlaneSets(data, obj, sof, options);
        this.SetupSpriteSets(data, obj, sof, options);
        this.SetupDecals(data, obj, sof, options);
        this.SetupBoosters(data, obj, sof, options);
        this.SetupLocators(data, obj, sof, options);

        //  TODO
        this.SetupAudio(data, obj, sof, options);
        this.SetupModelCurves(data, obj, sof, options);
        this.SetupLights(data, obj, sof, options);
        this.SetupObservers(data, obj, sof, options);
        this.SetupChildren(data, obj, sof, options);
        this.SetupInstancedMesh(data, obj, sof, options);
        this.SetupControllers(data, obj, sof, options);

        return obj;
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
        data.Log("debug", "Model curves not implemented");
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
        data.Log("debug", "Lights not implemented");
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
        data.Log("debug", "Observers not implemented");
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
            mask.Compose(transformLayer.rotation, transformLayer.position, transformLayer.scaling).RebuildTransforms();
        }
        else
        {
            mask.isMirrored = false;
            mask.Identity().RebuildTransforms();
        }

        let pU = 0,
            pV = 0;

        let ext;

        if (layer)
        {
            ext = getPathExtension(layer.textureResFilePath);

            mask.display = true;
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
            addressUMode: EveSOFDataPatternLayer.ToAddress(pU),
            addressVMode: EveSOFDataPatternLayer.ToAddress(pV),
            forceAddressModes: ext === "dds", // Temporary
            useAllOverrides: true
        });

        if (material)
        {
            const p = material.parameters;
            mask.parameters.DiffuseColor.SetValue(p["DiffuseColor"]);
            mask.parameters.FresnelColor.SetValue(p["FresnelColor"]);
            mask.parameters.DustDiffuseColor.SetValue(p["DustDiffuseColor"]);
            mask.parameters.Gloss.SetValue(p["Gloss"]);
        }
        else
        {
            // Don't reset any custom material for now
        }
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
            obj.customMasks[0] = obj.customMasks[0] || new EveCustomMask("Pattern1");
            obj.customMasks[1] = obj.customMasks[1] || new EveCustomMask("Pattern2");
        }

        const
            patternMaterial1 = sof.area.patternMaterial1 ? data.GetMaterial(sof.area.patternMaterial1) : null,
            patternMaterial2 = sof.area.patternMaterial2 ? data.GetMaterial(sof.area.patternMaterial2) : null,
            pattern = sof.pattern || {};

        console.dir(pattern);
        this.SetupCustomMask(obj.customMasks[0], pattern.layer1, pattern.transformLayer1, patternMaterial1);
        this.SetupCustomMask(obj.customMasks[1], pattern.layer2, pattern.transformLayer2, patternMaterial2);
    }

    /**
     *
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
        vec3.copy(obj.shapeEllipsoidCenter, get(sof.hull, "boundingEllipsoidCenter", [ 0, 0, 0 ]));
        vec3.copy(obj.shapeEllipsoidRadius, get(sof.hull, "boundingEllipsoidRadius", [ 0, 0, 0 ]));
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
    static SetupMesh(data, obj, sof, options)
    {
        obj.shadowEffect = obj.shadowEffect || options.effect.shadow;

        // Mesh
        const
            { hull } = sof,
            mesh = new Tw2Mesh();

        let initialized = false;

        /**** START TESTING ONLY *****/

        let resPath = get(hull, "geometryResFilePath", "");

        if (resPath in EveSOFData.knownGeometryResPath)
        {
            mesh.geometryResPath = EveSOFData.knownGeometryResPath[resPath];
        }
        else
        {
            mesh.geometryResPath = resPath;

            tw2.GetResource(resPath,
                res =>
                {
                    EveSOFData.knownGeometryResPath[resPath] = resPath;
                    if (initialized) mesh.Initialize();
                },
                err =>
                {
                    // Fallback to wbg...
                    mesh.geometryResPath = mesh.geometryResPath.replace("cdn:", "res:").replace(".cake", ".wbg");
                    EveSOFData.knownGeometryResPath[resPath] = mesh.geometryResPath;

                    if (initialized)
                    {
                        mesh.Initialize();
                        obj.Initialize();
                    }
                });
        }

        /**** END TESTING ONLY *****/

        const setupMeshArea = (areasName) =>
        {
            const { generic } = this;

            get(hull, areasName, []).forEach(hullArea =>
            {
                let { name = "", index = 0, count = 1, shader = "", areaType } = hullArea;

                const area = new Tw2MeshArea();
                area.name = name;
                area.index = index;
                area.count = count;
                mesh[areasName].push(area);

                const config = data.generic.GetShaderConfig(shader, sof.hull.isSkinned);
                hullArea.Assign(config);

                const effect = area.effect = new Tw2Effect();
                effect.name = area.name + "_effect";
                effect.effectFilePath = config.effectFilePath;
                effect.autoParameter = true;

                // Fix missing quadheatdetail shader
                if (effect.effectFilePath.includes("quadheatdetail"))
                {
                    data.Log("debug", "Patching missing shader: " + effect.effectFilePath);
                    effect.effectFilePath = effect.effectFilePath.replace("quadheatdetail", "quaddetail");
                }

                // Booster effect color
                const heatGlowColor = config.parameters["GeneralHeatGlowColor"] = [ 1, 1, 1, 1 ];
                if (heatGlowColor)
                {
                    vec4.multiply(heatGlowColor, sof.race.booster.glowColor, options.multiplier.generalHeatGlowColor);
                }

                // Area parameters
                // Todo: Clean this up
                let areaData = { colorType: -1 };

                if (sof.faction.HasAreaType(areaType))
                {
                    sof.faction.AssignAreaType(areaType, areaData);
                }
                else
                {
                    sof.faction.AssignAreaType(0, areaData);
                    data.Log("error", "Could not resolve area type: " + areaType);
                }

                // Get custom materials
                Object.assign(areaData, sof.area);

                data.AssignMaterialParameters(areaData, config.parameters);

                // Area lights colour
                const glowColor = config.parameters["GeneralGlowColor"] = [ 1, 1, 1, 1 ];
                if (glowColor)
                {
                    const { colorType } = areaData;

                    if (sof.faction.HasColorType(colorType))
                    {
                        sof.faction.GetColorType(colorType, glowColor);
                    }
                    else
                    {
                        sof.faction.GetColorType(0, glowColor);
                        data.Log("error", "Could not resolve general glow color type: " + colorType);
                    }

                    vec4.multiply(glowColor, glowColor, options.multiplier.generalGlowColor);
                }

                // Temporary overrides for dds files
                for (const key in config.textures)
                {
                    if (config.textures.hasOwnProperty(key))
                    {
                        if (getPathExtension(config.textures[key]) === "dds")
                        {
                            config.overrides[key] = {
                                useAllOverrides: true,
                                forceAddressModes: true,
                                mipFilterMode: 1
                            };
                        }
                    }
                }

                // Update effect
                effect.SetParameters(config.parameters);
                effect.SetTextures(config.textures);
                effect.SetOverrides(config.overrides);

                // TODO: There is no way to identify what resPathInserts are available
                //       unless we generate a file from the resFileIndex.
                //       Until then, we'll just try to download what they asked for...

                let pmdgResPathInsert = config.textures.PmdgMap ? sof.resPathInsert || sof.faction.resPathInsert : null;
                if (pmdgResPathInsert)
                {
                    const resPathInsert = sof.faction.GetResPathInsert(config.textures.PmdgMap, pmdgResPathInsert);
                    const { knownResPathInserts } = EveSOFData;

                    if (resPathInsert in knownResPathInserts)
                    {
                        if (knownResPathInserts[resPathInsert])
                        {
                            effect.SetTextures({ "PmdgMap": resPathInsert });
                        }
                        else
                        {
                            data.Log("error", "Invalid resPathInsert: " + resPathInsert);
                        }
                    }
                    else
                    {
                        tw2.FetchResource(resPathInsert)
                            .then(() =>
                            {
                                knownResPathInserts[resPathInsert] = true;
                                effect.SetTextures({ "PmdgMap": resPathInsert });
                            })
                            .catch(err =>
                            {
                                knownResPathInserts[resPathInsert] = false;
                                data.Log("error", "Invalid resPathInsert: " + resPathInsert);
                            });
                    }
                }

                if (config.hasPatternMaskMaps)
                {
                    for (let i = 0; i < obj.customMasks.length; i++)
                    {
                        EveCustomMask.ApplyMaterials(effect, obj.customMasks[i], i);
                    }
                }

                effect.Initialize();
            });
        };

        setupMeshArea("additiveAreas");
        setupMeshArea("decalAreas");
        setupMeshArea("depthAreas");
        setupMeshArea("distortionAreas");
        setupMeshArea("opaqueAreas");
        setupMeshArea("transparentAreas");

        mesh.Initialize();
        initialized = true;

        obj.mesh = mesh;
    }

    /**
     * Temporary catchment for found res path inserts
     * @type {{}}
     */
    static knownResPathInserts = {};

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupSpriteSets(data, obj, sof, options)
    {
        const { isSkinned = false, spriteSets = [] } = sof.hull;

        spriteSets.forEach(srcSet =>
        {
            const set = new EveSpriteSet();
            set.name = srcSet.name;
            set.display = srcSet.visibilityGroup ? sof.faction.HasVisibilityGroup(srcSet.visibilityGroup) : true;
            set.useQuads = true;
            set.skinned = srcSet.skinned && isSkinned;
            set.effect = options.effect.sprite;

            srcSet.items.forEach(srcItem =>
            {
                const color = [ 1, 1, 1, 1 ];

                if (sof.faction.HasColorType(srcItem.colorType))
                {
                    sof.faction.GetColorType(srcItem.colorType, color);
                }
                else
                {
                    sof.faction.GetColorType(0, color);
                    data.Log("debug", "Using primary color for spriteSet: " + srcItem.colorType);
                }

                set.items.push(EveSpriteSetItem.from(Object.assign({}, srcItem, { color })));
            });

            set.Initialize();

            const arr = obj.attachments || obj.spriteSets;
            arr.push(set);

        });
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
        const { isSkinned = false, spotlightSets = [] } = sof.hull;

        spotlightSets.forEach(srcSet =>
        {
            let coneShader, glowShader;
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

            const set = EveSpotlightSet.from({
                name: srcSet.name,
                items: srcSet.items,
                coneEffect: {
                    effectFilePath: coneShader,
                    parameters: {
                        zOffset: srcSet.zOffset
                    },
                    textures: {
                        TextureMap: srcSet.coneTextureResPath
                    }
                },
                glowEffect: {
                    effectFilePath: glowShader,
                    textures: {
                        TextureMap: srcSet.glowTextureResPath
                    }
                }
            });

            set.items.forEach(item =>
            {
                const faction = sof.faction.FindSpotlightSetByGroupIndex(item.groupIndex);
                if (faction)
                {
                    vec4.copy(item.coneColor, faction.coneColor);
                    vec4.copy(item.flareColor, faction.flareColor);
                    vec4.copy(item.spriteColor, faction.spriteColor);
                }
                item.UpdateValues();
            });

            set.Initialize();

            const arr = obj.attachments || obj.spotlightSets;
            arr.push(set);

        });
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
        const { isSkinned, planeSets } = sof.hull;

        planeSets.forEach(srcSet =>
        {
            const set = new EvePlaneSet();
            set.name = srcSet.name;

            // TODO: Usage
            // TODO: AtlasSize

            set.effect = Tw2Effect.from({
                effectFilePath: data.GetShaderPath(options.effectPath.plane, isSkinned && srcSet.skinned),
                autoParameter: true,
                parameters: {
                    PlaneData: [
                        0,  // Power of Fade Angle
                        1, //srcSet.atlasSize,  // srcSet.atlasSize doesn't work?
                        0,  // Unused
                        0   // Unused
                    ]
                },
                textures: {
                    Layer1Map: srcSet.layer1MapResPath.replace(".dds", ".png"),
                    Layer2Map: srcSet.layer2MapResPath.replace(".dds", ".png"),
                    MaskMap: srcSet.maskMapResPath.replace(".dds", ".png")
                }
            });

            srcSet.items.forEach(srcItem =>
            {
                const item = EvePlaneSetItem.from(srcItem);
                // TODO: Lots of new properties to add...

                const faction = sof.faction.FindPlaneSetByGroupIndex(srcItem.groupIndex);
                if (faction)
                {
                    vec4.copy(item.color, faction.color);
                }

                // TEMPORARY
                if (item.color[0] === 0 && item.color[1] === 0 && item.color[2] === 0 && item.color[3] === 0)
                {
                    vec4.copy(item.color, [ 1, 1, 1, 1 ]);
                }

                set.items.push(item);
            });

            set.Initialize();
            const arr = obj.attachments || obj.planeSets;
            arr.push(set);

        });
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
            NoMap = NoMaps[0] ? NoMaps[0].resourcePath : "";

        const provided = { textures: { PmdgMap, NoMap } };

        hull.decalSets.forEach(setData =>
        {
            // Don't process irrelevant decals
            if (setData.visibilityGroup && !faction.HasVisibilityGroup(setData.visibilityGroup))
            {
                return;
            }

            setData.items.forEach(itemData =>
            {
                const { name, visibilityGroup, logoType, usage, glowColorType } = itemData;

                // Don't add irrelevant decals (Should already have been caught)
                if (visibilityGroup && !faction.HasVisibilityGroup(visibilityGroup))
                {
                    return;
                }

                const
                    // How to tell what kind of effect to load??
                    shader = options.decalUsage[usage],
                    config = data.generic.GetShaderConfig(shader, false, provided);


                let display = true;

                if (faction.HasLogoType(logoType))
                {
                    faction.GetLogoType(logoType).Assign(config);
                }
                else
                {
                    data.Log("error", `Could not find logo type for decal: ${name} (${logoType})`);
                    display = false;
                }

                const { DecalGlowColor } = config.parameters;
                if (DecalGlowColor)
                {
                    if (faction.HasColorType(glowColorType))
                    {
                        faction.GetColorType(glowColorType, DecalGlowColor);
                    }
                    else
                    {
                        faction.GetColorType(0, DecalGlowColor);
                        data.Log("debug", `Using primary color for decal glow: ${name} (${glowColorType})`);
                    }
                }

                // Item's values override logo types
                itemData.Assign(config);

                /*
                for (const key in config.textures)
                {
                    if (config.textures.hasOwnProperty(key))
                    {
                        config.textures[key] = config.textures[key].replace(".dds", ".png");
                    }
                }
                 */

                obj.decals.push(EveSpaceObjectDecal.from(Object.assign({}, itemData, { effect: config, display })));
            });
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

        // No  boosters
        if (!hull.booster || !race.booster) return;

        const
            src = race.booster,
            srcItems = hull.booster.items || [];


        for (let i = 0; i < srcItems.length; ++i)
        {

            const scaled = mat4.scale([], srcItems[i].transform, options.multiplier.boosterScale);

            obj.locators.push(EveLocator2.from({
                name: "locator_booster_" + (i + 1),
                transform: scaled,
                atlasIndex0: srcItems[i].atlasIndex0,
                atlasIndex1: srcItems[i].atlasIndex1,
                // TODO: Add support for new locator parameters
                // hasTrail boolean
                // lightScale float  <-- Can use instead of manual brightnessModifier?
                // functionality vec4
            }));
        }

        const { shape0, shape1, warpShape0, warpShape1 } = src;
        const { boosterGlowScale = 1, boosterHaloScale = 1, boosterSymHalo = 1, boosterBrightness = 1 } = options.multiplier;

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
                    Color0: vec3.multiplyScalar([], shape0.color, boosterBrightness),
                    NoiseFunction1: shape1.noiseFunction,
                    NoiseSpeed1: shape1.noiseSpeed,
                    NoiseAmplitudeStart1: shape1.noiseAmplitureStart,
                    NoiseAmplitudeEnd1: shape1.noiseAmplitureEnd,
                    NoiseFrequency1: shape1.noiseFrequency,
                    Color1: vec3.multiplyScalar([], shape1.color, boosterBrightness),
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
        const { locatorTurrets = [] } = sof.hull;

        locatorTurrets.forEach(item =>
        {
            obj.locators.push(EveLocator2.from(item));
        });

        data.Log("debug", "Locator sets not implemented");
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
        data.Log("debug", "Audio not implemented");
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
        data.Log("debug", "Animations not implemented");
    }

    /**
     *
     * @param {EveSOFData} data
     * @param {EveStation2|EveShip2} obj
     * @param {Object} sof
     * @param {Object} [options={}]
     */
    static SetupChildren(data, obj, sof, options)
    {
        data.Log("debug", "Child objects not implemented");

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
                tw2.GetObject(redFilePath, EveSOFData.OnChildLoaded(children[i]));
            }
            else
            {
                data.Log({
                    type: "debug",
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
        data.Log("debug", "Binding child particle emitters not implemented");

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
            data.Log("debug", {
                name: "Space object factory",
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
    static SetupInstancedMesh(data, obj, sof, options)
    {
        data.Log("debug", "Instance meshes not implemented");

        /*
        const { instancedMeshes=[] } = sof.hull;
        for (var i = 0; i < instancedMeshes.length; ++i)
        {
            var him = instancedMeshes[i];
            var mesh = new Tw2InstancedMesh();
            mesh.instanceGeometryResPath = him.instanceGeometryResPath;
            mesh.geometryResPath = him.geometryResPath;
            mesh.Initialize();

            this.FillMeshAreas(data, get(mesh, "opaqueAreas", []), sof, options, "opaqueAreas", him.shader);

            var child = new EveChildMesh();
            child.mesh = mesh;
            obj.effectChildren.push(child);
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
        data.Log("debug", "Animation controllers not implemented");
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
        data.Log("debug", "Turret materials not implemented");
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
