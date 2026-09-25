// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Attachments/EveImpactOverlay.{h,cpp}
import { meta } from "utils";
import { mat4, vec3, vec4 } from "math";
import { Tr2ScalarFader } from "curve";
import { Tr2Lod } from "constant/ccpwgl";
import { Tw2GpuParticleRenderer } from "../../particle/gpu/Tw2GpuParticleRenderer";
import { EveDamageOverlay } from "./EveDamageOverlay";


const IMPACT_SHIELD_SIZE_MAX = 2000;
const IMPACT_SHIELD_SIZE_MIN = 70;
const IMPACT_SHIELD_FADEOUT = 1.5;
const IMPACT_ARMOR_PARTICLE_LOD_FACTOR = 400;
const IMPACT_ARMOR_SIZE_FACTOR = 0.0129;
const IMPACT_ARMOR_SIZE_MAX = 10;


/** Owns one ship's shield, armour and hull impact presentation. */
@meta.define("EveImpactOverlay", true)
export class EveImpactOverlay extends meta.Model
{

    @meta.string
    name = "";

    @meta.uint
    seed = 0;

    @meta.boolean
    display = true;

    @meta.struct("EveDamageOverlay")
    damageOverlay = new EveDamageOverlay();

    @meta.int32
    configuration = 0;

    @meta.int32
    impactDataNextIdx = 1;

    @meta.uint
    armorImpactGoalCount = 0;

    @meta.float
    armorImpactParentSize = 0;

    @meta.float
    shieldImpactColorFade = 0;

    @meta.float
    shieldImpactParentSize = 0;

    @meta.boolean
    shieldIsEllipsoid = true;

    @meta.boolean
    debugForceSpawnDebris = false;

    @meta.float
    renderPriority = 0;

    @meta.struct([ "Tw2Mesh", "Tw2InstancedMesh", "Tr2MeshLod" ])
    mesh = null;

    @meta.int32
    dataTextureBlockID = -1;

    @meta.uint
    maxShieldImpacts = 8;

    @meta.float
    overallShieldImpact = -1;

    @meta.struct("Tr2ScalarFader")
    shieldHardening = new Tr2ScalarFader();

    @meta.struct("Tr2ScalarFader")
    shieldBoosting = new Tr2ScalarFader();

    @meta.struct("Tw2Effect")
    armorDamageShader = null;

    @meta.struct("Tr2GpuUniqueEmitter")
    armorImpactEmitter = null;

    @meta.struct("Tr2ScalarFader")
    armorRepairing = new Tr2ScalarFader();

    @meta.struct("Tr2ScalarFader")
    armorHardening = new Tr2ScalarFader();

    @meta.struct("Tr2ScalarFader")
    hullRepairing = new Tr2ScalarFader();

    @meta.struct("TriPerlinCurve")
    hullDamageFlickerCurve = null;

    @meta.float
    hullDamageFactor = 0;

    @meta.struct("Tr2GpuUniqueEmitter")
    hullImpactEmitter = null;

    _damageLocatorCount = 0;
    _shieldImpacts = new Map();

    Initialize()
    {
        this._SyncLegacyDamageFieldsToOverlay();
        return true;
    }

    Set(hullCurve, armorEmitter, hullEmitter, armorShader, shieldMesh, shieldIsEllipsoid)
    {
        this.shieldIsEllipsoid = !!shieldIsEllipsoid;
        this.hullDamageFlickerCurve = hullCurve || null;
        this.armorImpactEmitter = armorEmitter || null;
        this.hullImpactEmitter = hullEmitter || null;
        this.armorDamageShader = armorShader || null;
        this.mesh = shieldMesh || null;
        this._SyncLegacyDamageFieldsToOverlay();
        return true;
    }

    SetSeed(value)
    {
        this.seed = Number(value) >>> 0;
        this.damageOverlay.SetSeed(this.seed);
        return true;
    }

    SetDamageLocatorCount(value)
    {
        this._damageLocatorCount = Number(value) >>> 0;
        this.damageOverlay.SetDamageLocatorCount(this._damageLocatorCount);
        return true;
    }

