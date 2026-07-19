/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const babel = require("@babel/core");
const glMatrix = require("gl-matrix");


const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "src/eve/item/EveTurretSet.js");
const EveTurretSet = loadTurretSet(fs.readFileSync(sourcePath, "utf8"));
const { mat4, vec3 } = glMatrix;

const turretSet = new EveTurretSet();
assert.equal(turretSet.sysBoneHeight, 1);
assert.equal(turretSet.sysBonePitchFactor, 1);
assert.equal(turretSet.sysBonePitch01Factor, 1);
assert.equal(turretSet.sysBonePitch02Factor, 1);
assert.equal(turretSet.sysBonePitch03Factor, 1);
assert.equal(turretSet.sysBonePitchMax, 90);

const baseTransforms = new Float32Array(36);
writeIdentityJoint(baseTransforms, 0);
writeIdentityJoint(baseTransforms, 12);
writeIdentityJoint(baseTransforms, 24);
const untouchedBaseTransforms = new Float32Array(baseTransforms);

const bones = [
    createBone("Sys_Rotation_Arm", -1, 0, baseTransforms),
    createBone("Sys_Pitch_Barrel", 0, 1, baseTransforms),
    createBone("Pos_Fire01", 1, 2, baseTransforms)
];
mat4.fromTranslation(bones[2].localTransform, [ 0, 0, 1 ]);

const model = {
    bones,
    bonesByName: Object.fromEntries(bones.map(bone => [ bone.boneRes.name, bone ]))
};
const controller = { models: [ model ] };
const firstItem = { _localTransform: mat4.create() };

turretSet._state = EveTurretSet.State.FIRING;
vec3.set(turretSet._targetPosition, 1, 1, 1);
assert.equal(turretSet.UpdateTrackingInfluence(0.5), 0.5);

const halfPose = turretSet.UpdateTrackingPose(controller, firstItem, baseTransforms);
const expectedHalfYaw = mat4.create();
mat4.rotateY(expectedHalfYaw, expectedHalfYaw, Math.PI / 8);
assertMatrixClose(halfPose.worldTransforms[0], expectedHalfYaw, "IDLE to FIRE must fade target yaw in");

const expectedHalfPitch = mat4.create();
mat4.rotateX(expectedHalfPitch, expectedHalfPitch, -Math.asin(1 / Math.sqrt(3)) * 0.5);
assertMatrixClose(halfPose.localTransforms[1], expectedHalfPitch, "IDLE to FIRE must fade barrel pitch in");

assert.equal(turretSet.UpdateTrackingInfluence(0.5), 1);
const firstPose = turretSet.UpdateTrackingPose(controller, firstItem, baseTransforms);

const expectedYaw = mat4.create();
mat4.rotateY(expectedYaw, expectedYaw, Math.PI / 4);
assertMatrixClose(firstPose.worldTransforms[0], expectedYaw, "the rotation arm must yaw toward the target");

const expectedPitch = mat4.create();
mat4.rotateX(expectedPitch, expectedPitch, -Math.asin(1 / Math.sqrt(3)));
assertMatrixClose(firstPose.localTransforms[1], expectedPitch, "the barrel must pitch toward the target");

const expectedMuzzle = mat4.create();
mat4.multiply(expectedMuzzle, expectedYaw, expectedPitch);
mat4.multiply(expectedMuzzle, expectedMuzzle, bones[2].localTransform);
assertMatrixClose(firstPose.worldTransforms[2], expectedMuzzle, "the muzzle must inherit the tracked yaw and pitch");
assert.deepEqual(baseTransforms, untouchedBaseTransforms, "tracking must not mutate the shared animation pose");
assert.notDeepEqual(firstPose.bindingTransforms, untouchedBaseTransforms, "the per-item binding pose must contain tracking");

