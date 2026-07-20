const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");
const { mat3, mat4, quat, vec3 } = require("gl-matrix");


const { Tr2InteriorAnimationController } = loadInteriorController();
const { Tr2InteriorBoneOffset } = loadBoneOffset();

testLoadCompletionAndLateResources();
testAnimationDedupeUsesMatchingIndex();
testBoneRotationPreservesTranslation();
console.log("Interior animation lifecycle and bone offsets verified");

function testLoadCompletionAndLateResources()
{
    const rebuilds = new Map();
    Tr2InteriorAnimationController.DoRebuildCachedData = (controller, resource) => {
        rebuilds.set(resource, (rebuilds.get(resource) || 0) + 1);
        for (const name of resource.animationNames || [])
        {
            if (!controller.GetAnimation(name)) controller.animations.push(makeAnimation(name));
        }
    };

    const controller = new Tr2InteriorAnimationController();
    const first = makeResource([ "Idle" ], true);
    const second = makeResource([ "Wave" ], true);
    const order = [];
    controller.SetGeometryResource(first);
    controller.AddGeometryResource(second);
    controller._pendingCommands.push({ func() { order.push("plain"); } });
    controller._pendingCommands.push({ func(value) { order.push(value); }, args: [ "args" ] });

    assert.equal(controller.RebuildCachedData(), true);
    assert.equal(controller._isLoaded, true);
    assert.deepEqual(order, [ "plain", "args" ]);
    assert.equal(controller._pendingCommands.length, 0);
    assert.equal(controller.events.filter(event => event.name === "loaded").length, 1);
    assert.equal(rebuilds.get(first), 1);
    assert.equal(rebuilds.get(second), 1);

    controller.RebuildCachedData();
    assert.equal(rebuilds.get(first), 1, "completed resources are not rebound");
    assert.equal(controller.events.filter(event => event.name === "loaded").length, 1);

    const late = makeResource([ "Late" ], false);
    controller.AddGeometryResource(late);
    assert.equal(controller._isLoaded, false);
    assert.equal(controller.PlayAnimation("Late", { amount: 0.5 }), null);
    assert.equal(controller._pendingCommands.length, 1, "missing late clip is queued while loading");

    late.good = true;
    assert.equal(controller.RebuildCachedData(), true);
    assert.equal(rebuilds.get(first), 1, "late resources do not duplicate old bindings");
    assert.equal(rebuilds.get(second), 1, "late resources do not duplicate old bindings");
    assert.equal(rebuilds.get(late), 1);
    assert.equal(controller.GetAnimation("Late").played, true);
    assert.equal(controller._pendingCommands.length, 0);
    assert.equal(controller.events.filter(event => event.name === "loaded").length, 2);

    assert.equal(controller.PlayAnimation("Unknown", {}), null);
    assert.equal(controller._pendingCommands.length, 0, "unknown clips do not requeue after loading");
}

function testAnimationDedupeUsesMatchingIndex()
{
    const controller = new Tr2InteriorAnimationController();
    const other = makeAnimation("Other");
    const animationRes = {
        name: "Target",
        trackGroups: [ {
            name: "Rig",
            transformTracks: [ { name: "Root" } ]
        } ]
    };
    const target = makeAnimation("Target");
    target.animationRes = animationRes;
    controller.animations.push(other, target);
    controller.models.push({
        modelRes: { name: "Rig" },
        bones: [ { boneRes: { name: "Root" } } ]
    });

    Tr2InteriorAnimationController.AddAnimationsFromRes(controller, { animations: [ animationRes ] });
    assert.equal(controller.animations.length, 2);
    assert.equal(other.trackGroups.length, 0);
    assert.equal(target.trackGroups.length, 1, "track group attaches to the matching animation index");
    assert.equal(target.trackGroups[0].transformTracks.length, 1);
}

function testBoneRotationPreservesTranslation()
{
    const offset = new Tr2InteriorBoneOffset();
    const halfAngle = Math.PI / 4;
    offset.SetRotation("Root", 0, 0, Math.sin(halfAngle), Math.cos(halfAngle));

    const bone = {
        boneRes: { name: "Root" },
        localTransform: mat4.fromTranslation(mat4.create(), [ 2, 3, 4 ])
    };
    const model = { bones: [ bone ] };
    assert.equal(offset.ApplyToBone(bone, 0, model), true);
    assert.deepEqual(
        Array.from(bone.localTransform.slice(12, 15)),
        [ 2, 3, 4 ],
        "local rotation offsets must not orbit the joint translation"
    );
}

