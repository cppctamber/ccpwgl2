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


const modules = loadStateModules();

testVetoAbandonsTheWholeWalk();
testUnresolvedDestinationDoesNotBlockLaterTransitions();
testFinalizerHoldsTheStateUntilItPermits();
testSelfTransitionRestartsTheState();
testChainedTransitionsSeeEveryVariableAsDirty();
testWritingAVariableMarksItDirty();
testServerTimeFamily();
testUnresolvedIdentifierIsZero();
testCarbonRandomStaysInRange();
testExponentOperator();
console.log("Controller state machine and expression parity verified");


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
 * Carbon loops on `next` alone and calls `Start()` unconditionally after each
 * hop (`Tr2StateMachine.cpp:143-149`); the state stopped itself inside `Update`,
 * so `Start()` runs for real. ccpwgl broke the loop when the destination was the
 * current state, dropping authored self-transitions entirely.
 */
function testSelfTransitionRestartsTheState()
{
    const
        machine = buildMachine([ "loop" ]),
        loop = machine.states[0];

    let starts = 0;
    loop.actions.push({ Start: () => starts++ });

    let armed = false;
    loop.transitions.push(makeTransition("loop", () => armed));

    machine.Start();
    assert.equal(starts, 1, "entering the machine starts the state once");

    armed = true;
    machine.Update(0.016, new Set());
    assert.ok(starts > 1, "a self-transition must re-run the state's actions");
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
    assert.equal(evaluate("owner"), 0, "context objects are not identifiers");
    assert.equal(evaluate("stateMachine"), 0, "context objects are not identifiers");
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


// -- harness ---------------------------------------------------------------


/**
 * Evaluates a condition against an empty controller context.
 * @param {String} source
 * @returns {Number}
 */
function evaluate(source)
{
    const program = modules.Tr2ExpressionProgram.Compile(source, {});
    assert.ok(program.IsValid(), `expression should compile: ${source} (${program.error})`);
    return program.Evaluate({ controller: null, owner: null, stateMachine: null });
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

function loadStateModules()
{
    const
        meta = makeMeta(),
        utils = { meta },
        tw2 = { Debug: () => undefined, device: { shaderModel: "hi" } },
        core = { Tw2Error: class Tw2Error extends Error { constructor(opt = {}) { super(opt.message || "error"); } } };

    const Tr2ExpressionProgram = loadModule(
        "../src/state/expression/Tr2ExpressionProgram.js",
        { core, global: { tw2 } }
    );

    const Tr2StateMachineState = loadModule("../src/state/Tr2StateMachineState.js", { utils });
    const Tr2StateMachine = loadModule("../src/state/Tr2StateMachine.js", { utils });
    const Tr2ControllerFloatVariable = loadModule("../src/state/variable/Tr2ControllerFloatVariable.js", { utils });
    const Tr2Controller = loadModule("../src/state/controller/Tr2Controller.js", { utils });

    return {
        Tr2ExpressionProgram: Tr2ExpressionProgram.Tr2ExpressionProgram,
        Tr2StateMachineState: Tr2StateMachineState.Tr2StateMachineState,
        Tr2StateMachine: Tr2StateMachine.Tr2StateMachine,
        Tr2ControllerFloatVariable: Tr2ControllerFloatVariable.Tr2ControllerFloatVariable,
        Tr2Controller: Tr2Controller.Tr2Controller
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
