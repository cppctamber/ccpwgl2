/**
 * SOF -> plane set lights -> collector, 2026-08-21.
 *
 * Static checks over the wiring, because the runtime path needs a GL device.
 * Each assertion names the Carbon behaviour it guards.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sof = read("../src/sof/EveSOFData.js");
const planeSet = read("../src/eve/item/EvePlaneSet.js");
const eveObject = read("../src/eve/object/EveObject.js");

testLightsBuiltAfterFactionColour();
testItemSuppliesTheWorldPlacement();
testSetEmitsThroughTheCollector();
testAttachmentsAreWalked();
console.log("SOF plane light wiring verified");

function read(rel)
{
    return fs.readFileSync(path.resolve(__dirname, rel), "utf8");
}

/** Carbon tints each light with the ITEM colour (EveSOF.cpp:1089), which the
  * faction pass writes - so the lights must be built after it, not before. */
function testLightsBuiltAfterFactionColour()
{
    // Scoped to SetupPlaneSets: GetColorType appears in several Setup
    // functions, so a whole-file indexOf compares against an unrelated one and
    // silently passes whatever the order really is.
    const from = sof.indexOf("static SetupPlaneSets(");
    const to = sof.indexOf("static SetupPlaneSetLights(");
    assert.ok(from !== -1 && to !== -1 && to > from, "both functions must exist");
    const scope = sof.slice(from, to);

    const faction = scope.indexOf("sof.faction.GetColorType");
    const lights = scope.indexOf("EveSOFData.SetupPlaneSetLights");
    assert.ok(faction !== -1, "the faction colour pass must be in SetupPlaneSets");
    assert.ok(lights !== -1, "the light pass must be called from SetupPlaneSets");
    assert.ok(lights > faction, "lights must be built AFTER the faction colour pass");

    const guard = [
        "            if (sof6)",
        "            {",
        "                EveSOFData.SetupPlaneSetLights(set, srcSet);",
        "            }"
    ].join(String.fromCharCode(10));
    assert.ok(scope.split(String.fromCharCode(13,10)).join(String.fromCharCode(10)).includes(guard),
        "and only for sof6, matching Carbon dna->UsingSof6()");
}

/** The item turns authored multipliers into a world light (EveSOF.cpp:1085-1093). */
function testItemSuppliesTheWorldPlacement()
{
    assert.ok(sof.includes("Math.max(src.scaling[0], src.scaling[1], src.scaling[2])"),
        "radii scale by the items LARGEST axis");
    assert.ok(sof.includes("Saturate(color, item.color, light.saturation)"),
        "the light colour is the items colour, saturated per light");
    assert.ok(sof.includes("vec3.transformQuat(offset, lightData.position, src.rotation)"),
        "the authored offset is LOCAL - rotate it by the item first");
    assert.ok(sof.includes("vec3.add(lightData.position, offset, src.position)"),
        "then translate by the items position");
    assert.ok(sof.includes("lightData.boneIndex = src.boneIndex"),
        "a light on an animated part must follow its bone");
}

/** EvePlaneSet::GetLights (cpp:544-568). */
function testSetEmitsThroughTheCollector()
{
    for (const member of [ "lights = []", "AddLightFromSOF(", "GetLights(collector", "GetAverageColor(" ])
    {
        assert.ok(planeSet.includes(member), `EvePlaneSet must have ${member}`);
    }

    assert.ok(planeSet.includes("const record = CreateLightRecord();"),
        "a FRESH record per light - Collect stores the reference it is given");
    assert.ok(planeSet.includes("Fade(animationTime, light.fadeType, light.blinkRate, light.blinkPhase)"),
        "brightness is faded by the lights blink type");
    assert.ok(planeSet.includes("Saturate(dataCopy.color, dataCopy.color, light.saturation)"),
        "colour is saturated per light");
    assert.ok(planeSet.includes("CopyLightData(dataCopy, light.lightData)"),
        "the STORED light data must never be mutated - Carbon iterates by value");
}

/** Without this a set can fill its lights and still never have one collected. */
function testAttachmentsAreWalked()
{
    assert.ok(eveObject.includes("this.effectChildren, this.attachments"),
        "GetLights must walk attachments as well as effect children");
}
