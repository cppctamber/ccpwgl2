const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");


class Tw2Mesh
{
    constructor()
    {
        this.name = "";
        this.display = true;
        this.geometryResPath = "";
        this.geometryResource = null;
        this.meshIndex = 0;
        this.maxVertexScale = 0;
        this.maxVertexDisplacement = 0;
        this.rotatesVertices = false;
        this.visible = {};
        for (const property of [
            "additiveAreas", "decalAreas", "depthAreas", "depthNormalAreas",
            "distortionAreas", "opaqueAreas", "opaquePrepassAreas",
            "pickableAreas", "transparentAreas"
        ])
        {
            this[property] = [];
        }
    }

    Initialize() {}

    GetResources(out = [])
    {
        if (this.geometryResource && !out.includes(this.geometryResource))
        {
            out.push(this.geometryResource);
        }
        return out;
    }
}


const meta = MakeMeta();
const { Tw2CharacterMesh } = LoadModule(
    "../src/interior/character/Tw2CharacterMesh.js",
    { utils: { meta }, core: { Tw2Mesh } }
);


TestIndependentCharacterState();
TestLegacyPromotionDoesNotMutateTw2Mesh();
TestSkinnedModelConstructsCharacterMeshes();
console.log("Character mesh compatibility boundary verified");


function TestIndependentCharacterState()
{
    const source = Geometry("res:/shared.gr2", [ "Smile", "Blink", "Smile" ]);
    const realizationA = Geometry("character:a", []);
    const realizationB = Geometry("character:b", []);
    const first = new Tw2CharacterMesh();
    const second = new Tw2CharacterMesh();

    first.SetCharacterGeometryResource(source, realizationA);
    second.SetCharacterGeometryResource(source, realizationB);

    assert.equal(first.GetCharacterSourceGeometryResource(), source);
    assert.equal(second.GetCharacterSourceGeometryResource(), source);
    assert.equal(first.geometryResource, realizationA);
    assert.equal(second.geometryResource, realizationB);
    assert.equal(first.HasPrivateGeometryRealization(), true);
    assert.deepEqual(first.GetMorphTargetNames(), [ "Smile", "Blink" ]);

    assert.equal(first.SetMorphTargetWeight("Smile", 0.75), true);
    assert.equal(first.GetMorphTargetWeight("Smile"), 0.75);
    assert.equal(second.GetMorphTargetWeight("Smile"), 0);
    assert.equal(first.SetMorphTargetWeight("Unknown", 1), false);
    assert.throws(
        () => first.SetMorphTargetWeight("Blink", Number.NaN),
        /must be finite/
    );

    const detached = first.GetMorphAnimations();
    detached.get("Smile").weight = 99;
    assert.equal(first.GetMorphTargetWeight("Smile"), 0.75);
    assert.deepEqual(first.GetResources(), [ realizationA, source ]);
}


function TestLegacyPromotionDoesNotMutateTw2Mesh()
{
    const source = Geometry("res:/legacy.gr2", [ "Pinch" ]);
    const legacy = new Tw2Mesh();
    const opaqueArea = { name: "opaque" };
    legacy.name = "legacy";
    legacy.meshIndex = 0;
    legacy.geometryResPath = source.path;
    legacy.geometryResource = source;
    legacy.opaqueAreas.push(opaqueArea);
    legacy.visible = { opaqueAreas: false };

    const promoted = Tw2CharacterMesh.FromTw2Mesh(legacy);

    assert.ok(promoted instanceof Tw2CharacterMesh);
    assert.notEqual(promoted, legacy);
    assert.equal(Object.getPrototypeOf(legacy), Tw2Mesh.prototype);
    assert.equal(legacy.geometryResource, source);
    assert.equal(promoted.geometryResource, source);
    assert.equal(promoted.opaqueAreas, legacy.opaqueAreas, "authored effects are retained");
    assert.notEqual(promoted.visible, legacy.visible, "mutable visibility is instance-owned");
    assert.equal(promoted.SetMorphTargetWeight("Pinch", 0.25), true);
    assert.equal(legacy.GetMorphTargetWeight, undefined);
}


function TestSkinnedModelConstructsCharacterMeshes()
{
    const { Tr2SkinnedModel } = LoadModule(
        "../src/interior/character/Tr2SkinnedModel.js",
        {
            utils: { meta, perArrayChild() {} },
            global: { tw2: { GetResource: () => null } },
            math: {
                box3: {
                    create: () => [], empty() {}, union() {}, copy() {}
                },
                sph3: { fromBox3() {} }
            },
            core: {
                Tw2Effect: { from: () => ({}) },
                Tw2MeshArea: class {}
            },
            "./Tw2CharacterMesh": { Tw2CharacterMesh }
        }
    );

    const model = new Tr2SkinnedModel();
    assert.ok(model.EnsureMesh() instanceof Tw2CharacterMesh);

    const legacy = new Tw2Mesh();
    legacy.geometryResource = Geometry("res:/configured.gr2", []);
    model.meshes = [ legacy ];
    model.Initialize();
    assert.ok(model.meshes[0] instanceof Tw2CharacterMesh);
    assert.equal(Object.getPrototypeOf(legacy), Tw2Mesh.prototype);

    const part = Tr2SkinnedModel.CreateRenderPartMesh(model.meshes[0], 1);
    assert.ok(part instanceof Tw2CharacterMesh);
    assert.equal(part.meshIndex, 1);
    assert.equal(part.GetCharacterSourceGeometryResource(), legacy.geometryResource);
}


function Geometry(pathname, morphNames)
{
    return {
        path: pathname,
        meshes: [ {
            blendShapes: morphNames.map(sourceName => ({ sourceName }))
        } ]
    };
}


function LoadModule(relativePath, modules)
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
    new Function("require", "module", "exports", output.code)(id =>
    {
        if (id in modules) return modules[id];
        throw new Error(`Unexpected dependency in ${relativePath}: ${id}`);
    }, module, module.exports);
    return module.exports;
}


function MakeMeta()
{
    const property = () => undefined;
    const classDecorator = () => value => value;
    return {
        Model: class {},
        type: classDecorator,
        define: classDecorator,
        wgl: { define: classDecorator },
        ccp: { define: classDecorator },
        struct: () => property,
        list: () => property,
        string: property,
        path: property,
        boolean: property,
        uint: property,
        float: property,
        isPrivate: property
    };
}
