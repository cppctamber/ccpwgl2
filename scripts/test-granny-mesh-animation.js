const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");
const { mat3, mat4, quat, vec3 } = require("gl-matrix");

// Rounds away float noise, and -0 with it, so identity compares as identity.
const closeTo = (actual, expected, message) =>
    assert.ok(Math.abs(actual - expected) < 1e-5, `${message} (${actual} vs ${expected})`);

const round = value =>
{
    const rounded = Math.round(value * 1e6) / 1e6;
    return rounded === 0 ? 0 : rounded;
};


const { Tr2GrannyAnimation } = loadGrannyAnimation();
const { EveChildMesh } = loadChildMesh();

testMeshBindingOrderIsLoadBearing();
testRebuildIsOncePerResource();
testRestPoseAndPaletteLayout();
testUnmappedBonesAreIdentity();
testChildMeshBindsOnUpdate();
testChildMeshOverridesTheParentPalette();
testPlaybackMovesTheBoneAndThePalette();
testPlaybackQueuesUntilTheGeometryArrives();
testCyclingAndEnding();
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


/**
 * The resource is fetched asynchronously, so the child mesh cannot bind at
 * construction — it binds on the first tick the resource is good.
 */
function testChildMeshBindsOnUpdate()
{
    const child = new EveChildMesh();
    child.animationUpdater = new Tr2GrannyAnimation();
    child.mesh = { meshIndex: 0, geometryResource: null };

    child.Update(0, mat4.create(), {});
    assert.equal(child.animationUpdater.GetBoneCount(0), 0, "nothing to bind to yet");

    child.mesh.geometryResource = makeResource();
    child.Update(0, mat4.create(), {});
    assert.equal(child.animationUpdater.GetBoneCount(0), 2);
    assert.equal(child.animationUpdater._useMeshBinding, true);

    const bones = child.animationUpdater._bones;
    child.Update(0, mat4.create(), {});
    assert.equal(child.animationUpdater._bones, bones, "a bound resource is not rebound every tick");

    // An updater with a resPath loads its own geometry, which is not ported.
    const withPath = new EveChildMesh();
    withPath.animationUpdater = new Tr2GrannyAnimation();
    withPath.animationUpdater.resPath_ = "res:/some/clip.gr2";
    withPath.mesh = { meshIndex: 0, geometryResource: makeResource() };
    withPath.Update(0, mat4.create(), {});
    assert.equal(withPath.animationUpdater.GetBoneCount(0), 0, "the resPath case is left alone");

    // Carbon gates stepping on updateAnimation.
    const disabled = new EveChildMesh();
    disabled.animationUpdater = new Tr2GrannyAnimation();
    disabled.updateAnimation = false;
    disabled.mesh = { meshIndex: 0, geometryResource: makeResource() };
    disabled.Update(0, mat4.create(), {});
    assert.equal(disabled.animationUpdater.GetBoneCount(0), 0, "updateAnimation gates the step");
}

/**
 * A child mesh with its own skeleton must send its own palette. Inheriting the
 * parent's means indexing the parent's bones with this mesh's bindings.
 */
function testChildMeshOverridesTheParentPalette()
{
    const parentPalette = new Float32Array(24).fill(9);

    const withoutUpdater = new EveChildMesh();
    const inherited = withoutUpdater.GetPerObjectDataBagOfStuff({ jointMatrices: parentPalette });
    assert.equal(inherited.jointMatrices, parentPalette, "without an updater the parent's palette stands");

    const child = new EveChildMesh();
    child.animationUpdater = new Tr2GrannyAnimation();
    child.mesh = { meshIndex: 0, geometryResource: makeResource() };
    child.Update(0, mat4.create(), {});

    const bag = child.GetPerObjectDataBagOfStuff({ jointMatrices: parentPalette });
    assert.notEqual(bag.jointMatrices, parentPalette, "the parent's palette is replaced");
    assert.equal(bag.jointMatrices, child.animationUpdater.GetBoneMatrices(0));
    assert.equal(bag.jointCount, 2, "the count travels with the palette");
}

