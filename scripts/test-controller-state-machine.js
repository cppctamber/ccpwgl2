/**
 * Controller / state machine parity fixes, 2026-08-19.
 *
 * Each test below fails against the code as it was, and each one names the
 * Carbon behaviour it is asserting. Ground truth is
 * `e:\carbonengine\trinity\trinity\Controllers\**`; runtime-trinity agrees with
 * Carbon on every point here, so ccpwgl was the outlier in all of them.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");


StubPerlin.calls = [];
StubPerlin.impl = (x, alpha, beta) => Math.sin(x * (beta || 1)) / (alpha || 1);

const modules = loadStateModules();

testVetoAbandonsTheWholeWalk();
testUnresolvedDestinationDoesNotBlockLaterTransitions();
testFinalizerHoldsTheStateUntilItPermits();
testSelfTransitionDoesNotRestartTheStateEveryFrame();
testChainedTransitionsSeeEveryVariableAsDirty();
testWritingAVariableMarksItDirty();
testServerTimeFamily();
testUnresolvedIdentifierIsZero();
testCurveExpressionReadsItsInputs();
testCarbonRandomStaysInRange();
testServerClockComesFromTheContextWhenSupplied();
testExponentOperator();
testVariableMaskNamesTheVariablesAStateReads();
testExternalVariableReachesEveryControllerAndChild();
testCurveSetsPlayThroughTheOwnerAndIntoChildren();
testNoiseIsPerlinNotAHash();
testCleanVariablesDoNotRetriggerATransition();
testAStaleConditionStopsRestartingTheActions();
testAVetoMakesTheStateAskEveryFrameAgain();
testAnEmptyConditionNeverFires();
testRangeDurationRecursesIntoChildren();
testStartArmsTheHoldEvenWhenPlayFindsNothing();
testStartStateIsAnObjectReference();
console.log("Controller state machine and expression parity verified");

/**
 * Carbon `Noise` (`Curves/Tr2CurveScalarExpression.cpp:25-28`) is
 * `(PerlinNoise1D(x + randomConstant, 1, 1, 1) + 1) / 2` - SMOOTH one-octave
 * Perlin, remapped to 0..1. `Fractal` (`cpp:20-22`) is the same with the octave
 * parameters exposed and rounded with `int(n + 0.5f)`.
 *
 * Both were `Hash01`, the GLSL `fract(sin(x * 12.9898 + 78.233) * 43758.5453)`
 * hash. Against a continuously varying input that is WHITE NOISE - consecutive
 * samples uncorrelated - so anything driven by it flickered instead of
 * wandering, on every profile, because this is CPU side.
 */
function testNoiseIsPerlinNotAHash()
{
    const program = new modules.Tr2ExpressionProgram();

    StubPerlin.calls.length = 0;
    program.Compile("noise(2)");
    const value = program.Evaluate({});

    assert.equal(StubPerlin.calls.length, 1, "noise goes through Perlin, not a hash");
    assert.deepEqual(StubPerlin.calls[0], [ 2, 1, 1, 1 ], "Carbon passes alpha 1, beta 1, one octave");
    assert.ok(value >= 0 && value <= 1, "remapped from -1..1 into 0..1");

    // Continuity is the whole point - the hash had none
    StubPerlin.impl = x => Math.sin(x);
    const a = evaluateNoise(1.000), b = evaluateNoise(1.001);
    assert.ok(Math.abs(a - b) < 0.01, `nearby inputs give nearby outputs, got ${a} and ${b}`);

    StubPerlin.calls.length = 0;
    const fractal = new modules.Tr2ExpressionProgram();
    fractal.Compile("fractal(2, 3, 4, 5.4)");
    fractal.Evaluate({});
    assert.deepEqual(StubPerlin.calls[0], [ 2, 3, 4, 5 ],
        "fractal forwards alpha/beta and ROUNDS the octave count - it used to ignore all three");

    StubPerlin.impl = (x, alpha, beta) => Math.sin(x * (beta || 1)) / (alpha || 1);
}

function evaluateNoise(x)
{
    const p = new modules.Tr2ExpressionProgram();
    p.Compile(`noise(${x})`);
    return p.Evaluate({});
}


/**
 * Carbon returns nullptr from inside the action-veto loop
 * (`Tr2StateMachineState.cpp:214-224`), abandoning the transition walk for the
 * frame. ccpwgl used to continue the loop, so a later transition could stand in
 * for the vetoed one and the machine entered a state Carbon never would.
 */
function testVetoAbandonsTheWholeWalk()
{
    const
        machine = buildMachine([ "start", "vetoed", "fallback" ]),
        start = machine.states[0];

    start.actions.push({ CanTransition: () => false });
    start.transitions.push(makeTransition("vetoed", () => true));
    start.transitions.push(makeTransition("fallback", () => true));

    machine.Start();
    machine.Update(0.016, new Set());

    assert.equal(machine.GetCurrentState().name, "start", "a vetoed state must not transition at all");
}

/**
 * Carbon tests `CanActivate() && GetDestination()` together
 * (`Tr2StateMachineState.cpp:216`), so a transition naming a state that does not
 * exist is skipped and the walk continues. ccpwgl resolved the destination only
 * after picking a winner, so one dangling name hid every transition below it.
 */
function testUnresolvedDestinationDoesNotBlockLaterTransitions()
{
    const
        machine = buildMachine([ "start", "real" ]),
        start = machine.states[0];

    start.transitions.push(makeTransition("doesNotExist", () => true));
    start.transitions.push(makeTransition("real", () => true));

    machine.Start();
    machine.Update(0.016, new Set());

    assert.equal(machine.GetCurrentState().name, "real", "the walk must continue past an unresolvable destination");
}