function loadInteriorController()
{
    class Tw2AnimationController
    {
        constructor()
        {
            this.geometryResources = [];
            this.models = [];
            this.animations = [];
            this.meshBindings = [];
            this._pendingCommands = [];
            this._isLoaded = false;
            this.events = [];
        }

        SetGeometryResource(resource)
        {
            this.geometryResources = resource ? [ resource ] : [];
            this.models = [];
            this.animations = [];
            this.meshBindings = [];
            this._isLoaded = false;
            if (resource?.RegisterNotification) resource.RegisterNotification(this);
        }

        AddGeometryResource(resource)
        {
            if (!this.geometryResources.includes(resource))
            {
                this.geometryResources.push(resource);
                if (resource?.RegisterNotification) resource.RegisterNotification(this);
            }
        }

        GetAnimation(name) { return this.animations.find(animation => animation.name === name) || null; }
        PlayAnimation(name)
        {
            const animation = this.GetAnimation(name);
            if (animation) animation.played = true;
            return animation;
        }
        EmitEvent(name, data) { this.events.push({ name, data }); }
        ResolveTrackMask() { return null; }
        Update() {}
        static AddModel() {}
        static FindMeshBindings() { return null; }
    }

    class Tw2Animation
    {
        constructor()
        {
            this.trackGroups = [];
        }
    }
    class Tw2Track { }
    class Tw2TrackGroup
    {
        constructor()
        {
            this.transformTracks = [];
        }
    }
    class Binding
    {
        constructor()
        {
            this.bones = [];
            this.meshIndex = [];
        }
    }

    return loadModule(
        "../src/interior/character/Tr2InteriorAnimationController.js",
        {
            utils: { meta: makeMeta() },
            math: { curve: {}, mat3, mat4, quat },
            core: {
                Tw2Animation,
                Tw2AnimationController,
                Tw2BoneBinding: Binding,
                Tw2GeometryMeshBinding: Binding,
                Tw2MeshBinding: Binding,
                Tw2Track,
                Tw2TrackGroup
            },
            "./Tr2InteriorBoneOffset": { Tr2InteriorBoneOffset: class {} },
            "./Tr2InteriorAdditiveAnimation": {
                composeInteriorAdditivePose() {},
                getInteriorMaskWeight() { return 0; },
                sampleInteriorDegreeOneCurve() {}
            }
        }
    );
}

function loadBoneOffset()
{
    return loadModule(
        "../src/interior/character/Tr2InteriorBoneOffset.js",
        {
            utils: { meta: makeMeta() },
            math: { mat4, quat, vec3 }
        }
    );
}

function loadModule(relativePath, modules)
{
    const filename = path.resolve(__dirname, relativePath);
    const output = transformSync(fs.readFileSync(filename, "utf8"), {
        babelrc: false,
        configFile: false,
        filename,
        plugins: [
            [ require("@babel/plugin-proposal-decorators"), { legacy: true } ],
            [ require("@babel/plugin-proposal-class-properties"), { loose: true } ],
            require("@babel/plugin-transform-modules-commonjs")
        ]
    });
    const module = { exports: {} };
    new Function("require", "module", "exports", output.code)(id => {
        if (id in modules) return modules[id];
        throw new Error(`Unexpected dependency in ${relativePath}: ${id}`);
    }, module, module.exports);
    return module.exports;
}

function makeMeta()
{
    const property = () => undefined;
    return {
        Model: class {},
        type: () => value => value,
        ccp: { define: () => value => value },
        struct: () => property,
        boolean: property,
        plain: property
    };
}

function makeAnimation(name)
{
    return {
        name,
        animationRes: { name, trackGroups: [] },
        trackGroups: [],
        weight: 1,
        trackMaskName: ""
    };
}

function makeResource(animationNames, good)
{
    return {
        animationNames,
        good,
        IsGood() { return this.good; },
        RegisterNotification() {},
        UnregisterNotification() {}
    };
}
