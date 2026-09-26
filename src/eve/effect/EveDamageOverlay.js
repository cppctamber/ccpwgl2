// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Attachments/EveDamageOverlay.{h,cpp}
import { meta } from "utils";
import { vec3, vec4 } from "math";
import { Tr2ScalarFader } from "curve";
import { RM_DECAL } from "constant";


const IMPACT_HOLE_TO_ARMOR_DAMAGE_RATIO = 12;
const IMPACT_ARMOR_SIZE_FACTOR = 0.0129;
const IMPACT_ARMOR_SIZE_MAX = 10;


/** Holds the armour and hull half of Carbon's impact-overlay state. */
@meta.define("EveDamageOverlay", true)
export class EveDamageOverlay extends meta.Model
{

    @meta.int32
    impactDataNextIdx = 1;

    @meta.uint
    armorImpactGoalCount = 0;

    @meta.float
    armorImpactParentSize = 0;

    @meta.float
    renderPriority = 0;

    @meta.boolean
    display = true;

    @meta.struct("Tw2Effect")
    armorDamageShader = null;

    @meta.uint
    seed = 0;

    @meta.float
    armorImpactLifeTime = 10;

    @meta.boolean
    debugForceSpawnDebris = false;

    @meta.struct("Tr2ScalarFader")
    armorRepairing = new Tr2ScalarFader();

    @meta.struct("Tr2ScalarFader")
    armorHardening = new Tr2ScalarFader();

    @meta.struct("Tr2ScalarFader")
    hullRepairing = new Tr2ScalarFader();

    @meta.float
    hullDamageFactor = 0;

    @meta.int32
    configuration = EveDamageOverlay.ImpactConfiguration.IMPACT_INVALID;

    @meta.uint
    damageLocatorCount = 0;

    @meta.int32
    dataTextureBlockID = -1;

    @meta.struct("TriPerlinCurve")
    hullDamageFlickerCurve = null;

    _dataTextureOffset = -1;
    _disabledDamageLocators = [];
    _lastDamageState = vec3.fromValues(1, 1, 1);
    _impactIndexSource = null;
    _armorImpacts = new Map();
    _header = Array.from({ length: 4 }, () => vec4.create());
    _texelRows = [];
    _wasVisible = false;

    Initialize()
    {
        return true;
    }

    SetSeed(value) { this.seed = Number(value) >>> 0; }

    SetDamageLocatorCount(value)
    {
        this.damageLocatorCount = Number(value) >>> 0;
        this._disabledDamageLocators.length = 0;
    }

    SetEnabledDamageLocators(enabled)
    {
        const filter = Array.from(enabled || []);
        this._disabledDamageLocators.length = 0;
        const count = Math.min(this.damageLocatorCount, filter.length);
        for (let index = 0; index < count; index++)
        {
            if (!filter[index]) this._disabledDamageLocators.push(index);
        }
    }

    SetDebugForceSpawnDebris(value) { this.debugForceSpawnDebris = !!value; }
    SetHullDamageFactor(value) { this.hullDamageFactor = Number(value); }
    SetArmorDamageShaderEffect(value) { this.armorDamageShader = value || null; }
    SetHullDamageFlickerCurve(value) { this.hullDamageFlickerCurve = value || null; }
    SetArmorRepairing(value) { this.armorRepairing = value; }
    SetArmorHardening(value) { this.armorHardening = value; }
    SetHullRepairing(value) { this.hullRepairing = value; }
    SetImpactIndexSource(value) { this._impactIndexSource = value || null; }

    GetSeed() { return this.seed; }
    GetImpactDataNextIdx() { return this.impactDataNextIdx; }
    GetArmorImpactGoalCount() { return this.armorImpactGoalCount; }
    GetArmorImpactParentSize() { return this.armorImpactParentSize; }
    GetDebugForceSpawnDebris() { return this.debugForceSpawnDebris; }
    GetHullDamageFactor() { return this.hullDamageFactor; }
    GetArmorDamageShaderEffect() { return this.armorDamageShader; }
    GetHullDamageFlickerCurve() { return this.hullDamageFlickerCurve; }
    GetArmorRepairing() { return this.armorRepairing; }
    GetArmorHardening() { return this.armorHardening; }
    GetHullRepairing() { return this.hullRepairing; }
    GetRenderPriority() { return this.renderPriority; }
    GetDataTextureOffset() { return this._dataTextureOffset; }
    GetDataTextureBlockID() { return this.dataTextureBlockID; }
    GetImpactConfiguration() { return this.configuration; }
    GetArmorImpactLifeTime() { return this.armorImpactLifeTime; }

    GetLastDamageState(out = vec3.create())
    {
        return vec3.copy(out, this._lastDamageState);
    }

    HeaderRow() { return this._header; }
    TexelRow(index) { return this._texelRows[index]; }
    ArmorImpacts() { return this._armorImpacts; }