/**
 * Carbon asks the finalizer in `Stop()` (`Tr2StateMachineState.cpp:293-321`):
 * refusing leaves the state ACTIVE and finalizing, and `Update` re-asks each
 * frame until it permits. ccpwgl asked inside the per-transition veto instead,
 * so a refusing finalizer rejected one transition and the state fell through to
 * another - or, with only one transition, never held at all.
 */
function testFinalizerHoldsTheStateUntilItPermits()
{
    const
        machine = buildMachine([ "playing", "done" ]),
        playing = machine.states[0];

    let animationFinished = false;
    playing.finalizer = { CanTransition: () => animationFinished };
    playing.transitions.push(makeTransition("done", () => true));

    machine.Start();
    machine.Update(0.016, new Set());
    assert.equal(machine.GetCurrentState().name, "playing", "the finalizer must hold the state");
    assert.equal(playing._isFinalizing, true, "the held state stays active and finalizing");

    animationFinished = true;
    machine.Update(0.016, new Set());
    assert.equal(machine.GetCurrentState().name, "done", "and release it once the animation ends");
}

/**
 * A self-transition must NOT restart the state, and this is a deliberate
 * divergence from Carbon rather than a missing feature.
 *
 * Carbon loops on `next` alone (`Tr2StateMachine.cpp:143-149`) so a state can
 * re-enter itself. That is safe there because transitions are only re-evaluated
 * when a variable they read changes. ccpwgl evaluates live every frame (D038),
 * so allowing it restarts the state on EVERY frame while the condition stays
 * true - `Tr2ActionPlayCurveSet.Start` replays its curve set from zero each
 * time. Allowing it on 2026-08-19 stopped VFX on both backends until this
 * guard came back.
 */
function testSelfTransitionDoesNotRestartTheStateEveryFrame()
{
    const
        machine = buildMachine([ "loop" ]),
        loop = machine.states[0];

    let starts = 0;
    loop.actions.push({ Start: () => starts++ });

    // The shape that broke it: a condition that is simply true, forever.
    loop.transitions.push(makeTransition("loop", () => true));

    machine.Start();
    assert.equal(starts, 1, "entering the machine starts the state once");

    for (let frame = 0; frame < 10; frame++) machine.Update(0.016, new Set());

    assert.equal(starts, 1, "ten frames later it must still have started exactly once");
    assert.equal(machine.GetCurrentState().name, "loop", "and it is still the current state");
}

/**
 * After a hop Carbon re-evaluates with every bit of the dirty mask set
 * (`Tr2StateMachine.cpp:148`) so a zero-duration chain completes inside one
 * frame. ccpwgl passed an EMPTY set, which says the opposite.
 */
function testChainedTransitionsSeeEveryVariableAsDirty()
{
    const machine = buildMachine([ "a", "b", "c" ]);

    let seenByB = null;
    machine.states[0].transitions.push(makeTransition("b", () => true));
    machine.states[1].transitions.push(makeTransition("c", (controller, owner, stateMachine, dirty) =>
    {
        seenByB = dirty;
        return true;
    }));

    machine._controller.variables.push({ name: "IsWarping", value: 0 });
    machine.Start();
    machine.Update(0.016, new Set());

    assert.equal(machine.GetCurrentState().name, "c", "the chain must complete in one frame");
    assert.ok(seenByB instanceof Set && seenByB.has("IsWarping"), "the hop must re-evaluate with everything dirty");
}

/**
 * Only `Tr2Controller.SetVariableValue` used to mark anything dirty; writing
 * through the variable itself left the controller none the wiser. Carbon and
 * runtime-trinity both mark from the variable's own write path.
 */
function testWritingAVariableMarksItDirty()
{
    const
        { Tr2Controller, Tr2ControllerFloatVariable } = modules,
        controller = new Tr2Controller(),
        variable = new Tr2ControllerFloatVariable();

    variable.name = "IsDocking";
    controller.variables.push(variable);
    controller.Link({});
    controller._dirtyVariables = new Set();

    variable.SetValue(1);

    assert.ok(controller._dirtyVariables.has("IsDocking"), "a direct write must mark the variable dirty");
}

/**
 * The server clock family (`Tr2ControllerExpression.cpp:238-454`). Without it
 * the whole condition failed to compile and the transition was silently dead,
 * so seasonal content never ran.
 */
