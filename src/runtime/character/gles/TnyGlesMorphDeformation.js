import { tw2 } from "global";

const deformationStates = new WeakMap();

const TARGET_CHANNELS = new Set([
    "POSITION",
    "NORMAL",
    "TANGENT",
    "BITANGENT",
    "BINORMAL"
]);

/** Reversibly realizes exact character morph requests on cached GLES geometry. */
export class TnyGlesMorphDeformation
{
    /**
     * Classifies one requested target without mutating the geometry resource.
     * Duplicate identities are exact only when every field consumed by the
     * deformation applicator is value-equivalent.
     */
    static ClassifyTarget(geometryResource, requests)
    {
        const normalized = NormalizeRequests(requests);
        if (normalized.length !== 1)
        {
            throw new TypeError("Legacy morph target classification requires one request");
        }

        const request = normalized[0];
        const matchedMeshIndices = [];
        const coalescedMeshIndices = [];
        const ambiguousMeshIndices = [];
        for (const [ meshIndex, mesh ] of (geometryResource?.meshes ?? []).entries())
        {
            const matches = (mesh?.morphTargets ?? []).filter(target =>
                TargetIdentity(target) === request.identity);
            if (matches.length === 1)
            {
                matchedMeshIndices.push(meshIndex);
            }
            else if (matches.length > 1)
            {
                if (AreEquivalentTargets(matches))
                {
                    matchedMeshIndices.push(meshIndex);
                    coalescedMeshIndices.push(meshIndex);
                }
                else
                {
                    ambiguousMeshIndices.push(meshIndex);
                }
            }
        }

        return {
            status: ambiguousMeshIndices.length
                ? "ambiguous"
                : matchedMeshIndices.length
                    ? "exact"
                    : "unavailable",
            targetName: request.targetName,
            matchedMeshIndices,
            coalescedMeshIndices,
            ambiguousMeshIndices
        };
    }

    /** Returns whether a geometry resource exposes at least one exact requested target. */
    static HasAnyTarget(geometryResource, requests)
    {
        const classifications = NormalizeRequests(requests).map(request =>
            this.ClassifyTarget(geometryResource, [ request ]));
        return classifications.every(value => value.status !== "ambiguous")
            && classifications.some(value => value.status === "exact");
    }

    /** Acquires one shared-geometry deformation lease. */
    static async Acquire(geometryResource, requests, { gl = null } = {})
    {
        const normalized = NormalizeRequests(requests);
        if (!Array.isArray(geometryResource?.meshes) || !geometryResource.meshes.length)
        {
            throw new Error("Legacy morph deformation requires geometry meshes");
        }

        const signature = JSON.stringify(normalized.map(value => [ value.identity, value.weight ]));
        let state = deformationStates.get(geometryResource);

        if (state?.leases.size)
        {
            if (state.signature !== signature)
            {
                throw new Error("Legacy morph deformation conflicts on shared geometry");
            }
            VerifyPreparedIdentity(state.prepared);
            ApplyPrepared(state.prepared, gl);
            const lease = {};
            state.leases.add(lease);
            return { lease, report: CloneReport(state.report) };
        }

        await geometryResource.ForceSystemMirror?.(true);
        const prepared = geometryResource.meshes.map((mesh, meshIndex) =>
            PrepareMesh(mesh, meshIndex, normalized));
        const matched = new Set(prepared.flatMap(value => value.matchedTargets));

        if (!matched.size)
        {
            throw new Error("Legacy morph deformation found no exact target");
        }

        ApplyPrepared(prepared, gl);
        geometryResource.RebuildBounds?.(true);

        const report = {
            status: "applied",
            rule: "legacy-gles-exact-morph-target-v1",
            requestedTargetCount: normalized.length,
            matchedTargetCount: matched.size,
            matchedTargets: [ ...matched ].sort(),
            meshReports: prepared.map(value => ({
                meshIndex: value.meshIndex,
                matchedTargets: [ ...value.matchedTargets ],
                changedVertexCount: value.changedVertexCount,
                uploaded: value.matchedTargets.length > 0
            }))
        };
        const lease = {};
        state = {
            leases: new Set([ lease ]),
            prepared,
            report,
            signature
        };
        deformationStates.set(geometryResource, state);
        return { lease, report: CloneReport(report) };
    }

