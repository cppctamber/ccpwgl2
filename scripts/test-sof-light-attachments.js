/**
 * SOF light attachments -> CjsLightData, 2026-08-21.
 *
 * The radii of an attachment light are DERIVED, never authored: SOF carries
 * multipliers and the owning item's scale turns them into world radii
 * (`EveSOFDataMgr.cpp:109-123` for point, `:140-160` for spot). ccpwgl declared
 * the multipliers and then read them NOWHERE - there was no AsLightData at all -
 * so every light that reached the collector carried the same radius and every
 * falloff looked identically hard.
 *
 * Two distinct layers of default, which must not be confused:
 *   - the SOF ATTACHMENT multipliers, whose defaults are Carbon's constructor
 *     values (point inner 1 / outer 2, spot inner 1 / outer 1, angles 0.5 / 1);
 *   - the LIGHT's own radius, which defaults to 0, as the Fenris editor shows.
 * ccpwgl had the attachment multipliers at 0.0, which zeroes every derived
 * radius no matter what the item's scale is.
 */
const assert = require("node:assert/strict");
const NL = String.fromCharCode(10);
const CRLF = String.fromCharCode(13) + NL;
const fs = require("node:fs");
const path = require("node:path");

const point = read("../src/sof/shared/EveSOFDataPointLightAttachment.js");
const spot = read("../src/sof/shared/EveSOFDataSpotlightAttachment.js");
const lightData = read("../src/eve/lights/CjsLightData.js");

testPointDefaultsMatchCarbon();
testSpotDefaultsMatchCarbon();
testLightRadiusStaysZero();
testDerivationExists();
console.log("SOF light attachment derivation verified");

function read(rel)
{
    return fs.readFileSync(path.resolve(__dirname, rel), "utf8").split(CRLF).join(NL);
}

function field(source, name)
{
    const marker = NL + "    " + name + " = ";
    const at = source.indexOf(marker);
    assert.ok(at !== -1, name + " must be declared");
    return source.slice(at + marker.length, source.indexOf(";", at)).trim();
}

/** `EveSOFData.cpp` EveSOFDataPointLightAttachment constructor. */
function testPointDefaultsMatchCarbon()
{
    for (const [ name, expected ] of [
        [ "intensity", "1" ], [ "saturation", "1" ],
        [ "innerScaleMultiplier", "1" ], [ "outerScaleMultiplier", "2" ],
        [ "noiseAmplitude", "0.0" ], [ "noiseFrequency", "1" ], [ "noiseOctaves", "1" ]
    ])
    {
        assert.equal(field(point, name), expected,
            `point light ${name} must default to Carbon's ${expected}`);
    }
}

/** `EveSOFData.cpp` EveSOFDataSpotLightAttachment constructor. */
function testSpotDefaultsMatchCarbon()
{
    for (const [ name, expected ] of [
        [ "intensity", "1" ], [ "saturation", "1" ],
        [ "innerAngleMultiplier", "0.5" ], [ "outerAngleMultiplier", "1" ],
        [ "innerScaleMultiplier", "1" ], [ "outerScaleMultiplier", "1" ],
        [ "noiseFrequency", "1" ], [ "noiseOctaves", "1" ]
    ])
    {
        assert.equal(field(spot, name), expected,
            `spot light ${name} must default to Carbon's ${expected}`);
    }
}

/** The light's own radius is a different layer, and stays 0 (Fenris). */
function testLightRadiusStaysZero()
{
    assert.equal(field(lightData, "radius"), "0", "a light's own radius defaults to 0");
    assert.equal(field(lightData, "innerRadius"), "0", "and so does its inner radius");
}

/** radius = outerScaleMultiplier * scale, innerRadius = innerScaleMultiplier * scale. */
function testDerivationExists()
{
    for (const [ source, label ] of [ [ point, "point" ], [ spot, "spot" ] ])
    {
        assert.ok(/AsLightData\(/.test(source), `${label} must expose AsLightData`);
        assert.ok(source.includes("out.radius = this.outerScaleMultiplier * scale"),
            `${label} radius must derive from outerScaleMultiplier and the item scale`);
        assert.ok(source.includes("out.innerRadius = this.innerScaleMultiplier * scale"),
            `${label} innerRadius must derive from innerScaleMultiplier and the item scale`);
        assert.ok(source.includes("out.brightness = this.intensity"),
            `${label} brightness comes from intensity`);
    }

    // Only the spot carries a cone, and both angles are multiplied by the item's.
    assert.ok(spot.includes("out.innerAngle = this.innerAngleMultiplier * innerAngle"),
        "spot inner angle must derive from the multiplier");
    assert.ok(spot.includes("out.outerAngle = this.outerAngleMultiplier * outerAngle"),
        "spot outer angle must derive from the multiplier");
    assert.ok(!/out\.innerAngle/.test(point), "a point light has no cone");
}
