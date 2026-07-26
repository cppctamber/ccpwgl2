const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const sourcePath = path.resolve(__dirname, "../src/interior/character/CcpwglCharacterVisemeBinding.js");
const source = fs.readFileSync(sourcePath, "utf8").replace("export class", "class");
const { CcpwglCharacterVisemeBinding } = new Function(
    `${source}\nreturn { CcpwglCharacterVisemeBinding };`
)();

function CreateController()
{
    const calls = [];
    const animations = new Map([ "neutral", "aa", "m" ].map(name => [ name, {
        name,
        paused: false,
        Pause()
        {
            this.paused = true;
            calls.push([ "pause", name ]);
        }
    } ]));
    return {
        calls,
        animations,
        GetAnimation(name)
        {
            return animations.get(name) || null;
        },
        RegisterMask(name, weights)
        {
            calls.push([ "mask", name, weights ]);
        },
        RegisterReferenceClip(name, clip)
        {
            calls.push([ "reference", name, clip.name ]);
        },
        PlayAdditiveAnimation(projection, options)
        {
            calls.push([ "play", projection, options ]);
            return animations.get(projection.Delta) || null;
        },
        SetLayerAmount(name, amount)
        {
            calls.push([ "amount", name, amount ]);
        }
    };
}

function CreateProfile()
{
    return {
        id: "speech",
        maskName: "Mouth",
        maskWeights: { jaw: 1, tongue: 1 },
        neutralVisemeID: "x",
        visemes: [
            { id: "AA", clipName: "aa" },
            { id: "m", clipName: "m" },
            { id: "x", clipName: "neutral" }
        ]
    };
}

test("binds simultaneous skeletal visemes as ordered independent zero-weight mouth layers", () =>
{
    const controller = CreateController();
    const binding = new CcpwglCharacterVisemeBinding(controller);
    const snapshot = binding.Bind(CreateProfile());
    const plays = controller.calls.filter(call => call[0] === "play");

    assert.equal(snapshot.prepared, true);
    assert.equal(snapshot.layerCount, 3);
    assert.equal(snapshot.neutralControlMode, "current-pose-cancellation");
    assert.equal(plays.length, 3);
    assert.deepEqual(plays.map(call => call[1]), [
        { Into: "CurrentPose", Base: "CurrentPose", Delta: "aa", Mask: "Mouth", Amount: 0 },
        { Into: "CurrentPose", Base: "CurrentPose", Delta: "m", Mask: "Mouth", Amount: 0 },
        { Into: "CurrentPose", Base: "CurrentPose", Delta: "neutral", Mask: "Mouth", Amount: 0 }
    ]);
    assert.ok(plays.every(call => call[2].percent === 1 && call[2].timeScale === 0));
    assert.deepEqual(
        controller.calls.filter(call => call[0] === "pause"),
        [ [ "pause", "aa" ], [ "pause", "m" ], [ "pause", "neutral" ] ]
    );
    assert.ok([ ...controller.animations.values() ].every(animation => animation.paused));
    assert.notEqual(plays[0][2].layerName, plays[1][2].layerName);
    assert.equal(plays[2][2].layerName, CcpwglCharacterVisemeBinding.formatLayerName("speech", "x"));
});

test("applies complete weight snapshots and clears omitted visemes", () =>
{
    const controller = CreateController();
    const binding = new CcpwglCharacterVisemeBinding(controller);
    binding.Bind(CreateProfile());
    controller.calls.length = 0;

    assert.equal(binding.SetWeights({ AA: 0.8, m: 0.25 }), true);
    assert.equal(binding.SetWeights({ m: 0.5 }), true);
    assert.deepEqual(controller.calls.map(call => call.slice(0, 3)), [
        [ "amount", CcpwglCharacterVisemeBinding.formatLayerName("speech", "AA"), 0.8 ],
        [ "amount", CcpwglCharacterVisemeBinding.formatLayerName("speech", "m"), 0.25 ],
        [ "amount", CcpwglCharacterVisemeBinding.formatLayerName("speech", "AA"), 0 ],
        [ "amount", CcpwglCharacterVisemeBinding.formatLayerName("speech", "m"), 0.5 ]
    ]);
    assert.deepEqual(binding.GetSnapshot().weights, { m: 0.5 });
});

test("rejects incomplete profiles and invalid weights without partial guessing", () =>
{
    const controller = CreateController();
    const binding = new CcpwglCharacterVisemeBinding(controller);

    assert.throws(() => binding.SetWeights({ AA: 1 }), /not prepared/);
    assert.throws(() => binding.Bind({ ...CreateProfile(), neutralVisemeID: "missing" }), /does not contain neutral/);
    binding.Bind(CreateProfile());
    assert.throws(() => binding.SetWeights({ unknown: 0.5 }), /does not contain "unknown"/);
    assert.throws(() => binding.SetWeights({ AA: 2 }), /between 0 and 1/);

    controller.animations.delete("m");
    assert.throws(() => binding.Bind(CreateProfile()), /clip was not found: m/);
    assert.deepEqual(binding.GetSnapshot(), {
        prepared: false,
        profileID: null,
        maskName: null,
        neutralVisemeID: null,
        neutralControlMode: "current-pose-cancellation",
        layerCount: 0,
        weights: {},
        layers: {}
    });
    assert.throws(() => binding.SetWeights({ AA: 0.5 }), /not prepared/);
});