function testServerTimeFamily()
{
    const { Tr2ExpressionProgram } = modules;

    // A Saturday, deliberately: Carbon's IsWeekend is `dayOfWeek % 6 == 0`,
    // which is only "Saturday or Sunday" because Sunday is 0 and Saturday is 6.
    Tr2ExpressionProgram.SERVER_TIME_OVERRIDE = Date.UTC(2026, 7, 15, 12, 30, 45);

    try
    {
        assert.equal(evaluate("IsWeekend()"), 1, "Saturday is a weekend");
        assert.equal(evaluate("ServerYear()"), 2026);
        assert.equal(evaluate("ServerMonth()"), 8, "months are 1-based");
        assert.equal(evaluate("ServerDay()"), 15);
        assert.equal(evaluate("ServerDayOfWeek()"), 6, "Sunday is 0, so Saturday is 6");
        assert.equal(evaluate("ServerHour()"), 12);

        Tr2ExpressionProgram.SERVER_TIME_OVERRIDE = Date.UTC(2026, 7, 17, 12, 0, 0);
        assert.equal(evaluate("IsWeekend()"), 0, "Monday is not");

        // -1 skips a field; the first field that decides wins.
        assert.equal(evaluate("ServerTimeGreaterThan(2025, -1, -1, -1, -1, -1)"), 1);
        assert.equal(evaluate("ServerTimeGreaterThan(2027, -1, -1, -1, -1, -1)"), 0);
        assert.equal(evaluate("ServerTimeEqual(2026, 8, -1, -1, -1, -1)"), 1);
        assert.equal(evaluate("ServerTimeEqual(2026, 9, -1, -1, -1, -1)"), 0);
        assert.equal(evaluate("ServerTimeLessThanOrEqual(2026, -1, -1, -1, -1, -1)"), 1, "equal counts as less-or-equal");

        // Whole days between two dates, the month shift applying to both sides.
        assert.equal(evaluate("DaysSinceServerTime(2026, 8, 10)"), 7);
        assert.equal(evaluate("DaysSinceServerTime(-1, -1, -1)"), 0, "-1 means today");

        // Seconds into the period, not a 0..1 phase.
        const phase = evaluate("ServerTimePhase(3600)");
        assert.ok(phase >= 0 && phase < 3600, `phase should be seconds within the period, got ${phase}`);
        assert.equal(evaluate("ServerTimePhase(0)"), 0, "a zero period is guarded");
    }
    finally
    {
        Tr2ExpressionProgram.SERVER_TIME_OVERRIDE = null;
    }
}

/**
 * Carbon fails the whole condition on an unknown identifier; ccpwgl keeps
 * evaluating with 0 because a hull may legitimately lack a variable another
 * declares. What it must no longer do is resolve the name off the context
 * object, which turned `controller`, `owner` and `stateMachine` into terms.
 */
function testUnresolvedIdentifierIsZero()
{
    assert.equal(evaluate("IsWarping"), 0, "an undeclared variable reads as 0");
    assert.equal(evaluate("owner", { owner: { name: "ship" } }), 0, "context objects are not identifiers");
    assert.equal(evaluate("stateMachine", { stateMachine: {} }), 0, "context objects are not identifiers");
}

/**
 * A curve expression reaches its own inputs as bare identifiers:
 * `Tr2CurveScalarExpression.GetValue` evaluates "input1*input2" against
 * `{ curve, time, input1..input4 }`. Restricting context identifiers to a
 * name allowlist on 2026-08-19 missed those, so every curve expression
 * evaluated to 0 - activation strength included - and VFX stopped engine-wide.
 */
function testCurveExpressionReadsItsInputs()
{
    const context = { curve: {}, time: 72.237, input1: 1, input2: 1.5, input3: 0, input4: 0 };

    assert.equal(evaluate("input1*input2", context), 1.5, "a curve reads its own inputs");
    assert.equal(evaluate("input1+input2>0?1:0", context), 1, "including inside a conditional");
    assert.equal(evaluate("time", context), 72.237, "and the clock the curve supplies");

    // The object on the same context stays unresolved - that was the real hazard.
    assert.equal(evaluate("curve", context), 0, "an object on the context is not a term");
}

/**
 * Carbon's `Random(min, max)` is `min + rand() % int(max - min)`, i.e. integers
 * in [min, max-1] - distinct from the continuous lowercase `random`.
 */
function testCarbonRandomStaysInRange()
{
    for (let i = 0; i < 200; i++)
    {
        const value = evaluate("Random(5, 10)");
        assert.ok(Number.isInteger(value), `Random must return whole numbers, got ${value}`);
        assert.ok(value >= 5 && value <= 9, `Random(5,10) must land in [5,9], got ${value}`);
    }

    assert.equal(evaluate("Random(3, 3)"), 3, "an empty range returns min rather than dividing by zero");
}


/**
 * A browser's only clock is the player's machine clock, in the player's
 * timezone. The fields are therefore always read in UTC - otherwise
 * `IsWeekend()` answers differently either side of a date line - and an
 * embedder that knows the real server time can supply it per evaluation.
 */
function testServerClockComesFromTheContextWhenSupplied()
{
    const saturday = Date.UTC(2026, 7, 15, 12, 0, 0);

    assert.equal(evaluate("ServerYear()", { serverTime: saturday }), 2026);
    assert.equal(evaluate("IsWeekend()", { serverTime: saturday }), 1);

    assert.equal(evaluate("ServerYear()", { functions: { GetServerTime: () => saturday } }), 2026);
    assert.equal(evaluate("ServerYear()", { owner: { GetServerTime: () => saturday } }), 2026);

    // A context clock wins over the global pin, so two scenes can disagree.
    modules.Tr2ExpressionProgram.SERVER_TIME_OVERRIDE = Date.UTC(1999, 0, 1);
    try
    {
        assert.equal(evaluate("ServerYear()", { serverTime: saturday }), 2026);
        assert.equal(evaluate("ServerYear()"), 1999, "and the pin still applies when nothing supplies one");
    }
    finally
    {
        modules.Tr2ExpressionProgram.SERVER_TIME_OVERRIDE = null;
    }

    // UTC, not local: 23:30 UTC on a Saturday is Sunday in New Zealand, and
    // both are weekend, so use an hour where the two dates disagree on the day
    // of the WEEK - late Sunday UTC is Monday there.
    const lateSunday = Date.UTC(2026, 7, 16, 23, 30, 0);
    assert.equal(evaluate("ServerDayOfWeek()", { serverTime: lateSunday }), 0, "read in UTC regardless of host timezone");
}

