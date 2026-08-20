import assert from "node:assert/strict";
import test from "node:test";

import { InitializeCharacterDemoScene } from "../src/demo/CharacterDemoScene.mjs";

test("character demo initializes one shared scene, camera, and light rig", async () =>
{
    class CharacterScene
    {
        lights = [];

        wrapped = {
            SetValues: values =>
            {
                this.sceneValues = values;
            }
        };

        AddLight(light)
        {
            this.lights.push(light);
        }

        Initialize()
        {
            this.initialized = true;
            for (const light of this.lights) light.Initialize?.();
        }
    }

    class Camera
    {
        constructor(values)
        {
            this.values = values;
        }
    }

    class Light
    {
        SetValues(values)
        {
            this.values = values;
        }

        Initialize()
        {
            this.initialized = true;
        }
    }

    const classes = {
        TnyCameraTest: Camera,
        TnyCharacterScene: CharacterScene,
        Tr2InteriorLightSource: Light
    };
    const client = {
        GetClass: name => classes[name] ?? null,
        async Initialize(options)
        {
            this.initializeCalls = (this.initializeCalls ?? 0) + 1;
            this.initializeOptions = options;
            this.scene = options.scene;
            this.camera = options.camera;
        }
    };
    const tw2 = {
        GetClass: name => classes[name] ?? null
    };

    const result = await InitializeCharacterDemoScene({
        client,
        tw2,
        resourceRoot: "http://127.0.0.1:5510/eve/3453885/resources",
        cameraDistance: 0.8,
        clearColor: [ 0.05, 1, 0, 1 ]
    });

    assert.equal(client.initializeCalls, 1);
    assert.equal(result.scene, client.scene);
    assert.equal(result.camera, client.camera);
    assert.equal(client.scene.initialized, true);
    assert.equal(client.camera.values.distance, 0.8);
    assert.deepEqual(client.initializeOptions.client.clearColor, [ 0.05, 1, 0, 1 ]);
    assert.equal(
        client.initializeOptions.paths.res,
        "http://127.0.0.1:5510/eve/3453885/resources"
    );
    assert.deepEqual(client.scene.sceneValues.clearColor, [ 0.05, 1, 0, 1 ]);
    assert.deepEqual(client.scene.lights.map(light => light.values.name), [
        "character_front",
        "character_left",
        "character_right",
        "character_back"
    ]);
    assert.equal(client.scene.lights.every(light => light.initialized), true);
});
