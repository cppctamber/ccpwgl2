/**
 * EveChildPlug and EveChildSocket, 2026-08-21.
 *
 * A plug is a separately-authored bundle of children plus the controllers that
 * drive them; a socket is an attachment point that loads exactly one plug by res
 * path and places it. The socket owns the transform, the plug owns the content.
 *
 * Ground truth:
 * `e:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\EveChildPlug.cpp`
 * and `EveChildSocket.cpp`.
 *
 * Several of these pin things Carbon does NOT do. Both classes have methods that
 * are empty bodies in Carbon while the ccpwgl base they extend has working
 * versions, so inheriting would silently invent behaviour - that is the failure
 * mode worth guarding, because it looks like more functionality rather than less.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");
const { vec3, vec4, mat4, quat } = require("gl-matrix");


const loads = [];
const { EveChildPlug, EveChildSocket } = load2();

testPlugRaisesEventsOnItsOwnControllersOnly();
testPlugStartsItsOwnControllersOnly();
testPlugVariablesStillPropagateDownwards();
testPlugSetupIsANoOp();
testPlugPublishesExternalParameters();
testSocketLoadsItsPlugOnInitialize();
testSocketPlugIsVisibleToInheritedTraversals();
testSocketReloadsOnlyOnAPathChange();
testSocketStaleLoadCannotOverwriteANewerOne();
testSocketReplaysStateOntoALatePlug();
testSocketRefusesRuntimeChildren();
console.log("EveChildPlug and EveChildSocket verified");


// -- plug -------------------------------------------------------------------


/**
 * Carbon `HandleControllerEvent` (`EveChildPlug.cpp:406-412`) walks
 * `m_controllers` and NOTHING else - unlike `SetControllerVariable` two methods
 * above it, which also recurses into `m_objects`. The asymmetry is deliberate.
 */
function testPlugRaisesEventsOnItsOwnControllersOnly()
{
    const plug = new EveChildPlug();
    const controller = recorder();
    const child = recorder();

    plug.controllers.push(controller);
    plug.objects.push(child);

    plug.HandleControllerEvent("Fire");

    assert.deepEqual(controller.events, [ "Fire" ], "own controller got it");
    assert.deepEqual(child.events, [], "the child did NOT - events do not propagate");
}

/** Carbon `StartControllers` (`cpp:414-420`) - `m_controllers` only, same shape. */
function testPlugStartsItsOwnControllersOnly()
{
    const plug = new EveChildPlug();
    const controller = recorder();
    const child = recorder();

    plug.controllers.push(controller);
    plug.objects.push(child);

    plug.StartControllers();

    assert.equal(controller.started, 1);
    assert.equal(child.started, 0, "children start their own");
}

/**
 * The other half of the asymmetry: variables DO recurse
 * (`EveChildPlug.cpp:385-404`), and that behaviour is inherited rather than
 * written here, so it needs pinning against a future override.
 */
function testPlugVariablesStillPropagateDownwards()
{
    const plug = new EveChildPlug();
    const child = recorder();
    plug.objects.push(child);

    plug.SetControllerVariable("ActivationStrength", 0.5);

    assert.deepEqual(child.variables, [ [ "ActivationStrength", 0.5 ] ]);
}

/**
 * Carbon `EveChildPlug::Setup` is an EMPTY BODY (`cpp:355-357`) - a plug ignores
 * the SRT offered to it, because its placement belongs to the socket. The
 * container it extends has a working transform, so this must be overridden or a
 * plug silently acquires one.
 */
function testPlugSetupIsANoOp()
{
    const plug = new EveChildPlug();

    assert.equal(plug.Setup([ 9, 9, 9 ], null, [ 1, 2, 3 ]), null);
    assert.deepEqual([ ...plug.scaling ], [ 1, 1, 1 ], "scaling untouched");
    assert.deepEqual([ ...plug.translation ], [ 0, 0, 0 ], "translation untouched");
}

/** `AddExternalParameter` / `GetExternalParameters` (`cpp:467-475`). */
function testPlugPublishesExternalParameters()
{
    const plug = new EveChildPlug();
    const parameter = { name: "StartAdNumber" };

    plug.AddExternalParameter(parameter);

    assert.deepEqual(plug.GetExternalParameters(), [ parameter ]);
    assert.doesNotThrow(() => plug.AddExternalParameter(null));
    assert.equal(plug.GetExternalParameters().length, 1, "a null parameter is ignored");
}


// -- socket -----------------------------------------------------------------


function testSocketLoadsItsPlugOnInitialize()
{
    const socket = makeSocket({ resPath: "res:/plug.red" });
    socket.Initialize();

    assert.deepEqual(loads.map(l => l.path), [ "res:/plug.red" ]);

    const plug = makePlug();
    loads[0].resolve(plug);
    assert.equal(socket.plug, plug);
}

/**
 * The plug must land in `objects`, because that is what every inherited
 * traversal walks. Held only in `socket.plug` it would load and never draw.
 */
function testSocketPlugIsVisibleToInheritedTraversals()
{
    const socket = makeSocket({ resPath: "res:/plug.red" });
    socket.Initialize();

    const plug = makePlug();
    loads[0].resolve(plug);

    assert.deepEqual(socket.objects, [ plug ]);
}

/**
 * Carbon compares before assigning (`cpp:33-40`), which matters because a reload
 * drops the live plug.
 */
function testSocketReloadsOnlyOnAPathChange()
{
    const socket = makeSocket({ resPath: "res:/plug.red" });
    socket.Initialize();
    const plug = makePlug();
    loads[0].resolve(plug);

    socket.SetPlugResPath("res:/plug.red");
    assert.equal(loads.length, 1, "no second load");
    assert.equal(socket.plug, plug, "plug kept");

    socket.SetPlugResPath("res:/other.red");
    assert.equal(loads.length, 2, "a different path does reload");
    assert.equal(socket.plug, null, "and detaches immediately");
}