    GetDamageLocatorCount() { return this._damageLocatorCount; }
    GetArmorImpactLifeTime() { return this.damageOverlay.GetArmorImpactLifeTime(); }
    GetLastDamageState(out = vec3.create()) { return this.damageOverlay.GetLastDamageState(out); }
    GetDataTextureOffset() { return this.damageOverlay.GetDataTextureOffset(); }
    GetImpactConfiguration() { return this.damageOverlay.GetImpactConfiguration(); }
    HasShieldEllipsoid() { return this.shieldIsEllipsoid; }
    GetDamageOverlay() { return this.damageOverlay; }
    GetImpactDataNextIdx() { return this.damageOverlay.GetImpactDataNextIdx(); }
    GetSeed() { return this.damageOverlay.GetSeed(); }
    GetArmorImpactGoalCount() { return this.damageOverlay.GetArmorImpactGoalCount(); }
    GetArmorImpactParentSize() { return this.damageOverlay.GetArmorImpactParentSize(); }
    GetDebugForceSpawnDebris() { return this.damageOverlay.GetDebugForceSpawnDebris(); }
    GetRenderPriority() { return this.damageOverlay.GetRenderPriority(); }
    GetDataTextureBlockID() { return this.damageOverlay.GetDataTextureBlockID(); }
    GetHullDamageFactor() { return this.damageOverlay.GetHullDamageFactor(); }
    GetArmorDamageShaderEffect() { return this.damageOverlay.GetArmorDamageShaderEffect(); }
    GetHullDamageFlickerCurve() { return this.damageOverlay.GetHullDamageFlickerCurve(); }
    GetArmorRepairing() { return this.damageOverlay.GetArmorRepairing(); }
    GetArmorHardening() { return this.damageOverlay.GetArmorHardening(); }
    GetHullRepairing() { return this.damageOverlay.GetHullRepairing(); }

    SetDebugForceSpawnDebris(value)
    {
        this.debugForceSpawnDebris = !!value;
        this.damageOverlay.SetDebugForceSpawnDebris(value);
    }

    SetHullDamageFactor(value)
    {
        this.hullDamageFactor = Number(value);
        this.damageOverlay.SetHullDamageFactor(value);
    }

    SetArmorDamageShaderEffect(value)
    {
        this.armorDamageShader = value || null;
        this.damageOverlay.SetArmorDamageShaderEffect(value);
    }

    SetHullDamageFlickerCurve(value)
    {
        this.hullDamageFlickerCurve = value || null;
        this.damageOverlay.SetHullDamageFlickerCurve(value);
    }

    SetArmorRepairing(value)
    {
        this.armorRepairing = value;
        this.damageOverlay.SetArmorRepairing(value);
    }

    SetArmorHardening(value)
    {
        this.armorHardening = value;
        this.damageOverlay.SetArmorHardening(value);
    }

    SetHullRepairing(value)
    {
        this.hullRepairing = value;
        this.damageOverlay.SetHullRepairing(value);
    }

    ToggleEffect(name, on, duration)
    {
        let fader = null;
        if (name === "shieldboost") fader = this.shieldBoosting;
        else if (name === "shieldhardening") fader = this.shieldHardening;
        if (fader)
        {
            fader.StartFade(!!on, Number(duration) / 4);
            return true;
        }
        return this.damageOverlay.ToggleEffect(name, on, duration);
    }

    SetDamageState(shield, armor, hull, createArmorImpacts = false)
    {
        this.shieldImpactColorFade = Math.max(0, Math.min(1, (1 - shield) ** 2));
        this.damageOverlay.SetDamageState(shield, armor, hull, createArmorImpacts);
        this.configuration = this.damageOverlay.GetImpactConfiguration();
    }

    Clear()
    {
        this._shieldImpacts.clear();
        this.damageOverlay.Clear();
    }

    CreateImpact(damageLocatorIndex, direction, lifeTime, size, intensity = 1,
        lod = Tr2Lod.TR2_LOD_HIGH, parent = null)
    {
        if (!EveDamageOverlay.impactEffectEnabled) return -1;
        const configuration = this.GetImpactConfiguration();
        if (configuration === EveImpactOverlay.ImpactConfiguration.IMPACT_SHIELD &&
            lod !== Tr2Lod.TR2_LOD_LOW)
        {
            return this._CreateShieldImpact(
                damageLocatorIndex, direction, lifeTime, size, intensity, parent);
        }
        if (configuration === EveImpactOverlay.ImpactConfiguration.IMPACT_ARMOR ||
            configuration === EveImpactOverlay.ImpactConfiguration.IMPACT_HULL)
        {
            return this.damageOverlay.CreateImpact(
                damageLocatorIndex, size, lod !== Tr2Lod.TR2_LOD_LOW);
        }
        return -1;
    }