/**
 * `^` was rejected by the tokenizer, so any condition using it failed to
 * compile and its transition was permanently dead. It binds tighter than `*`,
 * looser than unary, and is LEFT associative like CcpParser's.
 */
function testExponentOperator()
{
    assert.equal(evaluate("2^3"), 8);
    assert.equal(evaluate("2^3^2"), 64, "left associative: (2^3)^2, not 2^(3^2)");
    assert.equal(evaluate("2*3^2"), 18, "binds tighter than multiplication");
    assert.equal(evaluate("-2^2"), 4, "unary binds tighter still: (-2)^2");
}


/**
 * The mask says which variables a state responds to. Carbon uses it to skip
 * evaluation; ccpwgl publishes it and evaluates anyway (D038), so what matters
 * here is that it is HONEST - a condition calling a clock or a random cannot be
 * described by a variable list, and must report so rather than under-reporting.
 */
function testVariableMaskNamesTheVariablesAStateReads()
{
    const { Tr2StateMachineTransition } = modules;

    const pure = new Tr2StateMachineTransition();
    pure.name = "siege";
    pure.condition = "InSiegeMode == 1 && ShipStance > 0";
    const mask = pure.GetVariableMask();
    assert.ok(mask instanceof Set, "a pure condition reports its variables");
    assert.deepEqual([ ...mask ].sort(), [ "InSiegeMode", "ShipStance" ]);

    const impure = new Tr2StateMachineTransition();
    impure.name = "wait";
    impure.condition = "IsAnimationPlaying('gate') == 0";
    assert.equal(impure.GetVariableMask(), null, "an animation query cannot be described by variables");

    const clock = new Tr2StateMachineTransition();
    clock.name = "seasonal";
    clock.condition = "IsWeekend()";
    assert.equal(clock.GetVariableMask(), null, "nor can a clock");

    const none = new Tr2StateMachineTransition();
    none.name = "always";
    assert.equal(none.GetVariableMask(), null, "an empty condition is unnarrowable, not empty");

    // One unnarrowable transition makes the whole state unnarrowable.
    const machine = buildMachine([ "start", "siege", "wait" ]);
    machine.states[0].transitions.push(pure);
    machine.states[0].UpdateVariableMask();
    assert.deepEqual([ ...machine.states[0].GetVariableMask() ].sort(), [ "InSiegeMode", "ShipStance" ]);

    machine.states[0].transitions.push(impure);
    machine.states[0].UpdateVariableMask();
    assert.equal(machine.states[0].GetVariableMask(), null, "one unnarrowable transition taints the state");
}

/**
 * Carbon's `SetControllerVariable` records the value, sets it on EVERY
 * controller the object owns, then recurses into the children
 * (`EveEffectRoot2.cpp:880-899`, `EveChildContainer.cpp:917-936`) - and replays
 * the record onto children attached later (`EveChildContainer.cpp:975-987`).
 * ccpwgl had none of that: the action fell through to a raw loop over one
 * object's controllers.
 */
function testExternalVariableReachesEveryControllerAndChild()
{
    const { Tr2Controller, Tr2ControllerFloatVariable } = modules;

    const makeController = name =>
    {
        const controller = new Tr2Controller();
        const variable = new Tr2ControllerFloatVariable();
        variable.name = name;
        controller.variables.push(variable);
        controller.Link({});
        return controller;
    };

    const { SetControllerVariableOn, ReplayControllerVariablesOn } = modules;

    // The two owners differ only in which child list they recurse into, which is
    // why both call the same helper - these stand in for a ship and a container.
    const child = {
        controllers: [ makeController("DoorsOpen") ],
        controllerVariables: new Map(),
        SetControllerVariable(name, value) { SetControllerVariableOn(this, name, value, []); },
        GetControllerVariables() { return this.controllerVariables; }
    };

    const ship = {
        controllers: [ makeController("DoorsOpen"), makeController("DoorsOpen") ],
        controllerVariables: new Map(),
        SetControllerVariable(name, value) { SetControllerVariableOn(this, name, value, [ child ]); },
        GetControllerVariables() { return this.controllerVariables; }
    };

    ship.SetControllerVariable("DoorsOpen", 1);

    assert.equal(ship.controllers[0].GetVariableValue("DoorsOpen"), 1, "every controller on the ship");
    assert.equal(ship.controllers[1].GetVariableValue("DoorsOpen"), 1, "not just the first");
    assert.equal(child.controllers[0].GetVariableValue("DoorsOpen"), 1, "and down into the children");
    assert.equal(ship.GetControllerVariables().get("DoorsOpen"), 1, "the value is remembered for late children");

    // A child whose controllers link after the value was set still gets it.
    const lateChild = {
        controllers: [ makeController("DoorsOpen") ],
        controllerVariables: new Map()
    };
    ReplayControllerVariablesOn(lateChild, ship);
    assert.equal(lateChild.controllers[0].GetVariableValue("DoorsOpen"), 1, "a late child inherits and applies the record");

    // A value set directly on the child wins over the inherited one.
    const disagreeingChild = {
        controllers: [ makeController("DoorsOpen") ],
        controllerVariables: new Map([ [ "DoorsOpen", 0 ] ])
    };
    ReplayControllerVariablesOn(disagreeingChild, ship);
    assert.equal(disagreeingChild.controllers[0].GetVariableValue("DoorsOpen"), 0, "the child's own value is not overwritten");
}