/**
 * Carbon's load is synchronous; ccpwgl's is a callback, so it needs a guard
 * Carbon does not: a slow first load resolving after a second was started must
 * not attach over the newer plug.
 */
function testSocketStaleLoadCannotOverwriteANewerOne()
{
    const socket = makeSocket({ resPath: "res:/a.red" });
    socket.Initialize();
    socket.SetPlugResPath("res:/b.red");

    const second = makePlug();
    loads[1].resolve(second);
    loads[0].resolve(makePlug());          // the stale one lands last

    assert.equal(socket.plug, second);
    assert.deepEqual(socket.objects, [ second ]);
}

/**
 * Carbon binds and propagates on the line after the load because the load is
 * synchronous (`cpp:185-192`). Here the plug arrives later, so anything set in
 * the meantime has to be replayed onto it.
 */
function testSocketReplaysStateOntoALatePlug()
{
    const socket = makeSocket({ resPath: "res:/plug.red" });
    socket.Initialize();

    const colorSet = { Primary: [ 1, 0, 0, 1 ] };
    socket.SetInheritProperties(colorSet);
    socket.SetControllerVariable("ActivationStrength", 0.5);

    const plug = makePlug();
    loads[0].resolve(plug);

    assert.equal(plug.colorSet, colorSet, "colour set replayed");
    assert.deepEqual(plug.variables, [ [ "ActivationStrength", 0.5 ] ], "variable replayed");
    assert.equal(plug.started, 1, "and its controllers were started");
}

/**
 * Carbon's AddToEffectChildrenList and RemoveFromEffectChildrenList are EMPTY
 * BODIES on the socket (`EveChildSocket.cpp:248-254`): a socket's contents are
 * owned by the plug it loaded, so nothing may be added at runtime. The container
 * it extends has working versions, so inheriting them would invent behaviour -
 * and `Tr2ActionChildEffect` reaches for exactly this API, so it would be reached.
 */
function testSocketRefusesRuntimeChildren()
{
    const socket = makeSocket({ resPath: "res:/plug.red" });
    socket.Initialize();
    loads[0].resolve(makePlug());

    const intruder = makePlug();

    assert.equal(socket.AddToEffectChildrenList(intruder), false);
    assert.equal(socket.objects.length, 1, "nothing was added");
    assert.equal(socket.RemoveFromEffectChildrenList(socket.plug), false);
    assert.equal(socket.objects.length, 1, "and nothing was removed");
}


// -- harness ----------------------------------------------------------------


function recorder()
{
    return {
        events: [], variables: [], started: 0, colorSet: null,
        HandleEvent(name) { this.events.push(name); },
        HandleControllerEvent(name) { this.events.push(name); },
        Start() { this.started++; },
        StartControllers() { this.started++; },
        SetControllerVariable(name, value) { this.variables.push([ name, value ]); },
        SetInheritProperties(set) { this.colorSet = set; }
    };
}

function makePlug()
{
    return recorder();
}

function makeSocket(values = {})
{
    loads.length = 0;
    return Object.assign(new EveChildSocket(), values);
}

function load2()
{
    const meta = makeMeta();

    // The real EveChildContainer drags in the curve, controller and lighting
    // graph. Stubbed to the surface these two actually rely on inheriting, so the
    // tests exercise the plug and socket rather than the container.
    const container = {
        EveChildContainer: class
        {
            name = "";
            objects = [];
            controllers = [];
            controllerVariables = new Map();
            translation = vec3.create();
            rotation = quat.fromValues(0, 0, 0, 1);
            scaling = vec3.fromValues(1, 1, 1);
            localTransform = mat4.create();
            inheritProperties = null;

            Initialize() {}

            Setup(scale, rotation, translation)
            {
                if (scale) vec3.copy(this.scaling, scale);
                if (translation) vec3.copy(this.translation, translation);
                return this.localTransform;
            }

            SetControllerVariable(name, value)
            {
                this.controllerVariables.set(name, value);
                for (const child of this.objects)
                {
                    if (child.SetControllerVariable) child.SetControllerVariable(name, value);
                }
            }

            SetInheritProperties(colorSet)
            {
                for (const child of this.objects)
                {
                    if (child.SetInheritProperties) child.SetInheritProperties(colorSet);
                }
            }

            AddToEffectChildrenList(child) { this.objects.push(child); return true; }
            RemoveFromEffectChildrenList(child)
            {
                const i = this.objects.indexOf(child);
                if (i === -1) return false;
                this.objects.splice(i, 1);
                return true;
            }
        }
    };

    const resMan = {
        GetObject(path, onResolved) { loads.push({ path, resolve: onResolved }); }
    };

    const plugModule = load("../src/eve/child/EveChildPlug.js", {
        utils: { meta },
        "./EveChildContainer": container
    });

    const socketModule = load("../src/eve/child/EveChildSocket.js", {
        utils: { meta },
        global: { resMan },
        "./EveChildContainer": container
    });

    return { EveChildPlug: plugModule.EveChildPlug, EveChildSocket: socketModule.EveChildSocket };
}

function load(relativePath, modules)
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
    const self = function (...args)
    {
        const target = args[0];
        const applied = typeof target === "function"
            || (typeof target === "object" && target !== null && args.length >= 2);

        return applied ? undefined : self;
    };

    return new Proxy({}, {
        get: (target, key) => (key === "Model" ? class {} : self)
    });
}
