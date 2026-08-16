const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");
const { mat4, quat } = require("gl-matrix");

// Rounds away float noise, and -0 with it, so identity compares as identity.
const round = value =>
{
    const rounded = Math.round(value * 1e6) / 1e6;
    return rounded === 0 ? 0 : rounded;
};


const { Tr2GrannyAnimation } = loadGrannyAnimation();

testMeshBindingOrderIsLoadBearing();
testRebuildIsOncePerResource();
testRestPoseAndPaletteLayout();
testUnmappedBonesAreIdentity();
console.log("Granny mesh-bound animation verified");


/**
 * `SetUseMeshBinding` must precede `SetSharedGeometryRes`, because attaching an
 * already-prepared resource dispatches its notification synchronously and the
 * rebuild reads the flag.
 */
function testMeshBindingOrderIsLoadBearing()
{
    const wrongOrder = new Tr2GrannyAnimation();
    wrongOrder.SetSharedGeometryRes(makeResource());
    wrongOrder.SetUseMeshBinding(true);
    assert.equal(wrongOrder.GetBoneCount(0), 0, "a warm resource attached before the flag does not bind");

    const rightOrder = new Tr2GrannyAnimation();
    rightOrder.SetUseMeshBinding(true);
    rightOrder.SetSharedGeometryRes(makeResource());
    assert.equal(rightOrder.GetBoneCount(0), 2);
}

function testRebuildIsOncePerResource()
{
    const res = makeResource();
    const updater = new Tr2GrannyAnimation();
    updater.SetUseMeshBinding(true);
    updater.SetSharedGeometryRes(res);

    const built = updater._bones;
    assert.equal(res.registered.length, 1);
    assert.equal(updater.RebuildCachedData(), true);
    assert.equal(updater._bones, built, "a repeat notification does not rebuild");

    updater.OnResPrepared(makeResource());
    assert.equal(updater._bones, built, "another resource's notification is ignored");

    const second = makeResource();
    updater.SetSharedGeometryRes(second);
    assert.notEqual(updater._bones, built, "a new resource rebuilds");
    assert.equal(res.unregistered.length, 1, "the old resource is released");
}

/**
 * At rest the skin matrix is `invBind * world` where `world` is the bind pose,
 * so every palette entry is the transposed identity. Posing one bone away from
 * its bind pose proves the composition and the 12-float layout.
 */
function testRestPoseAndPaletteLayout()
{
    const res = makeResource();
    const updater = new Tr2GrannyAnimation();
    updater.SetUseMeshBinding(true);
    updater.SetSharedGeometryRes(res);

    const palette = updater.GetBoneMatrices(0);
    assert.equal(palette.length, 2 * 12, "12 floats per mesh bone");
    assert.deepEqual(
        Array.from(palette).map(round),
        [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0
        ],
        "the rest pose is the bind pose, so every skin matrix is identity"
    );

    // Push the child 5 along x in its local frame. World is `child * parent` in
    // row-vector terms, so the child ends at its parent's 10 plus 5 — and the
    // skin matrix, `invBind * world`, carries the 5 the bone moved.
    updater._bones[1].boneRes.localTransform[12] = 5;
    updater.ResetBoneTransforms();
    updater.UpdateBoneMatrices();

    // Root is rotated a quarter turn about z, so the child's local +5x lands at
    // +5y in world space. A reversed composition would put it at 15x — which is
    // why the parent carries a rotation and not just a translation.
    assert.deepEqual(
        Array.from(updater._bones[1].worldTransform.slice(12, 15)).map(round),
        [ 10, 5, 0 ],
        "world transform composes child onto parent"
    );

    const posed = updater.GetBoneMatrices(0);
    assert.deepEqual(
        Array.from(posed.slice(0, 12)).map(round),
        [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0 ],
        "the untouched Root bone stays at identity"
    );
    // Palette order follows the mesh's bone bindings, so Child is the second
    // entry. Translation lands in the fourth column of each row of the
    // transposed 4x3.
    // The skin matrix is `invBind * world`, so its translation is the distance
    // the bone moved in the bind pose's *world* frame — the local +5x shows up
    // as +5y, because the parent turned the child's frame a quarter turn.
    assert.equal(round(posed[12 + 3]), 0, "row 0 is the x component of the world-space delta");
    assert.equal(round(posed[12 + 7]), 5, "row 1 carries the y the bone moved");
    assert.equal(round(posed[12 + 11]), 0);
}

/**
 * The reader resolves mesh bone bindings by name and substitutes a fallback
 * rather than leaving a hole, so an unmapped bone should not occur — but a bone
 * that is not in the skeleton must still produce identity rather than NaN.
 */
function testUnmappedBonesAreIdentity()
{
    const res = makeResource();
    const stranger = makeBone("Stranger", -1);
    res.models[0].meshBindings[0].bones.push(stranger);

    const updater = new Tr2GrannyAnimation();
    updater.SetUseMeshBinding(true);
    updater.SetSharedGeometryRes(res);

    assert.equal(updater.GetBoneCount(0), 3);
    assert.equal(updater._palettes.get(0).indices[2], -1);

    const palette = updater.GetBoneMatrices(0);
    assert.deepEqual(
        Array.from(palette.slice(24)),
        [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0 ],
        "an unmapped bone is identity, not uninitialised"
    );
    assert.equal(palette.some(Number.isNaN), false);
}


function makeBone(name, parentIndex, x = 0)
{
    const localTransform = mat4.fromTranslation(mat4.create(), [ x, 0, 0 ]);
    return {
        name,
        parentIndex,
        localTransform,
        worldTransform: mat4.create(),
        worldTransformInv: mat4.create()
    };
}

/**
 * Two bones, `Root` and a child 10 along x, bound to a single mesh. Bind-pose
 * world transforms and their inverses are filled in the way `Gr2Reader` does.
 */
function makeResource()
{
    const bones = [ makeBone("Root", -1, 10), makeBone("Child", 0, 0) ];

    // A quarter turn about z on the parent, so that composition order is
    // observable — with pure translations both orders give the same answer.
    mat4.fromRotationTranslation(bones[0].localTransform, quat.setAxisAngle(quat.create(), [ 0, 0, 1 ], Math.PI / 2), [ 10, 0, 0 ]);

    for (const bone of bones)
    {
        if (bone.parentIndex !== -1)
        {
            mat4.multiply(bone.worldTransform, bones[bone.parentIndex].worldTransform, bone.localTransform);
        }
        else
        {
            mat4.copy(bone.worldTransform, bone.localTransform);
        }
        mat4.invert(bone.worldTransformInv, bone.worldTransform);
    }

    const mesh = { name: "Mesh", boneBindings: bones.map(bone => bone.name) };

    return {
        meshes: [ mesh ],
        models: [ {
            name: "Root",
            skeleton: { bones },
            meshBindings: [ { mesh, bones: bones.slice() } ]
        } ],
        animations: [],
        registered: [],
        unregistered: [],
        IsGood() { return true; },
        KeepAlive() {},
        RegisterNotification(target)
        {
            this.registered.push(target);
            // Tw2Resource dispatches immediately for a prepared resource
            target.OnResPrepared(this);
        },
        UnregisterNotification(target) { this.unregistered.push(target); }
    };
}

function loadGrannyAnimation()
{
    return loadModule(
        "../src/unsupported/core/animation/Tr2GrannyAnimation.js",
        {
            utils: { meta: makeMeta() },
            math: { mat4 }
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
    new Function("require", "module", "exports", output.code)(id =>
    {
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
        notImplemented: property,
        struct: () => property,
        string: property,
        path: property
    };
}