    _CreateShieldImpact(damageLocatorIndex, direction, lifeTime, size, intensity, parent)
    {
        const normalized = vec3.normalize(vec3.create(), direction);
        let locatorIndex = -1;
        let anyIndex = -1;
        let locatorDot = -Infinity;
        let anyDot = -Infinity;
        for (const [ index, impact ] of this._shieldImpacts)
        {
            const dot = vec3.dot(normalized, impact.direction);
            if (dot > anyDot)
            {
                anyDot = dot;
                anyIndex = index;
            }
            if (impact.damageLocatorIndex === damageLocatorIndex && dot > locatorDot)
            {
                locatorDot = dot;
                locatorIndex = index;
            }
        }

        if (locatorDot > 0.95)
        {
            const impact = this._shieldImpacts.get(locatorIndex);
            vec3.copy(impact.direction, normalized);
            impact.timeLeft = IMPACT_SHIELD_FADEOUT * Number(lifeTime);
            impact.size = Math.max(Number(size), impact.size);
            return locatorIndex;
        }

        if (this._shieldImpacts.size >= this.maxShieldImpacts)
        {
            if (anyIndex !== -1)
            {
                const impact = this._shieldImpacts.get(anyIndex);
                vec3.copy(impact.direction, normalized);
                impact.timeLeft = IMPACT_SHIELD_FADEOUT * Number(lifeTime);
                impact.size = Math.max(Number(size), impact.size);
            }
            return anyIndex;
        }

        if (!parent) return -1;
        const world = parent.GetWorldTransform(mat4.create());
        const inverse = mat4.invert(mat4.create(), world);
        if (!inverse) return -1;
        const center = vec3.create();
        const radii = vec3.fromValues(1, 1, 1);
        parent.GetShapeEllipsoid(center, radii);
        const locatorWorld = vec3.create();
        parent.GetDamageLocatorPosition(locatorWorld, damageLocatorIndex, true);
        const intercept = getShieldImpactPosition(
            vec3.create(), this.shieldIsEllipsoid, inverse, locatorWorld,
            normalized, center, radii);
        vec3.transformMat4(intercept, intercept, world);

        const index = this.damageOverlay.AllocateImpactIndex();
        const impactLifeTime = IMPACT_SHIELD_FADEOUT * Number(lifeTime);
        this._shieldImpacts.set(index, {
            damageLocatorIndex: Number(damageLocatorIndex) | 0,
            interceptPosition: intercept,
            direction: normalized,
            lifeTime: impactLifeTime,
            timeLeft: impactLifeTime,
            size: Number(size),
            intensity: Number(intensity)
        });
        return index;
    }

    UpdateImpact(out, direction, impactIndex)
    {
        if (impactIndex === -1) return false;
        const impact = this._shieldImpacts.get(Number(impactIndex) | 0);
        if (!impact) return this.damageOverlay.HasImpact(impactIndex);
        vec3.copy(out, impact.interceptPosition);
        vec3.copy(impact.direction, direction);
        return true;
    }

    HasShieldActivity()
    {
        return EveDamageOverlay.impactEffectEnabled &&
            (this._shieldImpacts.size !== 0 || this.overallShieldImpact > 0 ||
                !this.shieldHardening.IsKickInZero() || !this.shieldBoosting.IsKickInZero());
    }

    HasArmorActivity() { return this.damageOverlay.HasArmorActivity(); }
    HasHullActivity() { return this.damageOverlay.HasHullActivity(); }
    HasGeneralActivity() { return this.HasShieldActivity() || this.damageOverlay.HasGeneralActivity(); }
    GetActivationStrength(updateContext) { return this.damageOverlay.GetActivationStrength(updateContext); }

    UpdateSyncronous(updateContext, parent)
    {
        this.SpawnImpactDebris(updateContext, parent);
        const active = this.HasGeneralActivity();
        const manager = active ? updateContext?.GetDataTextureManager?.() || null : null;
        this.damageOverlay.UpdateBlockData(manager, active);
    }