    AllocateImpactIndex()
    {
        return this._impactIndexSource
            ? this._impactIndexSource.AllocateImpactIndex()
            : this.impactDataNextIdx++;
    }

    UpdateAsyncronous(updateContext, ownerInfo = {}, minTexelRows = 0, hasExternalActivity = false)
    {
        if (this.armorImpactGoalCount < this._armorImpacts.size)
        {
            let ordinal = 0;
            for (const [ index, impact ] of this._armorImpacts)
            {
                if (ordinal++ < this.armorImpactGoalCount) continue;
                impact.size -= updateContext.GetDeltaT() / this.armorImpactLifeTime;
                if (impact.size <= 0) this._armorImpacts.delete(index);
            }
        }

        this.armorHardening.Update(updateContext);
        this.armorRepairing.Update(updateContext);
        this.hullRepairing.Update(updateContext);

        const rowCount = Math.max(Number(minTexelRows) >>> 0, this._armorImpacts.size);
        while (this._texelRows.length < rowCount)
        {
            this._texelRows.push(Array.from({ length: 4 }, () => vec4.create()));
        }
        this._texelRows.length = rowCount;

        vec4.set(this._header[2],
            this._armorImpacts.size,
            this.armorImpactParentSize,
            this.hullRepairing.GetFaderValue(),
            this.hullRepairing.GetKickInValue());
        vec4.set(this._header[3],
            this.armorRepairing.GetFaderValue(),
            this.armorHardening.GetFaderValue(),
            this.armorRepairing.GetKickInValue(),
            this.armorHardening.GetKickInValue());

        if (!hasExternalActivity && !this.HasGeneralActivity()) return;

        const pixelDiameter = Math.max(0, Number(ownerInfo.estimatedPixelDiameter) || 0);
        const isInFrustum = !!ownerInfo.isInFrustum;
        this.renderPriority = this._wasVisible || isInFrustum ? pixelDiameter : 0;
        this._wasVisible = isInFrustum;

        const sphere = ownerInfo.boundingSphere;
        const radius = Number(sphere?.radius ?? sphere?.[3] ?? -1);
        this.armorImpactParentSize = Math.min(radius, IMPACT_ARMOR_SIZE_MAX / IMPACT_ARMOR_SIZE_FACTOR);

        if (!ownerInfo.getDamageLocatorPositionOS) return;
        let row = 0;
        for (const impact of this._armorImpacts.values())
        {
            const texel = this._texelRows[row++];
            const position = vec3.create();
            ownerInfo.getDamageLocatorPositionOS(impact.damageLocatorIndex, position);
            vec4.set(texel[2], position[0], position[1], position[2], 0);
            vec4.set(texel[3], impact.size * IMPACT_ARMOR_SIZE_FACTOR * this.armorImpactParentSize, 0, 0, 0);
        }
    }

    UpdateSyncronous(updateContext)
    {
        const manager = updateContext?.GetDataTextureManager?.() || null;
        return this.UpdateBlockData(manager, this.HasGeneralActivity());
    }

    UpdateBlockData(dataTextureManager, hasActivity)
    {
        if (!hasActivity || !dataTextureManager)
        {
            this.dataTextureBlockID = -1;
            this._dataTextureOffset = -1;
            return false;
        }

        this._dataTextureOffset = dataTextureManager.GetTextureOffset(this.dataTextureBlockID);
        this.dataTextureBlockID = dataTextureManager.RequestBlockData(
            this._header, this._texelRows.length, this._texelRows, this.renderPriority);
        return this.dataTextureBlockID !== -1;
    }

    HasArmorActivity()
    {
        return EveDamageOverlay.impactEffectEnabled &&
            (this._armorImpacts.size !== 0 || !this.armorHardening.IsZero() || !this.armorRepairing.IsZero());
    }

    HasHullActivity()
    {
        return EveDamageOverlay.impactEffectEnabled && !this.hullRepairing.IsZero();
    }

    HasGeneralActivity()
    {
        return this.HasHullActivity() || this.HasArmorActivity();
    }

    GetActivationStrength(updateContext)
    {
        if (EveDamageOverlay.impactEffectEnabled && this.hullDamageFactor > 0 && this.hullDamageFlickerCurve)
        {
            const value = Math.max(0.3, Math.min(
                1, this.hullDamageFlickerCurve.GetValueAt(updateContext.GetTime())));
            return value / Math.exp(this.hullDamageFactor);
        }
        return 1;
    }

    ToggleEffect(name, on, duration)
    {
        let fader = null;
        if (name === "armorhardening") fader = this.armorHardening;
        else if (name === "armorrepair") fader = this.armorRepairing;
        else if (name === "hullrepair") fader = this.hullRepairing;
        if (!fader) return false;
        fader.StartFade(!!on, Number(duration) / 4);
        return true;
    }

