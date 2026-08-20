import { meta } from "utils";
import { Tw2Mesh } from "core";


const AREA_PROPERTIES = [
    "additiveAreas",
    "decalAreas",
    "depthAreas",
    "depthNormalAreas",
    "distortionAreas",
    "opaqueAreas",
    "opaquePrepassAreas",
    "pickableAreas",
    "transparentAreas"
];


/**
 * WebGL compatibility mesh for one character instance.
 *
 * The ordinary Tw2Mesh contract remains unchanged. This subclass separates the
 * immutable, cache-owned source geometry from the optional character-owned
 * realization that is submitted by inherited Tw2Mesh batches. Morph weights
 * are instance state; a renderer must explicitly realize them into the private
 * geometry before drawing.
 */
@meta.type("Tw2CharacterMesh")
@meta.wgl.define("Tw2CharacterMesh")
export class Tw2CharacterMesh extends Tw2Mesh
{

    _characterSourceGeometryResource = null;
    _characterMorphTargetWeights = new Map();

    /**
     * Initializes inherited Tw2Mesh loading and captures the loaded resource as
     * the shared character source when no explicit source has been assigned.
     */
    Initialize()
    {
        super.Initialize();
        if (!this._characterSourceGeometryResource)
        {
            this._characterSourceGeometryResource = this.geometryResource;
        }
        this.RefreshMorphTargets();
    }

    /**
     * Binds shared source geometry and the realization drawn by this instance.
     * Passing only the source preserves legacy rendering until an engine-owned
     * private realization is available.
     *
     * @param {*} source Cache-owned source geometry resource.
     * @param {*} [realization=source] Character-owned render realization.
     * @returns {*} The active render realization.
     */
    SetCharacterGeometryResource(source, realization = source)
    {
        this._characterSourceGeometryResource = source || null;
        this.geometryResource = realization || null;
        if (source && source.path)
        {
            this.geometryResPath = source.path;
        }
        this.RefreshMorphTargets();
        return this.geometryResource;
    }

    /**
     * Gets the immutable/cache-owned geometry from which this instance is
     * realized.
     *
     * @returns {*} Shared source geometry, or the active legacy resource.
     */
    GetCharacterSourceGeometryResource()
    {
        return this._characterSourceGeometryResource || this.geometryResource;
    }

    /**
     * Gets whether this mesh currently draws a realization distinct from its
     * shared source resource.
     *
     * @returns {Boolean} True when an instance-local realization is active.
     */
    HasPrivateGeometryRealization()
    {
        const source = this.GetCharacterSourceGeometryResource();
        return !!source && !!this.geometryResource && source !== this.geometryResource;
    }

    /**
     * Returns unique morph target names for the active resource submesh.
     * Duplicate decoded records retain one instance weight because one name is
     * one logical character control.
     *
     * @returns {Array<String>} Exact authored target names in resource order.
     */
    GetMorphTargetNames()
    {
        const source = this.GetCharacterSourceGeometryResource();
        const targets = source?.meshes?.[this.meshIndex]?.blendShapes ?? [];
        const names = [];
        const seen = new Set();

        for (const target of targets)
        {
            const name = String(target?.sourceName || target?.name || "");
            if (!name || seen.has(name)) continue;
            seen.add(name);
            names.push(name);
        }
        return names;
    }

    /**
     * Synchronizes the instance weight map with the active source submesh while
     * preserving weights whose exact target identity still exists.
     *
     * @returns {Number} Number of available logical morph targets.
     */
    RefreshMorphTargets()
    {
        const previous = this._characterMorphTargetWeights;
        const next = new Map();
        for (const name of this.GetMorphTargetNames())
        {
            next.set(name, previous.get(name) ?? 0);
        }
        this._characterMorphTargetWeights = next;
        return next.size;
    }

    /**
     * Sets one exact morph target weight without mutating shared geometry.
     *
     * @param {String} name Exact authored morph target name.
     * @param {Number} value Unclamped finite morph weight.
     * @returns {Boolean} True when the active submesh exposes the target.
     */
    SetMorphTargetWeight(name, value)
    {
        const key = String(name ?? "");
        const weight = Number(value);
        if (!Number.isFinite(weight))
        {
            throw new TypeError(`Tw2CharacterMesh morph target ${JSON.stringify(key)} weight must be finite`);
        }
        if (!this._characterMorphTargetWeights.has(key)) return false;
        this._characterMorphTargetWeights.set(key, weight);
        return true;
    }

    /**
     * Gets one exact morph target weight.
     *
     * @param {String} name Exact authored morph target name.
     * @returns {Number} The instance weight, or zero for an unknown target.
     */
    GetMorphTargetWeight(name)
    {
        return this._characterMorphTargetWeights.get(String(name ?? "")) ?? 0;
    }

    /**
     * Returns detached indexed morph state for renderer realization.
     *
     * @returns {Map<String, {index: Number, weight: Number}>} Detached state.
     */
    GetMorphAnimations()
    {
        return new Map([ ...this._characterMorphTargetWeights ].map(
            ([ name, weight ], index) => [ name, { index, weight } ]
        ));
    }

    /**
     * Includes both the active realization and its distinct shared source in
     * resource traversal.
     *
     * @param {Array<*>} [out=[]] Receiving resource array.
     * @returns {Array<*>} The receiving array.
     */
    GetResources(out = [])
    {
        super.GetResources(out);
        const source = this.GetCharacterSourceGeometryResource();
        if (source && !out.includes(source)) out.push(source);
        return out;
    }

    /**
     * Promotes a legacy Tw2Mesh carrier into the character-only subclass
     * without changing or re-prototyping the source instance.
     *
     * @param {Tw2Mesh} source Legacy character mesh carrier.
     * @returns {Tw2CharacterMesh} Character mesh with the same render state.
     */
    static FromTw2Mesh(source)
    {
        if (source instanceof Tw2CharacterMesh) return source;
        if (!source) return new Tw2CharacterMesh();

        const mesh = new Tw2CharacterMesh();
        mesh.name = source.name;
        mesh.display = source.display;
        mesh.geometryResPath = source.geometryResPath;
        mesh.meshIndex = source.meshIndex;
        mesh.maxVertexScale = source.maxVertexScale;
        mesh.maxVertexDisplacement = source.maxVertexDisplacement;
        mesh.rotatesVertices = source.rotatesVertices;
        mesh.visible = { ...source.visible };

        for (const property of AREA_PROPERTIES)
        {
            mesh[property] = source[property] ?? [];
        }

        mesh.SetCharacterGeometryResource(source.geometryResource, source.geometryResource);
        return mesh;
    }

}
