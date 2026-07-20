/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const babel = require("@babel/core");
const glMatrix = require("gl-matrix");


const sourcePath = path.resolve(__dirname, "../src/eve/EveTurretTarget.js");
const EveTurretTarget = loadTarget(fs.readFileSync(sourcePath, "utf8"));
const { vec3 } = glMatrix;

let impactCount = 0;
const targetable = {
    center: vec3.fromValues(15, 0, 0),

    GetWorldTranslation(out)
    {
        return vec3.copy(out, this.center);
    },

    GetDamageLocatorPosition(out, locator)
    {
        if (locator < 0 || locator > 1)
        {
            vec3.copy(out, this.center);
            return false;
        }
        vec3.set(out, locator ? 20 : 10, 0, 0);
        return true;
    },

    GetClosestDamageLocatorIndex()
    {
        return 1;
    },

    GetGoodDamageLocatorIndex()
    {
        return 0;
    },

    GetMissPosition(out, hit)
    {
        vec3.copy(out, hit);
        out[1] += 10;
        return out;
    },

    GetRadius()
    {
        return 25;
    },

    GetImpactConfiguration()
    {
        return EveTurretTarget.ImpactConfiguration.IMPACT_HULL;
    },

    CreateImpact()
    {
        return impactCount++;
    },

    UpdateImpact()
    {
        return true;
    }
};

const target = new EveTurretTarget();
assert.equal(target.SetTargetable(targetable), true);
assert.strictEqual(target.GetTargetable(), targetable);
assert.equal(target.GetRadius(), 25);
assert.equal(target.GetImpactConfiguration(), EveTurretTarget.ImpactConfiguration.IMPACT_HULL);

const locatorPosition = vec3.create();
assert.equal(target.FindClosestLocator([ 0, 0, 0 ], locatorPosition), 1);
assert.deepEqual(Array.from(locatorPosition), [ 20, 0, 0 ]);
assert.equal(target.FindRandomValidLocator([ 0, 0, 0 ], locatorPosition), 0);
assert.deepEqual(Array.from(locatorPosition), [ 10, 0, 0 ]);

target.SetBehaviour(false, true, 2, EveTurretTarget.ImpactBehaviour.DAMAGE_LOCATOR);
for (let i = 0; i < 6; i++) target.SetShotMissed(i === 5, 100 + i);
assert.equal(target.MissQueueSize(), 4, "Carbon keeps at most four queued hit/miss results");
assert.equal(target.GetLastShotTime(), 105);

target.StartFireAtLocator(1, 0, 1, [ 0, 0, 0 ]);
target.Update(0.1, [ 0, 0, 0 ]);
assert.equal(target.GetLocator(), 1);
assert.equal(target.GetShotMissed(), false, "the oldest retained shot result is consumed first");
assert.deepEqual(Array.from(target.GetTargetPosition()), [ 20, 0, 0 ]);
assert.equal(impactCount, 1, "a successful damage-locator shot creates an impact");

target.StartFireAtLocator(1, 0, 1, [ 0, 0, 0 ]);
target.StartFireAtLocator(1, 0, 1, [ 0, 0, 0 ]);
target.StartFireAtLocator(1, 0, 1, [ 0, 0, 0 ]);
target.Update(0.1, [ 0, 0, 0 ]);
assert.equal(target.GetShotMissed(), true);
assert.equal(target.ShowDestObject(), false, "projectile misses hide the destination object");
assert.notDeepEqual(Array.from(target.GetTargetPosition()), [ 20, 0, 0 ], "misses use Carbon's extended miss ray");

target.StopFireAtLocator();
assert.equal(target.GetLocator(), -1);
assert.equal(target.MissQueueSize(), 0);
assert.equal(target.ShowDestObject(), true);

target.SetTargetPosition([ 1, 2, 3 ]);
assert.equal(target.GetTargetable(), null);
assert.deepEqual(Array.from(target.GetTargetPosition()), [ 1, 2, 3 ]);

console.log("EveTurretTarget live locator, impact and miss behavior verified");


function loadTarget(source)
{
    const transformed = babel.transformSync(source, {
        babelrc: false,
        configFile: false,
        plugins: [
            [ require("@babel/plugin-proposal-decorators"), { legacy: true } ],
            [ require("@babel/plugin-proposal-class-properties"), { loose: true } ],
            require("@babel/plugin-transform-modules-commonjs")
        ]
    }).code;

    const module = { exports: {} };
    const meta = createMetaStub();
    const requireStub = request =>
    {
        if (request === "utils") return { meta };
        if (request === "math") return glMatrix;
        throw new Error(`Unexpected EveTurretTarget dependency: ${request}`);
    };

    Function("require", "module", "exports", transformed)(requireStub, module, module.exports);
    return module.exports.EveTurretTarget;
}


function createMetaStub()
{
    let proxy;
    const target = function () {};
    proxy = new Proxy(target, {
        get: () => proxy,
        apply: (fn, thisArg, args) =>
        {
            if (args.length >= 2 && (typeof args[1] === "string" || typeof args[1] === "symbol")) return undefined;
            return value => value;
        }
    });
    proxy.Model = class {};
    return proxy;
}
