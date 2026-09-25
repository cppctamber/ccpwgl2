import { meta } from "utils";
import { mat4, quat, vec3 } from "math";
import { EveChildContainer } from "./EveChildContainer";

/** Carbon's timed local/global ship explosion controller. */
@meta.define("EveChildExplosion", true)
export class EveChildExplosion extends EveChildContainer
{
    @meta.struct("EveChild") localExplosion = null;
    @meta.list("EveChild") localExplosions = [];
    @meta.struct("EveChild") localExplosionShared = null;
    @meta.struct("EveChild") globalExplosion = null;
    @meta.list("EveChild") globalExplosions = [];
    @meta.float localExplosionDelay = 0;
    @meta.float localExplosionInterval = 1;
    @meta.float localExplosionIntervalFactor = 1;
    @meta.float globalExplosionDelay = 0;
    @meta.float wreckSwitchOffsetFromGlobalStart = 0;
    @meta.float localDuration = 0;
    @meta.float globalDuration = 0;
    @meta.vector3 localScaling = vec3.fromValues(1, 1, 1);
    @meta.vector3 globalScaling = vec3.fromValues(1, 1, 1);

    @meta.float wreckSwitchTime = 0;
    @meta.float totalDuration = 0;
    @meta.float globalExplosionTime = 0;
    @meta.boolean isPlaying = false;
    @meta.float playTime = 0;
    localExplosionTransforms = [];
    @meta.struct("EveChildContainer") generatedGlobalExplosions = null;
    _localExplosionTimes = [];
    _nextLocalExplosionTime = 0;
    _countdownToGlobalExplosionStart = 0;
    _nextLocalExplosion = 0;
    _globalExplosionOffset = vec3.create();
    _sharedObjects = new Set();

    generatedLocalExplosions = this.objects;

    Play()
    {
        this.Stop();
        if (!this.localExplosion && !this.globalExplosion &&
            !this.localExplosions.length && !this.globalExplosions.length) return this;
        this._nextLocalExplosionTime = this.localExplosionDelay;
        this._nextLocalExplosion = 0;
        if (this.localExplosionShared) this.objects.push(this.localExplosionShared);
        this._sharedObjects = EveChildExplosion.CollectGraph(this.localExplosionShared);
        this.CalculateExplosionTimes(this.localExplosionTransforms.length);
        this.playTime = 0;
        this._countdownToGlobalExplosionStart = this.globalExplosionTime;
        if (this.useSRT)
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        this.isPlaying = true;
        return this;
    }

    Stop()
    {
        this.objects.splice(0);
        this.generatedGlobalExplosions = null;
        this.isPlaying = false;
        this._sharedObjects.clear();
        return this;
    }

    CalculateExplosionTimes(localExplosionCount)
    {
        this._localExplosionTimes.splice(0);
        let untilLast = localExplosionCount ? this.localExplosionDelay : 0;
        this.globalExplosionTime = localExplosionCount ? this.globalExplosionDelay : 0;
        for (let i = 0; i < localExplosionCount; i++)
        {
            const interval = Math.pow(this.localExplosionIntervalFactor, i) *
                this.localExplosionInterval * Math.random();
            this._localExplosionTimes.push(interval);
            untilLast += interval;
        }
        this.globalExplosionTime += untilLast;
        this.totalDuration = Math.max(
            this.localDuration + untilLast,
            this.globalExplosionTime + this.globalDuration
        );
        this.wreckSwitchTime = this.globalExplosionTime + this.wreckSwitchOffsetFromGlobalStart;
        return this.totalDuration;
    }

    SetLocalExplosionTransforms(transforms)
    {
        this.localExplosionTransforms = transforms.map(transform => mat4.clone(transform));
        return this;
    }

    SetGlobalExplosionOffset(offset)
    {
        for (let i = 0; i < 3; i++)
        {
            this._globalExplosionOffset[i] = offset[i] / this.scaling[i];
        }
        return this;
    }

    Update(dt, params)
    {
        if (this.isPlaying)
        {
            this.playTime += dt;
            if (this.localExplosion || this.localExplosions.length)
            {
                if (this.wreckSwitchTime > 0 && this.playTime > this.wreckSwitchTime && this.globalDuration > 0)
                {
                    this._nextLocalExplosion = this.localExplosionTransforms.length;
                    this.objects = this.objects.filter(object =>
                        object === this.generatedGlobalExplosions || object === this.localExplosionShared);
                }
                while (this._nextLocalExplosionTime < dt &&
                    this._nextLocalExplosion < this.localExplosionTransforms.length)
                {
                    this.SpawnLocalExplosion(this.localExplosionTransforms[this._nextLocalExplosion++]);
                    if (this._nextLocalExplosion < this.localExplosionTransforms.length)
                    {
                        this._nextLocalExplosionTime = this._localExplosionTimes[this._nextLocalExplosion];
                    }
                }
                this._nextLocalExplosionTime -= dt;
            }
            if (this.globalExplosion)
            {
                this._countdownToGlobalExplosionStart -= dt;
                if (this._countdownToGlobalExplosionStart < 0 && !this.generatedGlobalExplosions)
                {
                    this.SpawnGlobalExplosions([ this.globalExplosion ], true);
                }
            }
            if (this.globalExplosions.length)
            {
                this._countdownToGlobalExplosionStart -= dt;
                if (this._countdownToGlobalExplosionStart < 0 && !this.generatedGlobalExplosions)
                {
                    this.SpawnGlobalExplosions(this.globalExplosions, false);
                }
            }
            if (this.playTime > this.totalDuration) this.Stop();
        }
        super.Update(dt, params);
    }

