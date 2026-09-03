import { mat4, quat } from "math";


const RANDOM_INCLUSION = 0;
const PARENT_MATCH = 1;
const DEPLETION_COUNTER = 2;
const GRAPHIC_SETTING_MAP = 3;
const DEFAULT_SHADER_MODEL = 4;


/**
 * Builds a detached deterministic plan for the layouts selected by a parsed
 * ccpwgl SOF DNA. The result contains data and matrices only; rendering is a
 * separate concern.
 * @param {EveSOFData} data
 * @param {Object} sof - result of EveSOFData.ParseDNA
 * @param {Object} [options]
 * @returns {Object}
 */
export function planSofLayouts(data, sof, options = {})
{
    const diagnostics = [];
    const normalized = normalizeOptions(options, diagnostics);
    const plan = {
        schemaVersion: 1,
        dna: sof.dna,
        options: {
            seedOverwrite: normalized.seedOverwrite,
            scrambleSeedOffset: normalized.scrambleSeedOffset,
            shaderModel: normalized.shaderModel,
            maxDepth: normalized.maxDepth,
            offsets: normalized.offsets.map(value => Array.from(value))
        },
        invocations: [],
        layouts: [],
        placements: [],
        skipped: [],
        diagnostics,
        finalRandomState: 0
    };
    const context = {
        ...normalized,
        data,
        plan,
        random: new SofLayoutRandom(normalized.initialRandomState),
        nextInvocationId: 0,
        nextPlacementId: 0
    };

    planSelectionLayouts(sof, normalized.offsets, context, 0, null);
    plan.finalRandomState = context.random.state;
    return plan;
}


class SofLayoutRandom
{
    constructor(seed)
    {
        this.state = 0;
        this.drawCount = 0;
        this.Srand(seed);
    }

    Srand(seed)
    {
        this.state = (Number(seed) >>> 0) % 714025;
    }

    Next()
    {
        this.state = ((((this.state << 12) >>> 0) + 150889) >>> 0) % 714025;
        this.drawCount++;
        return Math.fround(this.state / 714025);
    }
}


function normalizeOptions(options, diagnostics)
{
    const requestedMaxDepth = Number(options.maxDepth === undefined ? 16 : options.maxDepth);
    const offsets = Array.isArray(options.offsets) && options.offsets.length
        ? options.offsets.map((value, index) => finiteVector(
            value,
            16,
            identityMatrix(),
            diagnostics,
            `options.offsets[${index}]`
        ))
        : [ identityMatrix() ];

    let shaderModel = Number(options.shaderModel);
    if (!Number.isInteger(shaderModel))
    {
        const quality = String(options.graphicsQuality || "").toLowerCase();
        shaderModel = quality === "low" ? 3 : quality === "high" ? 5 : DEFAULT_SHADER_MODEL;
    }
    if (shaderModel < 3 || shaderModel > 6)
    {
        diagnostics.push({ code: "invalid-shader-model", value: shaderModel, fallback: DEFAULT_SHADER_MODEL });
        shaderModel = DEFAULT_SHADER_MODEL;
    }

    return {
        seedOverwrite: Number(options.seedOverwrite || 0) >>> 0,
        scrambleSeedOffset: Number(options.scrambleSeedOffset || 0) >>> 0,
        initialRandomState: Number(options.initialRandomState === undefined ? 1234 : options.initialRandomState) >>> 0,
        shaderModel,
        maxDepth: Number.isFinite(requestedMaxDepth) ? Math.max(0, Math.trunc(requestedMaxDepth)) : 16,
        offsets
    };
}