/**
 * A clip only matters if it reaches the palette. `Child` slides 0 to 10 over two
 * seconds, so at one second it is halfway — and the skin matrix carries it into
 * the bind pose's world frame, where the parent's quarter turn puts it on y.
 */
function testPlaybackMovesTheBoneAndThePalette()
{
    const updater = new Tr2GrannyAnimation();
    updater.SetUseMeshBinding(true);
    updater.SetSharedGeometryRes(makeResource());

    assert.deepEqual(updater.GetAnimations().map(a => a.name), [ "NormalLoop" ]);
    assert.equal(updater.PlayAnimation("NoSuchClip"), false, "an unknown clip is refused");
    assert.equal(updater.IsPlaying(), false);

    assert.equal(updater.PlayAnimation("NormalLoop", { cycle: true }), true);
    assert.equal(updater.IsPlaying(), true);

    // Nothing has advanced yet, so the palette is still the rest pose.
    assert.equal(round(updater.GetBoneMatrices(0)[12 + 7]), 0);

    updater.Update(1);
    assert.deepEqual(
        Array.from(updater._bones[1].localTransform.slice(12, 15)).map(round),
        [ 5, 0, 0 ],
        "the sampled position lands in the bone's local transform"
    );
    closeTo(updater.GetBoneMatrices(0)[12 + 7], 5, "and reaches the palette");

    // Bones the clip does not carry a track for stay at rest rather than drift.
    assert.deepEqual(
        Array.from(updater.GetBoneMatrices(0).slice(0, 12)).map(round),
        [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0 ],
        "an untracked bone is untouched"
    );
}

/**
 * The container's state machine starts on its owner's first update, which is
 * routinely before the geometry has loaded. A clip asked for then has to survive
 * rather than be dropped.
 */
function testPlaybackQueuesUntilTheGeometryArrives()
{
    const updater = new Tr2GrannyAnimation();
    updater.SetUseMeshBinding(true);

    assert.equal(updater.PlayAnimation("NormalLoop", { cycle: true }), false, "nothing to play from yet");
    assert.equal(updater.IsPlaying(), false);

    updater.SetSharedGeometryRes(makeResource());
    assert.equal(updater.IsPlaying(), true, "the queued clip starts once the geometry is good");

    updater.Update(1);
    closeTo(updater.GetBoneMatrices(0)[12 + 7], 5);
}

function testCyclingAndEnding()
{
    const cycling = new Tr2GrannyAnimation();
    cycling.SetUseMeshBinding(true);
    cycling.SetSharedGeometryRes(makeResource());
    cycling.PlayAnimation("NormalLoop", { cycle: true });

    cycling.Update(3);
    assert.equal(round(cycling._player.time), 1, "a cycling clip wraps rather than clamping");
    assert.equal(cycling.IsPlaying(), true);

    const once = new Tr2GrannyAnimation();
    once.SetUseMeshBinding(true);
    once.SetSharedGeometryRes(makeResource());

    let ended = null;
    once.PlayAnimation("NormalLoop", { callback: (updater, name) => { ended = name; } });
    once.Update(3);

    assert.equal(once.IsPlaying(), false, "a one-shot clip stops at its duration");
    assert.equal(ended, "NormalLoop", "and fires its callback once");
    closeTo(once.GetBoneMatrices(0)[12 + 7], 10, "holding the last frame rather than snapping to rest");

    once.Update(1);
    closeTo(once.GetBoneMatrices(0)[12 + 7], 10, "a stopped clip no longer advances");

    // Stopping leaves the pose where it stopped, which is what Carbon does.
    const stopped = new Tr2GrannyAnimation();
    stopped.SetUseMeshBinding(true);
    stopped.SetSharedGeometryRes(makeResource());
    stopped.PlayAnimation("NormalLoop", { cycle: true });
    stopped.Update(1);
    assert.equal(stopped.StopAnimation("Other"), false, "a different clip name does not stop it");
    assert.equal(stopped.StopAnimation("NormalLoop"), true);
    stopped.Update(1);
    closeTo(stopped.GetBoneMatrices(0)[12 + 7], 5, "the pose holds where it stopped");
}

