import { meta, perArrayChild } from "utils";
import { vec3, vec4, mat4 } from "math";
import { device } from "global";
import { Tw2RawData } from "core";
import { Tr2InteriorLightSet } from "../lighting/Tr2InteriorLightSet";
import { Tr2InteriorLightSource } from "../lighting/Tr2InteriorLightSource";


@meta.type("Tr2InteriorScene")
@meta.ccp.define("Tr2InteriorScene")
export class Tr2InteriorScene extends meta.Model
{

    @meta.path
    backgroundCubemapPath = "";

    @meta.boolean
    display = true;

    @meta.list([ "Tr2IntSkinnedObject", "Tr2InteriorPlaceable" ])
    dynamics = [];

    @meta.list("Tr2InteriorLightSource")
    lights = [];

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.boolean
    renderShadows = true;

    @meta.float
    minFogDistance = 0;

    @meta.float
    maxFogDistance = 1000;

    @meta.float
    maxFogAmount = 0;

    @meta.vector4
    fogColor = vec4.fromValues(1, 1, 1, 1);

    @meta.vector4
    ambientColor = vec4.create();

    @meta.vector4
    sunDiffuseColor = vec4.create();

    @meta.vector3
    sunDirection = vec3.fromValues(0, 0, 1);

    @meta.vector4
    sunSpecularColor = vec4.fromValues(0.8, 0.8, 0.8, 1);

    @meta.uint
    shadowCount = 0;

    @meta.uint
    shadowSize = 1024;

    _perFrameVS = Tw2RawData.from(Tr2InteriorScene.perFrameData.vs);
    _perFramePS = Tw2RawData.from(Tr2InteriorScene.perFrameData.ps);
    _lightSet = new Tr2InteriorLightSet();
    _selectedLights = [];
    _defaultLights = null;

    /**
     * Initializes the scene
     */
    Initialize()
    {
        const lights = this.GetSceneLights();

        for (let i = 0; i < lights.length; i++)
        {
            if (lights[i] && lights[i].Initialize)
            {
                lights[i].Initialize();
            }
        }

        for (let i = 0; i < this.dynamics.length; i++)
        {
            if (this.dynamics[i] && this.dynamics[i].Initialize)
            {
                this.dynamics[i].Initialize();
            }
        }
    }

    /**
     * Adds a dynamic object
     * @param {*} object
     * @returns {*}
     */
    AddDynamic(object)
    {
        if (object && !this.dynamics.includes(object))
        {
            this.dynamics.push(object);
        }
        return object;
    }

    /**
     * Removes a dynamic object
     * @param {*} object
     * @returns {Boolean}
     */
    RemoveDynamic(object)
    {
        const index = this.dynamics.indexOf(object);
        if (index === -1) return false;
        this.dynamics.splice(index, 1);
        return true;
    }

    /**
     * Adds an interior light source
     * @param {*} light
     * @returns {*}
     */
    AddLightSource(light)
    {
        if (light && !this.lights.includes(light))
        {
            this.lights.push(light);
        }
        return light;
    }

    /**
     * Removes an interior light source
     * @param {*} light
     * @returns {Boolean}
     */
    RemoveLightSource(light)
    {
        const index = this.lights.indexOf(light);
        if (index === -1) return false;
        this.lights.splice(index, 1);
        return true;
    }

    /**
     * Gets resources
     * @param {Array} [out=[]]
     * @returns {Array}
     */
    GetResources(out = [])
    {
        perArrayChild(this.dynamics, "GetResources", out);
        perArrayChild(this.lights, "GetResources", out);
        perArrayChild(this.curveSets, "GetResources", out);
        return out;
    }

    /**
     * Updates the scene
     * @param {Number} dt
     */
    Update(dt)
    {
        this.ApplyInteriorLights();

        for (let i = 0; i < this.curveSets.length; i++)
        {
            if (this.curveSets[i] && this.curveSets[i].UpdateDelta)
            {
                this.curveSets[i].UpdateDelta(dt);
            }
        }

        for (let i = 0; i < this.dynamics.length; i++)
        {
            if (this.dynamics[i] && this.dynamics[i].Update)
            {
                this.dynamics[i].Update(dt);
            }
        }

        const lights = this.GetSceneLights();
        for (let i = 0; i < lights.length; i++)
        {
            if (lights[i] && lights[i].Update)
            {
                lights[i].Update(dt);
            }
        }
    }

