/* eslint-env node */
// Uses the shipped bundle and real metadata hydration, not transcribed methods.
require("./test-attachment-lights-runtime.js");
const assert = require("node:assert/strict");
const { mat4, quat, vec3 } = require("gl-matrix");
const mod = require("../dist/ccpwgl2_int.js");
const tw2 = mod.tw2 || mod.default || mod;
const C = name => tw2.GetClass(name);
const identity = mat4.create();

function near(actual, expected, label)
{
    assert.equal(actual.length, expected.length, label);
    for (let i = 0; i < actual.length; i++)
        assert.ok(Math.abs(actual[i] - expected[i]) < 1e-4, `${label}[${i}]: ${actual[i]} != ${expected[i]}`);
}

function collect(owner, context = {})
{
    const rows = [];
    owner.GetLights({ Collect(values) { rows.push(...values); } }, context);
    return rows;
}

function add(set, extra = {}, data = {})
{
    set.AddLightFromSOF({ lightData: C("CjsLightData").from({
        position: [ 1, 2, 3 ], color: [ 1, 0.5, 0.25, 1 ], brightness: 4,
        radius: 8, innerRadius: 4, boneIndex: 1, ...data
    }), minScale: 1, maxScale: 3, blinkRate: 1, ...extra });
}

const parent = mat4.fromRotationTranslationScale(mat4.create(),
    quat.setAxisAngle(quat.create(), [ 0, 0, 1 ], Math.PI / 2), [ 10, 20, 30 ], [ 2, 2, 2 ]);
const bone = mat4.fromRotationTranslation(mat4.create(),
    quat.setAxisAngle(quat.create(), [ 0, 1, 0 ], Math.PI / 2), [ 5, 0, 0 ]);
const bones = [ { offsetTransform: mat4.fromTranslation(mat4.create(), [ 100, 0, 0 ]) }, { offsetTransform: bone } ];
const expected = vec3.transformMat4(vec3.create(), [ 1, 2, 3 ], bone);
vec3.transformMat4(expected, expected, parent);

for (const name of [ "EvePlaneSet", "EveSpriteSet", "EveSpotlightSet", "EveHazeSet", "EveSpriteLineSet", "EveBannerSet" ])
{
    const set = new (C(name))();
    add(set);
    if (name === "EveBannerSet") set.SetPrimaryTextureParameter({ textureRes: { GetAverageColor: () => [ 1, 1, 1, 1 ] } });
    set.UpdateLights(parent, bones, bones.length, 0.5, 0.25);
    const rows = collect(set, { animationTime: 0 });
    assert.equal(rows.length, 1, name);
    near(rows[0].position, expected, `${name} bone then parent`);
    assert.equal(rows[0].radius, 8, `${name} does not inherit parent radius scale`);
    assert.equal(rows[0].color[0], 2, `${name} activation`);
    set.lights[0].lightData.boneIndex = 0;
    set.UpdateLights(parent, bones, bones.length, 0.5, 0.25);
    near(collect(set)[0].position, vec3.transformMat4(vec3.create(), [ 1, 2, 3 ], parent), `${name} donor bone zero`);
    set.UpdateLights(parent, null, 0, 0, 0);
    near(collect(set)[0].color, [ 0, 0, 0 ], `${name} deactivation`);
}

const sprite = new (C("EveSpriteSet"))();
add(sprite);
sprite.UpdateLights(identity, null, 0, 1, 0);
const off = collect(sprite, { animationTime: 0 })[0], on = collect(sprite, { animationTime: 0.05 })[0];
assert.equal(on.radius, off.radius * 3);
assert.equal(on.innerRadius, off.innerRadius * 3);
near(on.color, off.color, "blink changes radii, not brightness");

for (const name of [ "EveSpotlightSet", "EveHazeSet" ])
{
    const set = new (C(name))();
    add(set, { boosterGainInfluence: true }, { innerAngle: 15, outerAngle: 30 });
    set.UpdateLights(identity, null, 0, 0.5, 0.25);
    const row = collect(set)[0];
    assert.equal(row.color[0], 0.5, `${name} booster gain`);
    if (name === "EveSpotlightSet")
    {
        assert.ok(Math.abs(row.outerAngle - Math.cos(Math.PI / 6)) < 1e-6);
        near(row.direction, [ 0, 0, -1 ], "spot axis");
    }
}

// Native AddLightFromSOF copies LightData, while resource handles remain shared.
const original = C("CjsLightData").from({ position: [ 4, 5, 6 ], radius: 2 });
const copies = new (C("EveSpriteSet"))();
copies.AddLightFromSOF({ lightData: original });
original.position[0] = 9;
copies.AddLightFromSOF({ lightData: original });
assert.notEqual(copies.lights[0].lightData, copies.lights[1].lightData);
assert.equal(copies.lights[0].lightData.position[0], 4);
assert.equal(copies.lights[1].lightData.position[0], 9);

