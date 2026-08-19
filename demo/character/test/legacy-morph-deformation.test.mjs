import assert from "node:assert/strict";
import test from "node:test";

import {
    SetTestTw2,
    TnyGlesMorphDeformation
} from "./runtime-character-modules.mjs";

SetTestTw2();

test("morph deformation classifies duplicate target identities without mutating geometry", async () =>
{
    const fixture = CreateFixture();
    const request = [ { targetName: "PushShape", weight: 0.5 } ];

    assert.deepEqual(TnyGlesMorphDeformation.ClassifyTarget(
        fixture.geometry,
        request
    ), {
        status: "exact",
        targetName: "PushShape",
        matchedMeshIndices: [ 0 ],
        coalescedMeshIndices: [],
        ambiguousMeshIndices: []
    });

    fixture.mesh.morphTargets.push({
        ...fixture.mesh.morphTargets[0],
        vertex: {
            position: fixture.mesh.morphTargets[0].vertex.position.slice(),
            normal: fixture.mesh.morphTargets[0].vertex.normal.slice()
        },
        vertexIndices: fixture.mesh.morphTargets[0].vertexIndices.slice()
    });

    assert.deepEqual(TnyGlesMorphDeformation.ClassifyTarget(
        fixture.geometry,
        request
    ), {
        status: "exact",
        targetName: "PushShape",
        matchedMeshIndices: [ 0 ],
        coalescedMeshIndices: [ 0 ],
        ambiguousMeshIndices: []
    });
    assert.equal(TnyGlesMorphDeformation.HasAnyTarget(fixture.geometry, request), true);
    const acquired = await TnyGlesMorphDeformation.Acquire(
        fixture.geometry,
        request,
        { gl: fixture.gl }
    );
    assert.equal(acquired.report.matchedTargetCount, 1);
    assert.deepEqual([ ...fixture.mesh.bufferData ], [ 0.5, 0, 0, 1, 1, 1 ]);
    TnyGlesMorphDeformation.Release(fixture.geometry, acquired.lease, { gl: fixture.gl });

    fixture.mesh.morphTargets[2].vertex.normal[0] = 2;

    assert.deepEqual(TnyGlesMorphDeformation.ClassifyTarget(
        fixture.geometry,
        request
    ), {
        status: "ambiguous",
        targetName: "PushShape",
        matchedMeshIndices: [],
        coalescedMeshIndices: [],
        ambiguousMeshIndices: [ 0 ]
    });
    assert.equal(TnyGlesMorphDeformation.HasAnyTarget(fixture.geometry, request), false);
    await assert.rejects(
        TnyGlesMorphDeformation.Acquire(fixture.geometry, request, { gl: fixture.gl }),
        /ambiguous on mesh 0/u
    );
});

test("morph deformation composes dense, sparse, and absolute targets from the original", async () =>
{
    const fixture = CreateFixture();
    const original = [ ...fixture.mesh.bufferData ];
    const requests = [
        { targetName: "PushShape", weight: 0.5 },
        { targetName: "AbsoluteShape", weight: 0.25 }
    ];
    const first = await TnyGlesMorphDeformation.Acquire(
        fixture.geometry,
        requests,
        { gl: fixture.gl }
    );
    const second = await TnyGlesMorphDeformation.Acquire(
        fixture.geometry,
        requests,
        { gl: fixture.gl }
    );

    assert.deepEqual([ ...fixture.mesh.bufferData ], [
        0.5, 0, 0,
        2.25, 2.25, 2.25
    ]);
    assert.deepEqual(first.report.matchedTargets, [ "absoluteshape", "pushshape" ]);
    assert.deepEqual(second.report, first.report);
    assert.equal(TnyGlesMorphDeformation.Release(
        fixture.geometry,
        first.lease,
        { gl: fixture.gl }
    ), true);
    assert.notDeepEqual([ ...fixture.mesh.bufferData ], original);
    assert.equal(TnyGlesMorphDeformation.Release(
        fixture.geometry,
        second.lease,
        { gl: fixture.gl }
    ), true);
    assert.deepEqual([ ...fixture.mesh.bufferData ], original);
    assert.equal(fixture.forceSystemMirror, true);
});

test("morph deformation rejects conflicting shared geometry and rolls back upload failure", async () =>
{
    const fixture = CreateFixture();
    const original = [ ...fixture.mesh.bufferData ];
    const acquired = await TnyGlesMorphDeformation.Acquire(
        fixture.geometry,
        [ { targetName: "PushShape", weight: 1 } ],
        { gl: fixture.gl }
    );

    await assert.rejects(
        TnyGlesMorphDeformation.Acquire(
            fixture.geometry,
            [ { targetName: "PushShape", weight: 0.5 } ],
            { gl: fixture.gl }
        ),
        /conflicts on shared geometry/u
    );
    TnyGlesMorphDeformation.Release(fixture.geometry, acquired.lease, { gl: fixture.gl });
    assert.deepEqual([ ...fixture.mesh.bufferData ], original);

    const failing = CreateFixture({ failUploadAt: 1 });
    const failingOriginal = [ ...failing.mesh.bufferData ];
    await assert.rejects(
        TnyGlesMorphDeformation.Acquire(
            failing.geometry,
            [ { targetName: "PushShape", weight: 1 } ],
            { gl: failing.gl }
        ),
        /upload failure/u
    );
    assert.deepEqual([ ...failing.mesh.bufferData ], failingOriginal);
});

function CreateFixture({ failUploadAt = -1 } = {})
{
    let uploads = 0;
    const position = { elements: 3, offset: 0 };
    const mesh = {
        buffer: {},
        bufferData: new Float32Array([ 0, 0, 0, 1, 1, 1 ]),
        declaration: {
            stride: 12,
            FindUsage(usage) { return usage === 0 ? position : null; }
        },
        _vertices: 2,
        morphTargets: [ {
            sourceName: "PushShape",
            name: "Push",
            dataIsDeltas: true,
            vertex: {
                position: new Float32Array([ 1, 0, 0 ]),
                normal: new Float32Array([ 0, 1, 0 ])
            },
            vertexIndices: new Uint32Array([ 0 ])
        }, {
            sourceName: "AbsoluteShape",
            name: "Absolute",
            dataIsDeltas: false,
            vertex: { POSITION: new Float32Array([ 6, 6, 6 ]) },
            vertexIndices: new Uint32Array([ 1 ])
        } ],
        RebuildBounds() {}
    };
    const fixture = {
        mesh,
        forceSystemMirror: false,
        geometry: {
            meshes: [ mesh ],
            async ForceSystemMirror(value) { fixture.forceSystemMirror = value; },
            RebuildBounds() {}
        },
        gl: {
            ARRAY_BUFFER: 1,
            ARRAY_BUFFER_BINDING: 2,
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
