function GetAdapter(object)
{
    return object && object.GetTrcAdapter ? object.GetTrcAdapter() : null;
}

function Unique(values)
{
    const out = [];
    for (let i = 0; i < values.length; i++)
    {
        const value = values[i];
        if (value && !out.includes(value)) out.push(value);
    }
    return out;
}

export function GetOwner(controller, owner)
{
    return owner || (controller && controller.GetOwner ? controller.GetOwner() : null);
}

export function GetCandidates(object)
{
    const adapter = GetAdapter(object);
    return Unique([
        adapter,
        adapter && adapter.owner,
        object,
        object && object.owner
    ]);
}

function MatchesName(object, name)
{
    if (!object) return false;
    return !name || object.name === name;
}

export function FindSoundEmitter(owner, emitterName = "", controller)
{
    owner = GetOwner(controller, owner);
    const candidates = GetCandidates(owner);

    for (let i = 0; i < candidates.length; i++)
    {
        const candidate = candidates[i];
        if (!candidate) continue;

        if (candidate.FindSoundEmitter)
        {
            const emitter = candidate.FindSoundEmitter(emitterName);
            if (emitter) return emitter;
        }

        if (candidate.GetSoundEmitter)
        {
            const emitter = candidate.GetSoundEmitter(emitterName);
            if (emitter) return emitter;
        }

        if (candidate.GetAudioEmitter)
        {
            const emitter = candidate.GetAudioEmitter(emitterName);
            if (emitter) return emitter;
        }

        const direct = candidate.audioEmitter || candidate.soundEmitter;
        if (MatchesName(direct, emitterName)) return direct;

        const lists = [
            candidate.audioEmitters,
            candidate.soundEmitters,
            candidate.emitters
        ];

        for (let j = 0; j < lists.length; j++)
        {
            const list = Array.isArray(lists[j]) ? lists[j] : [];
            for (let k = 0; k < list.length; k++)
            {
                if (MatchesName(list[k], emitterName))
                {
                    return list[k];
                }
            }
        }

        if (!emitterName && IsEmitterLike(candidate))
        {
            return candidate;
        }
    }

    return null;
}

export function FindAudioTarget(owner, targetName, controller)
{
    owner = GetOwner(controller, owner);
    if (!targetName)
    {
        return owner;
    }

    const candidates = GetCandidates(owner);
    for (let i = 0; i < candidates.length; i++)
    {
        const candidate = candidates[i];
        if (!candidate) continue;

        if (candidate.FindAudioTarget)
        {
            const target = candidate.FindAudioTarget(targetName, controller);
            if (target) return target;
        }

        if (candidate.GetParameterByName)
        {
            const parameter = candidate.GetParameterByName(targetName);
            const target = parameter && parameter.GetParameterObject ? parameter.GetParameterObject() : parameter && (parameter.parameterObject || parameter.object || parameter.value);
            if (target) return target;
        }

        if (candidate.GetEffectChildByName)
        {
            const target = candidate.GetEffectChildByName(targetName);
            if (target) return target;
        }

        if (candidate.FindEffectChild)
        {
            const target = candidate.FindEffectChild(targetName);
            if (target) return target;
        }

        if (candidate.FindChild)
        {
            const target = candidate.FindChild(targetName);
            if (target) return target;
        }
    }

    return null;
}

export function CallEmitter(emitter, methodName, args)
{
    if (!emitter || !emitter[methodName])
    {
        return false;
    }

    emitter[methodName](...args);
    return true;
}

function IsEmitterLike(object)
{
    return !!(
        object &&
        (
            object.SendEvent ||
            object.SetRTPC ||
            object.SetSwitch ||
            object.SetPrefix ||
            object.SetAttenuationScalingFactor
        )
    );
}