/**
 * `Tr2ActionPlayCurveSet` asks the OWNER to play a named set, and the owner has
 * to look below itself: a ship-level controller names curve sets that live on
 * effect children. Nothing implemented the owner side, so the action fell back
 * to scanning the ship's own list, found nothing, and started nothing - the
 * hull's mesh animation played on warp while every VFX set in the same state
 * stayed silent.
 */
function testCurveSetsPlayThroughTheOwnerAndIntoChildren()
{
    const { PlayCurveSetOn, StopCurveSetOn } = modules;

    const makeSet = name => ({
        name,
        plays: 0,
        stops: 0,
        resets: 0,
        ranges: [],
        Play() { this.plays++; },
        Stop() { this.stops++; },
        ResetTimeRange() { this.resets++; },
        PlayTimeRange(range) { this.ranges.push(range); }
    });

    const
        onShip = makeSet("warp"),
        onChild = makeSet("warp"),
        onGrandchild = makeSet("warp"),
        unrelated = makeSet("siege");

    const grandchild = {
        curveSets: [ onGrandchild ],
        PlayCurveSet(name, range) { return PlayCurveSetOn(this, name, range, []); },
        StopCurveSet(name) { return StopCurveSetOn(this, name, []); }
    };

    const child = {
        curveSets: [ onChild, unrelated ],
        objects: [ grandchild ],
        PlayCurveSet(name, range) { return PlayCurveSetOn(this, name, range, [ this.objects ]); },
        StopCurveSet(name) { return StopCurveSetOn(this, name, [ this.objects ]); }
    };

    const ship = { curveSets: [ onShip ], children: [], effectChildren: [ child ] };

    const played = PlayCurveSetOn(ship, "warp", "", [ ship.children, ship.effectChildren ]);

    assert.equal(played, true, "the owner reports it found something to play");
    assert.equal(onShip.plays, 1, "the owner's own set plays");
    assert.equal(onChild.plays, 1, "and the effect child's");
    assert.equal(onGrandchild.plays, 1, "recursing all the way down");
    assert.equal(unrelated.plays, 0, "a set of another name is left alone");

    // An empty range resets first: a set left mid-range would otherwise resume
    // inside it rather than starting over (Carbon EveSpaceObject2.cpp:3391).
    assert.equal(onChild.resets, 1, "an empty range name resets the time range");

    PlayCurveSetOn(ship, "warp", "loop", [ ship.children, ship.effectChildren ]);
    assert.deepEqual(onChild.ranges, [ "loop" ], "a named range plays that range");
    assert.equal(onChild.plays, 1, "and does not also play the whole set");

    StopCurveSetOn(ship, "warp", [ ship.children, ship.effectChildren ]);
    assert.equal(onChild.stops, 1, "stopping reaches the children too");
    assert.equal(onGrandchild.stops, 1);
    assert.equal(unrelated.stops, 0);
}


// -- harness ---------------------------------------------------------------


/**
 * Evaluates a condition against an empty controller context.
 * @param {String} source
 * @returns {Number}
 */
function evaluate(source, context = {})
{
    const program = modules.Tr2ExpressionProgram.Compile(source, {});
    assert.ok(program.IsValid(), `expression should compile: ${source} (${program.error})`);
    return program.Evaluate({ controller: null, owner: null, stateMachine: null, ...context });
}

/**
 * A linked, started-ready state machine with the named empty states.
 * @param {Array<String>} names
 * @returns {Tr2StateMachine}
 */
function buildMachine(names)
{
    const
        { Tr2StateMachine, Tr2StateMachineState, Tr2Controller } = modules,
        machine = new Tr2StateMachine(),
        controller = new Tr2Controller();

    for (let i = 0; i < names.length; i++)
    {
        const state = new Tr2StateMachineState();
        state.name = names[i];
        machine.states.push(state);
    }

    controller.stateMachines.push(machine);
    controller.Link({});
    machine._controller = controller;
    for (let i = 0; i < machine.states.length; i++) machine.states[i].Link(machine);

    return machine;
}

/**
 * A transition whose condition is a plain predicate, bypassing the expression
 * compiler so these tests stay about the state machine.
 * @param {String} destinationName
 * @param {Function} predicate
 * @returns {Object}
 */
function makeTransition(destinationName, predicate)
{
    return {
        name: destinationName,
        condition: "1",
        CanTransition: (...args) => predicate(...args),
        CanActivate: (...args) => predicate(...args),
        GetDestination: stateMachine => stateMachine ? stateMachine.GetStateByName(destinationName) : null,
        Link: () => undefined,
        Unlink: () => undefined
    };
}

/**
 * A smooth, deterministic stand-in for Carbon's Perlin. The property the
 * expression `noise` needs is CONTINUITY - nearby inputs give nearby outputs -
 * which is exactly what the hash it replaced did not have.
 * @returns {Number} -1..1
 */
function StubPerlin(x, alpha, beta, octaves)
{
    StubPerlin.calls.push([ x, alpha, beta, octaves ]);
    return StubPerlin.impl(x, alpha, beta, octaves);
}

