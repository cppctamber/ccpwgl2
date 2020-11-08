import { assignIfExists, isString } from "utils";
import * as math from "math";
import * as util from "utils";
import { device, resMan, tw2 } from "global";
import { Tw2EventEmitter, Tw2PostEffectManager } from "core";
import { WrappedCamera } from "./WrappedCamera";
import { WrappedScene } from "./WrappedScene";
import {
    getGraphicID,
    getResPathFromGraphicID,
    getResPathFromTypeID,
    getTypeID,
    getTypeIDSkinIDs,
    getResPathFromTypeIDAndSkinID,
    getSkinMaterialTypeIDs,
    getResPathFromTypeIDAndSkinMaterialID,
    getSkinID
} from "./APIManager";


let eveSof;

export class WrappedClient extends Tw2EventEmitter
{

    scene = null;
    camera = null;
    post = new Tw2PostEffectManager();
    math = math;
    util = util;

    options = {
        update: true,
        render: true,
        postEffects: true,
        clearColor: math.vec4.fromValues(0, 0, 0, 1),
        colorMask: math.vec4.fromValues(0, 0, 0, 0)
    };

    /**
     * Reference to the tw2 library
     * @return {Tw2Library}
     */
    get tw2()
    {
        return tw2;
    }

    /**
     * Gets the current delta time
     * @return {*}
     */
    get dt()
    {
        return device.dt;
    }

    /**
     * Gets the current frame
     * @return {*}
     */
    get frame()
    {
        return device.frameCounter;
    }

    /**
     * Gets the 3d canvas
     * @return {*}
     */
    get canvas3d()
    {
        return device.canvas;
    }

    /**
     * Gets the 2d canvas
     * @return {*}
     */
    get canvas2d()
    {
        return device.canvas2d;
    }

    /**
     * Initializes the client
     * @param {Object} options
     * @returns {Scene|undefined}
     */
    async Initialize(options = {})
    {
        let { client, render, scene, camera, ...opt } = options;
        if (client) assignIfExists(this.options, client, Object.keys(this.options));
        if (!render) render = dt => this.Render(dt);
        tw2.Initialize({ render, ...opt });

        // Force load the sof
        await WrappedClient.fetchEveSOF();

        // Quick setup
        if (camera) await this.FetchCamera(camera);
        if (scene) await this.FetchScene(scene);

        return this;
    }

    /**
     * Per frame render
     * @param {Number} dt
     * @returns {Boolean} true
     */
    Render(dt)
    {
        const { render, update, postEffects, colorMask } = this.options;
        const { camera, scene, post } = this;

        if (update && scene)
        {
            this.EmitEvent("update", dt);

            if (camera) camera.Update(dt);
            if (scene) scene.Update(dt);
            if (post) post.Update(dt);

            if (render)
            {
                const { gl, viewportAspect, viewportWidth, viewportHeight, RM_OPAQUE } = device;
                const { clearColor } = scene.wrapped;

                this.EmitEvent("pre_render", dt);

                device.SetStandardStates(RM_OPAQUE);
                device.SetProjection(camera.GetProjection([], viewportAspect));
                device.SetView(camera.GetView([]));

                gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
                gl.clearDepth(1.0);
                gl.viewport(0, 0, viewportWidth, viewportHeight);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

                this.EmitEvent("pre_scene_render", dt);
                scene.Render(dt);
                this.EmitEvent("post_scene_render", dt);

                if (!post || postEffects && !post.Render())
                {
                    gl.colorMask(!!colorMask[0], !!colorMask[1], !!colorMask[2], !!colorMask[3]);
                    gl.clearColor(0, 0, 0, 1);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    gl.colorMask(true, true, true, true);
                }
            }
        }

        this.EmitEvent("post_render", dt);
        return true;
    }

    /**
     * Fetches all type ids for a skin material ID
     * @param {String} skinMaterialID
     * @return {Promise<Array>}
     */
    async FetchSkinMaterialTypeIDs(skinMaterialID)
    {
        return getSkinMaterialTypeIDs(skinMaterialID);
    }

    /**
     * Fetches all skin ids for a type
     * @param {Number} typeID
     * @return {Promise<Array>}
     */
    async FetchTypeIDSkinIDs(typeID)
    {
        return getTypeIDSkinIDs(typeID);
    }

    /**
     *
     * @param skinID
     * @return {Promise<*>}
     */
    async FetchSkinID(skinID)
    {
        return getSkinID(skinID);
    }

