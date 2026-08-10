import assert from "node:assert/strict";
import test from "node:test";

import {
    CcpwglLegacyPaletteCompatibility
} from "../src/character/CcpwglLegacyPaletteCompatibility.mjs";

const POLICY = {
    status: "policy",
    rule: "legacy-opengl-bone-capacity-mask-v1",
    shaderCapacity: 58,
    requiredBoneCount: 69,
    bonePrefixes: [ "RightHand" ]
};

test("legacy palette compatibility masks only triangles influenced by the declared bone family", async () =>
{
    const fixture = CreateFixture();
    const report = await CcpwglLegacyPaletteCompatibility.Apply(
        fixture.geometry,
        POLICY,
        { gl: fixture.gl }
    );

    assert.equal(fixture.forceSystemMirror, true);
    assert.equal(fixture.rebuiltBounds, true);
    assert.equal(report.status, "applied");
    assert.equal(report.matchedBoneCount, 2);
    assert.equal(report.maskedVertexCount, 2);
    assert.equal(report.maskedTriangleCount, 2);
    assert.deepEqual([ ...fixture.mesh.indexData ], [ 0, 0, 0, 1, 1, 1 ]);
    assert.equal(fixture.uploads.length, 1);
});

test("legacy palette compatibility is idempotent and fails when the GPU mutation cannot be proved", async () =>
{
    const fixture = CreateFixture();

    await CcpwglLegacyPaletteCompatibility.Apply(fixture.geometry, POLICY, { gl: fixture.gl });
    await CcpwglLegacyPaletteCompatibility.Apply(fixture.geometry, POLICY, { gl: fixture.gl });

    assert.deepEqual([ ...fixture.mesh.indexData ], [ 0, 0, 0, 1, 1, 1 ]);
    assert.equal(fixture.uploads.length, 2);

    const unavailable = CreateFixture();
    await assert.rejects(
        CcpwglLegacyPaletteCompatibility.Apply(unavailable.geometry, POLICY),
        /could not be applied/u
    );
});

function CreateFixture()
{
    const influences = [ 0, 1, 0, 2 ];
    const mesh = {
        _vertices: 4,
        boneBindings: [ "Hips", "RightHand", "RightHandIndex1" ],
        declaration: { stride: 16 },
        bufferData: new Float32Array(16),
        indexData: new Uint16Array([ 0, 1, 2, 1, 2, 3 ]),
        indexes: {},
        GetVertexBlendIndice(out, vertex)
        {
            out.splice(0, out.length, influences[vertex], 0, 0, 0);
        },
        GetVertexBlendWeight(out)
        {
            out.splice(0, out.length, 1, 0, 0, 0);
        }
    };
    const uploads = [];
    const gl = {
        ELEMENT_ARRAY_BUFFER: 1,
        ELEMENT_ARRAY_BUFFER_BINDING: 2,
        getParameter() { return "previous"; },
        bindBuffer(target, value) { this.bound = [ target, value ]; },
        bufferSubData(target, offset, values) { uploads.push([ target, offset, [ ...values ] ]); }
    };
    const result = {
        forceSystemMirror: false,
        rebuiltBounds: false,
        geometry: {
            meshes: [ mesh ],
            async ForceSystemMirror(value) { result.forceSystemMirror = value; },
            RebuildBounds(value) { result.rebuiltBounds = value; }
        },
        gl,
        mesh,
        uploads
    };
    return result;
}
