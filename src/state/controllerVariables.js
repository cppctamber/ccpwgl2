/**
 * Controller-variable propagation, shared by the two objects that own
 * controllers.
 *
 * Carbon writes this body twice, once per owner - `EveEffectRoot2.cpp:880-899`
 * and `EveChildContainer.cpp:917-936` - and the two are identical apart from
 * which child list they recurse into. ccpwgl keeps one copy: the owners differ
 * only in what they pass as `children`.
 *
 * The shape matters in three ways, and the old code had none of them:
 *
 *   1. the value is REMEMBERED, so a controller that links later still gets it;
 *   2. it goes to EVERY controller the owner holds, not a chosen one;
 *   3. it recurses into the children, because a hull's doors or lights often
 *      live on a child container's controller rather than the ship's.
 */


/**
 * Sets a controller variable on an owner, its controllers, and everything below.
 *
 * @param {Object} owner - carries `controllerVariables` and `controllers`
 * @param {String} name
 * @param {Number} value
 * @param {Array} [children] - objects to recurse into
 */
export function SetControllerVariableOn(owner, name, value, children)
{
    if (!owner || !name) return;

    owner.controllerVariables.set(name, value);

    const controllers = owner.controllers || [];
    for (let i = 0; i < controllers.length; i++)
    {
        const controller = controllers[i];
        if (controller && controller.SetVariable) controller.SetVariable(name, value);
    }

    const list = children || [];
    for (let i = 0; i < list.length; i++)
    {
        const child = list[i];
        if (child && child.SetControllerVariable) child.SetControllerVariable(name, value);
    }
}


/**
 * Applies an owner's remembered variables to its controllers, first inheriting
 * anything the object above it already had set.
 *
 * Carbon replays its record when a child is attached
 * (`EveChildContainer.cpp:975-987`, `EveSpaceObject2.cpp:325,375`). ccpwgl has
 * no single attach hook - effect children arrive by deserialization and link
 * their controllers lazily on first tick - so the replay happens at that link.
 * The guarantee is the same: a variable set before a child's controllers existed
 * still reaches them.
 *
 * An inherited value never overwrites one set directly on this owner.
 *
 * @param {Object} owner - carries `controllerVariables` and `controllers`
 * @param {Object} [parent] - the object above, if it records variables
 */
export function ReplayControllerVariablesOn(owner, parent)
{
    if (!owner) return;

    const inherited = parent && parent.GetControllerVariables ? parent.GetControllerVariables() : null;
    if (inherited)
    {
        for (const [ name, value ] of inherited)
        {
            if (!owner.controllerVariables.has(name)) owner.controllerVariables.set(name, value);
        }
    }

    const controllers = owner.controllers || [];
    for (const [ name, value ] of owner.controllerVariables)
    {
        for (let i = 0; i < controllers.length; i++)
        {
            const controller = controllers[i];
            if (controller && controller.SetVariable) controller.SetVariable(name, value);
        }
    }
}
