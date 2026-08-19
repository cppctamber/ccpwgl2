import assert from "node:assert/strict";
import test from "node:test";

import {
    TnyGlesTriangleCoverage
} from "./runtime-character-modules.mjs";

const POLICY = {
    strategy: "triangle-mask",
    roles: [ "body" ],
    triangleRule: "legacy-opengl-exact-foundation-triangle-coverage-v1",
    bonePrefixes: [ "LeftFoot", "RightFoot", "LeftToe", "RightToe" ],
    evidence: {
        status: "policy",
        rule: "legacy-opengl-exact-foundation-coverage-v1"
    }
};

const LEG_POLICY = {
    strategy: "triangle-mask",
    roles: [ "body" ],
    triangleRule: "legacy-opengl-exact-foundation-triangle-coverage-v1",
    triangleSelection: "all-vertices",
    bonePrefixes: [
        "LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg",
        "LeftFoot", "RightFoot", "LeftToe", "RightToe"
    ],
    evidence: {
        status: "policy",
        rule: "legacy-opengl-authored-leg-coverage-v1"
    }
};

test("triangle coverage masks exact semantic triangles and restores after the final lease", async () =>
{
    const fixture = CreateFixture();
    const original = [ ...fixture.mesh.indexData ];
    const first = await TnyGlesTriangleCoverage.Acquire(
        fixture.geometry,
        POLICY,
        { gl: fixture.gl }
    );
    const second = await TnyGlesTriangleCoverage.Acquire(
        fixture.geometry,
        POLICY,
        { gl: fixture.gl }
    );

    assert.deepEqual([ ...fixture.mesh.indexData ], [ 0, 0, 0, 2, 3, 4 ]);
    assert.equal(first.report.matchedBoneCount, 1);
    assert.equal(first.report.maskedVertexCount, 1);
    assert.equal(first.report.maskedTriangleCount, 1);
    assert.deepEqual(second.report, first.report);
    assert.equal(TnyGlesTriangleCoverage.Release(
        fixture.geometry,
        first.lease,
        { gl: fixture.gl }
    ), true);
    assert.deepEqual([ ...fixture.mesh.indexData ], [ 0, 0, 0, 2, 3, 4 ]);
    assert.equal(TnyGlesTriangleCoverage.Release(
        fixture.geometry,
        second.lease,
        { gl: fixture.gl }
    ), true);
    assert.deepEqual([ ...fixture.mesh.indexData ], original);
    assert.equal(fixture.forceSystemMirror, true);
    assert.equal(fixture.rebuildBounds, 4);
});

test("triangle coverage rolls CPU indices back when the GPU upload fails", async () =>
{
    const fixture = CreateFixture({ failUploadAt: 1 });
    const original = [ ...fixture.mesh.indexData ];

    await assert.rejects(
        TnyGlesTriangleCoverage.Acquire(
            fixture.geometry,
            POLICY,
            { gl: fixture.gl }
        ),
        /upload failure/u
    );
    assert.deepEqual([ ...fixture.mesh.indexData ], original);
});

test("triangle coverage unions overlapping authored policies and restores each lease", async () =>
{
    const fixture = CreateFixture();
    const original = [ ...fixture.mesh.indexData ];
    const feet = await TnyGlesTriangleCoverage.Acquire(
        fixture.geometry,
        POLICY,
        { gl: fixture.gl }
    );
    const legs = await TnyGlesTriangleCoverage.Acquire(
        fixture.geometry,
        LEG_POLICY,
        { gl: fixture.gl }
    );

    assert.deepEqual([ ...fixture.mesh.indexData ], [ 0, 0, 0, 2, 2, 2 ]);
    assert.equal(TnyGlesTriangleCoverage.Release(
        fixture.geometry,
        legs.lease,
        { gl: fixture.gl }
    ), true);
    assert.deepEqual([ ...fixture.mesh.indexData ], [ 0, 0, 0, 2, 3, 4 ]);
    assert.equal(TnyGlesTriangleCoverage.Release(
        fixture.geometry,
        feet.lease,
        { gl: fixture.gl }
    ), true);
    assert.deepEqual([ ...fixture.mesh.indexData ], original);
});

function CreateFixture({ failUploadAt = -1 } = {})
{
    let uploads = 0;
    const mesh = {
        indexData: new Uint16Array([ 0, 1, 2, 2, 3, 4 ]),
        indexes: {},
        boneBindings: [ "LeftFoot", "Spine", "LeftUpLeg" ],
        declaration: { stride: 16 },
        _vertices: 5,
        GetVertexBlendIndice(out, vertex)
        {
            out[0] = vertex === 0 ? 0 : vertex >= 2 ? 2 : 1;
            out[1] = out[2] = out[3] = 0;
        },
        GetVertexBlendWeight(out)
        {
            out[0] = 1;
            out[1] = out[2] = out[3] = 0;
        }
    };
    const fixture = {
        mesh,
        forceSystemMirror: false,
        rebuildBounds: 0,
        geometry: {
            meshes: [ mesh ],
            async ForceSystemMirror(value)
            {
                fixture.forceSystemMirror = value;
            },
            RebuildBounds()
            {
                fixture.rebuildBounds++;
            }
        },
        gl: {
            ELEMENT_ARRAY_BUFFER: 1,
            ELEMENT_ARRAY_BUFFER_BINDING: 2,
            getParameter() { return null; },
            bindBuffer() {},
            bufferSubData()
            {
                uploads++;
                if (uploads === failUploadAt) throw new Error("synthetic upload failure");
            }
        }
    };
    return fixture;
}
