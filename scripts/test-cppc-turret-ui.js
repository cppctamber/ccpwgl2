/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");


const sourcePath = path.resolve(__dirname, "../_dev/cppc/tools/turrets.js");
const source = fs.readFileSync(sourcePath, "utf8")
    .replace(/export function /g, "function ");

const inspectors = [];

class Inspector
{
    constructor()
    {
        this.root = {};
        this.widgets = [];
        inspectors.push(this);
    }

    append() {}
    addSection() {}
    addSeparator() {}

    addComboButtons(name, value, options)
    {
        return this.addWidget("comboButtons", name, value, options);
    }

    addCombo(name, value, options)
    {
        return this.addWidget("combo", name, value, options);
    }

    addCheckbox(name, value, options)
    {
        return this.addWidget("checkbox", name, value, options);
    }

    addButton(name, value, options)
    {
        return this.addWidget("button", value, null, options);
    }

    addWidget(type, name, value, options)
    {
        const widget = {
            type,
            name,
            value,
            options,
            setValue(next, skipEvent)
            {
                this.value = next;
                if (!skipEvent && options.callback) return options.callback(next);
            }
        };
        this.widgets.push(widget);
        return widget;
    }
}

const LiteGUI = { Inspector };
const window = {
    resFileIndex: Promise.resolve({
        index: {
            "dx9/model/turret/energy/pulse/m/pulse.black": {},
            "dx9/model/turret/energy/beam/m/beam.black": {},
            "dx9/model/weapon/missile/test/test_missile.black": {}
        }
    })
};

const fetchedMissiles = [];
const tw2 = {
    async Fetch(resPath)
    {
        const missile = {
            resPath,
            target: null,
            warheads: [ {
                id: -1,
                prepares: 0,
                launches: [],
                PrepareLaunch()
                {
                    this.prepares++;
                },
                Launch(transform)
                {
                    this.launches.push(Array.from(transform));
                }
            } ],
            _worldTransform: new Float32Array(16),
            _worldTransformLast: new Float32Array(16),
            _position: new Float32Array(3),
            _rotation: new Float32Array(4),
            OnMissileFinished(callback)
            {
                this._missileFinishedCallback = callback;
            },
            Start(velocity, flightTime)
            {
                this.start = { velocity, flightTime };
            }
        };
        fetchedMissiles.push(missile);
        return missile;
    }
};

const toolsApi = {
    async GetWeaponTypes()
    {
        return {
            100: {
                typeID: 100,
                name: "Pulse",
                resPath: "res:/dx9/model/turret/energy/pulse/m/pulse.black"
            },
            101: {
                typeID: 101,
                name: "Beam",
                resPath: "res:/dx9/model/turret/energy/beam/m/beam.black"
            }
        };
    },
    async GetWeaponProjectiles()
    {
        return {
            200: {
                graphicID: 200,
                resPath: "res:/dx9/model/weapon/missile/test/test_missile.black"
            }
        };
    }
};
const tiny = { GetApiService: () => toolsApi };

const load = new Function(
    "LiteGUI",
    "window",
    "tw2",
    "tiny",
    `${source}\nreturn { createTurrets, removeSelectionAttachment, setContinuousFire, updateTurretTargets };`
);
const { createTurrets, removeSelectionAttachment, setContinuousFire, updateTurretTargets } = load(LiteGUI, window, tw2, tiny);

function createWeapon(resPath)
{
    const turretSet = {
        firingEffect: { isLoopFiring: false },
        _fireCallback: null,
        OnTurretFired(callback)
        {
            this._fireCallback = callback;
        }
    };

    return {
        resPath,
        mounts: [],
        unmounts: 0,
        fires: 0,
        idles: 0,
        targetObject: null,
        turretSet,
        GetTurretSet()
        {
            return this.turretSet;
        },
        GetTargetObject()
        {
            return this.targetObject;
        },
        UpdateTarget: () => null,
        SetTarget(value)
        {
            this.targetObject = null;
            this.targetPosition = Array.from(value);
        },
        SetTargetObject(value)
        {
            this.targetObject = value;
            return true;
        },
        Mount(next)
        {
            this.resPath = next;
            this.mounts.push(next);
            return Promise.resolve(true);
        },
        Unmount()
        {
            this.resPath = "";
            this.unmounts++;
        },
        Rebuild() {},
        Deactivate() {},
        Idle()
        {
            this.idles++;
        },
        Fire()
        {
            this.fires++;
        }
    };
}