    /** Releases one lease and restores original vertices after the final owner. */
    static Release(geometryResource, lease, { gl = null } = {})
    {
        const state = deformationStates.get(geometryResource);
        if (!state?.leases.delete(lease)) return false;
        if (state.leases.size) return true;

        VerifyPreparedIdentity(state.prepared);
        const failures = RestorePrepared(state.prepared, gl);
        if (failures.length)
        {
            state.leases.add(lease);
            const error = new Error("Legacy morph deformation restore failed");
            error.errors = failures;
            throw error;
        }
        geometryResource.RebuildBounds?.(true);
        deformationStates.delete(geometryResource);
        return true;
    }
}

function NormalizeRequests(requests)
{
    if (!Array.isArray(requests) || !requests.length)
    {
        throw new TypeError("Legacy morph deformation requires target requests");
    }

    const byIdentity = new Map();
    for (const request of requests)
    {
        const targetName = String(request?.targetName ?? "").trim();
        const identity = targetName.toLowerCase();
        const weight = Number(request?.weight);
        if (!targetName || !Number.isFinite(weight))
        {
            throw new TypeError("Legacy morph deformation requires exact finite target weights");
        }
        const existing = byIdentity.get(identity);
        if (existing && existing.weight !== weight)
        {
            throw new Error(`Conflicting morph weights for ${JSON.stringify(targetName)}`);
        }
        byIdentity.set(identity, { identity, targetName, weight });
    }

    return [ ...byIdentity.values() ].sort((a, b) => a.identity.localeCompare(b.identity));
}

function PrepareMesh(mesh, meshIndex, requests)
{
    const bufferData = mesh?.bufferData;
    const stride = Number(mesh?.declaration?.stride) / 4;
    if (!bufferData?.length || !Number.isInteger(stride) || stride <= 0)
    {
        return EmptyPrepared(mesh, meshIndex);
    }

    const vertexCount = Number(mesh?._vertices) || Math.floor(bufferData.length / stride);
    if (!vertexCount || vertexCount * stride > bufferData.length)
    {
        throw new Error(`Legacy morph deformation mesh ${meshIndex} has invalid vertex storage`);
    }

    const targets = Array.isArray(mesh.morphTargets) ? mesh.morphTargets : [];
    const original = bufferData.slice();
    const deformed = bufferData.slice();
    const matchedTargets = [];
    const changedVertices = new Set();

    for (const request of requests)
    {
        const matches = targets.filter(target => TargetIdentity(target) === request.identity);
        if (matches.length > 1 && !AreEquivalentTargets(matches))
        {
            throw new Error(
                `Legacy morph target ${JSON.stringify(request.targetName)} is ambiguous on mesh ${meshIndex}`
            );
        }
        if (!matches.length) continue;

        ApplyTarget(
            mesh,
            matches[0],
            request.weight,
            original,
            deformed,
            stride,
            vertexCount,
            changedVertices
        );
        matchedTargets.push(request.identity);
    }

    return {
        mesh,
        meshIndex,
        bufferData,
        buffer: mesh.buffer,
        original,
        deformed,
        matchedTargets,
        changedVertexCount: changedVertices.size
    };
}

function ApplyTarget(mesh, target, weight, original, deformed, stride, vertexCount, changed)
{
    const vertexElementTypes = tw2.GetClass?.("Tw2VertexElement")?.Type;
    if (!vertexElementTypes)
    {
        throw new Error("Legacy morph deformation requires the registered Tw2VertexElement class");
    }
    const sparse = target.vertexIndices ?? null;
    const targetVertexCount = sparse ? sparse.length : vertexCount;
    if (!targetVertexCount) return;

    for (const [ key, values ] of Object.entries(target.vertex ?? {}))
    {
        const channel = String(key).toUpperCase();
        if (!TARGET_CHANNELS.has(channel) || !values?.length) continue;

        const usage = vertexElementTypes[channel];
        const declaration = mesh.declaration?.FindUsage?.(usage, 0);
        if (!declaration) continue;

        const components = values.length / targetVertexCount;
        if (!Number.isInteger(components) || components <= 0 || components > declaration.elements)
        {
            throw new Error(`Legacy morph target ${JSON.stringify(target.sourceName)} has invalid ${key} data`);
        }
        const offset = Number(declaration.offset) / 4;
        if (!Number.isInteger(offset) || offset < 0)
        {
            throw new Error("Legacy morph target declaration has an invalid offset");
        }

        for (let item = 0; item < targetVertexCount; item++)
        {
            const vertex = sparse ? Number(sparse[item]) : item;
            if (!Number.isInteger(vertex) || vertex < 0 || vertex >= vertexCount)
            {
                throw new Error(`Legacy morph target ${JSON.stringify(target.sourceName)} has an invalid vertex index`);
            }
            const destination = vertex * stride + offset;
            const source = item * components;
            for (let component = 0; component < components; component++)
            {
                const base = original[destination + component];
                const value = Number(values[source + component]);
                if (!Number.isFinite(value))
                {
                    throw new Error(`Legacy morph target ${JSON.stringify(target.sourceName)} contains non-finite data`);
                }
                deformed[destination + component] += weight * (
                    target.dataIsDeltas === true ? value : value - base
                );
            }
            changed.add(vertex);
        }
    }
}

