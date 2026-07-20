const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");


const root = path.resolve(__dirname, "..");
const helperPath = path.join(
    root,
    "src/interior/character/Tr2InteriorAdditiveAnimation.js"
);
const helperSource = readFileSync(helperPath, "utf8");
const helperPromise = import(`data:text/javascript;base64,${Buffer.from(helperSource).toString("base64")}`);
const IDENTITY_SCALE = [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ];


test("interior degree-one sampler selects the correct segment and cycle wrap", async () => {
    const { sampleInteriorDegreeOneCurve: sample } = await helperPromise;
    const out = [ 0 ];

    sample(out, {
        degree: 1,
        dimension: 1,
        knots: [ 0, 2, 5 ],
        controls: [ 0, 10, 40 ]
    }, 1, false, 5);
    assert.equal(out[0], 5);

    const cyclic = {
        degree: 1,
        dimension: 1,
        knots: [ 1, 3 ],
        controls: [ 10, 30 ]
    };
    sample(out, cyclic, 4.5, true, 5);
    assert.equal(out[0], 20);
    sample(out, cyclic, -0.5, true, 5);
    assert.equal(out[0], 20);
});

test("degree-one quaternion sampling preserves equivalent signs", async () => {
    const { sampleInteriorDegreeOneCurve: sample } = await helperPromise;
    const out = [ 0, 0, 0, 0 ];

    sample(out, {
        degree: 1,
        dimension: 4,
        knots: [ 0, 1 ],
        controls: [ 0, 0, 0, 1, 0, 0, 0, -1 ]
    }, 0.5, false, 1, true);
    assert.deepEqual(out, [ 0, 0, 0, 1 ]);
});

test("Base-relative identity, zero mask, and zero Amount leave Into unchanged", async () => {
    const { composeInteriorAdditivePose: compose, getInteriorMaskWeight: maskWeight } = await helperPromise;
    const intoPosition = [ 3, 4, 5 ];
    const intoOrientation = quaternionZ(25);
    const intoScale = [ 2, 0, 0, 0, 3, 0, 0, 0, 4 ];
    const position = [ 0, 0, 0 ];
    const orientation = [ 0, 0, 0, 0 ];
    const scale = new Array(9).fill(0);

    assert.equal(maskWeight(new Float32Array([ 1, 0 ]), "Arm", 1), 0);
    assert.equal(maskWeight({ Arm: 1 }, "Leg", 8), 0);

    compose(
        position, orientation, scale,
        intoPosition, intoOrientation, intoScale,
        [ 0, 0, 0 ], [ 0, 0, 0, 1 ], IDENTITY_SCALE,
        [ 0, 0, 0 ], [ 0, 0, 0, -1 ], IDENTITY_SCALE,
        1
    );
    assertPose(position, orientation, scale, intoPosition, intoOrientation, intoScale);

    compose(
        position, orientation, scale,
        intoPosition, intoOrientation, intoScale,
        [ 1, 2, 3 ], quaternionZ(10), IDENTITY_SCALE,
        [ 9, 8, 7 ], quaternionZ(170), new Array(9).fill(4),
        0
    );
    assertPose(position, orientation, scale, intoPosition, intoOrientation, intoScale);
});

test("Mask and Amount multiply translation, scale, and quaternion delta", async () => {
    const { composeInteriorAdditivePose: compose, getInteriorMaskWeight: maskWeight } = await helperPromise;
    const position = [ 1, 0, 0 ];
    const orientation = quaternionZ(30);
    const scale = IDENTITY_SCALE.slice();
    const amount = 0.5 * maskWeight({ Arm: 0.5 }, "Arm", 0);

    compose(
        position, orientation, scale,
        position, orientation, scale,
        [ 2, 0, 0 ], quaternionZ(20), IDENTITY_SCALE,
        [ 10, 0, 0 ], quaternionZ(80), [ 5, 0, 0, 0, 5, 0, 0, 0, 5 ],
        amount
    );

    assert.ok(close(position[0], 3));
    assert.ok(close(scale[0], 2));
    assert.ok(close(scale[4], 2));
    assert.ok(close(scale[8], 2));
    assertQuaternionEquivalent(orientation, quaternionZ(45));
});

test("additive APIs remain isolated from Tw2AnimationController", () => {
    const controller = readFileSync(path.join(
        root,
        "src/interior/character/Tr2InteriorAnimationController.js"
    ), "utf8");
    const generic = readFileSync(path.join(root, "src/core/model/Tw2AnimationController.js"), "utf8");

    assert.match(controller, /PlayAdditiveAnimation\(projection/);
    assert.match(controller, /RegisterMask\(name, mask\)/);
    assert.match(controller, /RegisterReferenceClip\(name, clip\)/);
    assert.match(controller, /super\.Update\(dt\);\s*this\.ApplyAdditiveAnimations\(\);/);
    assert.match(controller, /sampleInteriorDegreeOneCurve/);
    assert.doesNotMatch(generic, /Tr2InteriorAdditiveAnimation|PlayAdditiveAnimation|composeInteriorAdditivePose/);
});

test("interior skinned objects preserve animation-only GR2 clips while rebinding visible meshes", () => {
    const skinnedObject = readFileSync(path.join(
        root,
        "src/interior/character/Tr2IntSkinnedObject.js"
    ), "utf8");

    assert.match(skinnedObject, /animationOnlyResources = current\.length && current\[0\] === resources\[0\]/);
    assert.match(skinnedObject, /!resource\?\.meshes\?\.length &&\s*!!resource\?\.animations\?\.length/);
    assert.match(skinnedObject, /for \(let i = 0; i < animationOnlyResources\.length; i\+\+\)[\s\S]*AddGeometryResource\(animationOnlyResources\[i\]\)/);
    assert.match(skinnedObject, /this\.animation\.RebuildCachedData\(\)/);
});

function quaternionZ(degrees)
{
    const radians = degrees * Math.PI / 180 / 2;
    return [ 0, 0, Math.sin(radians), Math.cos(radians) ];
}

function close(actual, expected, epsilon = 1e-6)
{
    return Math.abs(actual - expected) <= epsilon;
}

function assertQuaternionEquivalent(actual, expected)
{
    const dot = actual.reduce((sum, value, index) => sum + value * expected[index], 0);
    assert.ok(Math.abs(Math.abs(dot) - 1) < 1e-6, `${actual} should equal quaternion ${expected}`);
}

function assertPose(position, orientation, scale, expectedPosition, expectedOrientation, expectedScale)
{
    assert.deepEqual(position, expectedPosition);
    assertQuaternionEquivalent(orientation, expectedOrientation);
    assert.deepEqual(scale, expectedScale);
}
