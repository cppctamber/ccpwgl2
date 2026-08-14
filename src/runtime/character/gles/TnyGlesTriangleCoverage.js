const coverageStates = new WeakMap();

/**
 * Reversibly masks triangles influenced by one exact demo-owned foundation
 * coverage policy. Cached geometry can be shared by overlapping revisions, so
 * leases keep the mask active until the final committed consumer releases it.
 */
export class TnyGlesTriangleCoverage
{
    /** Acquires one exact triangle-coverage lease and returns its detached report. */
    static async Acquire(geometryResource, policy, { gl = null } = {})
    {
        ValidatePolicy(policy);
        if (!Array.isArray(geometryResource?.meshes) || !geometryResource.meshes.length)
        {
            throw new Error("Legacy triangle coverage requires geometry meshes");
        }

        let state = coverageStates.get(geometryResource);
        if (state?.leases.size)
        {
            ApplyPrepared(state.prepared, gl);
            const lease = {};
            state.leases.add(lease);
            return { lease, report: CloneReport(state.report) };
        }

        await geometryResource.ForceSystemMirror?.(true);
        const prepared = geometryResource.meshes.map(mesh => PrepareMesh(
            mesh,
            policy.bonePrefixes
        ));
        if (prepared.some(value => !value.available)
            || !prepared.some(value => value.maskedTriangleCount > 0))
        {
            throw new Error("Legacy foot/toe triangle coverage could not be prepared");
        }

        ApplyPrepared(prepared, gl);
        geometryResource.RebuildBounds?.(true);

        const report = {
            status: "applied",
            rule: policy.triangleRule,
            bonePrefixes: [ ...policy.bonePrefixes ],
            matchedBoneCount: prepared.reduce((sum, value) => sum + value.matchedBoneCount, 0),
            maskedVertexCount: prepared.reduce((sum, value) => sum + value.maskedVertexCount, 0),
            maskedTriangleCount: prepared.reduce((sum, value) => sum + value.maskedTriangleCount, 0),
            meshReports: prepared.map(value => ({
                available: value.available,
                matchedBoneCount: value.matchedBoneCount,
                maskedVertexCount: value.maskedVertexCount,
                maskedTriangleCount: value.maskedTriangleCount,
                uploaded: true
            }))
        };
        const lease = {};
        state = { leases: new Set([ lease ]), prepared, report };
        coverageStates.set(geometryResource, state);
        return { lease, report: CloneReport(report) };
    }

    /** Releases one lease, restoring the captured indices after the final owner. */
    static Release(geometryResource, lease, { gl = null } = {})
    {
        const state = coverageStates.get(geometryResource);
        if (!state?.leases.delete(lease)) return false;
        if (state.leases.size) return true;

        const failures = RestorePrepared(state.prepared, gl);
        if (failures.length)
        {
            const reapplyFailures = TryApplyPrepared(state.prepared, gl);
            state.leases.add(lease);
            failures.push(...reapplyFailures);
            const error = new Error("Legacy triangle coverage restore failed");
            error.errors = failures;
            throw error;
        }
        geometryResource.RebuildBounds?.(true);
        coverageStates.delete(geometryResource);
        return true;
    }
}

function ApplyPrepared(prepared, gl)
{
    const applied = [];
    try
    {
        for (const item of prepared)
        {
            SetIndices(item.mesh.indexData, item.maskedIndices);
            applied.push(item);
            if (!UploadIndices(item.mesh, gl))
            {
                throw new Error("Legacy foot/toe triangle coverage upload failed");
            }
        }
    }
    catch (error)
    {
        error.rollbackFailures = RestorePrepared(applied, gl);
        throw error;
    }
}

function TryApplyPrepared(prepared, gl)
{
    try
    {
        ApplyPrepared(prepared, gl);
        return [];
    }
    catch (error)
    {
        return [ error, ...(error.rollbackFailures ?? []) ];
    }
}

