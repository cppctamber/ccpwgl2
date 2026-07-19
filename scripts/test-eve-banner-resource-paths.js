const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");


const source = fs.readFileSync(
    path.resolve(__dirname, "../src/eve/item/EveBanner.js"),
    "utf8"
);

const expected = [
    "res:/graphics/generic/unit_plane.gr2",
    "res:/texture/fx/hologram/hologram_noise.dds",
    "res:/texture/fx/hologram/hologram_pulse_brighter.dds",
    "res:/texture/fx/logo/logomask_1px_border.dds",
    "res:/texture/global/white.dds",
    "res:/texture/global/black.dds"
];

for (const resourcePath of expected)
{
    assert.ok(source.includes(`"${resourcePath}"`), `Missing current resource path: ${resourcePath}`);
}

assert.doesNotMatch(source, /res:\/[^"']+\.(?:png|gr2_json)["']/i);
console.log("EveBanner resource paths verified");
