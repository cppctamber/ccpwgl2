import assert from "node:assert/strict";
import test from "node:test";

import {
    applyCharacterPaperdollSelections,
    captureCharacterPaperdollParts,
    createCharacterPartCatalog,
    createCharacterPartIndex,
    restoreCharacterPaperdollParts,
    setCharacterPaperdollPart
} from "../src/demo/CharacterDemoPartCatalog.mjs";

test("part catalog exposes only exact same-gender resources observed at each location", () =>
{
    const top = Record("10", { modifierKey: "top", variationKey: "primary" });
    const feet = Record("20", { modifierKey: "feet" });
    const femaleTopA = Record("100", { resGender: 0, resPath: "res:/female/top/a" });
    const femaleTopB = Record("101", { resGender: 0, resPath: "res:/female/top/b" });
    const femaleFeet = Record("102", { resGender: 0, resPath: "res:/female/feet/a" });
    const maleTop = Record("200", { resGender: 1, resPath: "res:/male/top/a" });
    const selected = Paperdoll("female-a", [ Modifier(top, femaleTopA) ]);
    const index = createCharacterPartIndex([
        selected,
        Paperdoll("female-b", [ Modifier(top, femaleTopB), Modifier(feet, femaleFeet) ]),
        Paperdoll("male-a", [ Modifier(top, maleTop) ])
    ]);
    const catalog = createCharacterPartCatalog(index, selected);

    assert.equal(catalog.gender, 0);
    assert.deepEqual(catalog.slots.map(value => value.modifierKey), [ "feet", "top" ]);
    assert.deepEqual(
        catalog.slots.find(value => value.modifierKey === "top").resources
            .map(value => value.recordID),
        [ "100", "101" ]
    );
    assert.equal(
        catalog.slots.find(value => value.modifierKey === "top").selectedResourceID,
        "100"
    );
    assert.equal(
        catalog.slots.find(value => value.modifierKey === "top").selectedChoiceID,
        "100@0"
    );
    assert.equal(
        catalog.slots.find(value => value.modifierKey === "feet").selectedResourceID,
        ""
    );
});

test("part catalog preserves distinct observed variations of one resource", () =>
{
    const top = Record("10", { modifierKey: "top" });
    const shirt = Record("100", { resGender: 0, resPath: "res:/female/top/shirt" });
    const selected = Paperdoll("female-a", [ Modifier(top, shirt, 1) ]);
    const index = createCharacterPartIndex([
        Paperdoll("female-b", [ Modifier(top, shirt, 0) ]),
        selected
    ]);
    const slot = createCharacterPartCatalog(index, selected).slots[0];

    assert.deepEqual(slot.resources.map(value => value.choiceID), [ "100@0", "100@1" ]);
    assert.equal(slot.selectedResourceID, "100");
    assert.equal(slot.selectedChoiceID, "100@1");
});