function loadStateModules()
{
    const
        meta = makeMeta(),
        utils = { meta },
        tw2 = { Debug: () => undefined, device: { shaderModel: "hi" } },
        core = { Tw2Error: class Tw2Error extends Error { constructor(opt = {}) { super(opt.message || "error"); } } };

    const Tr2ExpressionProgram = loadModule(
        "../src/state/expression/Tr2ExpressionProgram.js",
        { core, global: { tw2 }, math: { noise: { carbonPerlin1D: StubPerlin } } }
    );

    const Tr2StateMachineTransition = loadModule("../src/state/Tr2StateMachineTransition.js", {
        utils,
        "./expression/Tr2ExpressionProgram": Tr2ExpressionProgram
    });
    const controllerVariables = loadModule("../src/state/controllerVariables.js", {});
    const curveSetOwner = loadModule("../src/curve/curveSetOwner.js", {});
    const Tr2StateMachineState = loadModule("../src/state/Tr2StateMachineState.js", { utils });
    const Tr2StateMachine = loadModule("../src/state/Tr2StateMachine.js", { utils });
    const Tr2ControllerFloatVariable = loadModule("../src/state/variable/Tr2ControllerFloatVariable.js", { utils });
    const Tr2Controller = loadModule("../src/state/controller/Tr2Controller.js", { utils });
    const Tw2Action = loadModule("../src/state/action/Tw2Action.js", { utils });
    const Tr2ActionPlayCurveSet = loadModule("../src/state/action/Tr2ActionPlayCurveSet.js", { utils, "./Tw2Action": Tw2Action });

    return {
        Tr2ExpressionProgram: Tr2ExpressionProgram.Tr2ExpressionProgram,
        Tr2StateMachineState: Tr2StateMachineState.Tr2StateMachineState,
        Tr2StateMachine: Tr2StateMachine.Tr2StateMachine,
        Tr2ControllerFloatVariable: Tr2ControllerFloatVariable.Tr2ControllerFloatVariable,
        Tr2Controller: Tr2Controller.Tr2Controller,
        Tr2StateMachineTransition: Tr2StateMachineTransition.Tr2StateMachineTransition,
        SetControllerVariableOn: controllerVariables.SetControllerVariableOn,
        ReplayControllerVariablesOn: controllerVariables.ReplayControllerVariablesOn,
        PlayCurveSetOn: curveSetOwner.PlayCurveSetOn,
        StopCurveSetOn: curveSetOwner.StopCurveSetOn,
        GetRangeDurationOn: curveSetOwner.GetRangeDurationOn,
        GetCurveSetDurationOn: curveSetOwner.GetCurveSetDurationOn,
        Tr2ActionPlayCurveSet: Tr2ActionPlayCurveSet.Tr2ActionPlayCurveSet
    };
}

function loadModule(relativePath, modules)
{
    const filename = path.resolve(__dirname, relativePath);
    const output = transformSync(fs.readFileSync(filename, "utf8"), {
        babelrc: false,
        configFile: false,
        filename,
        plugins: [
            [ require("@babel/plugin-proposal-decorators"), { legacy: true } ],
            [ require("@babel/plugin-proposal-class-properties"), { loose: true } ],
            require("@babel/plugin-transform-modules-commonjs")
        ]
    });
    const module = { exports: {} };
    new Function("require", "module", "exports", output.code)(id =>
    {
        if (id in modules) return modules[id];
        throw new Error(`Unexpected dependency in ${relativePath}: ${id}`);
    }, module, module.exports);
    return module.exports;
}

function makeMeta()
{
    const property = () => undefined;
    return {
        Model: class { SetValues() { return true; } },
        type: () => value => value,
        ccp: { define: () => value => value },
        wgl: { define: () => value => value },
        todo: () => value => value,
        notImplemented: property,
        notOwned: property,
        struct: () => property,
        list: () => property,
        string: property,
        path: property,
        boolean: property,
        uint: property,
        float: property,
        plain: property,
        enums: () => property,
        matrix4: property,
        quaternion: property,
        vector3: property,
        isPrivate: property
    };
}


/**
 * Carbon only re-asks a transition when a controller variable it READS has
 * changed (`Tr2StateMachineTransition.cpp:73-77`,
 * `Tr2StateMachineState.cpp:210-213`). ccpwgl evaluated every condition on every
 * frame, so a condition that merely STAYS true fired forever - and a state
 * machine whose actions play curve sets restarted them from zero sixty times a
 * second. That is what made the hologram VFX on the Triglavian skins strobe:
 * `curveSets/4` never advanced, it was re-played at four different range starts
 * in rotation, one per frame.
 */
function testCleanVariablesDoNotRetriggerATransition()
{
    const { Tr2StateMachineTransition } = modules;
    const context = { controller: { GetVariableValue: name => (name === "KillCount" ? 1 : 0) } };
    const controller = {
        GetExpressionContext: () => context,
        GetVariableValue: name => (name === "KillCount" ? 1 : 0)
    };

    const transition = new Tr2StateMachineTransition();
    transition.name = "emit";
    transition.condition = "KillCount > 0";

    assert.equal(transition.CanTransition(controller, null, null, new Set([ "KillCount" ])), true,
        "the frame the variable changes, the condition is asked and passes");
    assert.equal(transition.CanTransition(controller, null, null, new Set([ "Something Else" ])), false,
        "a later frame with the variable clean must NOT re-fire, even though it is still true");
    assert.equal(transition.CanTransition(controller, null, null, new Set()), false,
        "nor with nothing dirty at all");
    assert.equal(transition.CanTransition(controller, null, null, undefined), true,
        "no dirty set means everything changed - how a state is entered, and how GetNextState asks");

    // A condition that cannot be described by variables is never gated, which is
    // what keeps an in-flight transition state advancing.
    const impure = new Tr2StateMachineTransition();
    impure.name = "done";
    impure.condition = "IsAnimationPlaying('gate') == 0";
    assert.equal(impure.CanTransition(controller, null, null, new Set()), true,
        "an animation query is asked every frame, dirty or not");
}