    SetDamageState(shield, armor, hull, createArmorImpacts = false)
    {
        if (shield > 0.05) this.configuration = EveDamageOverlay.ImpactConfiguration.IMPACT_SHIELD;
        else if (armor > 0.05) this.configuration = EveDamageOverlay.ImpactConfiguration.IMPACT_ARMOR;
        else if (hull > 0) this.configuration = EveDamageOverlay.ImpactConfiguration.IMPACT_HULL;

        // diverged: Carbon's goal is 12 * (1 - armor) + 4 * (1 - hull) holes, at
        // most 16 (EveDamageOverlay.cpp:467), picked with replacement. Here
        // armour damage places up to 12 distinct holes and hull damage fills the
        // remaining enabled locators, with a minimum size growing with hull
        // damage, so a ship at zero hull is blackened throughout - the
        // operator's requirement for this viewer, not Carbon's behaviour.
        const enabledLocatorCount = this.damageLocatorCount - this._disabledDamageLocators.length;
        const armorGoal = Math.min(enabledLocatorCount,
            IMPACT_HOLE_TO_ARMOR_DAMAGE_RATIO * Clamp01(1 - armor));
        const hullDamage = Clamp01(1 - hull);
        this.armorImpactGoalCount = Math.trunc(
            armorGoal + (enabledLocatorCount - armorGoal) * hullDamage);
        this.hullDamageFactor = Linearize(0.9, 0.1, hull);

        if (this.hullDamageFlickerCurve)
        {
            const modifier = Linearize(1, 0, hull);
            this.hullDamageFlickerCurve.scale = modifier;
            this.hullDamageFlickerCurve.offset = 1 - modifier;
        }

        if (createArmorImpacts && enabledLocatorCount)
        {
            const random = SeededRandom((this.seed + this._armorImpacts.size) >>> 0);
            const minimumImpactSize = 0.2 + 0.6 * hullDamage;
            for (const impact of this._armorImpacts.values())
            {
                impact.size = Math.max(impact.size, minimumImpactSize);
            }
            const used = new Set(Array.from(this._armorImpacts.values(), impact =>
                impact.damageLocatorIndex));
            const available = [];
            for (let locator = 0; locator < this.damageLocatorCount; locator++)
            {
                if (!used.has(locator) && !this._disabledDamageLocators.includes(locator))
                {
                    available.push(locator);
                }
            }
            while (this._armorImpacts.size < this.armorImpactGoalCount && available.length)
            {
                const candidate = Math.floor(random() * available.length);
                const locator = available.splice(candidate, 1)[0];
                this.CreateImpact(locator,
                    minimumImpactSize + random() * (0.6 - 0.4 * hullDamage),
                    this.debugForceSpawnDebris);
            }
        }

        vec3.set(this._lastDamageState, shield, armor, hull);
    }

    Clear()
    {
        this._armorImpacts.clear();
    }

    CreateImpact(damageLocatorIndex, size, spawnEffects = false)
    {
        for (const [ index, impact ] of this._armorImpacts)
        {
            if (impact.damageLocatorIndex !== damageLocatorIndex) continue;
            impact.size = Math.max(Number(size), impact.size);
            impact.requestSpawnDebris = !!spawnEffects;
            return index;
        }

        const impactIndex = this.AllocateImpactIndex();
        this._armorImpacts.set(impactIndex, {
            damageLocatorIndex: Number(damageLocatorIndex) | 0,
            size: Number(size),
            requestSpawnDebris: !!spawnEffects
        });
        return impactIndex;
    }

    HasImpact(impactIndex)
    {
        return this._armorImpacts.has(Number(impactIndex) | 0);
    }

    GetArmorDamageShader(batchType)
    {
        if (!this.display || batchType !== RM_DECAL ||
            this.dataTextureBlockID === -1 || this._dataTextureOffset === -1 ||
            !this.HasArmorActivity()) return null;
        return this.armorDamageShader;
    }

    static impactEffectEnabled = true;

    static ImpactConfiguration = Object.freeze({
        IMPACT_INVALID: 0,
        IMPACT_SHIELD: 1,
        IMPACT_ARMOR: 2,
        IMPACT_HULL: 3
    });
}


function Clamp01(value)
{
    return Math.max(0, Math.min(1, Number(value)));
}


function Linearize(min, max, value)
{
    return Clamp01((Number(value) - min) / (max - min));
}


function SeededRandom(seed)
{
    let state = seed || 0x6d2b79f5;
    return () =>
    {
        state = (state + 0x6d2b79f5) >>> 0;
        let value = state;
        value = Math.imul(value ^ value >>> 15, value | 1);
        value ^= value + Math.imul(value ^ value >>> 7, value | 61);
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
}