test("part catalog projects exact sibling material colours without guessing fixed artwork", () =>
{
    const outer = Record("10", { modifierKey: "outer" });
    const colorized = Record("100", {
        resGender: 0,
        resPath: "res:/female/outer/coat/types/coat_blue",
        partType: Record("coat-blue", {
            sourcePath: "res:/female/outer/coat/types/coat_blue.type",
            sourcePaths: [ "res:/female/outer/coat/types/coat_blue.type" ],
            partPath: "outer/coat",
            resourceVersion: "v1",
            colorVariant: "Blue"
        })
    });
    const fixed = Record("101", {
        resGender: 0,
        resPath: "res:/female/outer/fixed/types/fixed",
        partType: Record("fixed", {
            sourcePath: "res:/female/outer/fixed/types/fixed.type",
            colorVariant: null
        })
    });
    const definition = {
        sourcePath: "res:/female/outer/coat/blue.color",
        extension: ".color",
        values: {
            colors: [
                [ 0.1, 0.2, 0.3, 1 ],
                [ 0.4, 0.5, 0.6, 1 ],
                [ 0.7, 0.8, 0.9, 1 ]
            ],
            pattern: "Hexagon",
            patternColors: [
                [ 0.9, 0.8, 0.7, 1 ],
                [ 0.6, 0.5, 0.4, 1 ],
                [ 0.3, 0.2, 0.1, 1 ]
            ]
        }
    };
    const typeDefinition = {
        sourcePath: "res:/female/outer/coat/types/coat_blue.type",
        extension: ".type",
        values: [ "outer/coat", "v1", "Blue" ]
    };
    const library = {
        Get(document, recordID)
        {
            if (document !== "characterDefinitions") return null;
            if (recordID === typeDefinition.sourcePath) return typeDefinition;
            return recordID === definition.sourcePath ? definition : null;
        }
    };
    const paperdolls = [
        Paperdoll("a", [ Modifier(outer, colorized) ]),
        Paperdoll("b", [ Modifier(outer, fixed) ])
    ];
    const slot = createCharacterPartCatalog(
        createCharacterPartIndex(paperdolls, library),
        paperdolls[0]
    ).slots[0];
    const colorizedPreview = slot.resources.find(value => value.recordID === "100")
        .colorPreview;

    assert.equal(colorizedPreview.colorVariant, "Blue");
    assert.equal(colorizedPreview.pattern, "Hexagon");
    assert.deepEqual(colorizedPreview.colors, definition.values.colors);
    assert.deepEqual(colorizedPreview.patternColors, definition.values.patternColors);
    assert.equal(colorizedPreview.evidence.valuesStatus, "authored");
    assert.equal(colorizedPreview.evidence.relationshipStatus, "derived-policy");
    assert.equal(
        slot.resources.find(value => value.recordID === "101").colorPreview,
        null
    );
});

test("part palettes resolve the exact sex-specific type definition", () =>
{
    const hair = Record("5", { modifierKey: "hair" });
    const partType = Record("shared", {
        sourcePath: "res:/female/hair/shared/types/shared_blue.type",
        sourcePaths: [
            "res:/female/hair/shared/types/shared_blue.type",
            "res:/male/hair/shared/types/shared_blue.type"
        ],
        partPath: "hair/shared",
        resourceVersion: "",
        colorVariant: "blue"
    });
    const resource = Record("200", { resGender: 1, partType });
    const records = new Map([
        [ partType.sourcePaths[0], TypeDefinition(partType.sourcePaths[0], partType) ],
        [ partType.sourcePaths[1], TypeDefinition(partType.sourcePaths[1], partType) ],
        [ "res:/female/hair/shared/blue.color", ColorDefinition(
            "res:/female/hair/shared/blue.color", 0.1
        ) ],
        [ "res:/male/hair/shared/blue.color", ColorDefinition(
            "res:/male/hair/shared/blue.color", 0.8
        ) ]
    ]);
    const library = DefinitionLibrary(records);
    const selected = Paperdoll("male", [ Modifier(hair, resource) ]);
    const preview = createCharacterPartCatalog(
        createCharacterPartIndex([ selected ], library),
        selected
    ).slots[0].resources[0].colorPreview;

    assert.equal(preview.materialDefinitionPath, "res:/male/hair/shared/blue.color");
    assert.equal(preview.colors[0][0], 0.8);
});

test("part palettes support singular type folders and exact group colour fallback", () =>
{
    const hair = Record("5", { modifierKey: "hair" });
    const typePath = "res:/female/hair/cap/type/cap_yoiul.type";
    const partType = Record("cap-yoiul", {
        sourcePath: typePath,
        sourcePaths: [ typePath ],
        partPath: "hair/cap",
        resourceVersion: "v23",
        colorVariant: "28_bc"
    });
    const resource = Record("16241", { resGender: 0, partType });
    const groupColorPath = "res:/graphics/character/female/paperdoll/hair/colors/28_bc.color";
    const library = DefinitionLibrary(new Map([
        [ typePath, TypeDefinition(typePath, partType) ],
        [ groupColorPath, ColorDefinition(groupColorPath, 0.28) ]
    ]));
    const selected = Paperdoll("female", [ Modifier(hair, resource) ]);
    const preview = createCharacterPartCatalog(
        createCharacterPartIndex([ selected ], library),
        selected
    ).slots[0].resources[0].colorPreview;

    assert.equal(preview.materialDefinitionPath, groupColorPath);
    assert.equal(preview.evidence.rule, "preview-exact-type-group-color-definition-v1");
});

