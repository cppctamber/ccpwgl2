import assert from "node:assert/strict";
import test from "node:test";

import {
    InstallSyntheticHeadLayerFixture,
    InstallSyntheticMaleTopUnderwearFixture,
    SYNTHETIC_HEAD_RECORD_ID,
    SYNTHETIC_MALE_TOP_UNDERWEAR_RECORD_ID
} from "../src/demo/CharacterDemoSyntheticFixture.mjs";

test("synthetic head fixture combines exact retained donors without changing them", () =>
{
    const eyeshadow = Modifier("makeup/eyeshadow", "415");
    const freckles = Modifier("makeup/freckles", "38");
    const augmentation = Modifier("makeup/augmentations", "15635");
    const heroScar = Modifier("scars/head", "124");
    const bodyAugmentation = Modifier("makeup/bodyaugmentations", "2195");
    const tattooLocation = { recordID: "30", modifierKey: "tattoo/head" };
    const tattooResource = {
        recordID: "527",
        resPath: "Tattoo/Head/TattooFaceG10/Types/TattooFaceG10.type",
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
        [ "paperdolls/3019595", Donor("3019595", heroScar) ],
        [ "paperdolls/3020068", Donor("3020068", bodyAugmentation) ],
        [ "characterModifierLocations/30", tattooLocation ],
        [ "characterResources/527", tattooResource ],
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
    assert.strictEqual(result.modifiers[5], heroScar);
    assert.strictEqual(result.modifiers[6], bodyAugmentation);
    assert.deepEqual(result.modifiers[7], tattoo);
    assert.strictEqual(result.modifiers[7].modifierLocationID, tattooLocation);
    assert.strictEqual(result.modifiers[7].paperdollResourceID, tattooResource);
    assert.equal(result.modifiers[8].modifierLocationID.modifierKey, "makeup/blemish");
    assert.equal(result.modifiers[8].paperdollResourceID.recordID, "3744");
    assert.equal(result.modifiers.includes(baseFreckles), false);
    assert.equal(result.modifiers.includes(baseTop), false);
    assert.deepEqual(result.colorSelections, [ baseColor, eyeshadowColor, tattooColor ]);
    assert.equal(base.modifiers.length, 3);
    assert.strictEqual(InstallSyntheticHeadLayerFixture(manager), result);
});

test("synthetic male upper-underwear fixture exposes one retained unobserved source", () =>
{
    const retained = Modifier("bottomunderwear", "1046");
    const covered = [
        Modifier("outer", "314"),
        Modifier("bottomouter", "254"),
        Modifier("feet", "216"),
        Modifier("topmiddle", "48")
    ];
    const base = {
        recordID: "3019517",
        modifiers: [ retained, ...covered ],
        colorSelections: [],
        GetValues: () => ({ recordID: "3019517", creationDate: "authored" })
    };
    const location = { recordID: "121", modifierKey: "topunderwear" };
    const resource = { recordID: "16182", resGender: 1 };
    let created = null;
    const manager = {
        Get(documentName, recordID)
        {
            if (documentName === "paperdolls"
                && recordID === SYNTHETIC_MALE_TOP_UNDERWEAR_RECORD_ID)
            {
                return created;
            }
            if (documentName === "paperdolls" && recordID === "3019517") return base;
            if (documentName === "characterModifierLocations" && recordID === "121")
            {
                return location;
            }
            if (documentName === "characterResources" && recordID === "16182")
            {
                return resource;
            }
            return null;
        },
        Create(documentName, values, options)
        {
            assert.equal(documentName, "paperdolls");
            assert.equal(options.reason, "demo-synthetic-male-top-underwear-proof");
            created = values;
            return values;
        }
    };

    const result = InstallSyntheticMaleTopUnderwearFixture(manager);

    assert.equal(result.recordID, SYNTHETIC_MALE_TOP_UNDERWEAR_RECORD_ID);
    assert.strictEqual(result.modifiers[0], retained);
    assert.deepEqual(result.modifiers[1], {
        modifierLocationID: location,
        paperdollResourceID: resource,
        paperdollResourceVariation: 0
    });
    assert.equal(result.modifiers.some(value => covered.includes(value)), false);
    assert.strictEqual(InstallSyntheticMaleTopUnderwearFixture(manager), result);
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