function planSelectionLayouts(sof, offsets, context, depth, parentBatchKey)
{
    if (depth > context.maxDepth)
    {
        context.plan.diagnostics.push({
            code: "layout-depth-limit",
            dna: sof.dna,
            depth,
            parentBatchKey
        });
        return null;
    }

    const invocationId = context.nextInvocationId++;
    const invocation = {
        id: invocationId,
        dna: sof.dna,
        depth,
        parentBatchKey,
        offsetCount: offsets.length,
        layoutKeys: []
    };
    context.plan.invocations.push(invocation);

    const managedLocatorSets = buildManagedLocatorSets(sof, context, invocationId);
    for (let layoutIndex = 0; layoutIndex < sof.layouts.length; layoutIndex++)
    {
        const layout = sof.layouts[layoutIndex];
        const oldSeed = context.random.state;
        const sourceSeed = Number(layout.seed || 0) >>> 0;
        const effectiveSeed = (
            sourceSeed
            + context.seedOverwrite
            + (layout.randomizeSeedOnLoad ? context.scrambleSeedOffset : 0)
        ) >>> 0;
        context.random.Srand(effectiveSeed);

        const drawStart = context.random.drawCount;
        const layoutKey = `${invocationId}:${layoutIndex}`;
        const layoutPlan = {
            key: layoutKey,
            invocationId,
            index: layoutIndex,
            name: String(layout.name || ""),
            sourceSeed,
            effectiveSeed,
            randomStartState: context.random.state,
            randomEndState: context.random.state,
            restoredRandomState: null,
            randomDrawCount: 0,
            placementKeys: []
        };
        context.plan.layouts.push(layoutPlan);
        invocation.layoutKeys.push(layoutKey);

        for (let placementIndex = 0; placementIndex < layout.placements.length; placementIndex++)
        {
            processPlacement(
                normalizePlacement(layout.placements[placementIndex]),
                [ placementIndex ],
                layout,
                layoutPlan,
                sof,
                offsets,
                managedLocatorSets,
                context,
                depth
            );
        }

        layoutPlan.randomEndState = context.random.state;
        layoutPlan.randomDrawCount = context.random.drawCount - drawStart;
        if (layout.randomizeSeedOnLoad)
        {
            context.random.Srand((oldSeed + context.seedOverwrite) >>> 0);
            layoutPlan.restoredRandomState = context.random.state;
        }
    }
    return invocation;
}


function processPlacement(placement, path, layout, layoutPlan, sof, offsets, managedLocatorSets, context, depth)
{
    if (placement.isGroup)
    {
        if (!placement.enabled)
        {
            skip(context, layoutPlan, path, placement, "disabled-group");
            return;
        }
        if (!conditionsPass(placement.conditions, path, layoutPlan, sof, context))
        {
            skip(context, layoutPlan, path, placement, "group-condition-failed");
            return;
        }
        for (let index = 0; index < placement.placements.length; index++)
        {
            processPlacement(
                normalizePlacement(placement.placements[index]),
                [ ...path, index ],
                layout,
                layoutPlan,
                sof,
                offsets,
                managedLocatorSets,
                context,
                depth
            );
        }
        return;
    }

    if (!placement.enabled)
    {
        skip(context, layoutPlan, path, placement, "disabled-placement");
        return;
    }

    const locators = collectPlacementLocators(sof, placement.locatorSetName, managedLocatorSets, context, path);
    if (!locators.length)
    {
        skip(context, layoutPlan, path, placement, "no-locators");
        return;
    }
    if (!conditionsPass(placement.conditions, path, layoutPlan, sof, context))
    {
        skip(context, layoutPlan, path, placement, "placement-condition-failed");
        return;
    }
    if (placement.distribution && !distributeLocators(
        placement.distribution,
        locators,
        managedLocatorSets.get(placement.locatorSetName) || [],
        context,
        layoutPlan,
        path
    ))
    {
        skip(context, layoutPlan, path, placement, "invalid-distribution");
        return;
    }

    let extensionSof;
    try
    {
        extensionSof = buildExtensionSelection(context.data, layout.name, placement.descriptor, sof);
    }
    catch (err)
    {
        context.plan.diagnostics.push({
            code: "invalid-extension-dna",
            layoutKey: layoutPlan.key,
            placementPath: path.slice(),
            message: err.message
        });
        skip(context, layoutPlan, path, placement, "invalid-extension-dna");
        return;
    }

    if (!locators.length)
    {
        skip(context, layoutPlan, path, placement, "distribution-removed-all-locators");
        return;
    }

    const batches = placement.descriptor.layout
        ? locators.map(locator => [ locator ])
        : [ locators ];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++)
    {
        const batchKey = `${layoutPlan.key}:${path.join(".")}:${batchIndex}`;
        const transforms = [];
        let occurrenceIndex = 0;

        for (let offsetIndex = 0; offsetIndex < offsets.length; offsetIndex++)
        {
            for (let locatorIndex = 0; locatorIndex < batches[batchIndex].length; locatorIndex++)
            {
                const planned = createPlacementOccurrence(
                    placement,
                    batches[batchIndex][locatorIndex],
                    offsets[offsetIndex],
                    context,
                    layoutPlan,
                    path,
                    batchKey,
                    occurrenceIndex++,
                    offsetIndex,
                    locatorIndex,
                    extensionSof
                );
                context.plan.placements.push(planned);
                layoutPlan.placementKeys.push(planned.key);
                transforms.push(planned.transform.slice());
            }
        }

        if (extensionSof.layouts.length)
        {
            planSelectionLayouts(extensionSof, transforms, context, depth + 1, batchKey);
        }
    }
}


