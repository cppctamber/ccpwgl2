const originalIndices = new WeakMap();

/**
 * Applies explicit geometry compatibility policies required by the temporary
 * legacy OpenGL character renderer.
 */
export class TnyGlesPaletteCompatibility
{
    /** Applies one declared compatibility policy to a fetched geometry resource. */
    static async Apply(geometryResource, policy, { gl = null } = {})
    {
        ValidatePolicy(policy);

        if (!Array.isArray(geometryResource?.meshes) || !geometryResource.meshes.length)
        {
            throw new Error("Legacy palette compatibility requires geometry meshes");
        }

        await geometryResource.ForceSystemMirror?.(true);

        const reports = geometryResource.meshes.map(mesh => MaskMesh(mesh, policy.bonePrefixes, gl));
        const report = {
            status: reports.every(value => value.available && value.uploaded)
                ? "applied"
                : "failed",
            rule: policy.rule,
            shaderCapacity: policy.shaderCapacity,
            requiredBoneCount: policy.requiredBoneCount,
            bonePrefixes: [ ...policy.bonePrefixes ],
            matchedBoneCount: reports.reduce((sum, value) => sum + value.matchedBoneCount, 0),
            maskedVertexCount: reports.reduce((sum, value) => sum + value.maskedVertexCount, 0),
            maskedTriangleCount: reports.reduce((sum, value) => sum + value.maskedTriangleCount, 0),
            meshReports: reports
        };

        if (report.status !== "applied" || !report.maskedTriangleCount)
        {
            throw new Error("Legacy right-hand compatibility mask could not be applied");
        }

        geometryResource.RebuildBounds?.(true);
        return report;
    }
}
function MaskMesh(mesh, bonePrefixes, gl)
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
        return EmptyReport(false);
    }

    let source = originalIndices.get(mesh);
    if (!source || source.target !== indices || source.values.length !== indices.length)
    {
        source = { target: indices, values: indices.slice() };
        originalIndices.set(mesh, source);
    }
    if (typeof indices.set === "function") indices.set(source.values);
    else source.values.forEach((value, index) => { indices[index] = value; });

    const normalizedPrefixes = bonePrefixes.map(value => value.toLowerCase());
    const matchedBones = new Set();

    bindings.forEach((binding, index) =>
    {
        const name = String(binding ?? "").toLowerCase();
        if (normalizedPrefixes.some(prefix => name.startsWith(prefix))) matchedBones.add(index);
    });

    if (!matchedBones.size) return EmptyReport(true);

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
    for (let index = 0; index + 2 < indices.length; index += 3)
    {
        const a = Number(indices[index]);
        const b = Number(indices[index + 1]);
        const c = Number(indices[index + 2]);
        if (![ a, b, c ].every(value => Number.isInteger(value) && value >= 0 && value < vertexCount)) continue;
        if (!affected[a] && !affected[b] && !affected[c]) continue;
        indices[index + 1] = a;
        indices[index + 2] = a;
        maskedTriangleCount++;
    }

    return {
        available: true,
        matchedBoneCount: matchedBones.size,
        maskedVertexCount,
        maskedTriangleCount,
        uploaded: maskedTriangleCount > 0 && UploadIndices(mesh, gl)
    };
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

function EmptyReport(available)
{
    return {
        available,
        matchedBoneCount: 0,
        maskedVertexCount: 0,
        maskedTriangleCount: 0,
        uploaded: false
    };
}

function ValidatePolicy(policy)
{
    if (policy?.status !== "policy"
        || policy?.rule !== "legacy-opengl-bone-capacity-mask-v1"
        || policy?.shaderCapacity !== 58
        || policy?.requiredBoneCount !== 69
        || !Array.isArray(policy?.bonePrefixes)
        || policy.bonePrefixes.length !== 1
        || policy.bonePrefixes[0] !== "RightHand")
    {
        throw new TypeError("Unsupported legacy palette compatibility policy");
    }
}
