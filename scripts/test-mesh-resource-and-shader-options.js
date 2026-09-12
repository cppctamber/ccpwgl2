/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const parser = require("@babel/parser");

// Exercise the actual method bodies with resource/render boundaries supplied by
// the test. No browser or GPU is needed for ownership and dispatch semantics.
function method(file, className, name, context = {})
{
    const filename = path.resolve(__dirname, "../src", file);
    const source = fs.readFileSync(filename, "utf8");
    const ast = parser.parse(source, {
        sourceType: "module",
        plugins: [ "decorators-legacy", "classProperties" ]
    });
    const declaration = ast.program.body.map(node => node.declaration || node)
        .find(node => node.type === "ClassDeclaration" && node.id.name === className);
    const member = declaration.body.body.find(node => node.key.name === name);
    assert.ok(member, `${className}.${name} exists`);
    const code = source.slice(member.start, member.end).replace(/^static\s+/, "");
    return vm.runInNewContext(`({ ${code} }).${name}`, context, { filename });
}

async function testResourceClear()
{
    let complete;
    const pending = new Promise(resolve => { complete = resolve; });
    const fetch = method("core/mesh/Tw2Mesh.js", "Tw2Mesh", "HandleFetch", {
        tw2: { Fetch: () => pending }
    });
    let detached;
    const resource = { UnregisterNotification: owner => { detached = owner; } };
    const owner = { geometryResPath: "res:/old.gr2", geometryResource: resource };
    assert.equal(await fetch(owner, "geometryResPath", "geometryResource", ""), true);
    assert.equal(detached, owner, "unregister the owner, not the constructor");
    assert.equal(owner.geometryResPath, "");
    assert.equal(owner.geometryResource, null);
    assert.equal(await fetch(owner, "geometryResPath", "geometryResource", ""), false);

    owner.geometryResource = resource;
    assert.equal(await fetch(owner, "geometryResPath", "geometryResource", ""), true,
        "a resource-only state still reports a change");

    const loading = fetch(owner, "geometryResPath", "geometryResource", "res:/pending.gr2");
    assert.equal(await fetch(owner, "geometryResPath", "geometryResource", ""), true);
    complete(resource);
    assert.equal(await loading, false, "a cancelled fetch cannot attach its resource");
    assert.equal(owner.geometryResource, null);
    assert.equal(owner.geometryResPath, "");
}

function testInstancedDecals()
{
    const constants = Object.fromEntries([
        "RM_ADDITIVE", "RM_DECAL", "RM_DISTORTION", "RM_OPAQUE", "RM_NORMAL",
        "RM_TRANSPARENT", "RM_PICKABLE", "RM_DEPTH"
    ].map((name, i) => [ name, i ]));
    const getBatches = method("core/mesh/Tw2InstancedMesh.js", "Tw2InstancedMesh", "GetBatches", constants);
    const decals = [ { name: "decal" } ], opaque = [ { name: "opaque" } ];
    let submitted;
    const mesh = {
        display: true, IsGood: () => true,
        visible: { decalAreas: true, opaqueAreas: true },
        decalAreas: decals, opaqueAreas: opaque,
        constructor: { GetAreaBatches: (owner, areas) => { submitted = areas; return true; } }
    };
    assert.equal(getBatches.call(mesh, constants.RM_DECAL, {}, {}), true);
    assert.equal(submitted, decals);
    getBatches.call(mesh, constants.RM_OPAQUE, {}, {});
    assert.equal(submitted, opaque);
    mesh.visible.decalAreas = false;
    assert.equal(getBatches.call(mesh, constants.RM_DECAL, {}, {}), false);
}

function testShaderOptions()
{
    const setOption = method("core/mesh/Tw2Effect.js", "Tw2Effect", "SetOption");
    const effects = [];
    function effect()
    {
        const item = { options: {}, rebinds: 0, SetOption: setOption,
            Rebind() { this.rebinds++; } };
        effects.push(item);
        return item;
    }
    const meshSet = method("core/mesh/Tw2Mesh.js", "Tw2Mesh", "SetShaderOption");
    const mesh = { SetShaderOption: meshSet };
    for (const list of [ "additiveAreas", "decalAreas", "depthAreas", "depthNormalAreas",
        "distortionAreas", "opaqueAreas", "opaquePrepassAreas", "pickableAreas", "transparentAreas" ])
    {
        mesh[list] = [ { effect: effect() }, { effect: null } ];
    }
    const overlay = {
        display: false,
        SetShaderOption: method("eve/effect/EveMeshOverlayEffect.js", "EveMeshOverlayEffect", "SetShaderOption")
    };
    for (const list of [ "opaqueEffects", "decalEffects", "transparentEffects", "additiveEffects", "distortionEffects" ])
    {
        overlay[list] = [ effect() ];
    }
    const picking = { SetOption() { assert.fail("decal picking material must be unchanged"); } };
    const decal = { decalEffect: effect(), pickEffect: picking,
        SetShaderOption: method("eve/item/EveSpaceObjectDecal.js", "EveSpaceObjectDecal", "SetShaderOption") };
    const attachments = [ "EvePlaneSet", "EveSpriteSet", "EveSpotlightSet" ].map(name => ({
        SetShaderOption: method(`eve/item/${name}.js`, name, "SetShaderOption"),
        ...(name === "EveSpotlightSet" ? { coneEffect: effect(), glowEffect: effect() } : { effect: effect() })
    }));
    const child = { mesh, overlayEffects: [ overlay ], decals: [ decal ], attachments,
        SetShaderOption: method("eve/child/EveChildMesh.js", "EveChildMesh", "SetShaderOption") };
    const container = { objects: [ child ], display: false,
        SetShaderOption: method("eve/child/EveChildContainer.js", "EveChildContainer", "SetShaderOption") };
    const instances = { GetInstances: () => [ container ],
        SetShaderOption: method("eve/child/EveChildInstanceContainer.js", "EveChildInstanceContainer", "SetShaderOption") };
    const root = { effectChildren: [ instances ],
        SetShaderOption: method("eve/object/EveEffectRoot2.js", "EveEffectRoot2", "SetShaderOption") };
    const start = method("state/action/Tr2ActionSetShaderOption.js", "Tr2ActionSetShaderOption", "Start", {
        GetOwner: (controller, owner) => owner, GetCandidates: owner => [ owner ]
    });
    const action = { key: "BLEND_MODE", value: "ADDITIVE" };
    assert.equal(start.call(action, null, root), true);
    assert.equal(start.call(action, null, root), true, "an unchanged option is still handled");
    for (const item of effects)
    {
        assert.equal(item.options.BLEND_MODE, "ADDITIVE", "options reach unloaded and hidden effects");
        assert.equal(item.rebinds, 1, "repeat values do not rebind");
    }
    const instanceMeshSet = method("core/mesh/Tw2InstancedMesh.js", "Tw2InstancedMesh", "SetShaderOption", {
        Tw2Mesh: { prototype: { SetShaderOption: meshSet } }
    });
    delete mesh.opaquePrepassAreas;
    instanceMeshSet.call(mesh, "BLEND_MODE", "OPAQUE");
    assert.equal(mesh.decalAreas[0].effect.options.BLEND_MODE, "OPAQUE");
}

async function main()
{
    await testResourceClear();
    testInstancedDecals();
    testShaderOptions();
    console.log("Mesh resource clearing, decal selection and shader-option propagation verified");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