function buildExtensionSelection(data, layoutName, descriptor, parent)
{
    const hulls = String(descriptor.hull || "").split(";").filter(Boolean);
    if (!hulls.length) throw new TypeError(`Layout ${layoutName} placement has no hull descriptor`);

    const area = Object.assign({}, parent.area);
    for (let index = 1; index <= 4; index++)
    {
        const value = descriptor[`material${index}`];
        if (value) area[`material${index}`] = value;
    }

    const dna = data.StringifyDNA({
        hulls,
        faction: descriptor.faction || parent.faction.name,
        race: descriptor.race || parent.race.name,
        area,
        resPathInsert: parent.resPathInsert,
        pattern: descriptor.pattern || null,
        layouts: descriptor.layout || null
    });
    return data.ParseDNA(dna);
}


function conditionsPass(conditions, path, layoutPlan, sof, context)
{
    for (let index = 0; index < conditions.length; index++)
    {
        const condition = conditions[index];
        switch (condition.type)
        {
            case RANDOM_INCLUSION:
                if (!(condition.chance > context.random.Next())) return false;
                break;

            case PARENT_MATCH:
            {
                const descriptor = condition.descriptor;
                const ignored = [ "hull", "pattern", "material1", "material2", "material3", "material4", "layout" ]
                    .filter(name => String(descriptor[name] || "") !== "");
                if (ignored.length)
                {
                    context.plan.diagnostics.push({
                        code: "parent-match-fields-not-implemented-in-carbon",
                        layoutKey: layoutPlan.key,
                        placementPath: path.slice(),
                        conditionIndex: index,
                        fields: ignored
                    });
                }
                if (descriptor.faction && descriptor.faction !== sof.faction.name) return false;
                if (descriptor.race && descriptor.race !== sof.race.name) return false;
                break;
            }

            case DEPLETION_COUNTER:
                context.plan.diagnostics.push({
                    code: "depletion-condition-not-implemented-in-carbon",
                    layoutKey: layoutPlan.key,
                    placementPath: path.slice(),
                    conditionIndex: index
                });
                break;

            case GRAPHIC_SETTING_MAP:
                if (!graphicsConditionPasses(condition.displayFilter, context.shaderModel)) return false;
                break;

            default:
                context.plan.diagnostics.push({
                    code: "unknown-distribution-condition",
                    layoutKey: layoutPlan.key,
                    placementPath: path.slice(),
                    conditionIndex: index,
                    distributionType: condition.type
                });
                break;
        }
    }
    return true;
}


function graphicsConditionPasses(displayFilter, shaderModel)
{
    switch (displayFilter)
    {
        case 0: return shaderModel === 3;
        case 1: return shaderModel <= 4;
        case 2: return shaderModel === 4;
        case 3: return shaderModel >= 4;
        case 4: return shaderModel === 5;
        case 5: return true;
        case 6: return false;
        default: return false;
    }
}


