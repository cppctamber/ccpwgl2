const status = document.getElementById("status");

setStatus("initializing");

window.__carbonAgentEvents = [];
window.__carbonAgentReady = bootCarbonAgent().catch(error =>
{
    setStatus(`error: ${error.message}`);
    window.__carbonAgentEvents.push({
        type: "boot-error",
        message: error.message,
        stack: error.stack
    });
    throw error;
});

/**
 * Boots the smallest useful ccpwgl scene for Carbon shader tests.
 *
 * @returns {Promise<object>} Boot result.
 */
async function bootCarbonAgent()
{
    const tw2 = window.tw2 || window.CCPWGL;
    const tiny = window.tiny;

    if (!tw2 || !tiny)
    {
        throw new Error("ccpwgl2_int.js did not expose window.tw2/window.tiny");
    }

    window.tw2 = tw2;
    window.tiny = tiny;

    const query = new URLSearchParams(window.location.search);
    const localPath = query.get("localPath") || "http://127.0.0.1:3000/ccpwgl";
    const debug = query.get("debug") === "true";
    const clearColor = parseColor(query.get("clearColor"), [0.35, 0.18, 0.95, 1]);
    const focusDistance = Number(query.get("focusDistance") || 0);
    const focusBoundsMultiplier = Number(query.get("focusBoundsMultiplier") || 2);
    window.CarbonShaderDebug = {
        forceBlendIndexZero: query.get("forceBlendIndexZero") === "true"
    };

    tw2.SetPath("local", localPath);
    tw2.Tw2Effect.UNPACKED_TEXTURES = true;

    await tiny.Initialize({
        debug,
        canvas3d: document.getElementById("canvas3d"),
        canvas2d: document.getElementById("canvas2d"),
        device: {
            webgl2: true
        },
        resMan: {
            systemMirror: true
        },
        glParams: {
            alpha: true,
            depth: true,
            stencil: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true
        },
        camera: {
            cameraType: "testOrbit",
            farPlane: 1000000,
            nearPlane: 1,
            fov: 50,
            controller: false
        },
        clearColor,
        scene: clearColor
    });

    tiny.scene.cameras.push(tiny.camera);
    tiny.scene.wrapped.clearColor.set(clearColor);
    tiny.scene.wrapped.visible.fog = false;
    if (tiny.scene.wrapped.visible.environment !== undefined)
    {
        tiny.scene.wrapped.visible.environment = query.get("environment") === "true";
    }

    window.o = tiny.scene.objects;
    window.w = tiny.scene.wrapped.objects;

    const carbon = await import(`./index.js?v=${Date.now()}`);
    carbon.RegisterCarbonShaders(tw2);
    window.carbon = carbon;

    window.agentLoadCarbonDNA = async function agentLoadCarbonDNA(dna, options = {})
    {
        setStatus(`loading ${dna}`);
        const result = options.replace === false
            ? await fetchDNAWithoutCarbonReplacement(dna, {
                clear: options.clear !== false,
                disableEffectChildren: options.disableEffectChildren !== false
            })
            : await carbon.fetchDNA(dna, {
                clear: options.clear !== false,
                disableEffectChildren: options.disableEffectChildren !== false,
                log: options.log === true
            });

        const ship = result.ship || result.wrapped?.wrapped || window.w?.[window.w.length - 1];
        if (ship)
        {
            const wrapped = result.wrapped || tiny.scene.objects.find(item => item.wrapped === ship);
            if (wrapped && (tiny.camera?.SetFocus || tiny.camera?.Focus))
            {
                const focus = resolveFocus(ship, {
                    explicitDistance: options.focusDistance || focusDistance,
                    boundsMultiplier: options.focusBoundsMultiplier || focusBoundsMultiplier
                });
                if (tiny.camera.SetFocus)
                {
                    tiny.camera.SetFocus(focus.center, focus.distance);
                }
                else
                {
                    tiny.camera.Focus(wrapped, focus.distance);
                }
                tiny.camera.UpdateValues?.();
                tiny.camera.Update?.(0);
                tiny.camera.wrapped?.Update?.(0);
            }
        }

        setStatus(`loaded ${dna}`);
        return result;
    };

    window.agentCarbonReport = function agentCarbonReport(value)
    {
        return carbon.createAgentReport(value || window.w?.[window.w.length - 1]);
    };

    setStatus("ready");
    return { tw2, tiny, carbon };
}

