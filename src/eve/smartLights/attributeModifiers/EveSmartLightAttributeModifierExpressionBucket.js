// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/attributeModifiers/EveSmartLightAttributeModifierExpressionBucket.h
import { meta } from "utils";
import { vec3 } from "math";
import { EveSmartLightAttributeModifierBucket } from "./EveSmartLightAttributeModifierBucket.js";
import { Tr2ExpressionProgram } from "../../../state/expression/Tr2ExpressionProgram";


/** EveSmartLightAttributeModifierExpressionBucket (eve/smartLights/attributeModifiers) - generated from schema shapeHash 02cc58c3.... */
@meta.type("EveSmartLightAttributeModifierExpressionBucket")
@meta.ccp.define("EveSmartLightAttributeModifierExpressionBucket")
export class EveSmartLightAttributeModifierExpressionBucket extends EveSmartLightAttributeModifierBucket
{

    /** m_expression (std::string) [PERSISTONLY] */
    @meta.expression
    expression = "";

    /** m_name (std::string) [READWRITE, PERSIST] */
    @meta.string
    name = "bucket";

    /**
     * m_activationStrength (float) [READ] - "Value after the last update".
     *
     * Exposed under a DIFFERENT wire name than the member it reads, and than
     * the base's own `attributeMultiplier`, which maps the same-named member on
     * the base class. Both names appear in the data and they are not the same
     * slot, so this cannot be folded into the base.
     */
    @meta.float
    currentValue = 1;

    /** m_inputs (PITriScalarFunctionVector) [READ, PERSIST] */
    @meta.list("ITriScalarFunction")
    expressionInputs = [];

    /** Compiled expression program (Carbon m_program, a CcpParser::Program). */
    _program = null;

    /** m_randomConstant (float) - per-instance random constant (h:48). */
    _randomConstant = Math.random();

    // m_arguments (h:50-55) - the expression variable bindings, refreshed each
    // synchronous update.
    _arguments = { time: 0, shipSpeed: 0, shipMaxSpeed: 0 };

    /**
     * Compiles the authored expression after load
     * (EveSmartLightAttributeModifierExpressionBucket.cpp:93-103). CcpParser is
     * replaced by the shared Tr2ExpressionProgram VM, matching the
     * Tr2CurveScalarExpression consumer pattern.
     */
    Initialize()
    {
        super.Initialize();
        if (this.expression)
        {
            this.SetExpression(this.expression);
        }
        return true;
    }

    /** Gets the n-th input curve value at the given (default: current) time (cpp:105-121). */
    GetInputValue(index, time = this._arguments.time)
    {
        const i = index | 0;
        if (i < 0 || i >= this.expressionInputs.length)
        {
            return 0;
        }
        return Number(this.expressionInputs[i]?.GetValueAt?.(time) ?? 0);
    }

    /** Gets this bucket's random constant (cpp:123-126). */
    GetRandomConstant()
    {
        return this._randomConstant;
    }

    /** Gets the authored expression (cpp:128-131). */
    GetExpression()
    {
        return this.expression;
    }

    /**
     * Sets and compiles the authored expression
     * (EveSmartLightAttributeModifierExpressionBucket.cpp:134-164). An invalid
     * expression compiles to an invalid program, which UpdateSyncronous skips -
     * matching Carbon's keep-running-on-parse-error behavior. CcpParser::Parse
     * is replaced by the shared Tr2ExpressionProgram VM; parse errors are held
     * on the program's `error` property rather than logged through CCP_LOGERR.
     */
    SetExpression(expression)
    {
        this.expression = String(expression ?? "");
        this._program = this.expression
            ? Tr2ExpressionProgram.Compile(this.expression, { emptyValue: 0 })
            : null;
    }

    /** Regenerates the random constant (Carbon jessica hook, h:34). */
    ResetRandomConstant()
    {
        this._randomConstant = Math.random();
    }