function distributeLocators(distribution, locators, managed, context, layoutPlan, path)
{
    const completeness = Number(distribution.completeness);
    const cap = Math.trunc(Number(distribution.cap));
    if (!Number.isFinite(completeness) || completeness < 0 || completeness > 1 || !Number.isFinite(cap) || cap < 0)
    {
        context.plan.diagnostics.push({
            code: "unsafe-layout-distribution",
            layoutKey: layoutPlan.key,
            placementPath: path.slice(),
            completeness,
            cap
        });
        return false;
    }

    const preCount = Math.fround(locators.length * Math.fround(1 - completeness));
    const remainder = preCount % 1;
    let count = Math.trunc(preCount) + Math.trunc(remainder + context.random.Next());
    if (cap > 0) count = Math.max(count, locators.length - cap);

    if (count > 0)
    {
        const ranks = new Map(locators.map(locator => [ locator.uniqueID, [ 0, 0, 0, 0 ] ]));
        const bias = finiteVector(
            distribution.placementBias,
            3,
            [ 0, 0, 0 ],
            context.plan.diagnostics,
            `${layoutPlan.key}:${path.join(".")}:placementBias`
        );

        for (let axis = 0; axis < 3; axis++)
        {
            if (bias[axis] === 0) continue;
            locators.sort((a, b) => a.position[axis] - b.position[axis] || a.sourceOrder - b.sourceOrder);
            locators.forEach((locator, index) => { ranks.get(locator.uniqueID)[axis] = index; });
        }

        const centerBias = Number(distribution.centerBias || 0);
        if (centerBias !== 0)
        {
            locators.sort((a, b) => squaredLength(a.position) - squaredLength(b.position) || a.sourceOrder - b.sourceOrder);
            locators.forEach((locator, index) => { ranks.get(locator.uniqueID)[3] = index; });
        }

        const biasAmount = Math.hypot(...bias) + Math.abs(centerBias);
        const randomFactor = Math.max(1 - biasAmount, 0);
        for (const locator of locators)
        {
            const rank = ranks.get(locator.uniqueID);
            let power = -(rank[0] * bias[0] + rank[1] * bias[1] + rank[2] * bias[2]);
            power += locators.length * context.random.Next() * randomFactor * 4;
            power += centerBias < 0
                ? (locators.length - rank[3]) * Math.abs(centerBias)
                : rank[3] * centerBias;
            rank[0] = Math.fround(power);
        }
        locators.sort((a, b) => ranks.get(a.uniqueID)[0] - ranks.get(b.uniqueID)[0] || a.sourceOrder - b.sourceOrder);
    }

    while (count-- > 0) locators.pop();

    const maxSteps = finiteVector(
        distribution.randomRotationMaxSteps,
        3,
        [ 0, 0, 0 ],
        context.plan.diagnostics,
        `${layoutPlan.key}:${path.join(".")}:randomRotationMaxSteps`
    );
    if (squaredLength(maxSteps) > 0)
    {
        const step = quaternionToYawPitchRoll(finiteVector(
            distribution.randomRotationStepSizeYPR,
            4,
            [ 0, 0, 0, 1 ],
            context.plan.diagnostics,
            `${layoutPlan.key}:${path.join(".")}:randomRotationStepSizeYPR`
        ));

        for (const locator of locators)
        {
            const yaw = step[0] * Math.floor(maxSteps[0] * context.random.Next() + 0.5);
            const pitch = step[1] * Math.floor(maxSteps[1] * context.random.Next() + 0.5);
            const roll = step[2] * Math.floor(maxSteps[2] * context.random.Next() + 0.5);
            const randomRotation = quat.fromYawPitchRoll(quat.create(), yaw, pitch, roll);
            locator.rotation = Array.from(quat.multiply(quat.create(), randomRotation, locator.rotation));
        }
    }

    if (distribution.occupyLocators)
    {
        for (const locator of locators)
        {
            const index = managed.findIndex(value => value.uniqueID === locator.uniqueID);
            if (index !== -1)
            {
                managed[index] = managed[managed.length - 1];
                managed.pop();
            }
        }
    }
    return true;
}