    /**
     *
     * @param typeID
     * @return {Promise<Object>}
     */
    async FetchTypeID(typeID)
    {
        return getTypeID(typeID);
    }

    /**
     *
     * @param graphicID
     * @return {Promise<Object>}
     */
    async FetchGraphicID(graphicID)
    {
        return getGraphicID(graphicID);
    }

    /**
     *
     * @param typeID
     * @param skinMaterialID
     * @return {Promise<{dna: string, name: *}>}
     */
    async FetchResPathFromTypeIDAndSkinMaterialID(typeID, skinMaterialID)
    {
        return getResPathFromTypeIDAndSkinMaterialID(typeID, skinMaterialID);
    }

    /**
     *
     * @param typeID
     * @param skinID
     * @return {Promise<{dna: string, name: *}>}
     */
    async FetchResPathFromTypeIDAndSkinID(typeID, skinID)
    {
        return getResPathFromTypeIDAndSkinID(typeID, skinID);
    }

    /**
     *
     * @param typeID
     * @return {Promise<String>}
     */
    async FetchResPathFromTypeID(typeID)
    {
        return getResPathFromTypeID(typeID);
    }

    /**
     *
     * @param graphicID
     * @return {Promise<String>}
     */
    async FetchResPathFromGraphicID(graphicID)
    {
        return getResPathFromGraphicID(graphicID);
    }

    /**
     * Fetches the  space  object factory
     * @return {Promise<EveSOFData>}
     */
    async FetchSOF()
    {
        return WrappedClient.fetchEveSOF();
    }

    /**
     * Fetches sof pattern names for a given hull;
     * @param {String} hull
     * @return {Promise<Array>}
     */
    async FetchSOFHullPatterns(hull)
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetHullPatternNames(hull);
    }

    /**
     * Fetches sof hull names
     * @return {Promise<Array>}
     */
    async FetchSOFHulls()
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetHullNames([]);
    }

    /**
     * Fetches sof faction names
     * @return {Promise<Array>}
     */
    async FetchSOFFactions()
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetFactionNames([]);
    }

    /**
     * Fetches sof race names
     * @return {Promise<Array>}
     */
    async FetchSOFRaces()
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetRaceNames([]);
    }

    /**
     * Fetches sof material names
     * @return {Promise<Array>}
     */
    async FetchSOFMaterials()
    {
        const eveSof = await this.FetchSOF();
        return eveSof.GetMaterialNames([]);
    }

    /**
     * Fetches a scene async
     * @param {Object} options
     * @param {Boolean} [doNotAdd]
     * @return {Promise<WrappedScene>}
     */
    async FetchScene(options, doNotAdd)
    {
        const scene = await WrappedScene.fetch(options);
        if (!doNotAdd) this.SetScene(scene);
        return scene;
    }

    /**
     * Fetches a camera async
     * @param {Object} [options={}]
     * @param {Boolean} [doNotAdd]
     * @return {Promise<WrappedCamera>}
     */
    async FetchCamera(options = {}, doNotAdd)
    {
        if (isString(options))
        {
            options = { canvas: options };
        }

        if (!options.canvas)
        {
            options.canvas = this.canvas2d ? this.canvas2d : this.canvas3d;
        }

        const camera = await WrappedCamera.fetch(options);
        if (!doNotAdd) this.SetCamera(camera);
        return camera;
    }

    /**
     * Sets the current scene
     * @param {WrappedScene} scene
     * @return {WrappedClient}
     */
    SetScene(scene)
    {
        if (this.scene !== scene)
        {
            if (this.scene) this.EmitEvent("scene_removed", this.scene);
            this.scene = scene;
            this.EmitEvent("scene_added", scene);
        }
        return this;
    }

    /**
     * Sets the current camera
     * @param {WrappedCamera} camera
     * @return {WrappedClient}
     */
    SetCamera(camera)
    {
        if (this.camera !== camera)
        {
            if (this.camera) this.EmitEvent("camera_removed", this.camera);
            this.camera = camera;
            this.EmitEvent("camera_added", camera);
        }
        return this;
    }

    /**
     * Fetches the latest eve sof
     * @return {Promise<EveSOFData>}
     */
    static async fetchEveSOF()
    {
        if (!eveSof)
        {
            eveSof = await resMan.FetchObject(WrappedClient.SpaceObjectFactoryPath);
        }
        return eveSof;
    }

    /**
     * Path to the latest space object factory
     * @type {string}
     */
    static SpaceObjectFactoryPath = "cdn:/dx9/model/spaceobjectfactory/data.black";

}