test("part palettes resolve shallow paper-doll resources through the canonical library record", () =>
{
    const hair = Record("5", { modifierKey: "hair" });
    const typePath = "res:/female/hair/cap/types/cap_yoiul.type";
    const groupColorPath = "res:/graphics/character/female/paperdoll/hair/colors/28_bc.color";
    const partSource = Record("female/hair/cap");
    const partType = Record("cap-yoiul", {
        sourcePath: typePath,
        sourcePaths: [ typePath ],
        partPath: "hair/cap",
        resourceVersion: "v23",
        colorVariant: "28_bc",
        partSource
    });
    const canonical = Record("16241", {
        resGender: 0,
        resPath: "hair/cap/types/cap_yoiul.type",
        partType
    });
    const shallow = Record("16241", {
        resGender: 0,
        resPath: canonical.resPath,
        partType: null
    });
    const definitions = new Map([
        [ typePath, TypeDefinition(typePath, partType) ],
        [ groupColorPath, ColorDefinition(groupColorPath, 0.28) ]
    ]);
    const library = {
        Get(document, recordID)
        {
            if (document === "characterResources" && recordID === "16241") return canonical;
            return document === "characterDefinitions"
                ? definitions.get(recordID) ?? null
                : null;
        }
    };
    const selected = Paperdoll("female", [ Modifier(hair, shallow) ]);
    const resource = createCharacterPartCatalog(
        createCharacterPartIndex([ selected ], library),
        selected
    ).slots[0].resources[0];

    assert.equal(resource.partSourceRecordID, "female/hair/cap");
    assert.equal(resource.colorPreview.materialDefinitionPath, groupColorPath);
});

test("part palettes reject incomplete patterned material definitions", () =>
{
    const outer = Record("10", { modifierKey: "outer" });
    const typePath = "res:/female/outer/coat/types/coat_pattern.type";
    const partType = Record("coat-pattern", {
        sourcePath: typePath,
        sourcePaths: [ typePath ],
        partPath: "outer/coat",
        resourceVersion: "",
        colorVariant: "pattern"
    });
    const resource = Record("300", { resGender: 0, partType });
    const color = ColorDefinition("res:/female/outer/coat/pattern.color", 0.4);
    color.values.pattern = "Hexagon";
    color.values.patternColors = [ [ 1, 0, 0, 1 ] ];
    const library = DefinitionLibrary(new Map([
        [ typePath, TypeDefinition(typePath, partType) ],
        [ color.sourcePath, color ]
    ]));
    const selected = Paperdoll("female", [ Modifier(outer, resource) ]);

    assert.equal(createCharacterPartCatalog(
        createCharacterPartIndex([ selected ], library),
        selected
    ).slots[0].resources[0].colorPreview, null);
});

test("part catalog exposes the qualified inner clothing locations", () =>
{
    const locations = [ "bottomunderwear", "topinner", "topunderwear" ].map(
        (modifierKey, index) => Record(String(30 + index), { modifierKey })
    );
    const resources = locations.map((location, index) => Record(String(300 + index), {
        resGender: 0,
        resPath: `res:/female/${location.modifierKey}/example`
    }));
    const selected = Paperdoll("female-inner", locations.map((location, index) =>
        Modifier(location, resources[index])));
    const catalog = createCharacterPartCatalog(
        createCharacterPartIndex([ selected ]),
        selected
    );

    assert.deepEqual(catalog.slots.map(value => [ value.modifierKey, value.adapterSupported ]), [
        [ "bottomunderwear", true ],
        [ "topinner", true ],
        [ "topunderwear", true ]
    ]);
});

test("part catalog exposes qualified body augmentation overlays", () =>
{
    const location = Record("30", { modifierKey: "makeup/bodyaugmentations" });
    const resource = Record("300", {
        resGender: 0,
        resPath: "res:/female/makeup/bodyaugmentations/example"
    });
    const selected = Paperdoll("female-augmentation", [ Modifier(location, resource) ]);
    const catalog = createCharacterPartCatalog(
        createCharacterPartIndex([ selected ]),
        selected
    );

    assert.equal(catalog.slots[0].modifierKey, "makeup/bodyaugmentations");
    assert.equal(catalog.slots[0].adapterSupported, true);
});

