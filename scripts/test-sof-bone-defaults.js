const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const parser = require("@babel/parser");


const hullFiles = [
    "EveSOFDataHullPlaneSetItem.js",
    "EveSOFDataHullSpotlightSetItem.js",
    "EveSOFDataHullSpriteLineSetItem.js",
    "EveSOFDataHullSpriteSetItem.js"
];

for (const file of hullFiles)
{
    const filePath = path.resolve(__dirname, "../src/sof/hull", file);
    const ast = parse(filePath);
    let boneIndex = null;

    visit(ast, node => {
        if (node.type === "ClassProperty" && node.key?.name === "boneIndex")
        {
            boneIndex = getNumericValue(node.value);
        }
    });

    assert.equal(boneIndex, -1, `${file} must default missing boneIndex to -1`);
}

console.log("SOF missing-bone defaults verified");

function parse(filePath)
{
    return parser.parse(fs.readFileSync(filePath, "utf8"), {
        sourceType: "module",
        plugins: [ "classProperties", "decorators-legacy", "objectRestSpread" ]
    });
}

function getNumericValue(node)
{
    if (node?.type === "NumericLiteral") return node.value;
    if (node?.type === "UnaryExpression" && node.operator === "-")
    {
        return -getNumericValue(node.argument);
    }
    return null;
}

function visit(node, callback)
{
    if (!node || typeof node !== "object") return;
    callback(node);

    for (const value of Object.values(node))
    {
        if (Array.isArray(value))
        {
            for (const child of value) visit(child, callback);
        }
        else
        {
            visit(value, callback);
        }
    }
}
