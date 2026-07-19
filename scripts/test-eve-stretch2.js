/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const parser = require("@babel/parser");


const root = path.resolve(__dirname, "..");
const stretchPath = path.join(root, "src/eve/effect/EveStretch2.js");
const unsupportedPath = path.join(root, "src/unsupported/eve/effect/EveStretch2.js");
const controllerPath = path.join(root, "src/eve/effect/EveTurretFiringFX.js");
const shaderOverridesPath = path.join(root, "src/core/shader/shaderOverrides.json");

assert.equal(fs.existsSync(stretchPath), true, "EveStretch2 must be owned by the supported eve/effect module");
assert.equal(fs.existsSync(unsupportedPath), false, "the unsupported module must not retain an EveStretch2 copy");

const stretchSource = fs.readFileSync(stretchPath, "utf8");
const controllerSource = fs.readFileSync(controllerPath, "utf8");
const shaderOverrides = JSON.parse(fs.readFileSync(shaderOverridesPath, "utf8"));
const stretchClass = findClass(parse(stretchSource), "EveStretch2");
const controllerClass = findClass(parse(controllerSource), "EveTurretFiringFX");

assert.ok(stretchClass, "EveStretch2 class must be exported");
assert.ok(controllerClass, "EveTurretFiringFX class must be exported");

for (const method of [
    "GetBatches",
    "GetPerObjectData",
    "PrepareBuffers",
    "Render",
    "SetFiringTransform",
    "StartFiring",
    "StopFiring",
    "UpdatePerObjectData"
])
{
    assert.equal(hasMethod(stretchClass, method), true, `EveStretch2.${method} must be implemented`);
}

assert.match(stretchSource, /static MAX_QUAD_COUNT = 128;/);
assert.match(stretchSource, /new Float32Array\(EveStretch2\.MAX_QUAD_COUNT \* 4 \* 2\)/);
assert.match(stretchSource, /new Uint16Array\(EveStretch2\.MAX_QUAD_COUNT \* 6\)/);
assert.match(stretchSource, /gl\.drawElements\(gl\.TRIANGLES, this\.quadCount \* 6, gl\.UNSIGNED_SHORT, 0\)/);
assert.match(stretchSource, /fragmentSize > 12 \? this\._perObjectData : this\._perObjectDataShort/);
assert.match(stretchSource, /data\[3\] = this\._currentDestinationScale;/);
assert.match(stretchSource, /data\[7\] = this\._destinationScale;/);
assert.match(stretchSource, /data\[11\] = this\._effectData0RandomSeed;/);
assert.match(stretchSource, /data\[12\] = this\._effectData1X;/);

assert.doesNotMatch(controllerSource, /stretch\.splice\(/, "the firing controller must not discard Stretch2 instances");
assert.match(controllerSource, /typeof stretch\.SetFiringTransform === "function"/);
assert.match(controllerSource, /stretch\.StartFiring\(delay\)/);
assert.match(controllerSource, /stretch\.StopFiring\(\)/);
assert.equal(hasMethod(controllerClass, "GetCurveDuration"), true);
assert.equal(hasMethod(controllerClass, "StartMuzzleEffect"), true);

const dynamicCornerLookup = "c[0+a0.x]";
for (const family of [ "artillery", "atomic", "blast", "laser", "projectile" ])
{
    const overrides = shaderOverrides[`${family}.vertex`];
    assert.ok(overrides, `${family} must have a vertex-stage shader override`);
    assert.equal(
        overrides[dynamicCornerLookup],
        "(a0.x==0?c[0]:(a0.x==1?c[1]:(a0.x==2?c[2]:c[3])))",
        `${family} must expand corner-indexed local constants into constant indices 0..3`
    );
}

console.log("EveStretch2 render/controller contract and GLES corner-index overrides verified");


function parse(source)
{
    return parser.parse(source, {
        sourceType: "module",
        plugins: [
            "classProperties",
            "decorators-legacy",
            "dynamicImport",
            "nullishCoalescingOperator",
            "objectRestSpread",
            "optionalChaining"
        ]
    });
}


function findClass(ast, name)
{
    for (const statement of ast.program.body)
    {
        const node = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
        if (node && node.type === "ClassDeclaration" && node.id && node.id.name === name) return node;
    }
    return null;
}


function hasMethod(classNode, name)
{
    return classNode.body.body.some(node =>
        node.type === "ClassMethod" && (node.key.name || node.key.value) === name
    );
}
