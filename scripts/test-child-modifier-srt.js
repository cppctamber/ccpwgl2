/**
 * EveChildModifierSRT, 2026-08-21.
 *
 * Every hangar advert places its mesh through one of these, and the 3D ones came
 * out at the wrong scale. ccpwgl's version was a `Modify` that OVERWROTE
 * `parent.localTransform` with its own SRT, discarding the child's authored
 * translation, rotation and scaling. Carbon's COMPOSES, and is an
 * `ApplyTransform` modifier - so it runs against the WORLD transform, after the
 * local one has been built:
 *
 *     Matrix EveChildModifierSRT::ApplyTransform( const Matrix& transform, ... ) const
 *     {
 *         return TransformationMatrix( m_scaling, m_rotation, m_translation ) * transform;
 *     }
 *     (e:\carbonengine\...\TransformModifiers\EveChildModifierSRT.cpp:17-20)
 *
 * Row-vector `SRT * transform` means SRT applies FIRST, which is
 * `mat4.multiply(out, transform, srt)` in gl-matrix - the operands swap. Per the
 * carbon-math-conventions skill, an operand-order bug is invisible against an
 * identity or translation-only parent, so these compose against a parent with
 * BOTH rotation and non-uniform scale and assert at 1e-5.
 *
 * runtime-trinity reaches the same expression independently
 * (`src/eve/child/modifiers/EveChildModifierSRT.js:58`).
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { transformSync } = require("@babel/core");
const { vec3, quat, mat4 } = require("gl-matrix");


const { EveChildModifierSRT } = loadModifier();

testComposesRatherThanOverwrites();
testMatchesCarbonAgainstARotatingScalingParent();
testOperandOrderIsNotReversed();
testItIsAnApplyTransformModifierNotAModify();
console.log("EveChildModifierSRT verified");


/**
 * The bug. A modifier scaling by 2 under a parent already scaling by 3 must
 * produce 6, not 2 - the old code replaced the transform instead of stacking on
 * it.
 */
function testComposesRatherThanOverwrites()
{
    const modifier = makeModifier({ scaling: [ 2, 2, 2 ] });
    const transform = mat4.fromScaling(mat4.create(), [ 3, 3, 3 ]);

    modifier.ApplyTransform(transform);

    const scale = mat4.getScaling(vec3.create(), transform);
    assert.ok(Math.abs(scale[0] - 6) < 1e-5, `expected 6, got ${scale[0]}`);
}

/**
 * The full expression against a parent that would hide a wrong operand order:
 * rotation AND non-uniform scale, with the translation column asserted.
 */
function testMatchesCarbonAgainstARotatingScalingParent()
{
    const modifier = makeModifier({
        scaling: [ 2, 3, 4 ],
        rotation: quat.setAxisAngle(quat.create(), [ 0, 1, 0 ], Math.PI / 3),
        translation: [ 7, -2, 5 ]
    });

    const parent = buildParent();

    const actual = mat4.clone(parent);
    modifier.ApplyTransform(actual);

    // Carbon: TransformationMatrix(s, r, t) * parent - SRT applies first
    const srt = mat4.fromRotationTranslationScale(
        mat4.create(),
        modifier.rotation,
        modifier.translation,
        modifier.scaling
    );
    const expected = mat4.multiply(mat4.create(), parent, srt);

    assertMatrixEqual(actual, expected);
}

/**
 * The specific failure the convention causes. Guards the fix against being
 * "tidied" back into textual order.
 */
function testOperandOrderIsNotReversed()
{
    const modifier = makeModifier({
        scaling: [ 2, 3, 4 ],
        rotation: quat.setAxisAngle(quat.create(), [ 0, 1, 0 ], Math.PI / 3),
        translation: [ 7, -2, 5 ]
    });

    const parent = buildParent();

    const actual = mat4.clone(parent);
    modifier.ApplyTransform(actual);

    const srt = mat4.fromRotationTranslationScale(
        mat4.create(),
        modifier.rotation,
        modifier.translation,
        modifier.scaling
    );
    const reversed = mat4.multiply(mat4.create(), srt, parent);

    assert.ok(
        !matricesEqual(actual, reversed),
        "the reversed order produces the same matrix - the fixture cannot detect the bug"
    );
}

/**
 * `EveChildContainer.Update` dispatches on which method exists: a modifier with
 * `ApplyTransform` runs in the WORLD pass, one with only `Modify` runs earlier
 * against local state. Carbon's SRT is the former, so it must not also carry a
 * `Modify` - that would put it back in the wrong pass.
 */
function testItIsAnApplyTransformModifierNotAModify()
{
    const modifier = makeModifier({});

    assert.equal(typeof modifier.ApplyTransform, "function");
    assert.equal("Modify" in modifier, false, "must not also expose Modify");
}


/** A parent with rotation and non-uniform scale - see gotcha 2 in the skill. */
function buildParent()
{
    return mat4.fromRotationTranslationScale(
        mat4.create(),
        quat.setAxisAngle(quat.create(), [ 0.3, 0.8, 0.5 ], 0.9),
        [ 120, -40, 66 ],
        [ 3, 5, 0.5 ]
    );
}

function matricesEqual(a, b)
{
    for (let i = 0; i < 16; i++) if (Math.abs(a[i] - b[i]) > 1e-5) return false;
    return true;
}

function assertMatrixEqual(actual, expected)
{
    for (let i = 0; i < 16; i++)
    {
        assert.ok(
            Math.abs(actual[i] - expected[i]) < 1e-5,
            `element ${i}: expected ${expected[i]}, got ${actual[i]}`
        );
    }
}

function makeModifier(values)
{
    const modifier = new EveChildModifierSRT();
    if (values.scaling) vec3.copy(modifier.scaling, values.scaling);
    if (values.translation) vec3.copy(modifier.translation, values.translation);
    if (values.rotation) quat.copy(modifier.rotation, values.rotation);
    return modifier;
}

function loadModifier()
{
    const math = { vec3, quat, mat4 };

    return load("../src/unsupported/eve/child/modifier/EveChildModifierSRT.js", {
        utils: { meta: makeMeta() },
        math,
        "./EveChildModifier": {
            EveChildModifier: class
            {
                static global = { mat4_0: mat4.create() };
            }
        }
    });
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
