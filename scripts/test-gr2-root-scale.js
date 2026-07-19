const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");


async function main()
{
    const { CjsFormatGr2 } = await import("@carbonenginejs/format-gr2");
    const authoredScale = [
        0.75, 0, 0,
        0, 0.75, 0,
        0, 0, 0.75
    ];
    const decoded = CjsFormatGr2.curves.decode({
        format: 3,
        degree: 0,
        controls: authoredScale
    }, 9);

    assert.deepEqual(decoded.controls, authoredScale, "Normalized GR2 curves must preserve authored root scale");

    const readerPath = path.resolve(__dirname, "../src/core/reader/geometry/Gr2Reader.js");
    const readerSource = fs.readFileSync(readerPath, "utf8");
    assert.doesNotMatch(
        readerSource,
        /track\.name\.toUpperCase\(\)\s*===\s*["']ROOT["'][\s\S]{0,120}mat3\.identity\(track\.scaleShear\.controls\)/,
        "Gr2Reader must not replace authored ROOT scale-shear controls with identity"
    );

    console.log("GR2 authored root scale preservation verified");
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