/**
 * The end-to-end shape: two states pointing at each other on a condition that
 * stays true. Before the gate this hopped on every single frame and each hop
 * restarted the state's actions - the strobe. Carbon settles after the frame the
 * variable actually changed.
 */
function testAStaleConditionStopsRestartingTheActions()
{
    const { Tr2StateMachineTransition } = modules;
    const machine = buildMachine([ "idle", "emit" ]);

    machine._controller.variables.push({ name: "KillCount", value: 1 });

    for (const [ from, to ] of [ [ 0, "emit" ], [ 1, "idle" ] ])
    {
        const transition = new Tr2StateMachineTransition();
        transition.name = to;
        transition.condition = "KillCount > 0";
        machine.states[from].transitions.push(transition);
        machine.states[from].UpdateVariableMask();
    }

    let plays = 0;
    for (const state of machine.states) state.actions.push({ Start: () => plays++ });

    machine.Start();
    machine.Update(0.016, new Set([ "KillCount" ]));
    const settled = plays;

    for (let frame = 0; frame < 60; frame++) machine.Update(0.016, new Set());

    assert.equal(plays, settled,
        `a stale condition must not replay the curve sets; ${plays - settled} extra starts over 60 frames`);
}


/**
 * Carbon stops trusting dirtiness once an action has vetoed
 * (`Tr2StateMachineState.cpp:206-209`). Without that latch a `syncToRange` curve
 * set that refused once would hold its state forever: the variable that would
 * have released it went dirty on the frame of the veto and may never change again.
 */
function testAVetoMakesTheStateAskEveryFrameAgain()
{
    const { Tr2StateMachineTransition } = modules;
    const machine = buildMachine([ "playing", "done" ]);

    machine._controller.variables.push({ name: "KillCount", value: 1 });

    const transition = new Tr2StateMachineTransition();
    transition.name = "done";
    transition.condition = "KillCount > 0";
    machine.states[0].transitions.push(transition);
    machine.states[0].UpdateVariableMask();

    let allow = false;
    machine.states[0].actions.push({ Start: () => undefined, CanTransition: () => allow });

    machine.Start();
    machine.Update(0.016, new Set([ "KillCount" ]));
    assert.equal(machine.GetCurrentState().name, "playing", "the action vetoed, so the state is held");

    // The variable never changes again. Only the veto latch can release this.
    allow = true;
    machine.Update(0.016, new Set());
    assert.equal(machine.GetCurrentState().name, "done",
        "once the action stops refusing, the held state must be able to leave");
}


/**
 * Carbon's expression parser REJECTS an empty expression - its own suite asserts
 * it (`parser/tests/basic.cpp:26`). So `Tr2ControllerExpression::CreateParser`
 * leaves no program, `Eval` returns {false, 0}, and `CanActivate` returns false
 * (`Tr2StateMachineTransition.cpp:79-82`): a transition with no condition never
 * fires.
 *
 * ccpwgl compiled an empty condition to the literal 1 - the only `emptyValue: 1`
 * in the codebase - so a state carrying one was left on the frame it was entered,
 * every frame, forever. It is invisible to the dirty-variable gate too, because
 * an empty condition names no variables and so reports a null (unnarrowable)
 * mask - which is why gating alone only slowed the hologram flicker.
 */
function testAnEmptyConditionNeverFires()
{
    const { Tr2StateMachineTransition } = modules;

    const empty = new Tr2StateMachineTransition();
    empty.name = "on";
    assert.equal(empty.CanTransition(null, null, null, undefined), false,
        "no condition must never activate, not always activate");

    // A real condition still works, and still gates.
    const real = new Tr2StateMachineTransition();
    real.name = "on";
    real.condition = "1";
    assert.equal(real.CanTransition(null, null, null, undefined), true,
        "an explicit constant condition is still true");

    // End to end: a state whose only way out has no condition must stay put.
    const machine = buildMachine([ "idle", "on" ]);
    const stuck = new Tr2StateMachineTransition();
    stuck.name = "on";
    machine.states[0].transitions.push(stuck);
    machine.states[0].UpdateVariableMask();

    let plays = 0;
    for (const state of machine.states) state.actions.push({ Start: () => plays++ });

    machine.Start();
    for (let frame = 0; frame < 30; frame++) machine.Update(0.016, new Set());

    assert.equal(machine.GetCurrentState().name, "idle", "an unconditioned transition must not fire");
    assert.equal(plays, 1, `the state's actions must start once, not once per frame; got ${plays}`);
}


/**
 * Carbon makes `GetRangeDuration`/`GetCurveSetDuration` pure-virtual on
 * `ITr2CurveSetOwner`, so a space object cannot exist without them, and both
 * recurse into children and effect children taking a max
 * (`EveSpaceObject2.cpp:3451-3503`). ccpwgl's EveShip2 had only PlayCurveSet and
 * StopCurveSet - and no `curveSets` property at all - so every hull-level state
 * machine saw a duration of ZERO.
 *
 * That is the root cause of the hologram flicker, and it disarms TWO holds at
 * once: `syncToRange` on the action, and the `CurveSetTime("Set/Range")`
 * expression that a condition like `StateTime() > CurveSetTime(...)` compares
 * against. Both collapsing to 0 walks the whole state ring at one state per
 * frame, replaying a different range each frame so no curve ever advances.
 */
