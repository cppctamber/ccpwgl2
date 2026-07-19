/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");


const cewgSourcePath = path.resolve(
    __dirname,
    "../src/unsupported/interior/cewg/CewgInteriorPerObjectData.js"
);
const cewgSource = fs.readFileSync(cewgSourcePath, "utf8")
    .replace(/export const /g, "const ")
    .replace(/export class /g, "class ")
    .replace(/export function /g, "function ");
const {
    CewgInteriorPerObjectData,
    CewgInteriorPerObjectAdapter
} = new Function(
    `${cewgSource}\nreturn { CewgInteriorPerObjectData, CewgInteriorPerObjectAdapter };`
)();

const sourcePath = path.resolve(__dirname, "../src/unsupported/interior/Tr2InteriorPerObjectData.js");
const source = fs.readFileSync(sourcePath, "utf8")
    .replace(/^import[\s\S]*?;\r?\n/gm, "")
    .replace("export class GLESPerObjectDataInterior", "class GLESPerObjectDataInterior")
    .replace(/export \{[^}]+\};?\s*$/, "");

const mat4 = {
    transpose(out, value)
    {
        for (let row = 0; row < 4; row++)
        {
            for (let column = 0; column < 4; column++)
            {
                out[column * 4 + row] = value[row * 4 + column];
            }
        }
        return out;
    }
};

class Tw2PerObjectData {}
class Tw2RawData
{
    static from(layout)
    {
        return createLayoutRawData(layout);
    }
}

const createClass = new Function(
    "mat4",
    "Tw2PerObjectData",
    "Tw2RawData",
    "CewgInteriorPerObjectData",
    "CewgInteriorPerObjectAdapter",
    `${source}\nreturn GLESPerObjectDataInterior;`
);
const GLESPerObjectDataInterior = createClass(
    mat4,
    Tw2PerObjectData,
    Tw2RawData,
    CewgInteriorPerObjectData,
    CewgInteriorPerObjectAdapter
);

assert.equal(GLESPerObjectDataInterior.IDENTITY_JOINT_MAT.length, 58 * 12);
assert.equal(GLESPerObjectDataInterior.skinnedLayout.vs[0][1], 58 * 12);
assert.equal(
    GLESPerObjectDataInterior.skinnedLayout.vs
        .slice(0, 2)
        .reduce((sum, entry) => sum + entry[1], 0),
    195 * 4,
    "Legacy GLES WorldMat must remain at cb3[195]"
);

const world = new Float32Array([
    0, 1, 0, 0,
    -1, 0, 0, 0,
    0, 0, 1, 0,
    10, 20, 30, 1
]);

const skinned = createRawData(true);
GLESPerObjectDataInterior.Pack({ worldTransform: world }, { vs: skinned, ps: null });
assert.deepEqual(
    Array.from(skinned.Get("WorldMat")),
    Array.from(world),
    "Skinned avatar WorldMat must retain canonical columns and translation"
);

const unskinned = createRawData(false);
GLESPerObjectDataInterior.Pack({ worldTransform: world }, { vs: unskinned, ps: null });
assert.deepEqual(
    Array.from(unskinned.Get("WorldMat")),
    [
        0, -1, 0, 10,
        1, 0, 0, 20,
        0, 0, 1, 30,
        0, 0, 0, 1
    ],
    "Unskinned interior WorldMat must be packed as shader rows"
);

const fullJoints = Float32Array.from({ length: 69 * 12 }, (_, i) => Math.floor(i / 12) + 1);
const pod = new GLESPerObjectDataInterior();
const
    perFrameVSData = { data: new Float32Array([ 11 ]) },
    perFramePSData = { data: new Float32Array([ 22 ]) };
GLESPerObjectDataInterior.Pack({
    worldTransform: world,
    jointMatrices: fullJoints,
    perFrameVSData,
    perFramePSData
}, pod);
assert.strictEqual(pod.perFrameVSData, perFrameVSData);
assert.strictEqual(pod.perFramePSData, perFramePSData);
assert.equal(pod.vs.Get("JointMat").length, 58 * 12, "GLES palette must remain capped at 58 joints");
assert.deepEqual(
    Array.from(pod.vs.Get("JointMat").subarray(57 * 12, 58 * 12)),
    new Array(12).fill(58)
);
assert.equal(pod.cewgInteriorData.jointMatrices.length, 69 * 12);
assert(pod.cewgPerObjectPacker instanceof CewgInteriorPerObjectAdapter);
assert.deepEqual(
    Array.from(pod.cewgInteriorData.jointMatrices.subarray(68 * 12, 69 * 12)),
    new Array(12).fill(69),
    "CEWG snapshot must retain the full 69-joint palette"
);

console.log("Interior per-object matrix layouts verified");

function createRawData(withJoints)
{
    const values = new Map([
        [ "WorldMat", new Float32Array(16) ]
    ]);
    if (withJoints) values.set("JointMat", new Float32Array(696));

    return {
        Has(name)
        {
            return values.has(name);
        },
        Get(name)
        {
            return values.get(name);
        },
        Set(name, value)
        {
            values.get(name).set(value);
        }
    };
}


function createLayoutRawData(layout)
{
    const
        elements = new Map(),
        size = layout.reduce((sum, entry) => sum + elementSize(entry[1]), 0),
        data = new Float32Array(size);

    let offset = 0;
    for (let i = 0; i < layout.length; i++)
    {
        const
            entry = layout[i],
            length = elementSize(entry[1]),
            value = data.subarray(offset, offset + length);

        if (Array.isArray(entry[1])) value.set(entry[1]);
        elements.set(entry[0], value);
        offset += length;
    }

    return {
        data,
        Has: name => elements.has(name),
        Get: name => elements.get(name),
        Set(name, value)
        {
            elements.get(name).set(value);
        }
    };
}


function elementSize(value)
{
    return Array.isArray(value) ? value.length : value;
}
