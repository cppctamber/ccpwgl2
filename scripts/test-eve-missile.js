/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const babel = require("@babel/core");
const glMatrix = require("gl-matrix");


const sourcePath = path.resolve(__dirname, "../src/eve/EveMissile.js");
const { EveMissile, EveMissileWarhead } = loadMissile(fs.readFileSync(sourcePath, "utf8"));
const { vec3, mat4 } = glMatrix;

assert.equal("Launch" in EveMissile.prototype, false, "the unused ccpwgl aggregate Launch API must not shadow Carbon's lifecycle");

const target = {
    GetDamageLocatorPosition(out, locator)
    {
        vec3.set(out, locator === 0 ? -2 : locator === 1 ? 2 : 0, 0, 300);
        return locator >= 0;
    },

    GetGoodDamageLocatorIndex(position)
    {
        return position[0] < 0 ? 0 : 1;
    },

    GetImpactPosition(out, locator, previous, current, epsilon)
    {
        this.GetDamageLocatorPosition(out, locator);
        return vec3.squaredDistance(current, out) < epsilon ||
            (previous[2] <= out[2] && current[2] >= out[2]);
    },

    GetRadius()
    {
        return 10;
    },

    CreateImpact()
    {
        return 0;
    }
};

const warheads = [ new EveMissileWarhead(), new EveMissileWarhead() ];
for (let i = 0; i < warheads.length; i++)
{
    warheads[i].id = i;
    warheads[i].durationEjectPhase = 0;
    warheads[i].startEjectVelocity = 3;
    warheads[i].maxExplosionDistance = 2;
    warheads[i].pathOffsetNoiseScale = 2;
    warheads[i].PrepareLaunch();

    const transform = mat4.fromTranslation(mat4.create(), [ i ? 1 : -1, 0, 0 ]);
    warheads[i].Launch(transform);
}

const missile = new EveMissile();
missile.target = target;
missile.warheads = warheads;
missile.translationCurve = {
    GetValueAt(time, out)
    {
        return vec3.set(out, 0, 0, Math.min(time * 100, 300));
    },
    GetValueDotAt(time, out)
    {
        return vec3.set(out, 0, 0, time < 3 ? 100 : 0);
    }
};

let explosionCount = 0;
let finishedCount = 0;
const explodedIDs = [];
missile.explosionCallback = id => explodedIDs.push(id);
missile.OnWarheadExplosion(() => explosionCount++);
missile.OnMissileFinished(() => finishedCount++);
missile.Start([ 5, 0, 0 ], 3);

const worldTransform = missile.GetWorldTransform(mat4.create());
const worldTranslation = missile.GetWorldTranslation(vec3.create());
assert.deepEqual(Array.from(worldTransform), Array.from(missile._worldTransform));
assert.deepEqual(Array.from(worldTranslation), Array.from(missile._position));

for (let i = 0; i < 6; i++) missile.Update(0.1);
assert.notEqual(warheads[0].GetState(), EveMissileWarhead.State.STATE_DELAYED);
assert.notEqual(warheads[1].GetState(), EveMissileWarhead.State.STATE_DELAYED, "every authored warhead must launch independently");
assert.ok(warheads.some(warhead => vec3.squaredLength(warhead.pathOffset) > 0), "ccpwgl Perlin noise drives flight offsets");

warheads[0].UpdateViewDependentData();
assert.equal(warheads[0]._perObjectData.vs.Get("Shipdata")[0], 1);
assert.equal(warheads[0]._perObjectData.vs.Get("Shipdata")[1], 1);

for (let i = 0; i < 80 && finishedCount === 0; i++) missile.Update(0.1);
assert.equal(explosionCount, 2, "both warheads report their own explosion");
assert.deepEqual(explodedIDs.sort(), [ 0, 1 ]);
assert.equal(finishedCount, 1, "the missile finishes once after all warheads explode");
assert.ok(warheads.every(warhead =>
    warhead.GetState() === EveMissileWarhead.State.STATE_EXPLODED ||
    warhead.GetState() === EveMissileWarhead.State.STATE_DEAD
));
assert.ok(Number.isFinite(missile.boundingSphereRadius));

console.log("EveMissile Carbon launch, spread, tracking and impact lifecycle verified");


function loadMissile(source)
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
    const math = {
        ...glMatrix,
        mat4: {
            ...glMatrix.mat4,
            arcFromForward(out)
            {
                return glMatrix.mat4.identity(out);
            }
        },
        noise: { perlin1D: value => Math.sin(value) },
        sph3: {
            transformMat4(out, sphere, transform)
            {
                vec3.transformMat4(out, sphere, transform);
                out[3] = sphere[3];
                return out;
            },
            union(out, a, b)
            {
                const radius = Math.max(a[3], b[3], vec3.distance(a, b) + b[3]);
                out[3] = radius;
                return out;
            }
        }
    };

    class RawData
    {
        constructor(layout)
        {
            this.values = new Map(layout.map(entry => [ entry[0], new Float32Array(Array.isArray(entry[1]) ? entry[1] : entry[1]) ]));
        }

        Get(name)
        {
            return this.values.get(name);
        }
    }

    class GLESPerObjectDataEveMissileWarhead
    {
        static layout = {
            vs: [ [ "WorldMat", 16 ], [ "WorldMatLast", 16 ], [ "Shipdata", 4 ], [ "Clipdata1", 4 ] ],
            ps: [ [ "Shipdata", 4 ], [ "Clipdata1", 4 ], [ "Clipdata2", 4 ] ]
        };

        constructor()
        {
            this.vs = new RawData(GLESPerObjectDataEveMissileWarhead.layout.vs);
            this.ps = new RawData(GLESPerObjectDataEveMissileWarhead.layout.ps);
        }
    }

    const requireStub = request =>
    {
        if (request === "utils") return { meta };
        if (request === "math") return math;
        if (request === "core") return { GLESPerObjectDataEveMissileWarhead };
        throw new Error(`Unexpected EveMissile dependency: ${request}`);
    };

    Function("require", "module", "exports", transformed)(requireStub, module, module.exports);
    return module.exports;
}


function createMetaStub()
{
    let proxy;
    const target = function () {};
    proxy = new Proxy(target, {
        get: (object, property) => property === "Model" ? class {} : proxy,
        apply: (fn, thisArg, args) =>
        {
            if (args.length >= 2 && (typeof args[1] === "string" || typeof args[1] === "symbol")) return args[2];
            return (value, key, descriptor) => descriptor || value;
        }
    });
    return proxy;
}
