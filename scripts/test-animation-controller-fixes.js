/**
 * Four defects in Tw2AnimationController that only show up once something has
 * more than one of a thing. Each test fails against the code as it was.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");
const { mat3, mat4, quat, vec3 } = require("gl-matrix");


const { Tw2AnimationController } = loadAnimationController();

testRootBonesAreNotNaN();
testChildBonesComposeOntoTheirParent();
testFindModelForMeshReachesLaterBindings();
testAnimationsAttachToTheMatchingIndex();
console.log("Animation controller index and composition fixes verified");


/**
 * `mat4.set` takes sixteen values, not a matrix. Called with one it wrote the
 * matrix object into element 0 and undefined into the other fifteen, so every
 * root bone left this function as sixteen NaNs.
 */
function testRootBonesAreNotNaN()
{
    const controller = makeController([ makeBone("Root", -1, 10) ]);
    controller.ResetBoneTransforms();

    const world = controller.models[0].bones[0].worldTransform;
    assert.equal(Array.from(world).some(Number.isNaN), false, "a root bone's world transform is not NaN");
    assert.deepEqual(Array.from(world.slice(12, 15)), [ 10, 0, 0 ], "it is the bone's local transform");
}

/**
 * `child * parent` in row-vector terms is `multiply(out, parent, local)` with
 * stock gl-matrix. This site had the operands reversed; `Update` at :707 does
 * not. Two translations compose the same either way, so the parent carries a
 * rotation.
 */
function testChildBonesComposeOntoTheirParent()
{
    const root = makeBone("Root", -1, 10);
    quat.setAxisAngle(root.boneRes.orientation, [ 0, 0, 1 ], Math.PI / 2);
    mat4.fromRotationTranslation(root.boneRes.localTransform, root.boneRes.orientation, [ 10, 0, 0 ]);

    const controller = makeController([ root, makeBone("Child", 0, 5) ]);
    controller.ResetBoneTransforms();

    const world = controller.models[0].bones[1].worldTransform;
    assert.deepEqual(
        Array.from(world.slice(12, 15)).map(round),
        [ 10, 5, 0 ],
        "the child's local +5x lands at +5y through its parent's quarter turn"
    );
}

/**
 * The inner loop incremented the outer index, so it walked `models` instead of
 * that model's mesh bindings. It returned the right answer only when the match
 * was the first binding, which is every single-model ship.
 */
function testFindModelForMeshReachesLaterBindings()
{
    const controller = makeController([ makeBone("Root", -1) ]);
    const wanted = { name: "Mesh1" };

    controller.geometryResources = [ {
        meshes: [ { name: "Mesh0" }, wanted ],
        IsGood() { return true; }
    } ];
    controller.models[0].modelRes = {
        meshBindings: [ { mesh: { name: "Other" } }, { mesh: wanted } ]
    };

    assert.equal(
        controller.FindModelForMesh(1),
        controller.models[0],
        "a match in the second binding is found"
    );
}

/**
 * The match was tested on one index and taken on another. The two lists stay
 * aligned while there is a single geometry resource, which is why this survived
 * on ships; a second resource pulls them apart.
 */
function testAnimationsAttachToTheMatchingIndex()
{
    const controller = makeController([ makeBone("Root", -1) ]);
    controller.models[0].modelRes = { name: "Rig" };
    controller.models[0].bones[0].boneRes.name = "Root";

    const animationRes = {
        name: "Target",
        trackGroups: [ { name: "Rig", transformTracks: [ { name: "Root" } ], curves: [] } ]
    };

    // `Other` is only here to push `Target` off index 0 — the state a second
    // geometry resource leaves behind.
    const other = { name: "Other", animationRes: { name: "Other", trackGroups: [] }, trackGroups: [] };
    const target = { name: "Target", animationRes, trackGroups: [] };
    controller.animations.push(other, target);

    Tw2AnimationController.AddAnimationsFromRes(controller, { animations: [ animationRes ] });

    assert.equal(controller.animations.length, 2, "the existing animation is reused, not duplicated");
    assert.equal(other.trackGroups.length, 0, "the wrong animation is left alone");
    assert.equal(target.trackGroups.length, 1, "the track group lands on the matching animation");
}


function round(value)
{
    const rounded = Math.round(value * 1e6) / 1e6;
    return rounded === 0 ? 0 : rounded;
}

function makeBone(name, parentIndex, x = 0)
{
    return {
        boneRes: {
            name,
            parentIndex,
            position: vec3.fromValues(x, 0, 0),
            orientation: quat.create(),
            scaleShear: mat3.create(),
            localTransform: mat4.fromTranslation(mat4.create(), [ x, 0, 0 ]),
            worldTransform: mat4.create(),
            worldTransformInv: mat4.create()
        },
        localTransform: mat4.create(),
        worldTransform: mat4.create(),
        offsetTransform: mat4.create(),
        bindingArrays: []
    };
}

function makeController(bones)
{
    const controller = new Tw2AnimationController();
    controller.models.push({ modelRes: { meshBindings: [] }, bones });
    return controller;
}

function loadAnimationController()
{
    const passthrough = class {};

    return loadModule(
        "../src/core/model/Tw2AnimationController.js",
        {
            utils: { meta: makeMeta(), toArray: value => Array.isArray(value) ? value : [ value ] },
            math: {
                vec3,
                quat,
                mat3,
                mat4: withCcpwglMat4Extensions(),
                box3: { create: () => new Float32Array(6), empty: value => value },
                curve: { evaluate: () => undefined }
            },
            "../resource": { Tw2GeometryRes: passthrough },
            "./Tw2Animation": { Tw2Animation: class { constructor() { this.trackGroups = []; } } },
            "./Tw2Bone": { Tw2Bone: passthrough },
            "./Tw2BoneBinding": { Tw2BoneBinding: passthrough },
            "./Tw2Model": { Tw2Model: passthrough },
            "./Tw2Track": { Tw2Track: passthrough },
            "./Tw2TrackGroup": { Tw2TrackGroup: class { constructor() { this.transformTracks = []; } } },
            "./Tw2MeshBinding": { Tw2MeshBinding: passthrough }
        }
    );
}

/** ccpwgl's mat4 is stock gl-matrix plus a few additions (`src/global/math/mat4.js`). */
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
        wgl: { define: () => value => value },
        todo: () => value => value,
        notImplemented: property,
        struct: () => property,
        list: () => property,
        string: property,
        path: property,
        boolean: property,
        uint: property,
        float: property,
        plain: property,
        matrix4: property,
        quaternion: property,
        vector3: property,
        isPrivate: property
    };
}
