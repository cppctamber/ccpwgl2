var ccpwgl = (function(tw2)
{
    var ccpwgl = new tw2.Tw2EventEmitter();

    const { vec3, vec4, quat, mat4 } = tw2.math;

    // Enables debug mode
    Object.defineProperty(ccpwgl, "debug", {
        set: (bool) => tw2.debug = bool,
        get: () => tw2.debug
    });

    // Allow debug to be set from the browser
    if (tw2.util.getURLBoolean("debug", false))
    {
        ccpwgl.debug = true;
    }

    // The current canvas
    Object.defineProperty(ccpwgl, "canvas", {
        get: () => tw2.canvas
    });

    /**
     * Distables scene fog effects (they look terrible)
     * @type {boolean}
     */
    ccpwgl.disableFogOnSceneLoaded = true;

    /**
     * Values for textureQuality option that can be passed to ccpwgl.initialize.
     */
    ccpwgl.TextureQuality = {
        HIGH: 0,
        MEDIUM: 1,
        LOW: 2
    };

    /**
     * Values for textureQuality option that can be passed to ccpwgl.initialize.
     */
    ccpwgl.ShaderQuality = {
        HIGH: "hi",
        LOW: "lo"
    };

    /**
     * Resource unload policty. Controls how cached resources are evicted from
     * memory. See ccpwgl.getResourceUnloadPolicy and ccpwgl.setResourceUnloadPolicy.
     * When set to MANUAL you need to call ccpwgl.clearCachedResources function manually
     * from time to time to clear resources from memory cache. When set to USAGE_BASED
     * (default) resources are automatically removed from the cache if they are not used
     * for a specified period of time.
     * It is preferable to use USAGE_BASED, but occasionally this will unload resources
     * when you don't want to (for example if you temporary hide a ship). In such cases
     * you will have to use MANUAL policy and call ccpwgl.clearCachedResources when
     * you know that all resources you need are loaded (see ccpwgl.isLoading).
     */
    ccpwgl.ResourceUnloadPolicy = {
        MANUAL: 0,
        USAGE_BASED: 1
    };

    /**
     * Scene LOD settings: with LOD_ENABLED, scene will not try to render ships/objects that
     * are outside view frustum. Additionally it will hide some parts of ship (like decals)
     * for ships that too far away. Enabling LOD will help performance significantly for
     * scenes with a large number of objects. Defaults to LOD_DISABLED for compatibility.
     */
    ccpwgl.LodSettings = {
        LOD_DISABLED: 0,
        LOD_ENABLED: 1
    };

    /**
     * Turret states
     */
    ccpwgl.TurretState = {
        IDLE: 0,
        OFFLINE: 1,
        FIRING: 2
    };

    /**
     * Ship siege state
     */
    ccpwgl.ShipSiegeState = {
        NORMAL: 0,
        SIEGE: 1
    };

    /**
     * Exception that is thrown by some methods when their object .red files is not yet loaded.
     */
    ccpwgl.IsStillLoadingError = function()
    {
        this.name = "IsStillLoadingError";
        this.message = "Cannot process the request until the object is loaded";
    };
    ccpwgl.IsStillLoadingError.prototype = Object.create(Error.prototype);
    ccpwgl.IsStillLoadingError.prototype.constructor = ccpwgl.IsStillLoadingError;

    /** Current scene @type {ccpwgl.Scene} **/
    var scene = null;
    /** Current camera **/
    var camera = null;
    /** If scene updates and update callbacks are to be called **/
    var updateEnabled = true;
    /** If scene is to be rendered **/
    var renderingEnabled = true;
    /** Current resource unload policy @type {ccpwgl.ResourceUnloadPolicy} **/
    var resourceUnloadPolicy = ccpwgl.ResourceUnloadPolicy.USAGE_BASED;

    /** Background clear color **/
    var clearColor = [ 0, 0, 0, 1 ];
    /** Toggles using a scene's clear colour**/
    var useSceneClearColor = true;

    /**
     * Toggles using a scene's background colour or ccpwgl's
     * @param {Boolean} bool
     */
    ccpwgl.useSceneClearColor = function(bool)
    {
        useSceneClearColor = bool;
    };

    /**
     * Sets the background clear color
     * @param {vec4} color
     */
    ccpwgl.setClearColor = function(color)
    {
        vec4.copy(clearColor, color);
    };

    /**
     * Creates a render target
     * @param {number} width
     * @param {number} height
     * @param {boolean} depth
     * @returns {tw2.Tw2RenderTarget}
     */
    ccpwgl.createRenderTarget = function(width, height, depth)
    {
        var renderTarget = new tw2.Tw2RenderTarget();
        renderTarget.Create(width, height, depth);
        return renderTarget;
    };

    /**
     * Bloom post effect
     * @type {?Tw2PostEffect}
     **/
    var bloomEffect;

    /**
     * Post effect manager
     * @type {tw2.Tw2PostEffectManager}
     */
    ccpwgl.post = new tw2.Tw2PostEffectManager();

    /**
     * Internal render/update function. Is called every frame.
     * @param {Number} deltaTime
     **/
    var render = function(dt)
    {
        if (updateEnabled && camera && camera.update)
        {
            camera.update(dt);
        }

        if (scene && scene.wrappedScene)
        {
            if (updateEnabled)
            {
                ccpwgl.EmitEvent("update", dt);

                for (var i = 0; i < scene.objects.length; ++i)
                {
                    if (scene.objects[i].onUpdate)
                    {
                        scene.objects[i].onUpdate.call(scene.objects[i], dt);
                    }
                }

                if (ccpwgl.post)
                {
                    ccpwgl.post.Update(dt);
                }

                scene.wrappedScene.Update(dt);
            }

            if (renderingEnabled)
            {
                var clear = scene && scene.wrappedScene && useSceneClearColor ? scene.wrappedScene.clearColor : clearColor;

                tw2
                    .SetStandardStates(tw2.const.RM_OPAQUE)
                    .SetProjectionMatrix(camera.getProjection(tw2.aspect))
                    .SetViewMatrix(camera.getView())
                    .GLClearColor(clear)
                    .GLClearDepth(1.0)
                    .GLViewport([ 0, 0, tw2.width, tw2.height ])
                    .GLClear(tw2.gl.COLOR_BUFFER_BIT | tw2.gl.DEPTH_BUFFER_BIT);

                ccpwgl.EmitEvent("pre_render", dt);
                scene.wrappedScene.Render(dt);
                ccpwgl.EmitEvent("post_scene_render", dt);

                if (!ccpwgl.post || !ccpwgl.post.Render())
                {
                    // We have crap in back buffer alpha channel, so clear it
                    tw2
                        .GLColorMask([ false, false, false, false ])
                        .GLClearColor([ 0, 0, 0, 1 ])
                        .GLClear(tw2.gl.COLOR_BUFFER_BIT)
                        .GLColorMask([ true, true, true, true ]);
                }
            }
        }

        ccpwgl.EmitEvent("post_render", dt);
        return true;
    };

    // Provide backwards compatibility for old render callbacks
    function oldEvents(name)
    {
        let hasNotifiedDeveloper = false;
        return function(dt)
        {
            if (ccpwgl[name] && !hasNotifiedDeveloper)
            {
                hasNotifiedDeveloper = true;
                tw2.Log("error", `'ccpwgl.${name}' method is now deprecated and has been replaced with an emitted event`);
                ccpwgl[name](dt);
            }
        };
    }

    ccpwgl
        .OnEvent("update", oldEvents("onUpdate"))
        .OnEvent("pre_render", oldEvents("onPreRender"))
        .OnEvent("post_render", oldEvents("onPostRender"))
        .OnEvent("post_scene_render", oldEvents("onPostSceneRender"));


    /**
     * Initializes WebGL library. This function needs to be called before most of other
     * function from this module. The function accepts a canvas object that is to be used
     * outputting WebGL graphics and optional parameters that are passed as a map (object).
     * The parameters can be:
     * - webgl2: {boolean} enables webgl2 context creation
     * - textureQuality: one of ccpwgl.TextureQuality members, texture quality (size of loaded
     *   textures) with HIGH being the original size, MEDIUM - half the original size, LOW - a quater.
     *   Setting a lower texture quality results in smaller download sizes and possibly better
     *   performance on low-end machines. Defaults to HIGH.
     * - shaderQuality: one of ccpwgl.ShaderQuality members. Low quality shaders might improve
     *   performance on low-end machines, but do look ugly. Defaults to HIGH.
     * - anisotropicFilter: boolean value; if true anisotropic texture filtering will be
     *   turned on if browser supports it, if false anisotropic texture filtering is disabled.
     *   Disabling anisotropic filtering might result in better performance. Defaults to true.
     * - postprocessing: boolean value; if true, bloom postprocessing effects are applied to the
     *   rendered image. Disabling bloom postprocessing effects might result in better performance.
     *   Defaults to false. You can also turn this option on and off with ccpwgl.enablePostprocessing call.
     * - glParams: object; WebGL context creation parameters, see
     *   https://www.khronos.org/registry/webgl/specs/1.0/#2.2. Defaults to none.
     *
     * @param {HTMLCanvasElement|String} canvas  - Canvas
     * @param {{}} [params]                      - optional gl parameters
     * @throws {ErrWebglContext} If WebGL context is not available (IE or older browsers for example).
     */
    ccpwgl.initialize = function(canvas, params = {})
    {
        tw2.Initialize({
            canvas: canvas,
            glParams: params.glParams,
            device: params,
            render: render
        });

        if (params.postprocessing || params.postprocess)
        {
            ccpwgl.enablePostprocessing(true);
        }
    };

    /**
     * Sets/overrides URLs for resource paths. Resources paths used inside the engine have a
     * format 'namespace:/path' where namespace is usually 'res' which resolves to the
     * Eve Online CDN server and path is a relative path to the resource. You can extend
     * the resource loading by using a different namespace to load some resources from your
     * server. You can also override the default 'res' namespace to load EVE resources from
     * a different server.
     * @example
     * ccpwgl.setResourcePath('myres', 'http://www.myserver.com/resources/');
     * This call will forward all resource paths 'myres:/blah_blah_blah' to
     * http://www.myserver.com/resources/blah_blah_blah.
     *
     * @param {string} namespace Resource namespace.
     * @param {string} path URL to resource root. Needs to have a trailing slash.
     */
    ccpwgl.setResourcePath = function(namespace, path)
    {
        tw2.store.path.Set(namespace, path);
    };

    /**
     * Enables/disables bloom postprocessing effects. Triggers shader loading the first time
     * postprocessing is enabled, so the actual postprocessing will be turn on with a
     * delay after the first enabling call.
     *
     * @param {boolean} enable Enable/disable postprocessing.
     */
    ccpwgl.enablePostprocessing = function(enable)
    {
        if (enable)
        {
            if (!ccpwgl.post)
            {
                ccpwgl.post = new tw2.Tw2PostEffectManager();
            }

            if (!bloomEffect)
            {
                const postDirectory = "res:/Graphics/Effect/Managed/Space/PostProcess/";
                bloomEffect = ccpwgl.post.CreateItem({
                    name: "Bloom",
                    display: false,
                    index: 0,
                    steps: [
                        {
                            name: "Color down filter 4",
                            target: "quadRT1",
                            effectFilePath: postDirectory + "ColorDownFilter4.fx",
                            inputs: { BlitCurrent: null }
                        },
                        {
                            name: "Color high pass filter",
                            target: "quadRT0",
                            effectFilePath: postDirectory + "ColorHighPassFilter.fx",
                            parameters: { LuminanceThreshold: 0.85, LuminanceScale: 2 },
                            inputs: { BlitCurrent: "quadRT1" }
                        },
                        {
                            name: "Color exposure blur horizontal big",
                            target: "quadRT1",
                            effectFilePath: postDirectory + "ColorExpBlurHorizontalBig.fx",
                            inputs: { BlitCurrent: "quadRT0" }
                        },
                        {
                            name: "Color exposure blur vertical big",
                            target: "quadRT0",
                            effectFilePath: postDirectory + "ColorExpBlurVerticalBig.fx",
                            inputs: { BlitCurrent: "quadRT1" }
                        },
                        {
                            name: "Color up filter 4 add",
                            target: null,
                            effectFilePath: postDirectory + "ColorUpFilter4_Add.fx",
                            parameters: { "ScalingFactor": 1 },
                            inputs: { BlitCurrent: "quadRT0", BlitOriginal: null }
                        }
                    ]
                });
            }

            bloomEffect.display = true;
        }
        else if (!enable && bloomEffect)
        {
            bloomEffect.display = false;
        }
    };

    ccpwgl.post.setBlur = function(amount)
    {
        const blurs = [];
        ccpwgl.post.effects.forEach(effect =>
        {
            effect.steps.forEach(step =>
            {
                if (step.effect && "g_blurScale" in step.effect.parameters)
                {
                    step.effect.parameters["g_blurScale"].x = amount;
                }
            });
        });
    };

    /**
     * Assigns an active camera used for scene rendering. A camera is an object that is
     * required to have three following methods (that are called during rendering):
     * - update: function (dt) - a chance for camera object to update itself once per frame;
     *   the dt parameter is frame time in seconds
     * - getView: function () - return mat4 object, the view matrix
     * - getProjection: function (aspect) - return mat4 object, the projection matrix; the
     *   aspect parameter is the aspect ration: canvas width divided by canvas height.
     *
     * @param {Object} newCamera Current camera object.
     */
    ccpwgl.setCamera = function(newCamera)
    {
        camera = newCamera;
    };

    /**
     * Gets the current active camera
     * @returns {Camera}
     */
    ccpwgl.getCamera = function()
    {
        return camera;
    };

    var defaultErrorHandler = function(err)
    {
        throw err;
    };

    /**
     * Returns the whole Space Object Factory file.
     * Provides a callback that is called once SOF data has been loaded.
     * @param onResolved Function that is called when SOF data is ready. Called with a single parameter
     * @param onRejected Function that is called on errors
     */
    ccpwgl.getSofData = function(onResolved, onRejected)
    {
        tw2.eveSof.FetchSOF()
            .then(onResolved)
            .catch(onRejected || defaultErrorHandler);
    };

    /**
     * Query ship hull names from space object factory database. Along with getSofFactionNames and getSofRaceNames this
     * function can be used to get all supported ship DNA strings (DNA string has a form 'hull:faction:race' that can
     * be passed to loadShip function) to construct 'random' ships. The function is asynchronous so the user needs to
     * provide a callback that is called once SOF data has been loaded.
     * @param onResolved Function that is called when SOF data is ready. Called with a single parameter that is an mapping
     * of all hull names to their descriptions.
     * @param onRejected Function that is called on errors
     */
    ccpwgl.getSofHullNames = function(onResolved, onRejected)
    {
        tw2.eveSof.FetchHullNames()
            .then(onResolved)
            .catch(onRejected || defaultErrorHandler);
    };

    /**
     * Query ship faction names from space object factory database. Along with getSofHullNames and getSofRaceNames this
     * function can be used to get all supported ship DNA strings (DNA string has a form 'hull:faction:race' that can
     * be passed to loadShip function) to construct 'random' ships. The function is asynchronous so the user needs to
     * provide a callback that is called once SOF data has been loaded.
     * @param onResolved Function that is called when SOF data is ready. Called with a single parameter that is an mapping
     * of all hull names to their descriptions.
     * @param onRejected Function that is called on errors
     */
    ccpwgl.getSofFactionNames = function(onResolved, onRejected)
    {
        tw2.eveSof.FetchFactionNames()
            .then(onResolved)
            .catch(onRejected || defaultErrorHandler);
    };

    /**
     * Query ship race names from space object factory database. Along with getSofHullNames and getSofFactionNames this
     * function can be used to get all supported ship DNA strings (DNA string has a form 'hull:faction:race' that can
     * be passed to loadShip function) to construct 'random' ships. The function is asynchronous so the user needs to
     * provide a callback that is called once SOF data has been loaded.
     * @param onResolved Function that is called when SOF data is ready. Called with a single parameter that is an mapping
     * of all race names to their descriptions.
     * @param onRejected Function that is called on errors
     */
    ccpwgl.getSofRaceNames = function(onResolved, onRejected)
    {
        tw2.eveSof.FetchRaceNames()
            .then(onResolved)
            .catch(onRejected || defaultErrorHandler);
    };

    ccpwgl.getMaterialNames = function(onResolved, onRejected)
    {
        tw2.eveSof.FetchMaterialNames()
            .then(onResolved)
            .catch(onRejected || defaultErrorHandler);
    };

    ccpwgl.getPatternNames = function(onResolved, onRejected)
    {
        tw2.eveSof.FetchPatternNames()
            .then(onResolved)
            .catch(onRejected || defaultErrorHandler);
    };

    ccpwgl.getHullPatternNames = function(hull, onResolved, onRejected)
    {
        tw2.eveSof.FetchHullPatternNames(hull)
            .then(onResolved)
            .catch(onRejected || defaultErrorHandler);
    };

    /**
     * Returns a proper constructor function (either 'loadObject' or 'loadShip') appropriate for the given
     * hull name in a callback function.
     * @param hull {string} SOF hull name or full DNA
     * @param onResolved Function that is called when SOF data is ready. Called with a single parameter that is a
     * constructor name for the given hull.
     * @param onRejected Function that is called on errors
     */
    ccpwgl.getSofHullConstructor = function(hull, onResolved, onRejected)
    {
        tw2.eveSof.FetchHullBuildClass(hull)
            .then(function(buildClass)
            {
                onResolved(buildClass === 2 ? "loadObject" : "loadShip");
            })
            .catch(onRejected || defaultErrorHandler);
    };

    /**
     * Loads an object
     * @param {String} resPath
     * @param {Function} [onResolved]
     * @param {Function} [onRejected]
     * @param {String|Function|Class|Array<String|Function|Class>} expectedConstructor
     */
    ccpwgl.GetObject = function(resPath, onResolved, onRejected, expectedConstructor)
    {
        tw2.FetchObject(resPath)
            .then(onResolved)
            .catch(onRejected || defaultErrorHandler);
    };

    /**
     * Gets an object's length
     * @param object
     * @returns {number}
     */
    function getObjectLongAxis(object)
    {
        var bounds = object.getBoundingSphere();
        return bounds[1] ? Math.round(bounds[1] * 2) : -1;
    }

    const mat4_0 = mat4.create();

    /**
     * Wrapper for static objects (stations, gates, asteroids, clouds, etc.).
     * Created with Scene.loadObject function.
     *
     * @constructor
     * @param {string} resPath Res path to object .red file
     * @param {!function(): void} [onload] Optional callback function that is called
     *   when object .red file is loaded. this will point to SpaceObject instance.
     */
    function SpaceObject(resPath, onload)
    {
        /** Wrapped tw2 object **/
        this.wrappedObjects = [ null ];
        /** Transforms @type {Tw2Transform} **/
        this.transform = new tw2.Tw2Transforms()
            .OnWorldModified(world =>
            {
                if (!this.isLoaded()) return;
                this.wrappedObjects[0].SetTransform(world);
            });

        /** Per-frame on update callback @type {!function(dt): void} **/
        this.onUpdate = null;
        /** SOF DNA for objects constructed from SOF **/
        this.dna = null;
        /** Array of object overlay effects **/
        this.overlays = [];
        /** Parameter for holding visibility status **/
        var display = true;

        var self = this;

        Object.defineProperty(this, "display", {
            get: function()
            {
                return display;
            },
            set: function(bool)
            {
                display = bool;
                for (let i = 0; i < this.wrappedObjects.length; i++)
                {
                    if (this.wrappedObjects[i])
                    {
                        this.wrappedObjects[i].display = display;
                    }
                }
            }
        });

        function onObjectLoaded(obj)
        {
            obj.display = display;
            self.wrappedObjects[0] = obj;
            self.transform.RebuildTransforms({ force: true, skipUpdate: true });
            rebuildOverlays();
            if (onload)
            {
                onload.call(self);
            }
        }

        /**
         * Gets the object's length;
         * @returns {number}
         */
        this.getLongAxis = function()
        {
            return getObjectLongAxis(this);
        };

        /**
         * Gets the object's resources
         * @param {Array<Tw2Resource>} [out=[]]
         * @returns {Array<Tw2Resouce>} out
         */
        this.getResources = function(out)
        {
            if (!out) out = [];
            for (let i = 0; i < this.wrappedObjects.length; i++)
            {
                if (this.wrappedObjects[i] && "GetResources" in this.wrappedObjects[i])
                {
                    this.wrappedObjects[i].GetResources(out);
                }
            }
            return out;
        };

        /**
         * Check if object .red file is still loading.
         *
         * @returns {boolean} True if object's .red file is loading; false otherwise.
         */
        this.isLoaded = function()
        {
            return this.wrappedObjects[0] != null;
        };

        /**
         * Returns object's bounding sphere if it is available. Throws an exception otherwise.
         *
         * @throws If object is not yet loaded or if object does not have bounding sphere
         * information.
         * @returns {[vec3, float]} Array with first element being sphere position in local
         * coordinate space and second - sphere radius.
         */
        this.getBoundingSphere = function()
        {
            if (!this.isLoaded())
            {
                throw new ccpwgl.IsStillLoadingError();
            }
            if (!("boundingSphereRadius" in this.wrappedObjects[0]))
            {
                throw new TypeError("Object does not have bounding sphere information");
            }
            return [ this.wrappedObjects[0].boundingSphereCenter, this.wrappedObjects[0].boundingSphereRadius ];
        };

        function rebuildOverlays()
        {
            if (!self.isLoaded())
            {
                return;
            }

            var o = [];

            for (var i = 0; i < self.overlays.length; i++)
            {
                if (self.overlays[i].overlay)
                {
                    o.push(self.overlays[i].overlay);
                }
            }

            for (var i = 0; i < self.wrappedObjects.length; i++)
            {
                self.wrappedObjects[0].RebuildOverlays(o);
            }
        }

        /**
         * Adds an overlay effect to the object.
         *
         * @param {string} resPath Resource path to overlay effect.
         * @returns {number} Index of overlay effect; can be used in removeOverlay call.
         */
        this.addOverlay = function(resPath)
        {
            var index = this.overlays.length;
            var overlay = {
                resPath: resPath,
                overlay: null
            };
            this.overlays.push(overlay);
            ccpwgl.GetObject(resPath, function(obj)
            {
                overlay.overlay = obj;
                rebuildOverlays();
            });
            return index;
        };

        /**
         * Removes an overlay effect from the object.
         *
         * @param {number} index Index of overlay effect as returned by addOverlay.
         */
        this.removeOverlay = function(index)
        {
            this.overlays.splice(index, 1);
            rebuildOverlays();
        };

        /**
         * Removes all overlay effects from the object.
         */
        this.removeAllOverlays = function()
        {
            this.overlays.splice(0, this.overlays.length);
            rebuildOverlays();
        };

        if (resPath.match(/(\w|\d|[-_])+:(\w|\d|[-_])+:(\w|\d|[-_])+/))
        {
            this.dna = resPath;
        }

        ccpwgl.GetObject(resPath, onObjectLoaded, defaultErrorHandler, [ "!EveShip", "!EveShip2" ]);
    }

    /**
     * Wrapper for ships. On top of SpaceObject functionality it provides booster
     * and turret support.
     *
     * @constructor
     * @param {string|string[]} resPath Res path to ship .red file
     * @param {!function(): void} [onload] Optional callback function that is called
     *   when ship .red file is loaded. this will point to Ship instance.
     */
    function Ship(resPath, onload)
    {
        /** Wrapped tw2 ship object @type {tw2.EveShip} **/
        this.wrappedObjects = [ null ];
        /** Object transform @type {Tw2Transforms} **/
        this.transform = new tw2.Tw2Transforms()
            .OnWorldModified(world =>
            {
                if (!this.isLoaded()) return;
                const len = this.wrappedObjects.length;
                for (let i = 0; i < len; i++)
                {
                    if (len === 1)
                    {
                        this.wrappedObjects[i].SetTransform(world);
                    }
                    else
                    {
                        this.wrappedObjects[i].SetTransform(world, this.partTransforms[i]);
                    }
                }
            });

        /** Internal boosters object @type {tw2.EveBoosterSet} **/
        this.boosters = [ null ];
        /** Current siege state @type {ccpwgl.ShipSiegeState} **/
        this.siegeState = ccpwgl.ShipSiegeState.NORMAL;
        /** Internal siege state, as opposed to Ship.siegeState also includes transition states @type {number} **/
        this.internalSiegeState = ccpwgl.ShipSiegeState.NORMAL;
        /** Callback to be called when ship is loaded. Provided by Ship.setSiegeState. @type {!function(state): void} **/
        this.onInitialSeigeState = null;
        /** Current booster effect strength. **/
        this.boosterStrength = 1;
        /** Cached number of turret slots. **/
        this.turretCount = undefined;
        /** Array of mounted turrets. **/
        this.turrets = [];
        /** Per-frame on update callback @type {!function(dt): void} **/
        this.onUpdate = null;
        /** Local transforms for Tech3 ship parts **/
        this.partTransforms = [];
        /** Ship SOF DNA if the ship was constructed with SOF **/
        this.dna = undefined;
        /** Array of object overlay effects **/
        this.overlays = [];
        /** Kill counter **/
        this.killCount = 0;
        /** Function to call when turret fires  @type {!function(ship, muzzlePositions): void} **/
        this.turretFireCallback = null;
        /** Parameter for holding visibility status **/
        var display = true;

        Object.defineProperty(this, "display", {
            get: function()
            {
                return display;
            },
            set: function(bool)
            {
                display = bool;
                for (let i = 0; i < this.wrappedObjects.length; i++)
                {
                    if (this.wrappedObjects[i])
                    {
                        this.wrappedObjects[i].display = display;
                    }
                }
            }
        });

        var faction = null;

        var self = this;

        if (typeof resPath == "string")
        {
            resPath = [ resPath ];
        }
        for (var i = 0; i < resPath.length; ++i)
        {
            this.wrappedObjects[i] = null;
            this.boosters[i] = null;
        }

        function OnShipPartLoaded(index)
        {
            return function(obj)
            {
                obj.display = display;
                self.wrappedObjects[index] = obj;

                self.transform.RebuildTransforms({ force: true, skipUpdate: true });

                if (self.boosters[index])
                {
                    self.wrappedObjects[index].boosters = self.boosters[index];
                    self.wrappedObjects[index].RebuildBoosterSet();
                }
                self.wrappedObjects[index].killCount = self.killCount;
                self.wrappedObjects[index].boosterGain = self.boosterStrength;
                switch (self.siegeState)
                {
                    case ccpwgl.ShipSiegeState.SIEGE:
                        self.wrappedObjects[index].animation.PlayAnimation("SiegeLoop", { cycle: true });
                        self.internalSiegeState = ccpwgl.ShipSiegeState.SIEGE;
                        break;
                    default:
                        self.wrappedObjects[index].animation.PlayAnimation("NormalLoop", { cycle: true });
                }
                if (self.onInitialSeigeState)
                {
                    self.onInitialSeigeState.call(self, self.siegeState);
                }
                for (var i = 0; i < self.turrets.length; ++i)
                {
                    if (self.turrets[i])
                    {
                        doMountTurret(i, self.turrets[i].path, self.turrets[i].state, self.turrets[i].target, index);
                    }
                }
                if (self.isLoaded())
                {
                    if (self.wrappedObjects.length > 1)
                    {
                        assembleT3Ship();
                    }
                    rebuildOverlays();
                    if (onload)
                    {
                        onload.call(self);
                    }
                }
            };
        }

        if (resPath.length > 1)
        {
            if (resPath.length != 5)
            {
                throw new TypeError("Invalid number of parts passed to Tech3 ship constructor");
            }
        }

        function rebuildOverlays()
        {
            if (!self.isLoaded())
            {
                return;
            }

            var o = [];

            for (var i = 0; i < self.overlays.length; i++)
            {
                if (self.overlays[i].overlay)
                {
                    o.push(self.overlays[i].overlay);
                }
            }

            for (var i = 0; i < self.wrappedObjects.length; i++)
            {
                self.wrappedObjects[0].RebuildOverlays(o);
            }
        }

        /**
         * Gets the object's length;
         * @returns {number}
         */
        this.getLongAxis = function()
        {
            return getObjectLongAxis(this);
        };

        /**
         * Gets the object's resources
         * @param {Array<Tw2Resource>} [out=[]]
         * @returns {Array<Tw2Resouce>} out
         */
        this.getResources = function(out)
        {
            if (!out) out = [];
            for (let i = 0; i < this.wrappedObjects.length; i++)
            {
                if (this.wrappedObjects[i] && "GetResources" in this.wrappedObjects[i])
                {
                    this.wrappedObjects[i].GetResources(out);
                }
            }
            return out;
        };

        /**
         * Adds an overlay effect to the object.
         *
         * @param {string} resPath Resource path to overlay effect.
         * @returns {number} Index of overlay effect; can be used in removeOverlay call.
         */
        this.addOverlay = function(resPath)
        {
            var index = this.overlays.length;
            var overlay = {
                resPath: resPath,
                overlay: null
            };
            this.overlays.push(overlay);
            ccpwgl.GetObject(resPath, function(obj)
            {
                overlay.overlay = obj;
                rebuildOverlays();
            });
            return index;
        };

        /**
         * Removes an overlay effect from the object.
         *
         * @param {number} index Index of overlay effect as returned by addOverlay.
         */
        this.removeOverlay = function(index)
        {
            this.overlays.splice(index, 1);
            rebuildOverlays();
        };

        /**
         * Removes all overlay effects from the object.
         */
        this.removeAllOverlays = function()
        {
            this.overlays.splice(0, this.overlays.length);
            rebuildOverlays();
        };

        function assembleT3Ship()
        {
            var systemNames = [
                "electronic",
                "defensive",
                "engineering",
                "offensive",
                "propulsion"
            ];

            var systems = [];
            for (var i = 0; i < self.wrappedObjects.length; ++i)
            {
                var found = false;
                for (var j = 1; j < systemNames.length; ++j)
                {
                    var loc = self.wrappedObjects[i].FindLocatorTransformByName("locator_attach_" + systemNames[j]);
                    if (loc !== null)
                    {
                        if (systems[j - 1])
                        {
                            if (i == 4)
                            {
                                break;
                            }
                            throw new TypeError("Invalid parts passed to Tech3 ship constructor");
                        }
                        systems[j - 1] = [ i, loc.subarray(12, 15) ];
                        found = true;
                        break;
                    }
                }
                if (!found)
                {
                    if (systems[4])
                    {
                        throw new TypeError("Invalid parts passed to Tech3 ship constructor");
                    }
                    systems[4] = [ i, vec3.create() ];
                }
            }
            var offset = vec3.create();
            var transform = mat4.create();
            for (i = 0; i < systems.length; ++i)
            {
                var index = systems[i][0];
                self.partTransforms[index] = mat4.create();
                mat4.translate(self.partTransforms[index], self.partTransforms[index], offset);
                vec3.add(offset, offset, systems[i][1]);

                const { _worldTransform } = self.transform;
                self.wrappedObjects[index].SetTransform(_worldTransform, self.partTransforms[index]);
            }
        }

        /**
         * Check if ship's .red file is still loading.
         *
         * @returns {boolean} True if ship's .red file is loading; false otherwise.
         */
        this.isLoaded = function()
        {
            for (var i = 0; i < this.wrappedObjects.length; ++i)
            {
                if (!this.wrappedObjects[i])
                {
                    return false;
                }
            }
            return true;
        };

        /**
         * Returns ship's bounding sphere if this ship is loaded. Throws an exception otherwise.
         *
         * @throws If the ship is not yet loaded.
         * @returns {[vec3, float]} Array with first element being sphere position in local
         * coordinate space and second - sphere radius.
         */
        this.getBoundingSphere = function()
        {
            if (!this.isLoaded())
            {
                throw new ccpwgl.IsStillLoadingError();
            }
            return [ this.wrappedObjects[0].boundingSphereCenter, this.wrappedObjects[0].boundingSphereRadius ];
        };

        /**
         * Loads boosters effect for the ship.
         *
         * @param {string} resPath Res paths for boosters effect.
         * @param {!function(): void} onload Optional callback function that is called
         *   when boosters .red file is loaded. this will point to Ship instance.
         */
        this.loadBoosters = function(resPath, onload)
        {
            var self = this;

            function loaded(index)
            {
                return function(obj)
                {
                    self.boosters[index] = obj;
                    if (self.wrappedObjects[index])
                    {
                        self.wrappedObjects[index].boosters = obj;
                        self.wrappedObjects[index].RebuildBoosterSet();
                    }
                    for (var i = 0; i < self.boosters.length; ++i)
                    {
                        if (!self.boosters)
                        {
                            return;
                        }
                    }
                    if (onload)
                    {
                        onload.call(self);
                    }
                };
            }

            for (var i = 0; i < self.wrappedObjects.length; ++i)
            {
                ccpwgl.GetObject(resPath, loaded(i));
            }
        };

        /**
         * Sets strength of boosters effect.
         *
         * @param {number} boosterStrength Boosters strength from 0 to 1.
         */
        this.setBoosterStrength = function(boosterStrength)
        {
            this.boosterStrength = boosterStrength;
            for (var i = 0; i < self.wrappedObjects.length; ++i)
            {
                if (this.wrappedObjects[i])
                {
                    this.wrappedObjects[i].boosterGain = this.boosterStrength;
                }
            }
        };

        /**
         * Set number of kills for the ship (to display on the hull).
         *
         * @param {number} kills Number of kills (from 0).
         */
        this.setKillCount = function(kills)
        {
            this.killCount = kills;
            for (var i = 0; i < self.wrappedObjects.length; ++i)
            {
                if (this.wrappedObjects[i])
                {
                    this.wrappedObjects[i].killCount = kills;
                }
            }
        };

        /**
         * Returns number of turret slots available on the ship.
         *
         * @throws If the ship's .red file is not yet loaded.
         * @returns {number} Number of turret slots.
         */
        this.getTurretSlotCount = function()
        {
            if (this.turretCount !== undefined)
            {
                return this.turretCount;
            }
            if (!this.isLoaded())
            {
                throw new ccpwgl.IsStillLoadingError();
            }
            var slots = [];
            this.turretCount = 0;
            for (var j = 0; j < this.wrappedObjects.length; ++j)
            {
                for (var i = 0; i < this.wrappedObjects[j].locators.length; ++i)
                {
                    var match = (/^locator_turret_([0-9]+)[a-z]$/i).exec(this.wrappedObjects[j].locators[i].name);
                    if (match)
                    {
                        var index = parseInt(match[1], 10);
                        slots[index] = true;
                    }
                }
            }
            this.turretCount = slots.length - 1;
            return this.turretCount;
        };

        /**
         * Loads the turret and mounts it in a specified slot index.
         *
         * @param {number} index Slot index to mount turret in.
         * @param {string} resPath Res path to turret .red file.
         */
        this.mountTurret = function(index, resPath)
        {
            this.turrets[index] = {
                path: resPath,
                state: ccpwgl.TurretState.IDLE,
                target: vec3.create()
            };
            if (this.isLoaded())
            {
                doMountTurret(index, resPath, ccpwgl.TurretState.IDLE, this.turrets[index].target);
            }
        };

        /**
         * Removes turret from specified slot.
         *
         * @param {number} index Turret slot to clear.
         */
        this.removeTurret = function(index)
        {
            this.turrets[index] = null;
            if (this.isLoaded())
            {
                var name = "locator_turret_" + index;
                for (var j = 0; j < this.wrappedObjects.length; ++j)
                {
                    var ship = this.wrappedObjects[j];
                    for (var i = 0; i < ship.turretSets.length; ++i)
                    {
                        if (ship.turretSets[i].locatorName == name)
                        {
                            ship.turretSets.splice(i, 1);
                            break;
                        }
                    }
                    ship.RebuildTurretPositions();
                }
            }
        };

        /**
         * Sets turret's animation state. The specified slot must have a turret.
         *
         * @throws If the specified slot doesn't have turret mounted.
         * @param {number} index Turret slot.
         * @param {ccpwgl.TurretState} state Turret animation state.
         */
        this.setTurretState = function(index, state)
        {
            if (!this.turrets[index])
            {
                throw new ReferenceError("turret at index " + index + " is not defined");
            }
            if (this.turrets[index].state != state || state == ccpwgl.TurretState.FIRING)
            {
                this.turrets[index].state = state;
                var name = "locator_turret_" + index;
                for (var j = 0; j < this.wrappedObjects.length; ++j)
                {
                    if (this.wrappedObjects[j])
                    {
                        for (var i = 0; i < this.wrappedObjects[j].turretSets.length; ++i)
                        {
                            if (this.wrappedObjects[j].turretSets[i].locatorName == name)
                            {
                                switch (state)
                                {
                                    case ccpwgl.TurretState.FIRING:
                                        this.wrappedObjects[j].turretSets[i].EnterStateFiring();
                                        break;
                                    case ccpwgl.TurretState.OFFLINE:
                                        this.wrappedObjects[j].turretSets[i].EnterStateDeactive();
                                        break;
                                    default:
                                        this.wrappedObjects[j].turretSets[i].EnterStateIdle();
                                        break;
                                }
                                break;
                            }
                        }
                    }
                }
            }
        };

        /**
         * Sets turret's target position. The specified slot must have a turret.
         *
         * @throws If the specified slot doesn't have turret mounted.
         * @param {number} index Turret slot.
         * @param {vec3} target Target position in world space.
         */
        this.setTurretTargetPosition = function(index, target)
        {
            if (!this.turrets[index])
            {
                throw new ReferenceError("turret at index " + index + " is not defined");
            }
            vec3.copy(this.turrets[index].target, target);
            var name = "locator_turret_" + index;
            for (var j = 0; j < this.wrappedObjects.length; ++j)
            {
                if (this.wrappedObjects[j])
                {
                    for (var i = 0; i < this.wrappedObjects[j].turretSets.length; ++i)
                    {
                        if (this.wrappedObjects[j].turretSets[i].locatorName === name)
                        {
                            this.wrappedObjects[j].turretSets[i].SetTargetPosition(target);
                            break;
                        }
                    }
                }
            }
        };

        this.getTurretTargetPosition = function(index)
        {
            if (!this.turrets[index])
            {
                throw new ReferenceError("turret at index " + index + " is not defined");
            }
            return this.turrets[index].target;
        };

        function fireMissile(missilePath, positions)
        {
            console.error(missilePath);
        }

        /** Internal helper method that mount a turret on a loaded ship **/
        function doMountTurret(slot, resPath, state, targetPosition, objectIndex)
        {
            var name = "locator_turret_" + slot;
            if (objectIndex === undefined)
            {
                objectIndex = null;
                for (var i = 0; i < self.wrappedObjects.length; ++i)
                {
                    if (self.wrappedObjects[i] && self.wrappedObjects[i].HasLocatorPrefix(name))
                    {
                        objectIndex = i;
                        break;
                    }
                }
                if (objectIndex === null)
                {
                    return;
                }
            }
            else
            {
                if (!self.wrappedObjects[objectIndex].HasLocatorPrefix(name))
                {
                    return;
                }
            }
            var ship = self.wrappedObjects[objectIndex];
            for (i = 0; i < ship.turretSets.length; ++i)
            {
                if (ship.turretSets[i].locatorName == name)
                {
                    ship.turretSets.splice(i, 1);
                    break;
                }
            }

            const onTurretFired = function(turretSet, positions)
            {
                if (self.turretFireCallback)
                {
                    self.turretFireCallback(self, slot, positions);
                }
            };


            ship.RebuildTurretPositions();
            ccpwgl.GetObject(
                resPath,
                function(object)
                {
                    object.locatorName = name;
                    if (faction)
                    {
                        tw2.eveSof.SetupTurretMaterial(object, faction, faction);
                    }
                    ship.turretSets.push(object);
                    ship.RebuildTurretPositions();
                    object.SetTargetPosition(targetPosition);
                    object.OnTurretFired(onTurretFired);

                    switch (state)
                    {
                        case ccpwgl.TurretState.FIRING:
                            object.EnterStateFiring();
                            break;
                        case ccpwgl.TurretState.OFFLINE:
                            object.EnterStateDeactive();
                            break;
                        default:
                            object.EnterStateIdle();
                            break;
                    }
                });
        }

        /**
         * Sets ship siege state. Some ships support switching between 'normal' and
         * siege state having different animations for these states. This function
         * switches ships animation from one state to another. If the ship .red file
         * is not yet loaded the transition will happen once the file is loaded.
         *
         * @param {ccpwgl.ShipSiegeState} state State to switch to.
         * @param {!function(state): void} onswitch Optional callback function that is called
         *   when animation has switched to the new state. This will point to Ship instance. The
         *   state parameter is the new siege state.
         */
        this.setSiegeState = function(state, onswitch)
        {
            function getOnComplete(index, state, nextAnim)
            {
                return function()
                {
                    self.internalSiegeState = state;
                    self.wrappedObjects[index].animation.StopAllAnimations();
                    self.wrappedObjects[index].animation.PlayAnimation(nextAnim, true);
                    if (onswitch)
                    {
                        onswitch.call(self, self.internalSiegeState);
                    }
                };

            }

            if (this.siegeState != state)
            {
                this.siegeState = state;
                for (var j = 0; j < this.wrappedObjects.length; ++j)
                {
                    if (this.wrappedObjects[j])
                    {
                        if (state == ccpwgl.ShipSiegeState.SIEGE)
                        {
                            switch (this.internalSiegeState)
                            {
                                case ccpwgl.ShipSiegeState.NORMAL:
                                case 101:
                                    // 101 is transforming from siege state. Ideally we'd want to switch to StartSiege
                                    // with correct offset into animation, but we don't have that functionality yet...
                                    this.internalSiegeState = 100;
                                    this.wrappedObjects[j].animation.StopAllAnimations();
                                    this.wrappedObjects[j].animation.PlayAnimation("StartSiege", {
                                        callback: getOnComplete(j, ccpwgl.ShipSiegeState.SIEGE, "SiegeLoop")
                                    });
                                    break;
                                default:
                                    this.internalSiegeState = ccpwgl.ShipSiegeState.SIEGE;
                                    this.wrappedObjects[j].animation.StopAllAnimations();
                                    this.wrappedObjects[j].animation.PlayAnimation("SiegeLoop", { cycle: true });
                                    if (onswitch)
                                    {
                                        onswitch.call(self, self.internalSiegeState);
                                    }
                            }
                        }
                        else
                        {
                            switch (this.internalSiegeState)
                            {
                                case ccpwgl.ShipSiegeState.SIEGE:
                                case 100:
                                    // 100 is transforming to siege state. Ideally we'd want to switch to StartSiege
                                    // with correct offset into animation, but we don't have that functionality yet...
                                    this.internalSiegeState = 101;
                                    this.wrappedObjects[j].animation.StopAllAnimations();
                                    this.wrappedObjects[j].animation.PlayAnimation("EndSiege", {
                                        callback: getOnComplete(j, ccpwgl.ShipSiegeState.NORMAL, "NormalLoop")
                                    });
                                    break;
                                default:
                                    this.internalSiegeState = ccpwgl.ShipSiegeState.NORMAL;
                                    this.wrappedObjects[j].animation.StopAllAnimations();
                                    this.wrappedObjects[j].animation.PlayAnimation("NormalLoop", { cycle: true });
                                    if (onswitch)
                                    {
                                        onswitch.call(self, self.internalSiegeState);
                                    }
                            }
                        }
                    }
                    else
                    {
                        this.onInitialSeigeState = onswitch;
                    }
                }
            }
            else
            {
                if (onswitch)
                {
                    onswitch.call(self, this.siegeState);
                }
            }
        };

        /**
         * Returns an array of ship's locators. Locators hold transforms for various
         * ship mounts (turrets, boosters, etc.). If the ship is not yet loaded the
         * function throws ccpwgl.IsStillLoadingError exception.
         *
         * @throws If the ship's .red file is not yet loaded.
         * @returns {Array} Array of ship locators.
         */
        this.GetLocators = function()
        {
            if (!this.isLoaded())
            {
                throw new ccpwgl.IsStillLoadingError();
            }
            var result = this.wrappedObjects[0].locators;
            for (var i = 1; i < this.wrappedObjects.length; ++i)
            {
                result = result.concat(this.wrappedObjects[i].locators);
            }
            return result;
        };

        var factions = {
            amarr: "amarrbase",
            caldari: "caldaribase",
            gallente: "gallentebase",
            minmatar: "minmatarbase"
        };

        resPath.sort(function(x, y)
        {
            x = x.toLowerCase();
            y = y.toLowerCase();
            if (x < y)
            {
                return -1;
            }
            if (x > y)
            {
                return 1;
            }
            return 0;
        });

        for (i = 0; i < resPath.length; ++i)
        {
            if (i == 0)
            {
                // DNA
                if (resPath[i].match(/(\w|\d|[-_])+:(\w|\d|[-_])+:(\w|\d|[-_])+/))
                {
                    this.dna = resPath[0];
                    faction = this.dna.split(":")[1];
                }
                // Path
                else
                {
                    var p = resPath[0].toLowerCase();
                    for (var f in factions)
                    {
                        if (p.indexOf(f) >= 0)
                        {
                            faction = factions[f];
                        }
                    }
                }
            }

            ccpwgl.GetObject(resPath[i], OnShipPartLoaded(i), defaultErrorHandler, [ "EveShip", "EveShip2" ]);
        }
    }

    /**
     * Wrapper for planets. Created with Scene.loadPlanet function.
     *
     * @param {{}} [options={}]                 - an object containing the planet's options
     * @param {number} options.itemID           - the item id is used for randomization
     * @param {string} options.planetPath       - .red file for a planet, or planet template
     * @param {string} [options.atmospherePath] - optional .red file for a planet's atmosphere
     * @param {string} options.heightMap1       - planet's first height map
     * @param {string} options.heightMap2       - planet's second height map
     * @param {function} [onLoad]               - an optional callback which is fired when the planet has loaded
     * @constructor
     */
    function Planet(options, onLoad)
    {
        this.name = options && options.name ? options.name : "";

        /** Wrapped tw2 planet object @type {tw2.EvePlanet} **/
        this.wrappedObjects = [ new tw2.EvePlanet() ];

        /** Local transform **/
        this.transform = new tw2.Tw2Transforms()
            .OnWorldModified(world =>
            {
                this.wrappedObjects[0].SetTransform(world);
            });

        var self = this;

        /** Per-frame on update callback @type {!function(dt): void} **/
        this.onUpdate = null;

        var display = true;
        Object.defineProperty(this, "display", {
            get: function()
            {
                return display;
            },
            set: function(bool)
            {
                display = bool;
                this.wrappedObjects[0].display = display;
            }
        });

        /**
         * Gets the object's length;
         * @returns {number}
         */
        this.getLongAxis = function()
        {
            return getObjectLongAxis(this);
        };

        /**
         * Gets the object's resources
         * @param {Array<Tw2Resource>} [out=[]]
         * @returns {Array<Tw2Resouce>} out
         */
        this.getResources = function(out)
        {
            if (!out) out = [];
            this.wrappedObjects[0].GetResources(out);
            return out;
        };

        /**
         * Check if planet's resources are loaded and the resulting height map is generated.
         *
         * @returns {boolean} True if planet is loaded; false otherwise.
         */
        this.isLoaded = function()
        {
            return !this.wrappedObjects[0].heightDirty;
        };

        /**
         * Returns planets's bounding sphere. We know it always is a unit sphere in local
         * coordinate space.
         *
         * @returns {[vec3, float]} Array with first element being sphere position in local
         * coordinate space and the second it's radius
         */
        this.getBoundingSphere = function()
        {
            var tr = this.wrappedObjects[0].highDetail;
            return [ vec3.clone(tr.translation), Math.max(tr.scaling[0], tr.scaling[1], tr.scaling[2]) ];
        };

        this.wrappedObjects[0].Create(options, function()
        {
            // Temporary fix to decal area z-buffer issue
            var mesh = self.wrappedObjects[0]._planet.mesh;
            if (mesh.decalAreas[0])
            {
                mesh.opaqueAreas.push(mesh.decalAreas[0]);
                mesh.decalAreas.splice(0);
            }

            if (onLoad) onLoad.call(self);
        });
    }

    /**
     * Scene gathers together all objects that are rendered together. Scene can reference
     * a number of ship, other space objects (stations, gates, etc.), planets, sun, background
     * nebula. Use ccpwgl.loadScene or ccpwgl.createScene functions to create a scene.
     *
     * @constructor
     */
    function Scene()
    {
        /** Wrapped tw2 scene object @type {tw2.EveSpaceScene} **/
        this.wrappedScene = null;
        /** Array of rendered objects: SpaceObject, Ship or Planet **/
        this.objects = [];
        /** Current wrapped tw2 lensflare @type {tw2.EveLensflare} **/
        this.sun = null;
        /** Current sun direction (if null, the value is taked from scene .red file) @type {vec3} **/
        this.sunDirection = null;
        /** Current sun color (if null, the value is taked from scene .red file) @type {vec4} **/
        this.sunLightColor = null;
        /** Fog parameters (if null, the value is taked from scene .red file) @type {Array} **/
        this.fog = null;
        /** Current LOD setting @type {ccpwgl.LodSettings} **/
        var lodSetting = ccpwgl.LodSettings.LOD_DISABLED;
        /** Scene clear color **/
        var sceneClearColor;

        /**
         * Sets the background's clear color
         * @param {vec4} v
         */
        this.setClearColor = function(v)
        {
            sceneClearColor = v;
            if (this.wrappedScene)
            {
                vec4.copy(this.wrappedScene.clearColor, sceneClearColor);
            }
        };

        /** scene environment rendering **/
        var showEnvironment = true;

        /**
         * Toggles environment visibility
         * @param {Boolean} bool
         */
        this.showEnvironment = function(bool)
        {
            enableEnvironment = bool;
            if (this.wrappedScene)
            {
                this.wrappedScene.visible.environment = bool;
            }
        };

        /** scene fog rendering **/
        var showFog = true;

        /**
         * Toggles fog visibility
         * @param {Boolean} bool
         */
        this.showFog = function(bool)
        {
            showFog = bool;
            if (this.wrappedScene)
            {
                this.wrappedScene.visible.fog = bool;
            }
        };

        let treatPlanetsAsObjects = false;

        /**
         * Allows planets to be treated as objects
         * @param {Boolean} bool
         */
        this.treatPlanetsAsObjects = function(bool)
        {
            if (treatPlanetsAsObjects !== bool)
            {
                treatPlanetsAsObjects = bool;
                rebuildSceneObjects(self);
            }
        };

        /**
         * Force rebuilds the scene
         */
        this.rebuild = function()
        {
            rebuildSceneObjects(this);
        };

        /**
         * Internal helper function that rebuilds a list of object in the wrapped
         * scene with alread loaded objects from Scene.objects array.
         **/
        function rebuildSceneObjects(self)
        {
            if (!self.wrappedScene)
            {
                return;
            }
            self.wrappedScene.planets.splice(0);
            self.wrappedScene.objects.splice(0);
            for (var i = 0; i < self.objects.length; ++i)
            {
                for (var j = 0; j < self.objects[i].wrappedObjects.length; ++j)
                {
                    var wrapped = self.objects[i].wrappedObjects[j];
                    if (wrapped)
                    {
                        if (self.objects[i] instanceof Planet && !treatPlanetsAsObjects)
                        {
                            self.wrappedScene.planets.push(wrapped);
                        }
                        else
                        {
                            self.wrappedScene.objects.push(wrapped);
                        }
                    }
                }
            }
        }

        /**
         * Called when an EveSpaceScene is created or loaded.
         */
        function onSceneLoaded(self, obj)
        {
            self.wrappedScene = obj;
            if (self.sun)
            {
                obj.lensflares[0] = self.sun;
            }
            if (self.sunDirection)
            {
                obj.sunDirection.set(self.sunDirection);
            }
            if (self.sunLightColor)
            {
                obj.sunDiffuseColor.set(self.sunLightColor);
            }
            if (sceneClearColor)
            {
                vec4.copy(obj.clearColor, sceneClearColor);
            }

            obj.visible.environment = showEnvironment;
            obj.visible.fog = showFog;

            obj.EnableLod(lodSetting == ccpwgl.LodSettings.LOD_ENABLED);
            if (self.fog)
            {
                obj.fogStart = self.fog[0];
                obj.fogEnd = self.fog[1];
                obj.fogMax = self.fog[2];
                obj.fogColor.set(self.fog[3]);
            }
            rebuildSceneObjects(self);
        }

        /**
         * Creates a new empty scene.
         */
        this.create = function()
        {
            onSceneLoaded(this, new tw2.EveSpaceScene());
        };

        /**
         * Loads a scene from .red file.
         *
         * @param {string} resPath Res path to scene .red file
         * @param {!function(): void} onload Optional callback function that is called
         *   when scene .red file is loaded. this will point to Scene instance.
         */
        this.load = function(resPath, onload)
        {
            var self = this;
            ccpwgl.GetObject(
                resPath,
                function(obj)
                {
                    self.showFog(!ccpwgl.disableFogOnSceneLoaded);

                    onSceneLoaded(self, obj);

                    if (onload)
                    {
                        onload.call(self);
                    }
                });
        };

        /**
         * Check if scene's .red file is still loading.
         *
         * @returns {boolean} True if scene's .red file is loading; false otherwise.
         */
        this.isLoaded = function()
        {
            return this.wrappedScene != null;
        };

        /**
         * Loads a ship from .red file and adds it to scene's objects list.
         *
         * @param {string} resPath Res path to ship .red file
         * @param {!function(): void} [onload] Optional callback function that is called
         *   when ship .red file is loaded. this will point to Ship instance.
         * @returns {ccpwgl.Ship} A newly created ship instance.
         */
        this.loadShip = function(resPath, onload)
        {
            var self = this;

            var ship = new Ship(
                resPath,
                function()
                {
                    rebuildSceneObjects(self);
                    if (onload)
                    {
                        onload.call(this);
                    }
                });
            this.objects.push(ship);

            if (ship.wrappedObjects[0])
            {
                rebuildSceneObjects(this);
            }

            return ship;
        };

        /**
         * Loads a space object from .red file and adds it to scene's objects list.
         *
         * @param {string} resPath Res path to object .red file
         * @param {!function(): void} onload Optional callback function that is called
         *   when object .red file is loaded. this will point to SpaceObject instance.
         * @returns {ccpwgl.SpaceObject} A newly created object instance.
         */
        this.loadObject = function(resPath, onload)
        {
            var self = this;
            var object = new SpaceObject(
                resPath,
                function()
                {
                    rebuildSceneObjects(self);
                    if (onload)
                    {
                        onload.call(this);
                    }
                });
            this.objects.push(object);
            if (object.wrappedObjects[0])
            {
                rebuildSceneObjects(this);
            }
            return object;
        };

        /**
         * Adds previously loaded, but removed object back to the scene.
         *
         * @param {ccpwgl.SpaceObject} object Object to add.
         * @returns {ccpwgl.SpaceObject} Object added.
         */
        this.addObject = function(object)
        {
            this.objects.push(object);
            if (object.wrappedObjects[0])
            {
                rebuildSceneObjects(this);
            }
            return object;
        };

        /**
         * Creates a planet.
         *
         * @param {number} itemID           - the item id is used for randomization
         * @param {string} planetPath       - .red file for a planet, or planet template
         * @param {string} [atmospherePath] - optional .red file for a planet's atmosphere
         * @param {string} heightMap1       - planet's first height map
         * @param {string} heightMap2       - planet's second height map
         * @param {function} [onLoad]       - an optioanl callback which is fired when the planet has loaded
         * @returns {ccpwgl.Planet} A newly created planet instance.
         */
        this.loadPlanet = function(options, onLoad)
        {
            var object = new Planet(options, onLoad);
            this.objects.push(object);
            rebuildSceneObjects(this);
            return object;
        };

        /**
         * Returns object (ship or planet) at a specified index in scene's objects list.
         *
         * @thorws If index is out of bounds.
         * @param {number} index Object index.
         * @returns Object at specified index.
         */
        this.getObject = function(index)
        {
            if (index >= 0 && index < this.objects.length)
            {
                return this.objects[index];
            }
            throw new ReferenceError("object index out of bounds");
        };

        /**
         * Returns index of an object (ship or planet) in scene's objects list.
         *
         * @param object Object to search for.
         * @returns {number} Object index or -1 if the object is not found.
         */
        this.indexOf = function(object)
        {
            for (var i = 0; i < this.objects.length; ++i)
            {
                if (this.objects[i] === object)
                {
                    return i;
                }
            }
            return -1;
        };

        /**
         * Removes object at specified index from scene's objects list.
         *
         * @thorws If index is out of bounds.
         * @param {number} index Object index.
         */
        this.removeObject = function(index)
        {
            if (index >= this.objects.length)
            {
                throw new ReferenceError("object index out of bounds");
            }
            this.objects.splice(index, 1);
            rebuildSceneObjects(this);
        };

        /**
         * Loads a sun (a flare) into the scene. Due to some limitations of WebGL there
         * can only be once sun in the scene. It doesn't appear in scene's object list.
         *
         * @param {string} resPath Res path to sun's .red file
         * @param {!function(): void} onload Optional callback function that is called
         *   when sun .red file is loaded. this will point to Scene instance.
         */
        this.loadSun = function(resPath, onload)
        {
            var self = this;
            ccpwgl.GetObject(
                resPath,
                function(obj)
                {
                    console.dir(obj);
                    self.sun = obj;
                    if (self.wrappedScene)
                    {
                        self.wrappedScene.lensflares[0] = obj;
                    }
                    if (self.sunDirection)
                    {
                        vec3.negate(obj.position, self.sunDirection);
                    }
                    else if (self.wrappedScene)
                    {
                        vec3.negate(obj.position, self.wrappedScene.sunDirection);
                    }
                    if (onload)
                    {
                        onload.call(self);
                    }
                });
        };

        /**
         * Removes the sun (flare) from the scene.
         *
         * @throws If the scene doesn't have sun.
         */
        this.removeSun = function()
        {
            if (!this.sun)
            {
                throw new ReferenceError("scene does not have a Sun");
            }
            this.sun = null;
            if (this.wrappedScene)
            {
                this.wrappedScene.lensflares = [];
            }
        };

        /**
         * Sets new sun direction. This affects both lighting on objects and
         * sun (flare) position.
         *
         * @param {vec3} direction Sun direction.
         */
        this.setSunDirection = function(direction)
        {
            this.sunDirection = direction;
            if (this.wrappedScene)
            {
                this.wrappedScene.sunDirection.set(this.sunDirection);
            }
            if (this.sun)
            {
                vec3.negate(this.sun.position, direction);
            }
        };

        /**
         * Sets color for the sunlight. This affects lighting on objects.
         *
         * @param {vec3} color Sunlight color as RGB vector.
         */
        this.setSunLightColor = function(color)
        {
            this.sunLightColor = color;
            if (this.wrappedScene)
            {
                this.wrappedScene.sunDiffuseColor.set(this.sunLightColor);
            }
        };

        /**
         * Sets fog parameters. Fog effect helps depth perception. It does not
         * affect planets.
         *
         * @param {number} startDistance Distance at which fog starts to appear.
         * @param {number} endDistance Distance at which fog reaches its maxOpacity opacity.
         * @param {number} maxOpacity Maximum fog opacity from 0 to 1.
         * @param {vec3} color Fog color as RGB vector.
         */
        this.setFog = function(startDistance, endDistance, maxOpacity, color)
        {
            this.fog = [ startDistance, endDistance, maxOpacity, color ];
            if (this.wrappedScene)
            {
                this.wrappedScene.fogStart = startDistance;
                this.wrappedScene.fogEnd = endDistance;
                this.wrappedScene.fogMax = maxOpacity;
                this.wrappedScene.fogColor.set(color);
            }
        };

        /**
         * Returns current LOD setting.
         *
         * @returns {ccpwgl.LodSettings} Current LOD setting.
         */
        this.getLodSetting = function()
        {
            return lodSetting;
        };

        /**
         * Assigns new LOD setting.
         *
         * @param {ccpwgl.LodSettings} setting New LOD setting.
         */
        this.setLodSetting = function(setting)
        {
            lodSetting = setting;
            if (this.wrappedScene)
            {
                this.wrappedScene.EnableLod(lodSetting == ccpwgl.LodSettings.LOD_ENABLED);
            }
        };
    }

    /**
     * A basic perspective Camera
     * @param {HTMLCanvasElement|Element} element
     * @constructor
     */
    function Camera(element)
    {
        this.distance = 1;
        this.minDistance = -1;
        this.maxDistance = 1000000;
        this.fov = 60;
        this.rotationX = 0;
        this.rotationY = 0;
        this.poi = vec3.create();
        this.nearPlane = 1;
        this.farPlane = 0;

        this.onShift = null;
        this.shift = 0;
        this.shiftStage = 0;
        this._shiftX = null;

        this._dragX = 0;
        this._dragY = 0;
        this._lastRotationX = 0;
        this._lastRotationY = 0;
        this._rotationSpeedX = 0;
        this._rotationSpeedY = 0;
        this._measureRotation = null;
        this._moveEvent = null;
        this._upEvent = null;
        this._prevScale = null;

        this.additionalRotationX = 0;
        this.additionalRotationY = 0;

        var self = this;
        element.addEventListener("mousedown", function(event)
        {
            self._DragStart(event);
        }, false);
        element.addEventListener("touchstart", function(event)
        {
            self._DragStart(event);
        }, true);
        window.addEventListener("DOMMouseScroll", function(e)
        {
            return self._WheelHandler(e, element);
        }, false);
        window.addEventListener("mousewheel", function(e)
        {
            return self._WheelHandler(e, element);
        }, false);

        /**
         * Sets the cameras poi to an object, and adjusts the distance to suit
         *
         * @param {SpaceObject|Ship|Planet} obj
         * @param {number} [distanceMultiplier]
         * @param {number} [minDistance]
         * @param {boolean} [autoPlane] - Tries to fix near plane based on object's size
         * @returns {boolean}
         */
        this.focus = function(obj, distanceMultiplier, minDistance, autoPlane)
        {
            try
            {
                const radius = obj.getBoundingSphere()[1];
                obj.transform.GetWorldTranslation(this.poi);
                this.distance = Math.max(radius * (distanceMultiplier || 1.5), (minDistance || 0));
                if (autoPlane) this.nearPlane = Math.max(radius / 100, 0.1);
                return true;
            }
            catch (err)
            {
                return false;
            }
        };

        /**
         * Gets the camera's view matrix
         * @returns {mat4}
         */
        this.getView = function()
        {
            var view = mat4.create();
            mat4.identity(view);
            mat4.rotateY(view, view, -this.shift);
            mat4.translate(view, view, [ 0, 0.0, -this.distance ]);
            mat4.rotateX(view, view, this.rotationY + this.additionalRotationY);
            mat4.rotateY(view, view, this.rotationX + this.additionalRotationX);
            mat4.translate(view, view, [ -this.poi[0], -this.poi[1], -this.poi[2] ]);
            return view;
        };

        /**
         * Gets the cameras projection matrix
         * @param {number} aspect - The canvas's aspect ratio
         * @returns {mat4}
         */
        this.getProjection = function(aspect)
        {
            var fH = Math.tan(this.fov / 360 * Math.PI) * this.nearPlane;
            var fW = fH * aspect;
            return mat4.frustum(mat4.create(), -fW, fW, -fH, fH, this.nearPlane, this.farPlane > 0 ? this.farPlane : this.distance * 2);
        };

        /**
         * Per frame update
         * @param {number} dt - delta time
         */
        this.update = function(dt)
        {
            this.rotationX += this._rotationSpeedX * dt;
            this._rotationSpeedX *= 0.9;
            this.rotationY += this._rotationSpeedY * dt;
            this._rotationSpeedY *= 0.9;
            if (this.rotationY < -Math.PI / 2)
            {
                this.rotationY = -Math.PI / 2;
            }
            if (this.rotationY > Math.PI / 2)
            {
                this.rotationY = Math.PI / 2;
            }
            if (this.shiftStage === 2)
            {
                this.shift += this.shift * dt * 5;
                if (Math.abs(this.shift) > 2)
                {
                    this.onShift(1, this.shift > 0);
                    //this.shift = -this.shift;
                    //this._shiftOut = false;
                }
            }
            else if (this.shiftStage === 1)
            {
                this.shift -= this.shift * Math.min(dt, 0.5) * 2;
            }
        };

        /**
         * Drag start handler
         * @param event
         * @private
         */
        this._DragStart = function(event)
        {
            if (!event.touches && !this.onShift && event.button !== 0)
            {
                return;
            }
            if (this._moveEvent || this._upEvent)
            {
                return;
            }

            var self = this;
            if (this._moveEvent === null)
            {
                document.addEventListener("mousemove", this._moveEvent = function(event)
                {
                    self._DragMove(event);
                }, true);
                document.addEventListener("touchmove", this._moveEvent, true);
            }
            if (this._upEvent === null)
            {
                document.addEventListener("mouseup", this._upEvent = function(event)
                {
                    self._DragStop(event);
                }, true);
                document.addEventListener("touchend", this._upEvent, true);
            }
            event.preventDefault();
            if (event.touches)
            {
                event.screenX = event.touches[0].screenX;
                event.screenY = event.touches[0].screenY;
            }
            this._dragX = event.screenX;
            this._dragY = event.screenY;
            this._shiftX = null;
            this._rotationSpeedX = 0;
            this._lastRotationX = this.rotationX;
            this._rotationSpeedY = 0;
            this._lastRotationY = this.rotationY;
            this._measureRotation = setTimeout(function()
            {
                self._MeasureRotation();
            }, 500);
        };

        /**
         * Measures rotation
         * @private
         */
        this._MeasureRotation = function()
        {
            var self = this;
            this._lastRotationX = this.rotationX;
            this._lastRotationY = this.rotationY;
            this._measureRotation = setTimeout(function()
            {
                self._MeasureRotation();
            }, 500);
        };

        /**
         * Drag move handler
         * @param event
         * @private
         */
        this._DragMove = function(event)
        {
            var device = tw2.device;

            if (this.onShift && (event.touches && event.touches.length > 2 || !event.touches && event.button != 0))
            {
                this.shiftStage = 0;
                event.preventDefault();
                if (event.touches)
                {
                    event.screenX = 0;
                    event.screenY = 0;
                    for (var i = 0; i < event.touches.length; ++i)
                    {
                        event.screenX += event.touches[i].screenX;
                        event.screenY += event.touches[i].screenY;
                    }
                    event.screenX /= event.touches.length;
                    event.screenY /= event.touches.length;
                }
                if (this._shiftX !== null)
                {
                    this.shift += (event.screenX - this._shiftX) / device.viewportWidth * 2;
                }
                this._shiftX = event.screenX;
                return;
            }
            this._shiftX = null;
            if (event.touches)
            {
                if (event.touches.length > 1)
                {
                    event.preventDefault();
                    var dx = event.touches[0].screenX - event.touches[1].screenX;
                    var dy = event.touches[0].screenY - event.touches[1].screenY;
                    var scale = Math.sqrt(dx * dx + dy * dy);
                    if (this._prevScale != null)
                    {
                        var delta = (this._prevScale - scale) * 0.03;
                        this.distance = this.distance + delta * this.distance * 0.1;
                        if (this.distance < this.minDistance)
                        {
                            this.distance = this.minDistance;
                        }
                        if (this.distance > this.maxDistance)
                        {
                            this.distance = this.maxDistance;
                        }
                    }
                    this._prevScale = scale;
                    return;
                }
                event.screenX = event.touches[0].screenX;
                event.screenY = event.touches[0].screenY;
            }
            if (typeof (event.screenX) !== "undefined")
            {
                var dRotation = -(this._dragX - event.screenX) * 0.01;
                this.rotationX += dRotation;
                this._dragX = event.screenX;
                dRotation = -(this._dragY - event.screenY) * 0.01;
                this.rotationY += dRotation;
                this._dragY = event.screenY;
                if (this.rotationY < -Math.PI / 2)
                {
                    this.rotationY = -Math.PI / 2;
                }
                if (this.rotationY > Math.PI / 2)
                {
                    this.rotationY = Math.PI / 2;
                }
            }
        };

        /**
         * Drag stop handler
         * @param event
         * @private
         */
        this._DragStop = function(event)
        {
            clearTimeout(this._measureRotation);
            document.removeEventListener("mousemove", this._moveEvent, true);
            document.removeEventListener("mouseup", this._upEvent, true);
            document.removeEventListener("touchmove", this._moveEvent, true);
            document.removeEventListener("touchend", this._upEvent, true);
            this._moveEvent = null;
            this._upEvent = null;
            var dRotation = this.rotationX - this._lastRotationX;
            this._rotationSpeedX = dRotation * 0.5;
            dRotation = this.rotationY - this._lastRotationY;
            this._rotationSpeedY = dRotation * 0.5;
            this._prevScale = null;
            if (this.onShift)
            {
                if (Math.abs(this.shift) > 0.5)
                {
                    this.shiftStage = 2;
                    this.onShift(0, this.shift > 0);
                }
                else
                {
                    this.shiftStage = 1;
                }
            }
        };

        /**
         * Mouse wheel handler
         * @param event
         * @param element
         * @returns {boolean}
         * @private
         */
        this._WheelHandler = function(event, element)
        {
            var delta = 0;
            if (!event) /* For IE. */
                event = window.event;
            var source = null;
            if (event.srcElement)
            {
                source = event.srcElement;
            }
            else
            {
                source = event.target;
            }
            if (source !== element)
            {
                return false;
            }
            if (event.wheelDelta)
            { /* IE/Opera. */
                delta = event.wheelDelta / 120;
                /** In Opera 9, delta differs in sign as compared to IE.
                 */
                if (window.opera)
                    delta = -delta;
            }
            else if (event.detail)
            { /** Mozilla case. */
                /** In Mozilla, sign of delta is different than in IE.
                 * Also, delta is multiple of 3.
                 */
                delta = -event.detail / 3;
            }
            /** If delta is nonzero, handle it.
             * Basically, delta is now positive if wheel was scrolled up,
             * and negative, if wheel was scrolled down.
             */
            if (delta)
            {
                this.distance = this.distance + delta * this.distance * 0.1;
                if (this.distance < this.minDistance)
                {
                    this.distance = this.minDistance;
                }
            }
            /** Prevent default actions caused by mouse wheel.
             * That might be ugly, but we handle scrolls somehow
             * anyway, so don't bother here..
             */
            if (event.preventDefault)
                event.preventDefault();
            event.returnValue = false;
            return false;
        };
    }

    /**
     * Creates a camera
     * @param {*} [options]
     * @returns {Camera}
     */
    ccpwgl.createCamera = function(options = {})
    {
        var get = tw2.util.get;

        var camera = new Camera(get(options, "canvas", ccpwgl.canvas));
        camera.fov = get(options, "fov", 30);
        camera.distance = get(options, "distance", 1000);
        camera.maxDistance = get(options, "maxDistance", 1000000);
        camera.minDistance = get(options, "minDistance", 0.6);
        camera.rotationX = get(options, "rotationX", 0);
        camera.rotationY = get(options, "rotationY", 0);
        vec3.copy(camera.poi, get(options, "poi", [ 0, 0, 0 ]));
        camera.nearPlane = get(options, "nearPlane", 1);
        camera.farPlane = get(options, "farPlane", 1000000);
        camera.minPitch = get(options, "minPitch", -0.5);
        camera.maxPitch = get(options, "maxPitch", 0.35);

        if (get(options, "current", true))
        {
            ccpwgl.setCamera(camera);
        }

        return camera;
    };

    /**
     * Sets the active scene from a previously loaded scene
     * @param {Scene} newScene
     */
    ccpwgl.setScene = function(newScene)
    {
        scene = newScene;
    };

    /**
     * Gets the active scene
     * @returns {Scene}
     */
    ccpwgl.getScene = function()
    {
        return scene;
    };

    /**
     * Loads a new scene from .red file and makes it the current scene (the one that
     * will be automatically updated rendered into the canvas).
     *
     * @param {string} resPath Res path to scene's .red file
     * @param {!function(): void} [onload] Optional callback function that is called
     *   when scene .red file is loaded. this will point to Scene instance.
     * @returns {ccpwgl.Scene} Newly constructed scene.
     */
    ccpwgl.loadScene = function(resPath, onload)
    {
        scene = new Scene();
        scene.load(resPath, onload);
        return scene;
    };

    /**
     * Creates a new empty scene. The scene will not have background nebula and will
     * use a solid color to fill the background.
     *
     * @param {string|float[]} background Scene background color as RGBA vector or background cubemap res path.
     * @returns {ccpwgl.Scene} Newly constructed scene.
     */
    ccpwgl.createScene = function(background)
    {
        scene = new Scene();

        if (background && typeof background !== "string")
        {
            scene.setClearColor(background);
        }

        if (background && typeof background == "string")
        {
            ccpwgl.GetObject("res:/dx9/scene/starfield/starfieldNebula.red", function(obj)
            {
                scene.wrappedScene.backgroundEffect = obj;
                if ("NebulaMap" in obj.parameters)
                {
                    obj.parameters["NebulaMap"].resourcePath = background;
                    obj.parameters["NebulaMap"].Initialize();
                }
            });
        }
        scene.create();
        return scene;
    };

    /**
     * Checks if assets are still loading.
     *
     * @returns {boolean} True if any assets are still loading; false otherwise.
     */
    ccpwgl.isLoading = function()
    {
        return tw2.resMan.IsLoading();
    };

    /**
     * Returns a count of how many resources are still loading.
     *
     * @returns {number} Pending resource loads
     */
    ccpwgl.getPendingLoads = function()
    {
        return tw2.resMan._pendingLoads;
    };

    /**
     * Enable/disable scene per-frame updates.
     *
     * @param {boolean} enable If true scene update and update callbacks are called
     *   every frame.
     */
    ccpwgl.enableUpdate = function(enable)
    {
        updateEnabled = enable;
    };

    /**
     * Enable/disable scene rendering.
     *
     * @param {boolean} enable If true scene is rendered into the canvas.
     */
    ccpwgl.enableRendering = function(enable)
    {
        renderingEnabled = enable;
    };

    /**
     * Returns current resource unload policy.
     *
     * @returns {ccpwgl.ResourceUnloadPolicy} Current resource unload policy.
     */
    ccpwgl.getResourceUnloadPolicy = function()
    {
        return resourceUnloadPolicy;
    };

    /**
     * Assigns new resource unload policy.
     *
     * @param {ccpwgl.ResourceUnloadPolicy} policy New resource unload policy.
     * @param {number} timeout Optional timeout value (in seconds) when resource is unloaded
     *   from memomy if the policy is set to ccpwgl.ResourceUnloadPolicy.USAGE_BASED.
     */
    ccpwgl.setResourceUnloadPolicy = function(policy, timeout)
    {
        resourceUnloadPolicy = policy;
        tw2.resMan.autoPurgeResources = policy == ccpwgl.ResourceUnloadPolicy.USAGE_BASED;
        if (timeout != undefined)
        {
            tw2.resMan.purgeTime = timeout;
        }
    };

    /**
     * Manually clears resource cache.
     */
    ccpwgl.clearCachedResources = function()
    {
        tw2.resMan.Clear();
    };

    /**
     * Test scene
     * @param {*} options
     * @returns {Promise<WrappedScene>}
     */
    ccpwgl.loadWrappedScene = async function(options)
    {
        return await tw2.Scene.create(options, ccpwgl);
    };

    return ccpwgl;

}(tw2 || window));