function PrepareMesh(mesh, bonePrefixes)
{
    const indices = mesh?.indexData;
    const bindings = Array.isArray(mesh?.boneBindings) ? mesh.boneBindings : [];
    const stride = Number(mesh?.declaration?.stride) / 4;
    const vertexCount = Number(mesh?._vertices)
        || (Number.isInteger(stride) && stride > 0 && mesh?.bufferData
            ? Math.floor(mesh.bufferData.length / stride)
            : 0);
    if (!indices?.length || !bindings.length || !vertexCount
        || typeof mesh?.GetVertexBlendIndice !== "function"
        || typeof mesh?.GetVertexBlendWeight !== "function")
    {
        return { mesh, available: false, originalIndices: null, maskedIndices: null,
            matchedBoneCount: 0, maskedVertexCount: 0, maskedTriangleCount: 0 };
    }

    const originalIndices = indices.slice();
    const maskedIndices = indices.slice();
    const prefixes = bonePrefixes.map(value => value.toLowerCase());
    const matchedBones = new Set();
    bindings.forEach((binding, index) =>
    {
        const name = String(binding ?? "").toLowerCase();
        if (prefixes.some(prefix => name.startsWith(prefix))) matchedBones.add(index);
    });

    const affected = new Uint8Array(vertexCount);
    const blendIndices = [ 0, 0, 0, 0 ];
    const blendWeights = [ 0, 0, 0, 0 ];
    let maskedVertexCount = 0;
    for (let vertex = 0; vertex < vertexCount; vertex++)
    {
        if (mesh.declaration?.swapBlendWeightsAndIndices === false)
        {
            mesh.GetVertexBlendWeight(blendIndices, vertex);
            mesh.GetVertexBlendIndice(blendWeights, vertex);
        }
        else
        {
            mesh.GetVertexBlendIndice(blendIndices, vertex);
            mesh.GetVertexBlendWeight(blendWeights, vertex);
        }
        for (let influence = 0; influence < 4; influence++)
        {
            const boneIndex = Math.round(Number(blendIndices[influence]));
            const weight = Math.abs(Number(blendWeights[influence]) || 0);
            if (weight <= 1e-6 || !matchedBones.has(boneIndex)) continue;
            affected[vertex] = 1;
            maskedVertexCount++;
            break;
        }
    }

    let maskedTriangleCount = 0;
    for (let index = 0; index + 2 < maskedIndices.length; index += 3)
    {
        const a = Number(maskedIndices[index]);
        const b = Number(maskedIndices[index + 1]);
        const c = Number(maskedIndices[index + 2]);
        if (![ a, b, c ].every(value => Number.isInteger(value)
            && value >= 0 && value < vertexCount)) continue;
        if (!affected[a] && !affected[b] && !affected[c]) continue;
        maskedIndices[index + 1] = a;
        maskedIndices[index + 2] = a;
        maskedTriangleCount++;
    }

    return {
        mesh,
        available: true,
        originalIndices,
        maskedIndices,
        matchedBoneCount: matchedBones.size,
        maskedVertexCount,
        maskedTriangleCount
    };
}

function RestorePrepared(prepared, gl)
{
    const failures = [];
    for (const item of [ ...prepared ].reverse())
    {
        try
        {
            SetIndices(item.mesh.indexData, item.originalIndices);
            if (!UploadIndices(item.mesh, gl)) throw new Error("index restore upload failed");
        }
        catch (error)
        {
            failures.push(error);
        }
    }
    return failures;
}

function SetIndices(target, source)
{
    if (typeof target?.set === "function") target.set(source);
    else source.forEach((value, index) => { target[index] = value; });
}

function UploadIndices(mesh, gl)
{
    if (!gl || !mesh?.indexes || !gl.bindBuffer || !gl.bufferSubData) return false;
    const previous = gl.getParameter && gl.ELEMENT_ARRAY_BUFFER_BINDING !== undefined
        ? gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING)
        : null;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexes);
    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, mesh.indexData);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, previous);
    return true;
}

function ValidatePolicy(policy)
{
    const expected = [ "LeftFoot", "RightFoot", "LeftToe", "RightToe" ];
    if (policy?.strategy !== "triangle-mask"
        || policy?.triangleRule !== "legacy-opengl-exact-foundation-triangle-coverage-v1"
        || policy?.evidence?.status !== "policy"
        || ![
            "legacy-opengl-exact-foundation-coverage-v1",
            "legacy-opengl-authored-footwear-coverage-v1"
        ].includes(policy?.evidence?.rule)
        || !Array.isArray(policy?.bonePrefixes)
        || policy.bonePrefixes.length !== expected.length
        || expected.some((value, index) => policy.bonePrefixes[index] !== value))
    {
        throw new TypeError("Unsupported legacy triangle coverage policy");
    }
}

function CloneReport(value)
{
    return {
        ...value,
        bonePrefixes: [ ...value.bonePrefixes ],
        meshReports: value.meshReports.map(report => ({ ...report }))
    };
}