const profileType = C("Tr2LightProfileRes"), oldResolve = profileType.Resolve;
const profile = { GetTextureIndex: () => 2 };
profileType.Resolve = path => path ? profile : null;
try
{
    sprite.lights[0].lightProfilePath = "res:/test.ies";
    assert.equal(collect(sprite)[0].flags >> 4, 3);
    assert.equal(collect(sprite)[0].lightProfile, profile);
    assert.ok(sprite.GetResources().includes(profile));
    const child = new (C("EveChildMesh"))();
    child.attachments = [ sprite ];
    mat4.copy(child._worldTransform, parent);
    assert.ok(child.GetResources().includes(profile), "child resource enumeration reaches profiles");
    // Child palette differs from the ship palette. Float4x3 is three transposed rows.
    const palette = new Float32Array(24);
    for (let i = 0; i < 2; i++)
    {
        const m = bones[i].offsetTransform;
        palette.set([ m[0], m[4], m[8], m[12], m[1], m[5], m[9], m[13], m[2], m[6], m[10], m[14] ], i * 12);
    }
    child.animationUpdater = { GetBoneMatrices: () => palette };
    near(collect(child, { bones: [ { offsetTransform: identity } ], activationStrength: 1 })[0].position,
        expected, "child's own bone palette");
    sprite.lights[0].lightProfilePath = "";
    assert.equal(collect(sprite)[0].lightProfile, null);
    assert.equal(collect(sprite)[0].flags >> 4, 0);
}
finally { profileType.Resolve = oldResolve; }

const banner = new (C("EveBannerSet"))();
add(banner);
assert.equal(collect(banner).length, 0, "no image suppresses banner light");
let average = [ 0.2, 0.4, 0.6, 1 ];
banner.SetPrimaryTextureParameter({ textureRes: { GetAverageColor: () => average } });
near(collect(banner)[0].color, [ 0.8, 1.6, 2.4 ], "banner image tint");
average = [ 1, 0, 0, 1 ];
near(collect(banner)[0].color, [ 4, 0, 0 ], "banner new image does not accumulate tint");
average = [ 1, 1, 1, 0 ];
assert.equal(collect(banner).length, 0);

const sof = {
    hull: { sof6: true, isSkinned: false, spriteSets: [], spotlightSets: [], planeSets: [], banners: [], bannerSets: [], hazeSets: [], spriteLineSets: [] },
    faction: { visibilityGroupSet: { IsObjectVisible: () => true }, GetColorType: (type, out) => out.set([ 1, 0.5, 0.25, 1 ]) }
};
const source = C("EveSOFDataHullSpriteLineSetItem").from({
    position: [ 2, 0, 0 ], scaling: [ 3, 1, 1 ], spacing: 5, intensity: 1,
    saturation: 1, minScale: 1, maxScale: 2, light: { __type: "EveSOFDataPointLightAttachment", saturation: 1 }
});
sof.hull.spriteLineSets = [ { name: "line", items: [ source ] } ];
const factory = C("EveSOFData"), owner = { attachments: [] }, data = { enableSof6: true };
factory.SetupSpriteLineSets(data, owner, sof, {});
const line = owner.attachments[0];
assert.equal(line.lights.length, 3);
assert.deepEqual(line.lights.map(light => light.lightData.position[0]), [ 4, 9, 14 ], "donor double translation retained");
assert.notEqual(line.lights[0].lightData, line.lights[1].lightData);
assert.equal(line.GetBatches(), false, "sprite-line drawing is still disabled");
factory.SetupSpriteLineSets(data, owner, sof, {});
assert.equal(owner.attachments.length, 1, "rebuild reuses owner");
assert.equal(owner.attachments[0].lights.length, 3, "rebuild replaces records");
factory.TransformLayoutAttachment(line, mat4.fromTranslation(mat4.create(), [ 100, 0, 0 ]));
assert.equal(line.lights[0].lightData.position[0], 104);

const hazeSource = C("EveSOFDataHullHazeSetItem").from({ position: [ 5, 0, 0 ], scaling: [ 2, 3, 4 ], hazeBrightness: 0,
    saturation: 0, lights: [ { __type: "EveSOFDataPointLightAttachment", intensity: 2, saturation: 1 } ] });
sof.hull.hazeSets = [ { name: "haze", items: [ hazeSource ] } ];
factory.SetupHazeSets(data, owner, sof, {});
const haze = owner.attachments.find(set => set.GetClassName() === "EveHazeSet");
assert.equal(haze.lights[0].lightData.radius, 8);
assert.equal(collect(haze)[0].color[0], 2, "haze visual brightness does not dim its light");
assert.equal(haze.GetBatches(), false, "haze drawing remains disabled");
haze.Rebuild();

for (const name of [ "EveSpriteSet", "EveSpotlightSet", "EvePlaneSet", "EveHazeSet", "EveSpriteLineSet" ])
{
    const set = new (C(name))();
    add(set);
    set.items = [ { display: true } ];
    assert.equal(collect(set).length, 1, `${name} visible light`);
    set.items[0].display = false;
    assert.equal(collect(set).length, 0, `${name} hidden item`);
    set.items[0].display = true;
    set.display = false;
    assert.equal(collect(set).length, 0, `${name} hidden set`);
}
const ship = new (C("EveSpaceObject2"))();
ship.attachments = [sprite];
ship.visible.spriteSets = false;
assert.equal(collect(ship).length, 0, "ship category hides attachment lights");
ship.visible.spriteSets = true;
assert.equal(collect(ship).length, 1, "ship category restores attachment lights");
console.log("Attachment lights: transforms, activation, blink, profiles, copies, SOF and display switches verified");