    /**
     * Expression terms exposed for tooling
     * (EveSmartLightAttributeModifierExpressionBucket.cpp:166-184). Returns the
     * term list in the Tr2ExpressionProgram term-info shape instead of
     * Tr2ExpressionTermInfo instances.
     */
    GetExpressionTermInfo()
    {
        return [
            { group: "Random", name: "fractal", kind: "function", parameters: "x, alpha, beta, n", description: "fractal noise" },
            { group: "Random", name: "noise", kind: "function", parameters: "x", description: "simple one-octave noise" },
            { group: "Random", name: "randomConstant", kind: "function", parameters: "a, b", description: "random per-curve constant in range [a, b)" },
            { group: "Random", name: "randconst", kind: "function", parameters: "a, b", description: "random per-curve constant in range [a, b)" },
            { group: "Random", name: "random", kind: "function", parameters: "a, b", description: "random value in range [a, b)" },
            { group: "Random", name: "randhash", kind: "function", parameters: "a, b, x", description: "random value in range [a, b) based on value x" },
            { group: "Inputs", name: "input", kind: "function", parameters: "n", description: "n-th input curve value at current time" },
            { group: "Inputs", name: "inputAt", kind: "function", parameters: "n, t", description: "input curve value at time t" },
            { group: "Math", name: "clamp", kind: "function", parameters: "x, min, max", description: "value x clamped to [min, max] range" },
            { group: "Inputs", name: "time", kind: "variable", description: "current time" },
            { group: "Inputs", name: "shipSpeed", kind: "variable", description: "current speed of ship" },
            { group: "Inputs", name: "shipMaxSpeed", kind: "variable", description: "default maxSpeed for ship" },
            { group: "Math", name: "pi", kind: "variable", description: "Pi value" },
            { group: "Math", name: "pi2", kind: "variable", description: "Pi x 2 value" }
        ];
    }

    /**
     * Evaluates an arbitrary expression against the current argument bindings
     * (EveSmartLightAttributeModifierExpressionBucket.cpp:186-213). Returns the
     * numeric value directly (0 when the expression does not compile) instead
     * of Carbon's BlueStdResult out-parameter pair.
     */
    EvaluateExpression(expression)
    {
        const program = Tr2ExpressionProgram.Compile(String(expression ?? ""), { emptyValue: 0 });
        if (!program.IsValid())
        {
            return 0;
        }
        return Number(program.Evaluate(this._MakeEvaluationContext())) || 0;
    }

    /**
     * Fans a controller variable out to the child modifiers; Carbon leaves the
     * expression-variable hookup as a todo
     * (EveSmartLightAttributeModifierExpressionBucket.cpp:215-223).
     */
    SetControllerVariable(name, value)
    {
        for (const modifier of this.attributeModifiers)
        {
            modifier?.SetControllerVariable?.(name, value);
        }
    }

    /**
     * Expression-driven update
     * (EveSmartLightAttributeModifierExpressionBucket.cpp:225-250): folds the
     * multipliers directly (no crossfade state machine), advances play time,
     * updates the children with the UNSCALED parent multiplier, then evaluates
     * the expression into the attribute multiplier for the next fold.
     */
    UpdateSyncronous(updateContext, params, activationMultiplier)
    {
        this.finalAttributeMultiplier = activationMultiplier * this.attributeMultiplier * this.activationValue;
        this.playTime += updateContext?.GetDeltaT?.() ?? 0;

        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.UpdateSyncronous?.(updateContext, params, activationMultiplier);
        }

        if (!this.expression)
        {
            return;
        }

        this._arguments.time = this.playTime;
        this._arguments.shipSpeed = EveSmartLightAttributeModifierExpressionBucket._ShipSpeed(params?.spaceObjectParent);
        this._arguments.shipMaxSpeed = Number(params?.ownerMaxSpeed ?? 0);

        if (this._program?.IsValid())
        {
            this.attributeMultiplier = Number(this._program.Evaluate(this._MakeEvaluationContext())) || 0;
        }
    }

    /** Shared VM context (curve/self carry GetRandomConstant/GetInputValue, per the Tr2CurveScalarExpression pattern). */
    _MakeEvaluationContext()
    {
        return {
            curve: this,
            self: this,
            time: this._arguments.time,
            variables: {
                time: this._arguments.time,
                shipSpeed: this._arguments.shipSpeed,
                shipMaxSpeed: this._arguments.shipMaxSpeed
            }
        };
    }

    /**
     * Length of the owning space object's world velocity
     * (EveSmartLightAttributeModifierExpressionBucket.cpp:55-65); the space
     * object is duck-typed.
     */
    static _ShipSpeed(spaceObjectParent)
    {
        if (!spaceObjectParent?.GetWorldVelocity)
        {
            return 0;
        }
        const velocity = spaceObjectParent.GetWorldVelocity(EveSmartLightAttributeModifierExpressionBucket._velocity);
        return velocity ? vec3.length(velocity) : 0;
    }

    static _velocity = vec3.create();

}
