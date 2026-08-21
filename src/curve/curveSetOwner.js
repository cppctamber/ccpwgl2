/**
 * Curve-set play/stop for the objects that own curve sets.
 *
 * Carbon's `ITr2CurveSetOwner` contract, written twice there and once here:
 * `EveSpaceObject2::PlayCurveSet` (cpp:3385-3415) and
 * `EveChildContainer::PlayCurveSet` (cpp:676-706) differ only in which child
 * lists they recurse into.
 *
 * The recursion is the whole point. `Tr2ActionPlayCurveSet` names a curve set
 * and hands it to the OWNER of the controller - a ship - but the curve sets
 * that drive VFX live on its effect children. Without an owner-side
 * implementation the action fell back to scanning the ship's own list, found
 * nothing, and started nothing: the hull's mesh animation played on warp
 * because that goes to the animation controller, while every VFX curve set in
 * the same state stayed silent.
 *
 * Two details from Carbon that are easy to get wrong:
 *   - EVERY matching curve set plays, not the first. A name can appear on
 *     several children and they are all meant to run.
 *   - an empty range name means `ResetTimeRange()` then `Play()`, not a bare
 *     `Play()`. A set left on a previously played range would otherwise resume
 *     inside it.
 */


/**
 * Plays every curve set of this name on an owner and everything below it.
 *
 * @param {Object} owner - carries `curveSets`
 * @param {String} name
 * @param {String} [rangeName] - empty plays the whole set from its start
 * @param {Array<Array>} [childLists] - child collections to recurse into
 * @returns {Boolean} whether anything was found to play
 */
export function PlayCurveSetOn(owner, name, rangeName, childLists = [])
{
    if (!owner || !name) return false;

    let played = false;

    const curveSets = owner.curveSets || [];
    for (let i = 0; i < curveSets.length; i++)
    {
        const curveSet = curveSets[i];
        if (!curveSet || curveSet.name !== name) continue;

        if (rangeName)
        {
            if (curveSet.PlayTimeRange) curveSet.PlayTimeRange(rangeName);
        }
        else
        {
            if (curveSet.ResetTimeRange) curveSet.ResetTimeRange();
            if (curveSet.Play) curveSet.Play();
        }

        played = true;
    }

    for (let list = 0; list < childLists.length; list++)
    {
        const children = childLists[list] || [];
        for (let i = 0; i < children.length; i++)
        {
            const child = children[i];
            if (child && child.PlayCurveSet && child.PlayCurveSet(name, rangeName)) played = true;
        }
    }

    return played;
}


/**
 * Stops every curve set of this name on an owner and everything below it.
 *
 * @param {Object} owner - carries `curveSets`
 * @param {String} name
 * @param {Array<Array>} [childLists] - child collections to recurse into
 * @returns {Boolean} whether anything was found to stop
 */
export function StopCurveSetOn(owner, name, childLists = [])
{
    if (!owner || !name) return false;

    let stopped = false;

    const curveSets = owner.curveSets || [];
    for (let i = 0; i < curveSets.length; i++)
    {
        const curveSet = curveSets[i];
        if (!curveSet || curveSet.name !== name) continue;
        if (curveSet.Stop) curveSet.Stop();
        stopped = true;
    }

    for (let list = 0; list < childLists.length; list++)
    {
        const children = childLists[list] || [];
        for (let i = 0; i < children.length; i++)
        {
            const child = children[i];
            if (child && child.StopCurveSet && child.StopCurveSet(name)) stopped = true;
        }
    }

    return stopped;
}


/**
 * Longest duration of a named RANGE across every curve set of this name on an
 * owner and everything below it.
 *
 * Port of `EveSpaceObject2::GetRangeDuration` (cpp:3479-3503) and
 * `EveChildContainer::GetRangeDuration`. Both are pure-virtual on Carbon's
 * `ITr2CurveSetOwner`, so an owner cannot exist without them - which is why
 * their absence on `EveShip2` went unnoticed here for so long.
 *
 * This is load bearing twice over. It arms the `syncToRange` veto in
 * `Tr2ActionPlayCurveSet`, and it backs the `CurveSetTime("Set/Range")`
 * expression builtin that transition conditions use to hold a state for as long
 * as its range plays. Returning 0 from either makes a state machine walk its
 * whole ring at one state per frame, replaying a different range every frame so
 * no curve ever advances.
 *
 * @param {Object} owner - carries `curveSets`
 * @param {String} setName
 * @param {String} rangeName
 * @param {Array<Array>} [childLists] - child collections to recurse into
 * @returns {Number} seconds
 */
export function GetRangeDurationOn(owner, setName, rangeName, childLists = [])
{
    if (!owner || !setName) return 0;

    let duration = 0;

    const curveSets = owner.curveSets || [];
    for (let i = 0; i < curveSets.length; i++)
    {
        const curveSet = curveSets[i];
        if (curveSet && curveSet.name === setName && curveSet.GetRangeDuration)
        {
            duration = Math.max(duration, curveSet.GetRangeDuration(rangeName));
        }
    }

    for (let list = 0; list < childLists.length; list++)
    {
        const children = childLists[list] || [];
        for (let i = 0; i < children.length; i++)
        {
            const child = children[i];
            if (child && child.GetRangeDuration)
            {
                duration = Math.max(duration, child.GetRangeDuration(setName, rangeName));
            }
        }
    }

    return duration;
}


/**
 * Longest curve duration across every curve set of this name on an owner and
 * everything below it - the whole-set answer, as opposed to one named range.
 *
 * Port of `EveSpaceObject2::GetCurveSetDuration` (cpp:3451-3477). Backs
 * `CurveSetTime("Set")` with no slash.
 *
 * @param {Object} owner - carries `curveSets`
 * @param {String} setName
 * @param {Array<Array>} [childLists] - child collections to recurse into
 * @returns {Number} seconds
 */
export function GetCurveSetDurationOn(owner, setName, childLists = [])
{
    if (!owner || !setName) return 0;

    let duration = 0;

    const curveSets = owner.curveSets || [];
    for (let i = 0; i < curveSets.length; i++)
    {
        const curveSet = curveSets[i];
        if (curveSet && curveSet.name === setName && curveSet.GetMaxCurveDuration)
        {
            duration = Math.max(duration, curveSet.GetMaxCurveDuration());
        }
    }

    for (let list = 0; list < childLists.length; list++)
    {
        const children = childLists[list] || [];
        for (let i = 0; i < children.length; i++)
        {
            const child = children[i];
            if (child && child.GetCurveSetDuration)
            {
                duration = Math.max(duration, child.GetCurveSetDuration(setName));
            }
        }
    }

    return duration;
}
