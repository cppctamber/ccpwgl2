const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");


const controllerPath = path.resolve(
    __dirname,
    "../src/interior/character/Tr2InteriorAnimationController.js"
);
const controllerSource = fs.readFileSync(controllerPath, "utf8");
const rebuildSource = controllerSource.slice(controllerSource.indexOf("static DoRebuildCachedData"));
const configSource = fs.readFileSync(path.resolve(__dirname, "../src/config.js"), "utf8");
const unsupportedIndexSource = fs.readFileSync(
    path.resolve(__dirname, "../src/unsupported/index.js"),
    "utf8"
);

assert.equal(
    fs.existsSync(path.resolve(__dirname, "../src/unsupported/interior")),
    false,
    "The promoted interior runtime must not retain a second unsupported copy"
);
assert.match(configSource, /import \* as interior from "\.\/interior";/);
assert.match(configSource, /\{ \.\.\.interior \}/);
assert.doesNotMatch(unsupportedIndexSource, /interior/);

assert.match(
    rebuildSource,
    /^static DoRebuildCachedData[\s\S]*?for \(let i = 0; i < resource\.models\.length; \+\+i\)[\s\S]*?this\.AddModel\(controller, resource\.models\[i\]\);/,
    "Interior animation must register models from geometry-free skeleton resources"
);
assert.doesNotMatch(
    rebuildSource,
    /if \(resource\.meshes\.length\)[\s\S]{0,180}this\.AddModel\(/,
    "Skeleton model registration must not depend on render meshes"
);

console.log("Interior geometry-free skeleton registration verified");
