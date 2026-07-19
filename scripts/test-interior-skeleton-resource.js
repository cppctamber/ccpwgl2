const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");


const controllerPath = path.resolve(
    __dirname,
    "../src/unsupported/interior/character/Tr2InteriorAnimationController.js"
);
const controllerSource = fs.readFileSync(controllerPath, "utf8");
const rebuildSource = controllerSource.slice(controllerSource.indexOf("static DoRebuildCachedData"));

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
