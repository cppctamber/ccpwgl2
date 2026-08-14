import assert from "node:assert/strict";
import test from "node:test";

import {
    InstallSyntheticHeadLayerFixture,
    SYNTHETIC_HEAD_RECORD_ID
} from "../src/demo/CharacterDemoSyntheticFixture.mjs";

test("synthetic head fixture combines exact retained donors without changing them", () =>
{
    const eyeshadow = Modifier("makeup/eyeshadow", "415");
    const freckles = Modifier("makeup/freckles", "38");
    const augmentation = Modifier("makeup/augmentations", "15635");
    const tattooLocation = { recordID: "30", modifierKey: "tattoo/head" };
    const tattooResource = {
        recordID: "505",
        resPath: "Tattoo/Head/TattooFaceA01/Types/TattooFaceA01.type",
        resGender: 0
    };
    const tattoo = {
        modifierLocationID: tattooLocation,
        paperdollResourceID: tattooResource,
        paperdollResourceVariation: 0
    };
    const eyeshadowColor = Color("makeup/eyeshadow", "olivegreen_a", 0.3083);
    const tattooColorLocation = { recordID: "26", colorKey: "tattoo/head" };
    const tattooColorName = { recordID: "243", colorName: "default_a" };
    const tattooColor = {
        colorID: tattooColorLocation,
        colorNameA: tattooColorName,
        colorNameBC: null,
        gloss: 0,
        weight: 1
    };
    const baseModifier = Modifier("makeup/aging", "base-aging");
    const baseFreckles = Modifier("makeup/freckles", "260");
    const baseTop = Modifier("topmiddle", "130");
    const singlet = Modifier("topmiddle", "308");
    const baseColor = Color("skintone", "deteis_dark", 0);
    const base = {
        recordID: "3000001",
        modifiers: [ baseModifier, baseFreckles, baseTop ],
        colorSelections: [ baseColor ],
        GetValues: () => ({ recordID: "3000001", creationDate: "authored" })
    };
    const records = new Map([
        [ "paperdolls/3000001", base ],
        [ "paperdolls/3003877", Donor("3003877", freckles) ],
        [ "paperdolls/3020292", Donor("3020292", singlet) ],
        [ "paperdolls/3003957", Donor("3003957", eyeshadow, eyeshadowColor) ],
        [ "paperdolls/3020032", Donor("3020032", augmentation) ],
        [ "characterModifierLocations/30", tattooLocation ],
        [ "characterResources/505", tattooResource ],
        [ "characterColorLocations/26", tattooColorLocation ],
        [ "characterColorNames/243", tattooColorName ],
        [ "characterModifierLocations/129", { recordID: "129", modifierKey: "makeup/blemish" } ],
        [ "characterResources/3744", { recordID: "3744", resPath: "Makeup/Blemish/Light_01.type" } ]
    ]);
    let created = null;
    const manager = {
        Get(documentName, recordID)
        {
            if (documentName === "paperdolls" && recordID === SYNTHETIC_HEAD_RECORD_ID)
            {
                return created;
            }
            return records.get(`${documentName}/${recordID}`) ?? null;
        },
        Create(documentName, values, options)
        {
            assert.equal(documentName, "paperdolls");
            assert.equal(options.reason, "demo-synthetic-head-layer-proof");
            created = values;
            return values;
        }
    };

    const result = InstallSyntheticHeadLayerFixture(manager);

    assert.equal(result.recordID, SYNTHETIC_HEAD_RECORD_ID);
    assert.deepEqual(result.modifiers.slice(0, 4), [
        baseModifier,
        freckles,
        singlet,
        eyeshadow
    ]);
    assert.strictEqual(result.modifiers[4], augmentation);
    assert.deepEqual(result.modifiers[5], tattoo);
    assert.strictEqual(result.modifiers[5].modifierLocationID, tattooLocation);
    assert.strictEqual(result.modifiers[5].paperdollResourceID, tattooResource);
    assert.equal(result.modifiers[6].modifierLocationID.modifierKey, "makeup/blemish");
    assert.equal(result.modifiers[6].paperdollResourceID.recordID, "3744");
    assert.equal(result.modifiers.includes(baseFreckles), false);
    assert.equal(result.modifiers.includes(baseTop), false);
    assert.deepEqual(result.colorSelections, [ baseColor, eyeshadowColor, tattooColor ]);
    assert.equal(base.modifiers.length, 3);
    assert.strictEqual(InstallSyntheticHeadLayerFixture(manager), result);
});

function Donor(recordID, modifier, colorSelection = null)
{
    return {
        recordID,
        modifiers: [ modifier ],
        colorSelections: colorSelection ? [ colorSelection ] : []
    };
}

function Modifier(modifierKey, recordID)
{
    return {
        modifierLocationID: { modifierKey },
        paperdollResourceID: { recordID },
        paperdollResourceVariation: 0
    };
}

function Color(colorKey, colorName, weight)
{
    return {
        colorID: { colorKey },
        colorNameA: { colorName },
        colorNameBC: null,
        weight,
        gloss: 0
    };
}