const firstYaw = mat4.clone(firstPose.worldTransforms[0]);
const secondItem = { _localTransform: mat4.fromTranslation(mat4.create(), [ 1, 0, 0 ]) };
const secondPose = turretSet.UpdateTrackingPose(controller, secondItem, baseTransforms);
assertMatrixClose(secondPose.worldTransforms[0], mat4.create(), "each turret must aim from its own locator transform");
assert.notDeepEqual(Array.from(firstYaw), Array.from(secondPose.worldTransforms[0]));

turretSet.sysBonePitchMax = 10;
const limitedPose = turretSet.UpdateTrackingPose(controller, firstItem, baseTransforms);
const expectedLimitedPitch = mat4.create();
mat4.rotateX(expectedLimitedPitch, expectedLimitedPitch, -10 * Math.PI / 180);
assertMatrixClose(limitedPose.localTransforms[1], expectedLimitedPitch, "Carbon's pitch limit must be respected");

turretSet._state = EveTurretSet.State.IDLE;
assert.equal(turretSet.UpdateTrackingInfluence(0.25), 0.75);
const fadingIdlePose = turretSet.UpdateTrackingPose(controller, firstItem, baseTransforms);
const expectedFadingIdleYaw = mat4.create();
mat4.rotateY(expectedFadingIdleYaw, expectedFadingIdleYaw, Math.PI / 4 * 0.75);
assertMatrixClose(fadingIdlePose.worldTransforms[0], expectedFadingIdleYaw, "FIRE to IDLE must fade target yaw out");

assert.equal(turretSet.UpdateTrackingInfluence(0.75), 0);
const idlePose = turretSet.UpdateTrackingPose(controller, firstItem, baseTransforms);
assertMatrixClose(idlePose.worldTransforms[0], mat4.create(), "idle turrets must retain their sampled animation pose");

const firingSet = new EveTurretSet();
Object.defineProperty(firingSet, "turretEffect", { value: {}, writable: true });
firingSet._state = EveTurretSet.State.IDLE;
firingSet._trackingInfluence = 0;
let startCount = 0;
let fireAnimationCount = 0;
firingSet.DoStartFiring = () =>
{
    startCount++;
    firingSet._state = EveTurretSet.State.FIRING;
};
firingSet.PlayFireAnimation = () => fireAnimationCount++;

assert.equal(firingSet._trackingInfluence, 0);
firingSet.EnterStateFiring();
assert.equal(firingSet._state, EveTurretSet.State.TARGETING);
assert.equal(firingSet._pendingFiring, true);
assert.equal(startCount, 0, "the first shot must wait while the turret aims");

firingSet.UpdateTrackingInfluence(0.5);
assert.equal(firingSet.StartPendingFiring(), false);
assert.equal(startCount, 0, "a partially aimed turret must not fire");

firingSet.UpdateTrackingInfluence(0.5);
assert.equal(firingSet.StartPendingFiring(), true);
assert.equal(startCount, 1, "the first shot must start after the targeting fade");
assert.equal(fireAnimationCount, 1);
assert.equal(firingSet._pendingFiring, false);

firingSet.EnterStateFiring();
assert.equal(startCount, 2, "subsequent shots while aimed must remain immediate");
assert.equal(fireAnimationCount, 2);

const cancelledSet = new EveTurretSet();
Object.defineProperty(cancelledSet, "turretEffect", { value: {}, writable: true });
cancelledSet._state = EveTurretSet.State.IDLE;
cancelledSet.EnterStateFiring();
cancelledSet.EnterStateIdle();
assert.equal(cancelledSet._state, EveTurretSet.State.IDLE);
assert.equal(cancelledSet._pendingFiring, false);
cancelledSet.UpdateTrackingInfluence(1);
assert.equal(cancelledSet.StartPendingFiring(), false, "cancelled targeting must not produce a late shot");