(async () =>
{
    const
        pulsePath = "res:/dx9/model/turret/energy/pulse/m/pulse.black",
        beamPath = "res:/dx9/model/turret/energy/beam/m/beam.black",
        missilePath = "res:/dx9/model/weapon/missile/test/test_missile.black",
        weapons = [ createWeapon(pulsePath), createWeapon(beamPath) ],
        launcher = createWeapon(null),
        liveTarget = { name: "target ship" },
        sceneObjects = [ liveTarget ],
        owner = {
            wrapped: { attachments: [] },
            turrets: weapons,
            xlTurrets: [],
            chains: [],
            atomics: [],
            bombs: [],
            launchers: [ launcher ]
        };

    launcher.targetObject = liveTarget;
    let authoredFireCallbacks = 0;
    launcher.turretSet.OnTurretFired(() => authoredFireCallbacks++);

    createTurrets(owner, {
        getTargets: () => sceneObjects,
        getSceneObjects: () => sceneObjects
    });
    await waitFor(() => findWidget("Turret 1") && findWidget("Missile effect"));

    const
        first = findWidget("Turret 0"),
        second = findWidget("Turret 1"),
        fitAll = findWidget("Fit all"),
        animation = findWidget("animation"),
        continuousFire = findWidget("continuous fire"),
        clear = findWidget("Clear");

    assert.equal(first.value, pulsePath, "individual controls must reflect mounted weapon paths");
    assert.equal(second.value, beamPath, "each control must retain its own mounted weapon path");
    assert.equal(fitAll.value, null, "mixed fittings must not report a common Fit all value");

    continuousFire.setValue(true);
    assert.equal(weapons[0].turretSet.firingEffect.isLoopFiring, true);
    assert.equal(weapons[1].turretSet.firingEffect.isLoopFiring, true);
    assert.equal(weapons[0].fires, 1, "continuous mode must start a mounted weapon once");
    assert.equal(weapons[1].fires, 1);

    updateTurretTargets([ owner ], []);
    assert.equal(weapons[0].fires, 1, "the per-frame updater must not restart the same firing effect");
    assert.equal(weapons[1].fires, 1);

    const replacedEffect = weapons[0].turretSet.firingEffect;
    weapons[0].turretSet = { firingEffect: { isLoopFiring: false } };
    updateTurretTargets([ owner ], []);
    assert.equal(replacedEffect.isLoopFiring, false, "replaced effects must recover their authored loop setting");
    assert.equal(weapons[0].turretSet.firingEffect.isLoopFiring, true);
    assert.equal(weapons[0].fires, 2, "a newly mounted effect must join continuous firing once");

    animation.options.callback("Idle");
    assert.equal(continuousFire.value, false, "manual idle must clear the continuous-fire toggle");
    assert.equal(weapons[0].turretSet.firingEffect.isLoopFiring, false);
    assert.equal(weapons[1].turretSet.firingEffect.isLoopFiring, false);
    assert.equal(weapons[0].idles, 1);
    assert.equal(weapons[1].idles, 1);

    continuousFire.setValue(true);
    continuousFire.setValue(false);
    assert.equal(weapons[0].turretSet.firingEffect.isLoopFiring, false);
    assert.equal(weapons[1].turretSet.firingEffect.isLoopFiring, false);
    assert.equal(weapons[0].idles, 2, "turning continuous mode off must return weapons to idle");
    assert.equal(weapons[1].idles, 2);

    const authoredLoopWeapon = createWeapon(pulsePath);
    authoredLoopWeapon.turretSet.firingEffect.isLoopFiring = true;
    setContinuousFire([ authoredLoopWeapon ], true);
    setContinuousFire([ authoredLoopWeapon ], false);
    assert.equal(
        authoredLoopWeapon.turretSet.firingEffect.isLoopFiring,
        true,
        "continuous mode must preserve an authored looping effect"
    );

    await first.options.callback(beamPath);
    assert.deepEqual(weapons[0].mounts, [ beamPath ]);
    assert.deepEqual(weapons[1].mounts, [], "individual fitting must not alter another slot");

    await second.options.callback(null);
    assert.equal(weapons[0].unmounts, 0);
    assert.equal(weapons[1].unmounts, 1, "individual clearing must affect only the selected slot");

    await fitAll.options.callback(pulsePath);
    assert.deepEqual(weapons[0].mounts, [ beamPath, pulsePath ]);
    assert.deepEqual(weapons[1].mounts, [ pulsePath ]);
    assert.equal(first.value, pulsePath);
    assert.equal(second.value, pulsePath);

    await clear.options.callback();
    assert.equal(first.value, null);
    assert.equal(second.value, null);
    assert.equal(fitAll.value, null);

    const
        missileEffect = findWidget("Missile effect"),
        missileFlightTime = findWidget("Missile flight time"),
        fireMissiles = findWidget("Fire missiles");

    assert.equal(
        missileEffect.options.values["test_missile (200)"],
        missilePath,
        "missile black files must be available to launcher tooling"
    );

    missileEffect.setValue(missilePath);
    missileFlightTime.setValue(5);
    updateTurretTargets([ owner ], sceneObjects, 0.1);
    assert.equal(typeof launcher.turretSet._fireCallback, "function", "a configured launcher must hook turret firing");

    const muzzleTransform = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        10, 20, 30, 1
    ]);
    launcher.turretSet._fireCallback(launcher.turretSet, [ muzzleTransform ], {});
    await waitFor(() => fetchedMissiles.length === 1);

    const missile = fetchedMissiles[0];
    assert.equal(authoredFireCallbacks, 1, "the demo hook must preserve an authored fire callback");
    assert.equal(missile.resPath, missilePath);
    assert.equal(missile.target, liveTarget, "loaded launchers must retain live raw-scene targets");
    assert.deepEqual(Array.from(missile._position), [ 10, 20, 30 ]);
    assert.equal(missile.start.flightTime, 5);
    assert.equal(missile.warheads[0].id, 0, "demo-launched warheads need impact-capable ids");
    assert.equal(missile.warheads[0].prepares, 1);
    assert.deepEqual(
        missile.warheads[0].launches[0].slice(12, 15),
        [ 0, 0, 0 ],
        "world muzzle transforms must be converted into missile-local starts"
    );
    assert.equal(sceneObjects.includes(missile), true, "launched missiles must enter the raw scene");

    sceneObjects.splice(sceneObjects.indexOf(missile), 1);
    updateTurretTargets([ owner ], sceneObjects, 0.1);
    assert.equal(sceneObjects.includes(missile), true, "raw missiles must survive wrapper scene rebuilds");

    missile._missileFinishedCallback(missile);
    updateTurretTargets([ owner ], sceneObjects, 0.1);
    assert.equal(sceneObjects.includes(missile), false, "finished missiles must leave the raw scene");

    const launcherTarget = findWidgets("Target all").pop();
    launcherTarget.setValue("random location");
    launcher.turretSet._fireCallback(launcher.turretSet, [ muzzleTransform ], {});
    await waitFor(() => fetchedMissiles.length === 2);

    const randomTargetMissile = fetchedMissiles[1];
    assert.notEqual(randomTargetMissile.target, liveTarget);
    assert.equal(
        typeof randomTargetMissile.target.GetImpactPosition,
        "function",
        "fixed random launcher targets must satisfy the missile target contract"
    );

    missileEffect.setValue(null);
    launcher.turretSet._fireCallback(launcher.turretSet, [ muzzleTransform ], {});
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(fetchedMissiles.length, 2, "clearing the missile effect must detach the demo launch hook");
    assert.equal(authoredFireCallbacks, 3, "detaching the demo hook must restore the authored callback");

    fireMissiles.options.callback();
    assert.equal(launcher.fires, 1, "the launcher panel must expose a manual missile fire action");

    const
        before = { name: "before" },
        outline = { name: "selection outline" },
        turretA = { name: "turret A" },
        turretB = { name: "turret B" },
        selected = { wrapped: { attachments: [ before, outline, turretA, turretB ] } };

    assert.equal(removeSelectionAttachment(selected, outline), true);
    assert.deepEqual(
        selected.wrapped.attachments,
        [ before, turretA, turretB ],
        "selection cleanup must preserve turrets mounted after its outline"
    );
    assert.equal(removeSelectionAttachment(selected, outline), false);
    assert.deepEqual(selected.wrapped.attachments, [ before, turretA, turretB ]);

    console.log("cppc turret fittings, targeting, missile launching and safe outline cleanup verified");
})().catch(err =>
{
    console.error(err);
    process.exitCode = 1;
});


function findWidget(name)
{
    for (let i = 0; i < inspectors.length; i++)
    {
        const found = inspectors[i].widgets.find(widget => widget.name === name);
        if (found) return found;
    }
    return null;
}


function findWidgets(name)
{
    const found = [];
    for (let i = 0; i < inspectors.length; i++)
    {
        found.push(...inspectors[i].widgets.filter(widget => widget.name === name));
    }
    return found;
}


async function waitFor(predicate)
{
    for (let i = 0; i < 20; i++)
    {
        if (predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    throw new Error("Timed out waiting for turret UI construction");
}
