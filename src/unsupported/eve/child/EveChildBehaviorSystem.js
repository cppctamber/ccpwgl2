// Source: trinity/trinity/Eve/SpaceObject/Children/EveChildBehaviorSystem.cpp
import { meta } from "utils";
import { mat4, quat, vec3 } from "math";
import { device } from "global";
import { EveChild } from "eve/child/EveChild";
import { EveChildUpdateParams } from "eve/EveChildUpdateParams";
import { GLESPerObjectDataEveSpaceObject, Tw2VertexDeclaration } from "core";

/** Owns drone simulation, shared instance streams and the child world transform. */
@meta.define("EveChildBehaviorSystem", true)
export class EveChildBehaviorSystem extends EveChild
{
    @meta.boolean
    display = true;
    @meta.quaternion
    rotation = quat.create();
    @meta.vector3
    translation = vec3.create();
    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);
    @meta.matrix4
    localTransform = mat4.create();
    @meta.matrix4
    worldTransform = mat4.create();
    @meta.boolean
    useSRT = true;
    @meta.boolean
    staticTransform = false;
    @meta.list("BehaviorGroup")
    behaviorGroups = [];
    @meta.list("SplineTunnelGroup")
    splineTunnels = [];

    instanceCount = 1;
    _worldTransformLast = mat4.create();
    _knownGroups = [];
    _knownTunnels = [];
    _tunnels = [];
    _shipData = new Float32Array(0);
    _boosterData = new Float32Array(0);
    _shipBuffer = null;
    _boosterBuffer = null;
    _bufferDevice = null;
    _hasUpdated = false;
    _bufferDirty = true;
    _updateSerial = 0;
    _packedSerial = -1;
    _perObjectData = new GLESPerObjectDataEveSpaceObject();
    _dataValues = {};
    _frameContext = { dt: 0, currentTime: 0 };

    /** Defers group initialization until the complete authored graph exists. */
    Initialize()
    {
        if (this.useSRT) mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
    }

    /** Rebuilds the flattened tunnel registry and resets affected groups. */
    UpdateTunnelRegistry()
    {
        this._tunnels.length = 0;
        for (const group of this.splineTunnels)
        {
            for (const tunnel of group.GetTunnels())
            {
                tunnel.tunnelID = this._tunnels.length;
                this._tunnels.push(tunnel);
            }
        }
        for (const group of this.behaviorGroups)
        {
            for (const behavior of group.behaviors) behavior.OnSystemTunnelsChanged();
            group.InitializeGeometryResource();
        }
        this.ChangeBufferInstanceCount();
    }

    /** Returns the shared spline paths used by lifetime and path behaviors. */
    GetTunnels() { return this._tunnels; }
    /** Returns the authored tunnel groups. */
    GetSplineTunnels() { return this.splineTunnels; }
    /** Returns the current child world transform. */
    GetWorldTransform() { return this.worldTransform; }
    /** Scene sorting and standalone child preparation use the same world pose. */
    GetWorldTranslation(out) { return mat4.getTranslation(out, this.worldTransform); }
    UpdateViewDependentData(parentTransform) { this.PrepareLod(parentTransform); }

    /** Supplies a usable transform to nested behavior effects in ccpwgl. */
    GetLocalToWorldTransform(out) { mat4.copy(out, this.worldTransform); }

    /** Resizes CPU streams when live agent counts change; GPU allocation is lazy. */
    ChangeBufferInstanceCount()
    {
        let count = 0;
        for (const group of this.behaviorGroups) count += group.GetSize();
        this.instanceCount = Math.max(1, count);
        if (this._shipData.length !== count * 24)
        {
            this._shipData = new Float32Array(count * 24);
            this._boosterData = new Float32Array(count * 12);
        }
        let start = 0;
        for (const group of this.behaviorGroups)
        {
            group._system = this;
            group._instanceStart = start;
            group._instanceDeclaration = Tw2VertexDeclaration.from(Array.from({ length: 6 }, (_, i) => ({
                usage: "TEXCOORD", usageIndex: 8 + i, elements: 4, offset: start * 96 + i * 16
            })));
            for (const element of group._instanceDeclaration.elements) element.offset += start * 96;
            start += group.GetSize();
        }
        this._bufferDirty = true;
    }

    /** Bridges ccpwgl's child update into Carbon's synchronous/asynchronous phases. */
    Update(dt, params = EveChildUpdateParams.DEFAULT)
    {
        const context = this._frameContext;
        context.dt = dt;
        context.currentTime = device.currentTime;
        this.UpdateSyncronous(context, params);
        this.UpdateAsyncronous(context, params);
    }

    /** Initializes groups, applies behavior changes, and advances the simulation. */
    UpdateSyncronous(context, params)
    {
        const changed = this._knownGroups.length !== this.behaviorGroups.length
            || this.behaviorGroups.some((group, i) => group !== this._knownGroups[i]);
        if (changed)
        {
            for (const group of this._knownGroups)
            {
                if (!this.behaviorGroups.includes(group)) group.SetVertexFunctionReferance(null);
            }
            for (const group of this.behaviorGroups)
            {
                if (!this._knownGroups.includes(group))
                {
                    group.SetVertexFunctionReferance(() => this.ChangeBufferInstanceCount());
                    group.InitializeGeometryResource();
                }
            }
            this._knownGroups = this.behaviorGroups.slice();
            this.ChangeBufferInstanceCount();
        }
        if (this._knownTunnels.length !== this.splineTunnels.length || this.splineTunnels.some((group, i) => group !== this._knownTunnels[i]))
        {
            for (const group of this._knownTunnels) if (!this.splineTunnels.includes(group)) group.SetSystemTunnelFunctionReferenceAndColor(null);
            this._knownTunnels = this.splineTunnels.slice();
            for (const group of this.splineTunnels) group.SetSystemTunnelFunctionReferenceAndColor(() => this.UpdateTunnelRegistry(), 0xffffff00);
            this.UpdateTunnelRegistry();
        }
        for (const group of this.splineTunnels) group.GetTunnels();
        for (const group of this.behaviorGroups)
        {
            group.UpdateSyncronous(context, params);
            group.UpdateAgents(context.dt, this);
        }
    }

    /** Updates the system transform after simulation, retaining prior-frame pose. */
    UpdateAsyncronous(context, params)
    {
        mat4.copy(this._worldTransformLast, this.worldTransform);
        if (this.useSRT && !this.staticTransform) mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        // Carbon local * parent; gl-matrix reverses composition operands.
        mat4.multiply(this.worldTransform, params.localToWorldTransform, this.localTransform);
        for (const group of this.behaviorGroups) group.UpdateAsyncronous(context);
        this._updateSerial++;
        this._hasUpdated = true;
        this._bufferDirty = true;
    }

    /** Uses each agent's projected sphere for the authored mesh/flare LOD. */
    UpdateLod(context, parentLod, parentTransform)
    {
        if (parentTransform) this.PrepareLod(parentTransform);
        this.lodLevel = parentLod;
        for (const group of this.behaviorGroups) group.UpdateVisibility(context, this.worldTransform);
        this._bufferDirty = true;
    }

    /** Refreshes a moving parent's transform without advancing motion history. */
    PrepareLod(parentTransform)
    {
        if (this.useSRT && !this.staticTransform) mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        mat4.multiply(this.worldTransform, parentTransform, this.localTransform);
    }

    /** Uploads both streams once per prepared frame, preserving motion history. */
    UpdateBuffer()
    {
        if (!this._bufferDirty) return;
        const gl = device.gl;
        if (this._bufferDevice !== gl)
        {
            this._shipBuffer = this._boosterBuffer = null;
            this._bufferDevice = gl;
        }
        if (!this._shipBuffer) this._shipBuffer = gl.createBuffer();
        if (!this._boosterBuffer) this._boosterBuffer = gl.createBuffer();
        for (const group of this.behaviorGroups)
        {
            group.GetShipInfoForBuffer(this._shipData, this.worldTransform, group._instanceStart * 24, this._packedSerial !== this._updateSerial);
            group.GetBoosterInfoForBuffer(this._boosterData, this.worldTransform, group._instanceStart * 12);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this._shipBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._shipData, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._boosterBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._boosterData, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this._packedSerial = this._updateSerial;
        this._bufferDirty = false;
    }

    /** Submits group meshes and their booster/flare representation. */
    GetBatches(mode, accumulator, parentData)
    {
        if (!this.display || !this._hasUpdated) return false;
        if (parentData) GLESPerObjectDataEveSpaceObject.Unpack(parentData, this._dataValues);
        this._dataValues.worldTransform = this.worldTransform;
        this._dataValues.worldTransformLast = this._worldTransformLast;
        this._dataValues.inverseWorldTransform = null;
        this._dataValues.inverseWorldTransformTranspose = null;
        GLESPerObjectDataEveSpaceObject.Pack(this._dataValues, this._perObjectData);
        this.UpdateBuffer();
        let added = false;
        for (const group of this.behaviorGroups) added = group.GetBatches(mode, accumulator, this._perObjectData) || added;
        return added;
    }

    /** Exposes agent booster lights and firing effects to scene collection. */
    GetLights(collector)
    {
        if (!this.display || !this._hasUpdated) return;
        this.UpdateBuffer();
        for (const group of this.behaviorGroups) if (group.display) group.GetLights(collector);
    }

    /** Enumerates meshes, flare effects, and spawned firing-effect resources. */
    GetResources(out = [])
    {
        for (const group of this.behaviorGroups) group.GetResources(out);
        return out;
    }

    OnDestroy() { this.Unload(); }

    /** Releases only the buffers owned by this system. */
    Unload()
    {
        if (this._bufferDevice)
        {
            if (this._shipBuffer) this._bufferDevice.deleteBuffer(this._shipBuffer);
            if (this._boosterBuffer) this._bufferDevice.deleteBuffer(this._boosterBuffer);
        }
        this._shipBuffer = this._boosterBuffer = null;
        for (const group of this.behaviorGroups) if (group.boosters) group.boosters.Unload();
        this._bufferDirty = true;
    }
}