    /**
     * Updates view dependent data
     * @param {mat4} [parentTransform]
     */
    UpdateViewDependentData(parentTransform = Tr2InteriorScene.global.identity)
    {
        this.ApplyPerFrameData();
        this.ApplyInteriorLights();

        for (let i = 0; i < this.dynamics.length; i++)
        {
            if (this.dynamics[i] && this.dynamics[i].UpdateViewDependentData)
            {
                this.dynamics[i].UpdateViewDependentData(parentTransform);
            }
        }
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {*} accumulator
     * @returns {Boolean}
     */
    GetBatches(mode, accumulator)
    {
        if (!this.display) return false;

        this.ApplyPerFrameData();
        this.ApplyInteriorLights();

        const c = accumulator.length;
        for (let i = 0; i < this.dynamics.length; i++)
        {
            if (this.dynamics[i] && this.dynamics[i].GetBatches)
            {
                this.dynamics[i].GetBatches(mode, accumulator);
            }
        }
        return accumulator.length !== c;
    }

    /**
     * Carbon compatibility hook
     * @returns {Boolean}
     */
    RebuildSceneData()
    {
        this.Initialize();
        this.ApplyPerFrameData();
        return true;
    }

    /**
     * Applies compact Carbon/legacy GLES interior per-frame data.
     * These layouts intentionally differ from EveSpaceScene's space-object
     * per-frame buffers; old managed/interior shaders read cb1/cb2 in this order.
     * @returns {Tr2InteriorScene}
     */
    ApplyPerFrameData()
    {
        device.UpdateViewProjection();

        const
            g = Tr2InteriorScene.global,
            vs = this._perFrameVS,
            ps = this._perFramePS,
            sunDir = this.GetPerFrameSunDirection(g.vec4_0),
            fog = this.fogColor;

        vs.Set("ViewInverseTransposeMat", device.viewInverse);
        vs.Set("SunData.DirWorld", sunDir);
        vs.Set("Fog.color", fog);
        vs.Set("ViewProjectionMat", device.viewProjectionTranspose);
        vs.Set("ViewMat", device.viewTranspose);
        vs.Set("ProjectionMat", device.projectionTranspose);

        ps.Set("ViewInverseTransposeMat", device.viewInverse);
        ps.Set("SceneData.ambientColor", this.ambientColor);
        ps.Set("SceneData.fogColor", g.fogData(fog));
        ps.Set("SunData.DirWorld", sunDir);
        ps.Set("SunData.DiffuseColor", this.sunDiffuseColor);
        ps.Set("SunData.SpecularColor", this.sunSpecularColor);
        ps.Set("Fog.Values", [
            this.maxFogAmount,
            this.maxFogDistance,
            this.minFogDistance,
            1
        ]);
        ps.Set("ViewProjectionMat", device.viewProjectionTranspose);
        ps.Set("Unknown", [
            this.renderShadows ? this.shadowCount : 0,
            this.shadowSize ? 1 / this.shadowSize : 0,
            0,
            0
        ]);
        ps.Set("Viewport", [
            device.viewportWidth,
            device.viewportHeight,
            0,
            0
        ]);
        ps.Set("ViewProjInverse", device.viewProjectionInverse);
        return this;
    }

    /**
     * Gets the Carbon interior sun direction used by frame constants.
     * @param {vec4} out
     * @returns {vec4}
     */
    GetPerFrameSunDirection(out)
    {
        const
            x = -this.sunDirection[0],
            y = -this.sunDirection[1],
            z = -this.sunDirection[2],
            lenSq = x * x + y * y + z * z;

        if (Number.isFinite(lenSq) && lenSq > 1e-8)
        {
            const invLen = 1 / Math.sqrt(lenSq);
            out[0] = x * invLen;
            out[1] = y * invLen;
            out[2] = z * invLen;
        }
        else
        {
            out[0] = 0;
            out[1] = 0;
            out[2] = -1;
        }
        out[3] = 0;
        return out;
    }

    /**
     * Shares scene lights with dynamics for per-object packing.
     */
    ApplyInteriorLights()
    {
        this._lightSet.SetLights(this.GetSceneLights());

        for (let i = 0; i < this.dynamics.length; i++)
        {
            const dynamic = this.dynamics[i];
            if (dynamic)
            {
                dynamic._interiorScene = this;
                if (dynamic.interiorLights)
                {
                    dynamic.interiorLights = this._lightSet.GetActiveLights(dynamic, this._selectedLights[i] || (this._selectedLights[i] = []));
                }
            }
        }
    }

    /**
     * Gets authored lights, or a small neutral preview rig for unlit scenes.
     * The generated defaults are intentionally not appended to `lights`, so
     * deserialized scenes remain untouched and authored lights always win.
     * @returns {Array<Tr2InteriorLightSource>}
     */
    GetSceneLights()
    {
        return this.lights && this.lights.length ? this.lights : this.GetDefaultLights();
    }

    /**
     * Gets a lazily created default interior lighting rig.
     * @returns {Array<Tr2InteriorLightSource>}
     */
    GetDefaultLights()
    {
        if (!this._defaultLights)
        {
            this._defaultLights = Tr2InteriorScene.CreateDefaultLights();
        }
        return this._defaultLights;
    }

    /**
     * Creates a simple character/interior preview rig.
     * @returns {Array<Tr2InteriorLightSource>}
     */
    static CreateDefaultLights()
    {
        const make = (name, position, radius, color, falloff = 1) =>
        {
            const light = new Tr2InteriorLightSource();
            light.name = name;
            vec3.copy(light.position, position);
            vec4.copy(light.color, color);
            light.radius = radius;
            light.falloff = falloff;
            light.primaryLighting = true;
            light.coneAlphaInner = 180;
            light.coneAlphaOuter = 180;
            vec3.set(light.coneDirection, 0, -1, 0);
            light.Initialize();
            return light;
        };

        return [
            make("default_key", [ -120, 180, 160 ], 700, [ 2.15, 2.0, 1.75, 1 ]),
            make("default_fill", [ 180, 80, 110 ], 650, [ 1.2, 1.3, 1.55, 1 ]),
            make("default_rim", [ 0, -220, 220 ], 750, [ 1.55, 1.65, 1.9, 1 ]),
            make("default_body", [ 0, 0, 80 ], 900, [ 1.05, 1.0, 0.95, 1 ])
        ];
    }

    /**
     * Applies default interior per-frame data for unsupported bootstrap paths
     * where interior objects are hosted by a regular EveSpaceScene.
     * @returns {Tr2InteriorScene}
     */
    static ApplyFallbackPerFrameData()
    {
        if (!this.fallbackScene)
        {
            this.fallbackScene = new Tr2InteriorScene();
        }
        this.fallbackScene.ApplyPerFrameData();
        return this.fallbackScene;
    }

    static global = {
        identity: mat4.create(),
        vec4_0: vec4.create(),
        fogData: (() =>
        {
            const out = new Float32Array(16);
            return function(fog)
            {
                out.fill(0);
                out[0] = fog[0];
                out[1] = fog[1];
                out[2] = fog[2];
                out[3] = fog[3];
                return out;
            };
        })()
    };

    static fallbackScene = null;

    /**
     * Legacy GLES/Carbon interior per-frame data.
     * VS: 18 vec4 registers. PS: 23 vec4 registers, matching the old ccpwgl
     * managed/interior shader layout used by avatar/placeable GLES effects.
     */
    static perFrameData = {
        ps: [
            [ "ViewInverseTransposeMat", 16 ],
            [ "SceneData.ambientColor", 4 ],
            [ "SceneData.fogColor", 16 ],
            [ "SunData.DirWorld", 4 ],
            [ "SunData.DiffuseColor", 4 ],
            [ "SunData.SpecularColor", 4 ],
            [ "Fog.Values", 4 ],
            [ "ViewProjectionMat", 16 ],
            [ "Unknown", 4 ],
            [ "Viewport", 4 ],
            [ "ViewProjInverse", 16 ]
        ],
        vs: [
            [ "ViewInverseTransposeMat", 16 ],
            [ "SunData.DirWorld", 4 ],
            [ "Fog.color", 4 ],
            [ "ViewProjectionMat", 16 ],
            [ "ViewMat", 16 ],
            [ "ProjectionMat", 16 ]
        ]
    };

}
