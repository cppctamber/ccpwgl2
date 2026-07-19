const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const parser = require("@babel/parser");


const sourceRoot = path.resolve(__dirname, "../src");
const files = getJavaScriptFiles(sourceRoot);
const methods = [];

for (const filePath of files)
{
    const source = fs.readFileSync(filePath, "utf8");
    const ast = parser.parse(source, {
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

    visit(ast, node => {
        if (node.type !== "ClassMethod" || getKeyName(node.key) !== "GetResources") return;
        methods.push({ filePath, node });
    });
}

assert.ok(methods.length, "Expected to find GetResources implementations");

for (const { filePath, node } of methods)
{
    const location = `${path.relative(sourceRoot, filePath)}:${node.loc.start.line}`;
    const parameter = node.params[0];
    assert.equal(
        parameter?.type,
        "AssignmentPattern",
        `${location} GetResources must default its output parameter`
    );
    assert.equal(
        parameter?.right?.type,
        "ArrayExpression",
        `${location} GetResources must use an empty array default`
    );

    const statements = node.body.body;
    assert.equal(
        statements.at(-1)?.type,
        "ReturnStatement",
        `${location} GetResources must end by returning an array`
    );

    visit(node.body, child => {
        if (child.type === "ReturnStatement")
        {
            assert.ok(child.argument, `${location} GetResources must not use a bare return`);
        }
    });
}

console.log(`GetResources contract verified for ${methods.length} implementations`);

function getJavaScriptFiles(directory)
{
    const out = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }))
    {
        const filePath = path.join(directory, entry.name);
        if (entry.isDirectory()) out.push(...getJavaScriptFiles(filePath));
        else if (entry.isFile() && filePath.endsWith(".js")) out.push(filePath);
    }
    return out;
}

function getKeyName(key)
{
    if (key?.type === "Identifier" || key?.type === "StringLiteral") return key.name || key.value;
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