test("URL-owned part choices apply exact variations before first render", () =>
{
    const top = Record("10", { modifierKey: "top" });
    const topA = Record("100", { resGender: 0, resPath: "res:/female/top/a" });
    const topB = Record("101", { resGender: 0, resPath: "res:/female/top/b" });
    const paperdoll = Paperdoll("female-a", [ Modifier(top, topA, 0) ]);
    const donor = Paperdoll("female-b", [ Modifier(top, topB, 1) ]);
    const index = createCharacterPartIndex([ paperdoll, donor ]);
    const records = new Map([
        [ "characterModifierLocations:10", top ],
        [ "characterResources:100", topA ],
        [ "characterResources:101", topB ]
    ]);
    const manager = {
        Get(document, recordID) { return records.get(`${document}:${recordID}`) ?? null; }
    };

    applyCharacterPaperdollSelections(manager, index, paperdoll, [ {
        locationID: "10",
        choiceID: "101@1"
    } ]);
    assert.equal(paperdoll.modifiers[0].paperdollResourceID, topB);
    assert.equal(paperdoll.modifiers[0].paperdollResourceVariation, 1);

    applyCharacterPaperdollSelections(manager, index, paperdoll, [ {
        locationID: "10",
        choiceID: ""
    } ]);
    assert.equal(paperdoll.modifiers.length, 0);
});

test("part edits replace, add, remove, and reset hydrated modifier relationships", () =>
{
    const top = Record("10", { modifierKey: "top" });
    const feet = Record("20", { modifierKey: "feet" });
    const topA = Record("100", { resGender: 0 });
    const topB = Record("101", { resGender: 0 });
    const shoes = Record("102", { resGender: 0 });
    const paperdoll = Paperdoll("female-a", [ Modifier(top, topA, 3) ]);
    const original = captureCharacterPaperdollParts(paperdoll);

    setCharacterPaperdollPart(paperdoll, top, topB, 1);
    assert.equal(paperdoll.modifiers[0].paperdollResourceID, topB);
    assert.equal(paperdoll.modifiers[0].paperdollResourceVariation, 1);

    setCharacterPaperdollPart(paperdoll, feet, shoes);
    assert.equal(paperdoll.modifiers.length, 2);
    assert.equal(paperdoll.modifiers[1].modifierLocationID, feet);

    setCharacterPaperdollPart(paperdoll, top, null);
    assert.deepEqual(paperdoll.modifiers.map(value => value.modifierLocationID), [ feet ]);

    setCharacterPaperdollPart(paperdoll, feet, null);
    assert.equal(paperdoll.modifiers.length, 0);

    restoreCharacterPaperdollParts(paperdoll, original);
    assert.equal(paperdoll.modifiers.length, 1);
    assert.equal(paperdoll.modifiers[0].modifierLocationID, top);
    assert.equal(paperdoll.modifiers[0].paperdollResourceID, topA);
    assert.equal(paperdoll.modifiers[0].paperdollResourceVariation, 3);
});

class TestModifier
{
    modifierLocationID = null;

    paperdollResourceID = null;

    paperdollResourceVariation = 0;
}

function Modifier(location, resource, variation = 0)
{
    const value = new TestModifier();
    value.modifierLocationID = location;
    value.paperdollResourceID = resource;
    value.paperdollResourceVariation = variation;
    return value;
}

function Paperdoll(recordID, modifiers)
{
    return { recordID, modifiers };
}

function Record(recordID, values = {})
{
    return { recordID, ...values };
}

function TypeDefinition(sourcePath, partType)
{
    return {
        sourcePath,
        extension: ".type",
        values: [
            partType.partPath,
            partType.resourceVersion,
            partType.colorVariant
        ]
    };
}

function ColorDefinition(sourcePath, channel)
{
    return {
        sourcePath,
        extension: ".color",
        values: {
            colors: [
                [ channel, 0.2, 0.3, 1 ],
                [ 0.4, channel, 0.6, 1 ],
                [ 0.7, 0.8, channel, 1 ]
            ],
            pattern: ""
        }
    };
}

function DefinitionLibrary(records)
{
    return {
        Get(document, recordID)
        {
            return document === "characterDefinitions"
                ? records.get(recordID) ?? null
                : null;
        }
    };
}