    SpawnImpactDebris(updateContext, parent)
    {
        if (!EveDamageOverlay.impactEffectEnabled || !parent || !this.armorImpactEmitter) return;
        const overlays = [ [ this.damageOverlay, 0 ] ];
        for (const item of parent.CollectPartDamageOverlays?.([]) || []) overlays.push(item);
        const hasPendingDebris = overlays.some(([ overlay ]) =>
            overlay.GetArmorImpactParentSize() > 0 &&
            Array.from(overlay.ArmorImpacts().values()).some(impact => impact.requestSpawnDebris));
        if (!hasPendingDebris) return;

        let system = updateContext?.GetGpuParticleSystem?.() || null;
        let renderer = null;
        if (!system)
        {
            renderer = Tw2GpuParticleRenderer.Get();
            system = renderer.system;
        }
        if (!system) return;

        const spawnFrom = (overlay, offset) =>
        {
            const parentSize = overlay.GetArmorImpactParentSize();
            if (parentSize <= 0) return;
            for (const impact of overlay.ArmorImpacts().values())
            {
                if (!impact.requestSpawnDebris) continue;
                const locator = offset + impact.damageLocatorIndex;
                const position = vec3.create();
                const direction = vec3.fromValues(0, 1, 0);
                parent.GetDamageLocatorPosition(position, locator, true);
                parent.GetDamageLocatorDirection(direction, locator, true);
                const velocity = parent.GetWorldVelocity?.(vec3.create()) || vec3.create();
                const scale = impact.size * parentSize /
                    (IMPACT_ARMOR_SIZE_MAX / IMPACT_ARMOR_SIZE_FACTOR);
                const rate = Math.max(0, Math.min(1,
                    overlay.GetRenderPriority() / IMPACT_ARMOR_PARTICLE_LOD_FACTOR));
                const args = renderer
                    ? renderer.GetEmitArguments({}, mat4.create())
                    : { system, time: updateContext.GetTime(), parentTransform: mat4.create() };
                args.system = system;
                args.time = updateContext.GetTime();
                args.originShift = updateContext?.GetOriginShift?.() || vec3.create();
                vec3.subtract(position, position, args.originShift);
                this.armorImpactEmitter.SetPosition(position);
                this.armorImpactEmitter.SetDirection(direction);
                this.armorImpactEmitter.SpawnOnce(args, velocity, scale, rate);
                impact.requestSpawnDebris = false;

                if (this.hullImpactEmitter &&
                    this.GetImpactConfiguration() === EveImpactOverlay.ImpactConfiguration.IMPACT_HULL)
                {
                    this.hullImpactEmitter.SetPosition(position);
                    this.hullImpactEmitter.SetDirection(direction);
                    this.hullImpactEmitter.SpawnOnce(args, velocity, scale, rate);
                }
            }
        };

        for (const [ overlay, offset ] of overlays)
        {
            spawnFrom(overlay, offset);
        }
    }

    UpdateAsyncronous(updateContext, parent)
    {
        if (!parent) return;
        const delta = updateContext.GetDeltaT();
        for (const [ index, impact ] of this._shieldImpacts)
        {
            impact.timeLeft -= delta;
            if (impact.timeLeft <= 0) this._shieldImpacts.delete(index);
        }
        this.shieldBoosting.Update(updateContext);
        this.shieldHardening.Update(updateContext);

        const sphere = vec4.create();
        parent.GetBoundingSphere(sphere);
        this.damageOverlay.UpdateAsyncronous(updateContext, {
            boundingSphere: sphere,
            estimatedPixelDiameter: parent.estimatedPixelDiameter,
            isInFrustum: parent.IsInFrustum?.() ?? parent._isInFrustum ?? parent.isVisible !== false,
            getDamageLocatorPositionOS: (index, out) =>
            {
                if (parent.GetDamageLocatorBindPosition)
                {
                    return parent.GetDamageLocatorBindPosition(index, out);
                }
                return parent.GetDamageLocatorPosition(out, index, false);
            }
        }, this._shieldImpacts.size, this.HasShieldActivity());

        const header = this.damageOverlay.HeaderRow();
        vec4.set(header[0], this._shieldImpacts.size, this.overallShieldImpact,
            this.shieldImpactColorFade, this.shieldImpactParentSize);
        vec4.set(header[1], this.shieldHardening.GetFaderValue(),
            this.shieldBoosting.GetFaderValue(), this.shieldHardening.GetKickInValue(),
            this.shieldBoosting.GetKickInValue());
        if (!this.HasGeneralActivity()) return;

        const world = parent.GetWorldTransform(mat4.create());
        const inverse = mat4.invert(mat4.create(), world);
        if (!inverse) return;
        this.shieldImpactParentSize = Math.max(
            IMPACT_SHIELD_SIZE_MIN, Math.min(IMPACT_SHIELD_SIZE_MAX, sphere[3]));
        if (!this._shieldImpacts.size) return;

        const center = vec3.create();
        const radii = vec3.fromValues(1, 1, 1);
        parent.GetShapeEllipsoid(center, radii);
        const locatorWorld = vec3.create();
        const position = vec3.create();
        let row = 0;
        for (const impact of this._shieldImpacts.values())
        {
            parent.GetDamageLocatorPosition(locatorWorld, impact.damageLocatorIndex, true);
            getShieldImpactPosition(position, this.shieldIsEllipsoid, inverse,
                locatorWorld, impact.direction, center, radii);
            const texel = this.damageOverlay.TexelRow(row++);
            vec4.set(texel[0], position[0], position[1], position[2], impact.timeLeft);
            vec4.set(texel[1], impact.size, impact.intensity, 0, impact.lifeTime);
            vec3.transformMat4(impact.interceptPosition, position, world);
        }
    }