function EmptyPrepared(mesh, meshIndex)
{
    return {
        mesh,
        meshIndex,
        bufferData: mesh?.bufferData ?? null,
        buffer: mesh?.buffer ?? null,
        original: null,
        deformed: null,
        matchedTargets: [],
        changedVertexCount: 0
    };
}

function TargetIdentity(target)
{
    return String(target?.sourceName || target?.name || "").trim().toLowerCase();
}

function AreEquivalentTargets(targets)
{
    const first = targets[0];
    return targets.slice(1).every(target => AreEquivalentTargetPayloads(first, target));
}

function AreEquivalentTargetPayloads(left, right)
{
    if ((left?.dataIsDeltas === true) !== (right?.dataIsDeltas === true)) return false;
    if (!AreEquivalentNumberArrays(left?.vertexIndices ?? null, right?.vertexIndices ?? null))
    {
        return false;
    }

    const leftChannels = NormalizeTargetChannels(left?.vertex);
    const rightChannels = NormalizeTargetChannels(right?.vertex);
    if (!leftChannels || !rightChannels || leftChannels.size !== rightChannels.size) return false;
    for (const [ channel, values ] of leftChannels)
    {
        if (!rightChannels.has(channel)
            || !AreEquivalentNumberArrays(values, rightChannels.get(channel)))
        {
            return false;
        }
    }
    return true;
}

function NormalizeTargetChannels(vertex)
{
    const channels = new Map();
    for (const [ key, values ] of Object.entries(vertex ?? {}))
    {
        const channel = String(key).toUpperCase();
        if (!TARGET_CHANNELS.has(channel) || !values?.length) continue;
        if (channels.has(channel)) return null;
        channels.set(channel, values);
    }
    return channels;
}

function AreEquivalentNumberArrays(left, right)
{
    if (left === right) return true;
    if (left == null || right == null || left.length !== right.length) return false;
    for (let index = 0; index < left.length; index++)
    {
        if (Number(left[index]) !== Number(right[index])) return false;
    }
    return true;
}

function VerifyPreparedIdentity(prepared)
{
    for (const value of prepared)
    {
        if (!value.matchedTargets.length) continue;
        if (value.mesh?.bufferData !== value.bufferData || value.mesh?.buffer !== value.buffer)
        {
            throw new Error("Legacy morph deformation geometry changed while leased");
        }
    }
}

function ApplyPrepared(prepared, gl)
{
    const applied = [];
    try
    {
        for (const value of prepared)
        {
            if (!value.matchedTargets.length) continue;
            value.bufferData.set(value.deformed);
            value.mesh.RebuildBounds?.(true);
            applied.push(value);
            if (!UploadVertices(value.mesh, gl))
            {
                throw new Error("Legacy morph deformation upload failed");
            }
        }
    }
    catch (error)
    {
        error.rollbackFailures = RestorePrepared(applied, gl);
        throw error;
    }
}

function RestorePrepared(prepared, gl)
{
    const failures = [];
    for (const value of [ ...prepared ].reverse())
    {
        if (!value.matchedTargets.length) continue;
        try
        {
            value.bufferData.set(value.original);
            value.mesh.RebuildBounds?.(true);
            if (!UploadVertices(value.mesh, gl)) throw new Error("vertex restore upload failed");
        }
        catch (error)
        {
            failures.push(error);
        }
    }
    return failures;
}

function UploadVertices(mesh, gl)
{
    if (!gl || !mesh?.buffer || !gl.bindBuffer || !gl.bufferSubData) return false;
    const previous = gl.getParameter && gl.ARRAY_BUFFER_BINDING !== undefined
        ? gl.getParameter(gl.ARRAY_BUFFER_BINDING)
        : null;
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, mesh.bufferData);
    gl.bindBuffer(gl.ARRAY_BUFFER, previous);
    return true;
}

function CloneReport(value)
{
    return {
        ...value,
        matchedTargets: [ ...value.matchedTargets ],
        meshReports: value.meshReports.map(report => ({
            ...report,
            matchedTargets: [ ...report.matchedTargets ]
        }))
    };
}