function createPlacementOccurrence(
    placement,
    locator,
    offset,
    context,
    layoutPlan,
    path,
    batchKey,
    occurrenceIndex,
    offsetIndex,
    locatorIndex,
    extensionSof
)
{
    const scaling = locator.scaling.slice();
    if (placement.distribution)
    {
        const minimum = finiteVector(
            placement.distribution.randomScaleMin,
            3,
            [ 1, 1, 1 ],
            context.plan.diagnostics,
            `${layoutPlan.key}:${path.join(".")}:randomScaleMin`
        );
        const maximum = finiteVector(
            placement.distribution.randomScaleMax,
            3,
            [ 1, 1, 1 ],
            context.plan.diagnostics,
            `${layoutPlan.key}:${path.join(".")}:randomScaleMax`
        );

        if (placement.distribution.uniformScale)
        {
            const amount = context.random.Next();
            for (let axis = 0; axis < 3; axis++) scaling[axis] *= lerp(minimum[axis], maximum[axis], amount);
        }
        else
        {
            for (let axis = 0; axis < 3; axis++)
            {
                scaling[axis] *= lerp(minimum[axis], maximum[axis], context.random.Next());
            }
        }
    }

    const rotation = Array.from(quat.normalize(quat.create(), locator.rotation));
    const placementOffset = finiteVector(
        placement.offset,
        3,
        [ 0, 0, 0 ],
        context.plan.diagnostics,
        `${layoutPlan.key}:${path.join(".")}:offset`
    );
    const transform = mat4.fromTranslation(mat4.create(), placementOffset);
    const locatorTransform = mat4.fromRotationTranslationScale(
        mat4.create(),
        rotation,
        locator.position,
        scaling
    );

    // ccpwgl and the consolidated runtime both use gl-matrix column-major
    // semantics. This is locator * placement offset, then parent * result.
    mat4.multiply(transform, locatorTransform, transform);
    mat4.multiply(transform, offset, transform);

    const id = context.nextPlacementId++;
    return {
        key: `${batchKey}:${occurrenceIndex}`,
        id,
        batchKey,
        layoutKey: layoutPlan.key,
        layoutIndex: layoutPlan.index,
        placementPath: path.slice(),
        name: placement.name,
        locatorSetName: placement.locatorSetName,
        descriptor: cloneDescriptor(placement.descriptor),
        dna: extensionSof.dna,
        nestedLayoutNames: extensionSof.layouts.map(value => value.name),
        isInstanced: placement.isInstanced,
        isShared: placement.isShared,
        extendsBoundingSphere: placement.extendsBoundingSphere,
        extendsShieldEllipsoid: placement.extendsShieldEllipsoid,
        buildFlags: placement.isInstanced ? 4 : 2,
        offsetIndex,
        locatorIndex,
        locator: {
            hullIndex: locator.hullIndex,
            uniqueID: locator.uniqueID,
            key: `${locator.hullIndex}:${locator.uniqueID}`,
            position: locator.position.slice(),
            rotation: locator.rotation.slice(),
            scaling: locator.scaling.slice(),
            boneIndex: locator.boneIndex
        },
        placementOffset,
        randomizedScaling: scaling,
        rotation,
        transform: Array.from(transform)
    };
}


function buildManagedLocatorSets(sof, context, invocationId)
{
    const result = new Map();
    let sourceOrder = 0;
    for (let hullIndex = 0; hullIndex < sof.hulls.length; hullIndex++)
    {
        const sets = getHullLocatorSets(sof.hulls[hullIndex]);
        for (const [ name, locators ] of sets)
        {
            if (!result.has(name)) result.set(name, []);
            const target = result.get(name);
            for (let index = 0; index < locators.length; index++)
            {
                target.push({ uniqueID: locators[index].uniqueID, sourceOrder });
                sourceOrder++;
            }
        }
    }
    if (!sourceOrder && sof.layouts.length)
    {
        context.plan.diagnostics.push({ code: "layout-invocation-has-no-locators", invocationId });
    }
    return result;
}