    GetBatches(batchType, accumulator, perObjectData)
    {
        if (!this.display || !this.mesh ||
            this.damageOverlay.GetDataTextureBlockID() === -1 ||
            this.damageOverlay.GetDataTextureOffset() === -1 ||
            !this.HasShieldActivity()) return false;
        return this.mesh.GetBatches(batchType, accumulator, perObjectData);
    }

    GetArmorDamageShader(batchType) { return this.damageOverlay.GetArmorDamageShader(batchType); }

    GetResources(out = [])
    {
        this.mesh?.GetResources?.(out);
        this.armorDamageShader?.GetResources?.(out);
        this.armorImpactEmitter?.GetResources?.(out);
        this.hullImpactEmitter?.GetResources?.(out);
        return out;
    }

    _SyncLegacyDamageFieldsToOverlay()
    {
        this.damageOverlay ||= new EveDamageOverlay();
        this.damageOverlay.SetSeed(this.seed);
        this.damageOverlay.SetDamageLocatorCount(this._damageLocatorCount);
        this.damageOverlay.SetDebugForceSpawnDebris(this.debugForceSpawnDebris);
        this.damageOverlay.SetHullDamageFactor(this.hullDamageFactor);
        this.damageOverlay.SetArmorDamageShaderEffect(this.armorDamageShader);
        this.damageOverlay.SetHullDamageFlickerCurve(this.hullDamageFlickerCurve);
        this.damageOverlay.SetArmorRepairing(this.armorRepairing);
        this.damageOverlay.SetArmorHardening(this.armorHardening);
        this.damageOverlay.SetHullRepairing(this.hullRepairing);
    }

    static ImpactConfiguration = EveDamageOverlay.ImpactConfiguration;
}


function getShieldImpactPosition(out, ellipsoid, inverse, locatorWorld, direction, center, radii)
{
    vec3.transformMat4(out, locatorWorld, inverse);
    if (!ellipsoid) return out;
    const normal = transformNormal(vec3.create(), direction, inverse);
    return intersectEllipsoidRay(out, center, radii, out, normal);
}


function transformNormal(out, direction, matrix)
{
    const x = direction[0], y = direction[1], z = direction[2];
    out[0] = matrix[0] * x + matrix[4] * y + matrix[8] * z;
    out[1] = matrix[1] * x + matrix[5] * y + matrix[9] * z;
    out[2] = matrix[2] * x + matrix[6] * y + matrix[10] * z;
    return out;
}


function intersectEllipsoidRay(out, center, radii, origin, direction)
{
    if (Math.abs(radii[0]) < 1e-8 || Math.abs(radii[1]) < 1e-8 ||
        Math.abs(radii[2]) < 1e-8) return vec3.set(out, 0, 0, 0);
    const vx = direction[0] / radii[0];
    const vy = direction[1] / radii[1];
    const vz = direction[2] / radii[2];
    const sx = (origin[0] - center[0]) / radii[0];
    const sy = (origin[1] - center[1]) / radii[1];
    const sz = (origin[2] - center[2]) / radii[2];
    const vv = vx * vx + vy * vy + vz * vz;
    if (!(vv > 1e-12)) return vec3.set(out, 0, 0, 0);
    const vs = vx * sx + vy * sy + vz * sz;
    const ss = sx * sx + sy * sy + sz * sz;
    let discriminant = (vs / vv) ** 2 - ss / vv + 1 / vv;
    if (discriminant < 0) return vec3.set(out, 0, 0, 0);
    discriminant = Math.sqrt(discriminant);
    let t = -discriminant - vs / vv;
    if (t < 0) t = discriminant - vs / vv;
    return vec3.scaleAndAdd(out, origin, direction, t);
}
