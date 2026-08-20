const LEGACY_OPENGL_LIGHTS = Object.freeze([
    Object.freeze({
        name: "front",
        color: Object.freeze([ 4.4, 4.4, 4.4, 1 ]),
        position: Object.freeze([ 0, 135, 190 ]),
        radius: 300,
        falloff: 1
    }),
    Object.freeze({
        name: "left",
        color: Object.freeze([ 2.15, 2.15, 2.15, 1 ]),
        position: Object.freeze([ -190, 115, 0 ]),
        radius: 280,
        falloff: 1
    }),
    Object.freeze({
        name: "right",
        color: Object.freeze([ 2.15, 2.15, 2.15, 1 ]),
        position: Object.freeze([ 190, 115, 0 ]),
        radius: 280,
        falloff: 1
    }),
    Object.freeze({
        name: "back",
        color: Object.freeze([ 4.8, 4.8, 4.8, 1 ]),
        position: Object.freeze([ 0, 150, -200 ]),
        radius: 320,
        falloff: 1
    })
]);

/**
 * Initializes the demo's one shared client, scene, camera, and light rig.
 * Character appearance managers attach independently to the returned scene;
 * they never initialize or replace scene-owned state.
 *
 * @param {Object} options Demo scene options.
 * @param {Object} options.client Shared Tny client.
 * @param {Object} options.tw2 Shared ccpwgl facade.
 * @param {String} options.resourceRoot Exact-build resource root.
 * @param {Number} [options.cameraDistance=3.2] Initial orbit distance.
 * @param {Number[]} [options.clearColor] Normalized scene clear colour.
 * @param {String} [options.canvas="character-canvas"] Canvas identity.
 * @returns {Promise<{client:Object,scene:Object,camera:Object}>} Shared scene state.
 */
export async function InitializeCharacterDemoScene({
    client,
    tw2,
    resourceRoot,
    cameraDistance = 3.2,
    clearColor = [ 0.035, 0.055, 0.08, 1 ],
    canvas = "character-canvas"
} = {})
{
    ValidateOptions({ client, tw2, resourceRoot, cameraDistance, clearColor, canvas });

    const Scene = RequireClass(client, tw2, "TnyCharacterScene");
    const Camera = RequireClass(client, tw2, "TnyCameraTest");
    const LightSource = RequireClass(client, tw2, "Tr2InteriorLightSource");
    const scene = new Scene();
    const camera = new Camera({
        type: "testOrbit",
        canvas,
        controller: true,
        poi: [ 0, 1.05, 0 ],
        distance: cameraDistance,
        minDistance: 0.5,
        maxDistance: 20,
        fov: 40,
        nearPlane: 0.05,
        farPlane: 200
    });

    for (const values of LEGACY_OPENGL_LIGHTS)
    {
        const light = new LightSource();
        light.SetValues?.({
            name: `character_${values.name}`,
            primaryLighting: true,
            position: [ ...values.position ],
            color: [ ...values.color ],
            radius: values.radius,
            falloff: values.falloff
        });
        scene.AddLight(light);
    }

    scene.wrapped?.SetValues?.({
        visible: { fog: false, environment: false },
        sunDirection: [ 0, -1, 1 ],
        ambientColor: [ 0.08, 0.08, 0.09, 1 ],
        clearColor
    });
    scene.Initialize?.();

    await client.Initialize({
        canvas,
        debug: false,
        device: { webgl2: false },
        client: {
            clearColor,
            colorMask: [ 0, 0, 0, 0 ]
        },
        paths: {
            res: resourceRoot,
            cdn: resourceRoot,
            local: resourceRoot,
            _cache: resourceRoot,
            cache: resourceRoot
        },
        pathAliases: {
            cdn: "res",
            local: "res"
        },
        scene,
        camera
    });

    return { client, scene, camera };
}

function ValidateOptions({ client, tw2, resourceRoot, cameraDistance, clearColor, canvas })
{
    if (!client || typeof client.Initialize !== "function")
    {
        throw new TypeError("Character demo scene requires a Tny-compatible client");
    }
    if (!tw2 || typeof tw2.GetClass !== "function")
    {
        throw new TypeError("Character demo scene requires the ccpwgl facade");
    }
    if (!String(resourceRoot ?? "").trim())
    {
        throw new TypeError("Character demo scene requires a resource root");
    }
    if (!Number.isFinite(cameraDistance) || cameraDistance < 0.5 || cameraDistance > 20)
    {
        throw new TypeError("Character demo cameraDistance must be between 0.5 and 20");
    }
    if (!Array.isArray(clearColor)
        || clearColor.length !== 4
        || clearColor.some(value => !Number.isFinite(value) || value < 0 || value > 1))
    {
        throw new TypeError("Character demo clearColor must be four normalized values");
    }
    if (!String(canvas ?? "").trim())
    {
        throw new TypeError("Character demo scene requires a canvas identity");
    }
}

function RequireClass(client, tw2, name)
{
    let Constructor = null;
    try
    {
        Constructor = client.GetClass?.(name) ?? null;
    }
    catch
    {
        // Optional character constructors may be installed only on tw2 in
        // an older local bundle.
    }
    Constructor ||= tw2.GetClass?.(name) ?? tw2[name];
    if (typeof Constructor !== "function")
    {
        throw new Error(`The ccpwgl runtime does not register ${name}`);
    }
    return Constructor;
}