function collectPlacementLocators(sof, setName, managedLocatorSets, context, path)
{
    const result = [];
    const managed = managedLocatorSets.get(setName) || [];
    const hullOffset = [ 0, 0, 0 ];
    let sourceOrder = 0;
    for (let hullIndex = 0; hullIndex < sof.hulls.length; hullIndex++)
    {
        const sets = getHullLocatorSets(sof.hulls[hullIndex]);
        const values = (sets.get(setName) || []).map(value => cloneLocator(
            value,
            hullIndex,
            hullOffset,
            sourceOrder++,
            value.uniqueID,
            context,
            path
        ));

        for (let index = 0; index < values.length; index++)
        {
            if (managed.some(item => item.uniqueID === values[index].uniqueID)) continue;
            values[index] = values[values.length - 1];
            values.pop();
            index--;
        }
        result.push(...values);

        const next = (sets.get("next_subsystem") || [])[0];
        if (next) addVector(hullOffset, next.locator.position);
    }
    return result;
}


function getHullLocatorSets(hull)
{
    const result = new Map();
    let uniqueID = 0;
    const visit = value =>
    {
        if (value.GetClassName() === "EveSOFDataHullLocatorSet")
        {
            if (!result.has(value.name)) result.set(value.name, []);
            for (const locator of value.locators)
            {
                result.get(value.name).push({ locator, uniqueID: uniqueID++ });
            }
            return;
        }
        for (const child of value.locatorSets) visit(child);
    };
    for (const value of hull.locatorSets) visit(value);
    return result;
}


function cloneLocator(value, hullIndex, hullOffset, sourceOrder, uniqueID, context, path)
{
    value = value.locator;
    const position = finiteVector(
        value.position,
        3,
        [ 0, 0, 0 ],
        context.plan.diagnostics,
        `locator:${path.join(".")}:position`
    );
    addVector(position, hullOffset);
    return {
        hullIndex,
        uniqueID,
        position,
        rotation: finiteVector(
            value.rotation,
            4,
            [ 0, 0, 0, 1 ],
            context.plan.diagnostics,
            `locator:${path.join(".")}:rotation`
        ),
        scaling: finiteVector(
            value.scaling,
            3,
            [ 1, 1, 1 ],
            context.plan.diagnostics,
            `locator:${path.join(".")}:scaling`
        ),
        boneIndex: Number(value.boneIndex === undefined ? -1 : value.boneIndex) | 0,
        sourceOrder
    };
}


function normalizePlacement(value)
{
    const className = value.GetClassName();
    const isGroup = className === "EveSOFDataHullExtensionPlacementGroup"
        || className === "EveSOFDataHullExtensionBucket";

    if (isGroup)
    {
        return {
            name: String(value.name || ""),
            enabled: value.enabled !== false,
            isGroup: true,
            placements: value.placements,
            conditions: normalizeConditions(value.distributionConditions)
        };
    }

    if (className !== "EveSOFDataHullExtensionPlacement")
    {
        throw new TypeError(`Unsupported SOF layout placement class ${className}`);
    }

    return {
        name: String(value.name || ""),
        enabled: value.enabled !== false,
        isGroup: false,
        offset: value.offset,
        locatorSetName: String(value.locatorSetName || ""),
        descriptor: cloneDescriptor(value.descriptor),
        isInstanced: value.isInstanced !== false,
        isShared: value.isShared === true,
        extendsBoundingSphere: value.extendsBoundingSphere !== false,
        extendsShieldEllipsoid: value.extendsShieldEllipsoid !== false,
        distribution: value.distribution,
        conditions: normalizeConditions(value.distributionConditions)
    };
}


function normalizeConditions(values)
{
    return values.map(value =>
    {
        const className = value.GetClassName();
        if (className === "EveSOFDataHullExtensionPlacementDistributionParentMatch")
        {
            return { type: PARENT_MATCH, descriptor: cloneDescriptor(value.parentDescriptor) };
        }
        if (className === "EveSOFDataHullExtensionPlacementDistributionDepletionCounter")
        {
            return { type: DEPLETION_COUNTER };
        }
        if (className === "EveSOFDataHullExtensionPlacementDistributionMapGraphicSettings")
        {
            return { type: GRAPHIC_SETTING_MAP, displayFilter: Number(value.displayFilter) | 0 };
        }
        if (className === "EveSOFDataHullExtensionPlacementDistributionRandomChance")
        {
            return { type: RANDOM_INCLUSION, chance: Number(value.chanceOfUsage) };
        }
        return { type: -1 };
    });
}


