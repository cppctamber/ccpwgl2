import assert from "node:assert/strict";
import test from "node:test";

import { CcpwglLegacyTexturePolicy } from "../src/character/CcpwglLegacyTexturePolicy.mjs";

const root = "res:/graphics/character/female/paperdoll/topmiddle/shirtcf01";
const typePath = `${root}/types/shirtcf01_generic02.type`;
const materialPath = `${root}/generic02.color`;

test("legacy texture policy joins exact retained type and color definitions without dropping candidates", () =>
{
    const fixture = CreateFixture();
    const result = new CcpwglLegacyTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.length, 1);
    assert.equal(result[0].ownerSelectionIndex, 0);
    assert.deepEqual(result[0].source, {
        partSourceRecordID: "female/topmiddle/shirtcf01",
        versionIndex: 0,
        typeDefinitionPath: typePath,
        materialDefinitionPath: materialPath
    });
    assert.strictEqual(result[0].materialValues, fixture.materialValues);
    assert.equal(result[0].textureCandidates.length, 9);
    assert.equal(result[0].textureCandidates.filter(value => value.selected).length, 4);
    assert.deepEqual(result[0].selectedTextures.map(value => [ value.role, value.path ]), [
        [ "colorize-layer", `${root}/colorize_body_l_4k.png` ],
        [ "colorize-zones", `${root}/colorize_body_z_4k.png` ],
        [ "normal-source", `${root}/shirtcf01_n_4k.png` ],
        [ "specular-source", `${root}/shirtcf01_s_4k.png` ]
    ]);
    assert.deepEqual(
        result[0].textureCandidates.find(value => value.path.endsWith("unclassified.png")),
        {
            path: `${root}/unclassified.png`,
            family: "unclassified",
            quality: "standard",
            role: null,
            target: null,
            recognized: false,
            selected: false
        }
    );
    assert.deepEqual(result[0].diagnostics, []);
    assert.equal(result[0].evidence.rule, "legacy-opengl-texture-filename-v1");
});

test("legacy texture policy reports missing material evidence while retaining all texture paths", () =>
{
    const fixture = CreateFixture();

    fixture.definitions.delete(materialPath);
    const [ result ] = new CcpwglLegacyTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.materialValues, null);
    assert.equal(result.textureCandidates.length, 9);
    assert.equal(result.diagnostics[0].code, "MATERIAL_DEFINITION_UNRESOLVED");
});

test("schema-v8 plan texture paths retain and classify dependency cut masks", () =>
{
    const fixture = CreateFixture();
    const part = fixture.plan.parts[0];

    fixture.library.schemaVersion = 8;
    part.texturePaths = [
        "res:/graphics/character/female/paperdoll/dependants/masktuck/tuckmaskmid/comp_body_m.png",
        "res:/graphics/character/female/paperdoll/dependants/masktuck/tuckmaskmid/comp_body_m_512.png"
    ];

    const [ result ] = new CcpwglLegacyTexturePolicy().Resolve(
        fixture.library,
        fixture.paperdoll,
        fixture.plan
    );

    assert.equal(result.textureCandidates.length, 2);
    assert.deepEqual(result.selectedTextures, [ {
        path: part.texturePaths[0],
        role: "cut-mask",
        target: "body",
        quality: "standard"
    } ]);
});

function CreateFixture()
{
    const materialValues = {
        colors: [
            [ 0.121569, 0.152941, 0.152941, 1 ],
            [ 0.0588235, 0.0666667, 0.0666667, 1 ],
            [ 0.380392, 0.419608, 0.419608, 1 ]
        ],
        pattern: ""
    };
    const definitions = new Map([ [ typePath, {
        sourcePath: typePath,
        extension: ".type",
        values: [ "topmiddle/shirtcf01", "", "generic02" ]
    } ], [ materialPath, {
        sourcePath: materialPath,
        extension: ".color",
        values: materialValues
    } ] ]);
    const version = {
        resourceVersion: null,
        configurationCandidates: [],
        geometryCandidates: [],
        textureCandidates: [
            `${root}/colorize_body_l.png`,
            `${root}/colorize_body_l_4k.png`,
            `${root}/colorize_body_z_512.png`,
            `${root}/colorize_body_z_4k.png`,
            `${root}/shirtcf01_n.png`,
            `${root}/shirtcf01_n_4k.png`,
            `${root}/shirtcf01_s_512.png`,
            `${root}/shirtcf01_s_4k.png`,
            `${root}/unclassified.png`
        ]
    };
    const partSource = {
        recordID: "female/topmiddle/shirtcf01",
        versions: [ version ]
    };
    const partType = {
        sourcePath: typePath,
        sourcePaths: [ typePath ],
        partPath: "topmiddle/shirtcf01",
        resourceVersion: null,
        colorVariant: "generic02"
    };
    const resource = {
        resGender: 0,
        partType
    };
    const paperdoll = {
        modifiers: [ { paperdollResourceID: resource } ]
    };
    const part = {
        origin: {
            recordID: partSource.recordID,
            jsonPointer: "/versions/0"
        }
    };
    const owner = { groupID: "topmiddle" };
    const plan = {
        selections: [ owner ],
        parts: [ part ],
        layers: [ {
            owner,
            contributor: part,
            origin: { jsonPointer: "/modifiers/0" }
        } ]
    };
    const records = new Map([ [ `characterPartSources\0${partSource.recordID}`, partSource ] ]);
    const library = {
        schema: "carbonenginejs.characterLibrary",
        schemaVersion: 7,
        Get(documentName, recordID)
        {
            if (documentName === "characterDefinitions") return definitions.get(recordID) ?? null;
            return records.get(`${documentName}\0${recordID}`) ?? null;
        }
    };

    return { definitions, library, materialValues, paperdoll, plan };
}