function testRangeDurationRecursesIntoChildren()
{
    const { GetRangeDurationOn, GetCurveSetDurationOn } = modules;

    const makeSet = (name, ranges, maxCurve) => ({
        name,
        GetRangeDuration: rangeName =>
        {
            const range = ranges.find(r => r.name === rangeName);
            return range ? range.endTime - range.startTime : 0;
        },
        GetMaxCurveDuration: () => maxCurve
    });

    // The shape that matters: the ship owns NO curve sets; they live on an
    // effect child, which is exactly where skin VFX sit.
    const effectChild = {
        curveSets: [ makeSet("Holo", [ { name: "On", startTime: 1, endTime: 6 } ], 26) ],
        GetRangeDuration(setName, rangeName) { return GetRangeDurationOn(this, setName, rangeName); },
        GetCurveSetDuration(setName) { return GetCurveSetDurationOn(this, setName); }
    };
    const ship = { children: [], effectChildren: [ effectChild ] };

    assert.equal(GetRangeDurationOn(ship, "Holo", "On", [ ship.children, ship.effectChildren ]), 5,
        "a ship must answer for a range that lives on an effect child, not report 0");
    assert.equal(GetCurveSetDurationOn(ship, "Holo", [ ship.children, ship.effectChildren ]), 26,
        "and likewise for the whole-set duration");
    assert.equal(GetRangeDurationOn(ship, "Holo", "NoSuchRange", [ ship.children, ship.effectChildren ]), 0,
        "an unknown range is still 0");

    // With a real duration the action arms its veto and HOLDS the state.
    const { Tr2ActionPlayCurveSet } = modules;
    const action = new Tr2ActionPlayCurveSet();
    action.curveSetName = "Holo";
    action.rangeName = "On";
    action.syncToRange = true;

    let time = 0;
    const controller = {
        GetOwner: () => ship,
        GetTime: () => time,
        RegisterUpdateable: () => undefined,
        UnRegisterUpdateable: () => undefined
    };
    ship.PlayCurveSet = () => true;
    ship.GetRangeDuration = (s, r) => GetRangeDurationOn(ship, s, r, [ ship.children, ship.effectChildren ]);

    action.Start(controller, ship);
    assert.equal(action._duration, 5, "Start must arm the range duration");

    time = 1;
    assert.equal(action.CanTransition(controller), false, "part way through the range, the action vetoes");

    time = 6;
    assert.equal(action.CanTransition(controller), true, "once the range has played, it releases");
}


/**
 * Carbon ignores what PlayCurveSet reported and arms the syncToRange block
 * regardless (`Tr2ActionPlayCurveSet.cpp:24-33`). ccpwgl returned early on a
 * falsy result, so an unreachable curve set ALSO cost the action its veto - a
 * second, independent path to a state that can be left one frame after entry.
 */
function testStartArmsTheHoldEvenWhenPlayFindsNothing()
{
    const { Tr2ActionPlayCurveSet } = modules;

    const action = new Tr2ActionPlayCurveSet();
    action.curveSetName = "Missing";
    action.rangeName = "On";
    action.syncToRange = true;

    const owner = {
        PlayCurveSet: () => false,          // nothing of that name is reachable
        GetRangeDuration: () => 4           // but the owner still knows the range
    };
    const controller = { GetOwner: () => owner, GetTime: () => 0, RegisterUpdateable: () => undefined };

    action.Start(controller, owner);
    assert.equal(action._duration, 4, "the hold must be armed even though Play reported nothing");
}


/**
 * Carbon persists `startState` as an OBJECT REFERENCE - `Tr2StateMachineStatePtr
 * m_startState` (`Tr2StateMachine.h:46`), exposed as a plain object attribute
 * (`Tr2StateMachine_Blue.cpp:18`) - not as an index. ccpwgl declared it
 * `@meta.uint`, so it read the raw reference id: real content deserialised to
 * 1237 / 1262 / 1269 against machines of six to eleven states, and every one of
 * them silently fell back to `states[0]`.
 *
 * These machines are authored with a `Start` state that caches each range's
 * duration into a controller variable, and every later transition asks "has the
 * range finished?" by comparing `StateTime()` against it. Start anywhere else and
 * those variables are never written, every test reads 0 and is true one frame
 * after entry, and the machine walks its whole ring at a state per frame -
 * replaying a different range of one curve set every frame so nothing plays
 * through. That is the hologram flicker.
 */
function testStartStateIsAnObjectReference()
{
    const machine = buildMachine([ "PostKill", "AfterStartDelay", "Kill", "PreKill", "Idle", "Start" ]);
    const started = [];
    machine.states.forEach(state => state.actions.push({ Start: () => started.push(state.name) }));

    // How the reader actually delivers it: the state object itself.
    machine.startState = machine.states[5];
    machine.Start();
    assert.equal(machine.GetCurrentState().name, "Start", "an object reference must be honoured");
    assert.deepEqual(started, [ "Start" ], "and it is the state whose actions run");

    // A numeric index still works, for content authored that way.
    const byIndex = buildMachine([ "a", "b", "c" ]);
    byIndex.startState = 2;
    byIndex.Start();
    assert.equal(byIndex.GetCurrentState().name, "c", "a real index is still honoured");

    // The failure that was happening: an unresolved reference id. Falling back to
    // states[0] is the last resort, not the normal path.
    const stale = buildMachine([ "PostKill", "Start" ]);
    stale.startState = 1262;
    stale.Start();
    assert.equal(stale.GetCurrentState().name, "PostKill", "an out-of-range id falls back rather than crashing");

    // A reference to a state that is not ours is not trusted.
    const foreign = buildMachine([ "x", "y" ]);
    foreign.startState = buildMachine([ "somewhere else" ]).states[0];
    foreign.Start();
    assert.equal(foreign.GetCurrentState().name, "x", "a foreign state reference falls back");
}