function cloneDescriptor(value)
{
    return {
        hull: String(value && value.hull || ""),
        faction: String(value && value.faction || ""),
        race: String(value && value.race || ""),
        pattern: String(value && value.pattern || ""),
        material1: String(value && value.material1 || ""),
        material2: String(value && value.material2 || ""),
        material3: String(value && value.material3 || ""),
        material4: String(value && value.material4 || ""),
        layout: String(value && value.layout || ""),
        seed: String(value && value.seed || "")
    };
}


function quaternionToYawPitchRoll(value)
{
    let y = 2 * (value[0] * value[3] - value[2] * value[1]);
    const w = Math.sqrt(Math.max(1 - y * y, 0));
    const gamma = Math.SQRT1_2 / Math.sqrt(w + 1);
    y = Math.max(-1, Math.min(1, y));
    const pitch = Math.asin(y);
    const qPitch = [ y * gamma, 0, 0, (w + 1) * gamma ];

    if (Math.abs(Math.abs(y) - 1) < 0.00001)
    {
        const combined = quat.multiply(quat.create(), quat.conjugate(quat.create(), qPitch), value);
        let roll = 2 * Math.acos(Math.max(-1, Math.min(1, combined[3])));
        if (roll > Math.PI) roll -= Math.PI * 2;
        if (combined[2] > 0) roll = -roll;
        return [ 0, pitch, -roll ];
    }

    const denominator = 1 / (qPitch[0] * qPitch[0] - qPitch[3] * qPitch[3]);
    const yawRoll = [
        (value[3] * qPitch[0] - value[0] * qPitch[3]) * denominator,
        -(value[2] * qPitch[0] + value[1] * qPitch[3]) * denominator,
        -(value[2] * qPitch[3] + value[1] * qPitch[0]) * denominator,
        (value[0] * qPitch[0] - value[3] * qPitch[3]) * denominator
    ];
    const divisor = Math.sqrt(yawRoll[3] * yawRoll[3] + yawRoll[2] * yawRoll[2]);
    const rollGamma = divisor === 0 ? 0 : 1 / divisor;
    const rollConW = Math.max(-1, Math.min(1, yawRoll[3] * rollGamma));
    let roll = 2 * Math.acos(rollConW);
    if (roll > Math.PI) roll -= Math.PI * 2;
    if (yawRoll[2] < 0) roll = -roll;
    yawRoll[1] = (yawRoll[0] * yawRoll[2] + yawRoll[1] * yawRoll[3]) * rollGamma;
    yawRoll[3] = (yawRoll[2] * yawRoll[2] + yawRoll[3] * yawRoll[3]) * rollGamma;
    let yaw = Math.asin(Math.max(-1, Math.min(1, yawRoll[1])));
    if (yawRoll[3] < 0) yaw = Math.PI - yaw;
    if (yaw < 0) yaw += Math.PI;
    return [ yaw * 2, pitch, roll ];
}


function skip(context, layoutPlan, path, placement, reason)
{
    context.plan.skipped.push({
        layoutKey: layoutPlan.key,
        placementPath: path.slice(),
        name: placement.name,
        reason
    });
}


function finiteVector(value, length, fallback, diagnostics, label)
{
    if (value && typeof value.length === "number" && value.length === length)
    {
        const result = Array.from(value, Number);
        if (result.every(Number.isFinite)) return result;
    }
    diagnostics.push({ code: "invalid-numeric-vector", field: label, fallback: fallback.slice() });
    return fallback.slice();
}


function addVector(target, value)
{
    for (let index = 0; index < 3; index++) target[index] += Number(value[index] || 0);
}


function squaredLength(value)
{
    return value.reduce((total, component) => total + component * component, 0);
}


function lerp(from, to, amount)
{
    return from + (to - from) * amount;
}


function identityMatrix()
{
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
}
