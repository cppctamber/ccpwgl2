const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");


const commonPath = path.resolve(
    __dirname,
    "../src/unsupported/eve/child/modifier/EveChildModifierTransformCommon.js"
);
const commonSource = fs.readFileSync(commonPath, "utf8");
const functionMatch = commonSource.match(
    /export function rotateIntoBasis\(out, v, transform\)\s*\{[\s\S]*?\n\}/
);

assert.ok(functionMatch, "Expected exported rotateIntoBasis helper");

const sandbox = {};
vm.runInNewContext(
    `${functionMatch[0].replace("export ", "")}\nthis.rotateIntoBasis = rotateIntoBasis;`,
    sandbox
);

const transform = new Float32Array([
    0, 2, 0, 0,
    -3, 0, 0, 0,
    0, 0, 4, 0,
    100, -50, 25, 1
]);
const value = new Float32Array([ 5, 7, 11 ]);

sandbox.rotateIntoBasis(value, value, transform);
assert.deepEqual(
    Array.from(value),
    [ 14, -15, 44 ],
    "basis rotation must support in-place use, nonuniform scale, and ignore translation"
);

const haloPath = path.resolve(
    __dirname,
    "../src/unsupported/eve/child/modifier/EveChildModifierHalo.js"
);
const haloSource = fs.readFileSync(haloPath, "utf8");

assert.match(commonSource, /rotateIntoBasis\(camFwd, outD, transform\)/);
assert.match(commonSource, /rotateIntoBasis\(right, right, transform\)/);
assert.match(haloSource, /rotateIntoBasis\(camFwd, dir, parentTransform\)/);
assert.match(haloSource, /rotateIntoBasis\(right, right, parentTransform\)/);
assert.doesNotMatch(commonSource, /mat4\.transpose\(parentT, transform\)/);
assert.doesNotMatch(haloSource, /mat4\.transpose\(parentT, parentTransform\)/);

console.log("Child modifier basis rotation verified");
