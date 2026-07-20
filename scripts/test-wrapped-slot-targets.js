/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");


const sourcePath = path.resolve(__dirname, "../src/wrapped/WrappedSlots.js");
const source = fs.readFileSync(sourcePath, "utf8")
    .replace(/^import .*;\r?\n/gm, "")
    .replace("export class WrappedSlot", "class WrappedSlot");

class Tw2EventEmitter
{
    EmitEvent()
    {

    }
}

const vec3 = {
    create: () => new Float32Array(3),
    copy: (out, value) =>
    {
        out[0] = value[0];
        out[1] = value[1];
        out[2] = value[2];
        return out;
    }
};

const mat4 = {
    create: () => new Float32Array(16),
    getTranslation: (out, value) =>
    {
        out[0] = value[12];
        out[1] = value[13];
        out[2] = value[14];
        return out;
    }
};

const turretTargets = [];
let turretObjectTarget = null;
const turretSet = {
    SetTargetPosition(value)
    {
        turretTargets.push(Array.from(value));
    },
    SetTargetObject(value)
    {
        turretObjectTarget = value;
        return true;
    },
    GetTargetObject()
    {
        return turretObjectTarget;
    },
    UpdateItemsFromLocators()
    {

    },
    EnterStateFiring()
    {

    },
    EnterStateIdle()
    {

    },
    EnterStateDeactive()
    {

    }
};

const EveTurretSet = {
    State: { INACTIVE: 0, IDLE: 1, FIRING: 2 }
};

const tw2 = {
    Fetch: async () => turretSet
};

const WrappedClient = {
    fetchEveSOF: async () => ({ SetupTurretMaterial() {} })
};

const addToArray = (array, value) =>
{
    if (!array.includes(value)) array.push(value);
};
const removeFromArray = (array, value) =>
{
    const index = array.indexOf(value);
    if (index !== -1) array.splice(index, 1);
};
const toArray = value => Array.isArray(value) ? value : [ value ];

const load = new Function(
    "Tw2EventEmitter",
    "EveLocator2",
    "EveTurretSet",
    "addToArray",
    "removeFromArray",
    "toArray",
    "mat4",
    "vec3",
    "tw2",
    "WrappedClient",
    `${source}\nreturn WrappedSlot;`
);

const WrappedSlot = load(
    Tw2EventEmitter,
    class EveLocator2 {},
    EveTurretSet,
    addToArray,
    removeFromArray,
    toArray,
    mat4,
    vec3,
    tw2,
    WrappedClient
);

const parent = {
    wrapped: {
        dna: "hull:faction:race",
        mesh: { opaqueAreas: [ { effect: { parameters: {} } } ] }
    }
};
const wrapped = { attachments: [] };
const slot = new WrappedSlot(parent, wrapped, "locator_turret_1", []);

(async () =>
{
    assert.equal(await slot.Mount("res:/weapon.black"), true);
    assert.equal(slot.resPath, "res:/weapon.black", "mounted resource paths must remain visible to UI consumers");

    const movingTarget = {
        position: [ 10, 20, 30 ],
        GetWorldTranslation(out)
        {
            return vec3.copy(out, this.position);
        }
    };

    assert.equal(slot.SetTargetObject(movingTarget), true);
    assert.strictEqual(slot.GetTargetObject(), movingTarget);
    assert.strictEqual(turretObjectTarget, movingTarget, "live target identity must be forwarded to the turret runtime");

    movingTarget.position = [ 40, 50, 60 ];
    assert.equal(slot.UpdateTarget([ movingTarget ]), true);
    assert.strictEqual(turretObjectTarget, movingTarget, "moving targets stay object-owned rather than becoming fixed positions");

    assert.equal(slot.UpdateTarget([]), false, "removed scene targets must be invalidated by identity");
    assert.equal(slot.GetTargetObject(), null);
    assert.equal(turretObjectTarget, null);

    const matrixTarget = {
        GetWorldTransform(out)
        {
            out[12] = 70;
            out[13] = 80;
            out[14] = 90;
            return out;
        }
    };

    assert.equal(slot.SetTargetObject(matrixTarget), true);
    assert.strictEqual(turretObjectTarget, matrixTarget);

    slot.SetTarget([ 1, 2, 3 ]);
    assert.equal(slot.GetTargetObject(), null, "fixed targets must clear object following");
    assert.deepEqual(turretTargets.at(-1), [ 1, 2, 3 ]);

    const laterAttachment = { name: "later attachment" };
    wrapped.attachments.push(laterAttachment);
    slot.Unmount();
    assert.equal(slot.resPath, "");
    assert.deepEqual(wrapped.attachments, [ laterAttachment ], "unmount must remove only its own turret attachment");
    slot.Unmount();
    assert.deepEqual(wrapped.attachments, [ laterAttachment ], "repeated unmount must not splice index -1");

    console.log("WrappedSlot targets, mounted path visibility and safe unmount verified");
})().catch(err =>
{
    console.error(err);
    process.exitCode = 1;
});