    SpawnLocalExplosion(transform)
    {
        const choices = this.localExplosions.length ? this.localExplosions : [ this.localExplosion ];
        const source = choices[Math.floor(Math.random() * choices.length)];
        if (!source) return null;
        let instance;
        try
        {
            instance = source.Clone();
        }
        catch (err)
        {
            return null;
        }
        const local = mat4.clone(transform);
        if (mat4.invert(EveChildExplosion.global.inverse, this.localTransform))
        {
            mat4.getTranslation(EveChildExplosion.global.translation, local);
            vec3.transformMat4(
                EveChildExplosion.global.translation,
                EveChildExplosion.global.translation,
                EveChildExplosion.global.inverse
            );
            local[12] = EveChildExplosion.global.translation[0];
            local[13] = EveChildExplosion.global.translation[1];
            local[14] = EveChildExplosion.global.translation[2];
        }
        mat4.getScaling(EveChildExplosion.global.scale, local);
        mat4.getRotation(EveChildExplosion.global.rotation, local);
        mat4.getTranslation(EveChildExplosion.global.translation, local);
        EveChildExplosion.RestoreSharedReferences(source, instance, this._sharedObjects);
        EveChildExplosion.RebaseSphereGenerators(
            instance,
            EveChildExplosion.global.rotation,
            EveChildExplosion.global.translation,
            this._sharedObjects
        );
        EveChildExplosion.SetupChild(instance, EveChildExplosion.global.scale,
            EveChildExplosion.global.rotation, EveChildExplosion.global.translation);
        this.objects.push(instance);
        return instance;
    }

    SpawnGlobalExplosions(sources, staticRotation)
    {
        const container = new EveChildContainer();
        if (staticRotation)
        {
            EveChildExplosion.SetupChild(container, this.globalScaling, quat.create(),
                this._globalExplosionOffset, true);
        }
        for (const source of sources)
        {
            if (!source) continue;
            try { container.objects.push(source.Clone()); }
            catch (err) { /* Carbon skips copies that fail. */ }
        }
        this.generatedGlobalExplosions = container;
        this.objects.push(container);
        return container;
    }

    GetResources(out = [])
    {
        for (const child of [ this.localExplosion, this.localExplosionShared, this.globalExplosion ])
            child?.GetResources?.(out);
        for (const child of this.localExplosions) child?.GetResources?.(out);
        for (const child of this.globalExplosions) child?.GetResources?.(out);
        return out;
    }

    static global = {
        inverse: mat4.create(),
        scale: vec3.create(),
        rotation: quat.create(),
        inverseRotation: quat.create(),
        translation: vec3.create()
    };

    static SetupChild(child, scale, rotation, translation, staticRotation = false)
    {
        if (typeof child.Setup === "function") child.Setup(scale, rotation, translation, 0);
        else
        {
            if (child.scaling) vec3.copy(child.scaling, scale);
            if (child.rotation) quat.copy(child.rotation, rotation);
            if (child.translation) vec3.copy(child.translation, translation);
            if (child.localTransform)
                mat4.fromRotationTranslationScale(child.localTransform, rotation, translation, scale);
        }
        if (staticRotation && "useStaticRotation" in child) child.useStaticRotation = true;
        return child;
    }

    static CollectGraph(root, out = new Set())
    {
        if (!root || typeof root !== "object" || ArrayBuffer.isView(root) || out.has(root)) return out;
        out.add(root);
        for (const key of Object.keys(root))
        {
            const value = root[key];
            if (Array.isArray(value)) for (const item of value) this.CollectGraph(item, out);
            else this.CollectGraph(value, out);
        }
        return out;
    }

    static RestoreSharedReferences(source, copy, shared, visited = new Set())
    {
        if (!source || !copy || typeof source !== "object" || visited.has(source)) return;
        visited.add(source);
        for (const key of Object.keys(source))
        {
            const sourceValue = source[key];
            if (shared.has(sourceValue)) copy[key] = sourceValue;
            else if (Array.isArray(sourceValue) && Array.isArray(copy[key]))
            {
                for (let i = 0; i < sourceValue.length; i++)
                {
                    if (shared.has(sourceValue[i])) copy[key][i] = sourceValue[i];
                    else this.RestoreSharedReferences(sourceValue[i], copy[key][i], shared, visited);
                }
            }
            else this.RestoreSharedReferences(sourceValue, copy[key], shared, visited);
        }
    }

    static RebaseSphereGenerators(root, rotation, translation, shared = new Set(), visited = new Set())
    {
        if (!root || typeof root !== "object" || ArrayBuffer.isView(root) ||
            shared.has(root) || visited.has(root)) return;
        visited.add(root);
        if (root.constructor?.name === "Tw2SphereShapeAttributeGenerator")
        {
            quat.conjugate(EveChildExplosion.global.inverseRotation, rotation);
            vec3.transformQuat(root.position, root.position, EveChildExplosion.global.inverseRotation);
            vec3.add(root.position, root.position, translation);
            quat.multiply(root.rotation, root.rotation, rotation);
        }
        for (const key of Object.keys(root))
        {
            const value = root[key];
            if (Array.isArray(value)) for (const item of value) this.RebaseSphereGenerators(item, rotation, translation, shared, visited);
            else this.RebaseSphereGenerators(value, rotation, translation, shared, visited);
        }
    }
}