function makeBone(name, parentIndex, x = 0)
{
    return {
        name,
        parentIndex,
        // The reader carries both the decomposed rest pose and the matrix it
        // composes to; sampling reads the first, the rest pose reads the second.
        position: vec3.fromValues(x, 0, 0),
        orientation: quat.create(),
        scaleShear: mat3.create(),
        localTransform: mat4.fromTranslation(mat4.create(), [ x, 0, 0 ]),
        worldTransform: mat4.create(),
        worldTransformInv: mat4.create()
    };
}

/**
 * One clip, `NormalLoop`, two seconds long, sliding `Child` from its rest
 * position out to 10 along x.
 */
function makeAnimation(model)
{
    return {
        name: "NormalLoop",
        duration: 2,
        trackGroups: [ {
            name: model.name,
            model,
            transformTracks: [ {
                name: "Child",
                position: { degree: 1, dimension: 3, knots: [ 0, 2 ], controls: [ 0, 0, 0, 10, 0, 0 ] },
                orientation: null,
                scaleShear: null
            } ]
        } ]
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
    quat.setAxisAngle(bones[0].orientation, [ 0, 0, 1 ], Math.PI / 2);
    mat4.fromRotationTranslation(bones[0].localTransform, bones[0].orientation, [ 10, 0, 0 ]);

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
    const model = {
        name: "Root",
        skeleton: { bones },
        meshBindings: [ { mesh, bones: bones.slice() } ]
    };

    return {
        meshes: [ mesh ],
        models: [ model ],
        animations: [ makeAnimation(model) ],
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
            math: { mat3, mat4: withCcpwglMat4Extensions(), quat, vec3 },
            // The real sampler, not a stub — the point is the curve behaviour.
            "core/geometry/sampleDegreeOneCurve.js": loadModule("../src/core/geometry/sampleDegreeOneCurve.js", {})
        }
    );
}

function loadChildMesh()
{
    class EveChild
    {
        boneIndex = -1;
        _lod = 3;
        static GetJointMatrices(parentData) { return parentData ? parentData.jointMatrices : null; }
        static perObjectData = {};
    }

    class GLESPerObjectDataEveSpaceObject
    {
        // The real Unpack copies the parent's values into the bag, the parent's
        // bone palette among them.
        static Unpack(perObjectData, out)
        {
            Object.assign(out, perObjectData);
            return out;
        }
        static Pack() {}
    }

    return loadModule(
        "../src/eve/child/EveChildMesh.js",
        {
            utils: { meta: makeMeta() },
            math: { vec3, quat, mat4 },
            core: { GLESPerObjectDataEveSpaceObject, Tw2PerObjectData: class {} },
            "./EveChild": { EveChild }
        }
    );
}

/**
 * ccpwgl's `mat4` is stock gl-matrix plus a handful of additions; `fromMat3` is
 * one of them (`src/global/math/mat4.js:149`).
 */
function withCcpwglMat4Extensions()
{
    return Object.assign(Object.create(mat4), {
        fromMat3(out, m)
        {
            out[0] = m[0]; out[1] = m[1]; out[2] = m[2];
            out[4] = m[3]; out[5] = m[4]; out[6] = m[5];
            out[8] = m[6]; out[9] = m[7]; out[10] = m[8];
            out[3] = out[7] = out[11] = out[12] = out[13] = out[14] = 0;
            out[15] = 1;
            return out;
        }
    });
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
        define: () => value => value,
        notImplemented: property,
        struct: () => property,
        list: () => property,
        string: property,
        path: property,
        boolean: property,
        uint: property,
        float: property,
        matrix4: property,
        quaternion: property,
        vector3: property
    };
}