const cancelledDeploySet = new EveTurretSet();
Object.defineProperty(cancelledDeploySet, "turretEffect", { value: {}, writable: true });
cancelledDeploySet._state = EveTurretSet.State.INACTIVE;
cancelledDeploySet.EnterStateFiring();
assert.equal(cancelledDeploySet._state, EveTurretSet.State.UNPACKING);
cancelledDeploySet.EnterStateIdle();
const deploy = cancelledDeploySet._activeAnimation.played.find(({ name }) => name === "Deploy");
deploy.options.callback();
assert.equal(cancelledDeploySet._state, EveTurretSet.State.IDLE);
assert.equal(cancelledDeploySet._pendingFiring, false, "cancelled deployment must settle in idle without firing");

console.log("EveTurretSet per-item Carbon tracking pose verified");


function createBone(name, parentIndex, skeletonIndex, bindingArray)
{
    return {
        _skeletonIndex: skeletonIndex,
        index: skeletonIndex,
        localTransform: mat4.create(),
        worldTransform: mat4.create(),
        bindingArrays: [ {
            array: bindingArray,
            offset: skeletonIndex * 12
        } ],
        boneRes: {
            name,
            parentIndex,
            worldTransformInv: mat4.create()
        }
    };
}


function writeIdentityJoint(out, offset)
{
    out[offset] = 1;
    out[offset + 5] = 1;
    out[offset + 10] = 1;
}


function assertMatrixClose(actual, expected, message)
{
    for (let i = 0; i < 16; i++)
    {
        assert.ok(Math.abs(actual[i] - expected[i]) < 1e-6, `${message} (matrix index ${i})`);
    }
}


function loadTurretSet(source)
{
    const transformed = babel.transformSync(source, {
        babelrc: false,
        configFile: false,
        plugins: [
            [ require("@babel/plugin-proposal-decorators"), { legacy: true } ],
            [ require("@babel/plugin-proposal-class-properties"), { loose: true } ],
            require("@babel/plugin-transform-modules-commonjs")
        ]
    }).code;

    const module = { exports: {} };
    const meta = createMetaStub();
    const math = {
        ...glMatrix,
        box3: {
            create: () => new Float32Array(6),
            fromTransform: out => out
        }
    };

    class EveObjectSet
    {
        constructor()
        {
            this.items = [];
            this._visibleItems = [];
            this.display = true;
        }

        static global = {
            vec3_0: glMatrix.vec3.create(),
            vec4_0: glMatrix.vec4.create(),
            vec4_1: glMatrix.vec4.create(),
            mat4_0: glMatrix.mat4.create()
        };
    }

    class EveObjectSetItem {}
    class Tw2AnimationController
    {
        constructor()
        {
            this.models = [];
            this.played = [];
        }

        StopAllAnimations() {}

        PlayAnimation(name, options)
        {
            this.played.push({ name, options });
        }
    }

    const requireStub = request =>
    {
        switch (request)
        {
            case "utils":
                return { meta };
            case "global":
                return { tw2: {}, device: {} };
            case "math":
                return math;
            case "core":
                return {
                    GLESPerObjectDataEveSpaceObject: class {},
                    Tw2PerObjectData: { from: () => ({}) },
                    Tw2VertexElement: class {},
                    Tw2AnimationController,
                    Tw2ForwardingRenderBatch: class {}
                };
            case "./EveObjectSet":
                return { EveObjectSet, EveObjectSetItem };
            case "../../unsupported/curve/curve/AudEventCurve":
                return { AudEventKey: { from: value => value } };
            default:
                throw new Error(`Unexpected EveTurretSet dependency: ${request}`);
        }
    };

    Function("require", "module", "exports", transformed)(requireStub, module, module.exports);
    return module.exports.EveTurretSet;
}


function createMetaStub()
{
    let proxy;
    const target = function () {};
    proxy = new Proxy(target, {
        get: () => proxy,
        apply: (fn, thisArg, args) =>
        {
            if (args.length >= 2 && (typeof args[1] === "string" || typeof args[1] === "symbol"))
            {
                return undefined;
            }
            return value => value;
        }
    });
    return proxy;
}