/**
 * Resolves a camera focus center and distance from explicit values or hull bounds.
 *
 * @param {object} ship EveShip2-like object.
 * @param {object} options Focus options.
 * @param {number} options.explicitDistance Explicit world-unit distance.
 * @param {number} options.boundsMultiplier Bounding sphere multiplier.
 * @returns {{center:number[],distance:number}} Focus center and distance.
 */
function resolveFocus(ship, options)
{
    const center = [
        Number(ship?.boundingSphereCenter?.[0] || 0),
        Number(ship?.boundingSphereCenter?.[1] || 0),
        Number(ship?.boundingSphereCenter?.[2] || 0)
    ];

    if (Number.isFinite(options.explicitDistance) && options.explicitDistance > 0)
    {
        return { center, distance: options.explicitDistance };
    }

    if (ship?.RebuildBounds)
    {
        ship.RebuildBounds(true);
    }

    const radius = Number(ship?.boundingSphereRadius || ship?.mesh?.geometryResource?.boundsSphereRadius || 0);
    if (Number.isFinite(radius) && radius > 0)
    {
        return {
            center,
            distance: radius * (Number.isFinite(options.boundsMultiplier) && options.boundsMultiplier > 0 ? options.boundsMultiplier : 2)
        };
    }

    return { center, distance: 1500 };
}

/**
 * Fetches a DNA without replacing its shaders.
 *
 * @param {string} dna SOF DNA.
 * @param {object} options Load options.
 * @returns {Promise<object>} Report-compatible result.
 */
async function fetchDNAWithoutCarbonReplacement(dna, options = {})
{
    if (options.clear && window.tiny?.scene?.RemoveAllObjects)
    {
        window.tiny.scene.RemoveAllObjects(true, true);
        if (Array.isArray(window.w)) window.w.length = 0;
    }

    const restore = setSofEffectChildrenEnabled(options.disableEffectChildren !== false);
    let wrapped;
    try
    {
        wrapped = await window.tiny.scene.FetchShip(dna);
    }
    finally
    {
        restore();
    }

    const ship = wrapped?.wrapped?.mesh ? wrapped.wrapped : wrapped?.mesh ? wrapped : window.w?.[window.w.length - 1];
    return { ship, wrapped, dna, results: [] };
}

/**
 * Temporarily toggles SOF child effect generation.
 *
 * @param {boolean} disabled True to disable child effects.
 * @returns {Function} Restore function.
 */
function setSofEffectChildrenEnabled(disabled)
{
    const sof = window.tw2?.eveSof;
    if (!sof || !Object.prototype.hasOwnProperty.call(sof, "enableChildren")) return () => {};
    const previous = sof.enableChildren;
    sof.enableChildren = !disabled;
    return () =>
    {
        sof.enableChildren = previous;
    };
}

/**
 * Sets the status text.
 *
 * @param {string} text Status text.
 */
function setStatus(text)
{
    if (status) status.textContent = text;
}

/**
 * Parses a comma-separated RGBA color.
 *
 * @param {string|null} value Query value.
 * @param {number[]} fallback Fallback color.
 * @returns {number[]} RGBA color.
 */
function parseColor(value, fallback)
{
    if (!value) return fallback;
    const parts = value.split(",").map(Number);
    if (parts.length < 3 || parts.some(item => !Number.isFinite(item))) return fallback;
    return [
        parts[0],
        parts[1],
        parts[2],
        parts[3] === undefined ? 1 : parts[3]
    ];
}
