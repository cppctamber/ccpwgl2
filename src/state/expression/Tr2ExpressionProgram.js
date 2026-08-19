import { Tw2Error } from "core";
import { tw2 } from "global";

const BLOCKED_IDENTIFIERS = new Set([
    "__proto__",
    "prototype",
    "constructor",
    "Function",
    "eval",
    "process",
    "global",
    "globalThis",
    "window",
    "document",
    "this"
]);

const CONSTANTS = {
    true: 1,
    false: 0,
    pi: Math.PI,
    pi2: Math.PI * 2,
    // CcpParser std constants (carbonengine parser/src/stdfunctions.cpp)
    _pi: Math.PI,
    _e: Math.E
};

/**
 * Compiled constrained expression program used by curves, transitions, and actions.
 */
export class Tr2ExpressionProgram
{
    /**
     * Pins the clock the `Server*` condition builtins read, standing in for
     * Carbon's `controllerServerTime` setting. Null follows the real clock.
     * Accepts a Date or epoch milliseconds.
     * @type {Date|Number|null}
     */
    static SERVER_TIME_OVERRIDE = null;

    constructor(source = "", options = {})
    {
        this.source = source || "";
        this.options = options || {};
        this.ast = null;
        this.error = "";
        this._error = null;
        this.variableNames = new Set();
        this.functionNames = new Set();
        this.Compile(this.source, this.options);
    }

    Compile(source = this.source, options = this.options)
    {
        this.source = source || "";
        this.options = options || {};
        this.error = "";
        this._error = null;
        this.variableNames.clear();
        this.functionNames.clear();

        if (!this.source)
        {
            this.ast = { type: "literal", value: this.options.emptyValue !== undefined ? this.options.emptyValue : 1 };
            return this;
        }

        try
        {
            const parser = new TrcExpressionParser(this.source, this.options);
            this.ast = parser.Parse();
            this.variableNames = parser.variableNames;
            this.functionNames = parser.functionNames;
        }
        catch (err)
        {
            this.ast = null;
            this.error = err.message;
            this._error = err;
        }
        return this;
    }

    Evaluate(context = {})
    {
        if (!this.ast)
        {
            if (this._error) throw this._error;
            return 0;
        }
        return EvaluateNode(this.ast, context, this);
    }

    EvaluateBoolean(context = {})
    {
        return ToBoolean(this.Evaluate(context));
    }

    IsValid()
    {
        return !!this.ast && !this.error;
    }

    GetVariableNames()
    {
        return Array.from(this.variableNames);
    }

    GetFunctionNames()
    {
        return Array.from(this.functionNames);
    }

    /**
     * Whether this expression calls anything whose result can change without a
     * controller variable changing - a clock, a random, an animation query.
     *
     * Carbon marks functions `PURE_FUNC` at registration and treats an
     * expression referencing a non-pure one as untrackable, dropping its
     * variable mask to zero (`Tr2ControllerExpression.cpp:509-515,556`).
     * `Random` is the clearest case: deliberately registered without the flag,
     * so it is never folded and never cached.
     *
     * ccpwgl re-evaluates every condition every frame regardless, so nothing
     * here gates evaluation. It answers "can this condition be described by the
     * variables it names", which is what a mask means.
     *
     * @returns {Boolean}
     */
    HasNonPureFunctions()
    {
        for (const name of this.functionNames)
        {
            if (!PURE_FUNCTION_NAMES.has(name)) return true;
        }
        return false;
    }

    static Compile(source, options)
    {
        return new Tr2ExpressionProgram(source, options);
    }
}

/**
 * Recursive-descent parser for the experiment's safe expression subset.
 */
class TrcExpressionParser
{
    constructor(source, options)
    {
        this.source = source;
        this.options = options || {};
        this.tokens = Tokenize(source);
        this.index = 0;
        this.variableNames = new Set();
        this.functionNames = new Set();
    }

    Parse()
    {
        const expression = this.ParseConditional();
        this.Expect("eof");
        return expression;
    }

    /**
     * CarbonEngine's CcpParser grammar supports the C-style conditional operator:
     * `expr(A) ::= expr(C) OP_QUESTION(O) expr(T) OP_COLON expr(F).` (parser/src/parser.y:135,
     * parser/src/parserstate.cpp Conditional). Codegen evaluates branches lazily via JUMP_Z
     * (parser/src/codebuilder.cpp Node::CONDITIONAL).
     */
    ParseConditional()
    {
        const condition = this.ParseLogicalOr();
        if (this.Match("operator", "?"))
        {
            const consequent = this.ParseConditional();
            this.Expect("operator", ":");
            const alternate = this.ParseConditional();
            return { type: "conditional", condition, consequent, alternate };
        }
        return condition;
    }

    ParseLogicalOr()
    {
        let node = this.ParseLogicalAnd();
        while (this.Match("operator", "||"))
        {
            node = { type: "binary", operator: "||", left: node, right: this.ParseLogicalAnd() };
        }
        return node;
    }

    ParseLogicalAnd()
    {
        let node = this.ParseEquality();
        while (this.Match("operator", "&&"))
        {
            node = { type: "binary", operator: "&&", left: node, right: this.ParseEquality() };
        }
        return node;
    }

    ParseEquality()
    {
        let node = this.ParseComparison();
        while (true)
        {
            if (this.Match("operator", "=="))
            {
                node = { type: "binary", operator: "==", left: node, right: this.ParseComparison() };
            }
            else if (this.Match("operator", "!="))
            {
                node = { type: "binary", operator: "!=", left: node, right: this.ParseComparison() };
            }
            else
            {
                return node;
            }
        }
    }

    ParseComparison()
    {
        let node = this.ParseTerm();
        while (true)
        {
            if (this.Match("operator", "<"))
            {
                node = { type: "binary", operator: "<", left: node, right: this.ParseTerm() };
            }
            else if (this.Match("operator", "<="))
            {
                node = { type: "binary", operator: "<=", left: node, right: this.ParseTerm() };
            }
            else if (this.Match("operator", ">"))
            {
                node = { type: "binary", operator: ">", left: node, right: this.ParseTerm() };
            }
            else if (this.Match("operator", ">="))
            {
                node = { type: "binary", operator: ">=", left: node, right: this.ParseTerm() };
            }
            else
            {
                return node;
            }
        }
    }

    ParseTerm()
    {
        let node = this.ParseFactor();
        while (true)
        {
            if (this.Match("operator", "+"))
            {
                node = { type: "binary", operator: "+", left: node, right: this.ParseFactor() };
            }
            else if (this.Match("operator", "-"))
            {
                node = { type: "binary", operator: "-", left: node, right: this.ParseFactor() };
            }
            else
            {
                return node;
            }
        }
    }

    ParseFactor()
    {
        let node = this.ParseExponent();
        while (true)
        {
            if (this.Match("operator", "*"))
            {
                node = { type: "binary", operator: "*", left: node, right: this.ParseExponent() };
            }
            else if (this.Match("operator", "/"))
            {
                node = { type: "binary", operator: "/", left: node, right: this.ParseExponent() };
            }
            else if (this.Match("operator", "%"))
            {
                node = { type: "binary", operator: "%", left: node, right: this.ParseExponent() };
            }
            else
            {
                return node;
            }
        }
    }

    /**
     * Exponent. Binds tighter than * and /, looser than unary, and is LEFT
     * associative - matching CcpParser and runtime-trinity, so 2^3^2 is 64 and
     * not 512.
     *
     * ccpwgl rejected `^` in the tokenizer, so a condition using it failed to
     * compile and its transition was permanently dead - the same silent failure
     * mode as the missing server-time builtins.
     */
    ParseExponent()
    {
        let node = this.ParseUnary();
        while (this.Match("operator", "^"))
        {
            node = { type: "binary", operator: "^", left: node, right: this.ParseUnary() };
        }
        return node;
    }

    ParseUnary()
    {
        if (this.Match("operator", "!"))
        {
            return { type: "unary", operator: "!", argument: this.ParseUnary() };
        }
        if (this.Match("operator", "-"))
        {
            return { type: "unary", operator: "-", argument: this.ParseUnary() };
        }
        if (this.Match("operator", "+"))
        {
            return { type: "unary", operator: "+", argument: this.ParseUnary() };
        }
        return this.ParsePrimary();
    }

    ParsePrimary()
    {
        const token = this.Peek();

        if (this.Match("number"))
        {
            return { type: "literal", value: token.value };
        }

        if (this.Match("string"))
        {
            return { type: "literal", value: token.value };
        }

        if (this.Match("identifier"))
        {
            this.AssertSafeIdentifier(token.value);
            if (this.Match("operator", "("))
            {
                return this.ParseCall(token.value);
            }

            if (token.value in CONSTANTS)
            {
                return { type: "literal", value: CONSTANTS[token.value] };
            }

            this.variableNames.add(token.value);
            return { type: "identifier", name: token.value };
        }

        if (this.Match("operator", "("))
        {
            const node = this.ParseConditional();
            this.Expect("operator", ")");
            return node;
        }

        throw this.Error(`Unexpected token '${token.value}'`);
    }

    ParseCall(name)
    {
        this.AssertSafeIdentifier(name);
        if (!GetFunction(name, this.options))
        {
            throw this.Error(`Unknown function '${name}'`);
        }

        const args = [];
        if (!this.Match("operator", ")"))
        {
            do
            {
                args.push(this.ParseConditional());
            }
            while (this.Match("operator", ","));
            this.Expect("operator", ")");
        }

        this.functionNames.add(name);
        return { type: "call", name, args };
    }

    AssertSafeIdentifier(name)
    {
        if (BLOCKED_IDENTIFIERS.has(name))
        {
            throw this.Error(`Unsafe identifier '${name}'`);
        }
    }

    Peek()
    {
        return this.tokens[this.index];
    }

    Match(type, value)
    {
        const token = this.Peek();
        if (!token || token.type !== type) return false;
        if (value !== undefined && token.value !== value) return false;
        this.index++;
        return true;
    }

    Expect(type, value)
    {
        const token = this.Peek();
        if (this.Match(type, value)) return token;
        throw this.Error(`Expected ${value || type}, got '${token ? token.value : "end of input"}'`);
    }

    Error(message)
    {
        const token = this.Peek();
        return new ErrTrcExpressionCompile({
            expression: this.source,
            reason: message,
            position: token ? token.position : this.source.length
        });
    }
}

function Tokenize(source)
{
    const tokens = [];
    let i = 0;

    while (i < source.length)
    {
        const c = source[i];

        if (/\s/.test(c))
        {
            i++;
            continue;
        }

        if (IsDigit(c) || (c === "." && IsDigit(source[i + 1])))
        {
            const start = i;
            i = ReadNumber(source, i);
            tokens.push({ type: "number", value: Number(source.slice(start, i)), position: start });
            continue;
        }

        if (c === "\"" || c === "'")
        {
            const start = i;
            const result = ReadString(source, i);
            i = result.end;
            tokens.push({ type: "string", value: result.value, position: start });
            continue;
        }

        if (IsIdentifierStart(c))
        {
            const start = i;
            i++;
            while (IsIdentifierPart(source[i])) i++;
            tokens.push({ type: "identifier", value: source.slice(start, i), position: start });
            continue;
        }

        const two = source.slice(i, i + 2);
        if (two === "&&" || two === "||" || two === "<=" || two === ">=" || two === "==" || two === "!=")
        {
            tokens.push({ type: "operator", value: two, position: i });
            i += 2;
            continue;
        }

        if ("+-*/%^<>()!,?:".includes(c))
        {
            tokens.push({ type: "operator", value: c, position: i });
            i++;
            continue;
        }

        throw new ErrTrcExpressionCompile({
            expression: source,
            reason: `Unexpected character '${c}'`,
            position: i
        });
    }

    tokens.push({ type: "eof", value: "", position: source.length });
    return tokens;
}

function ReadNumber(source, index)
{
    let i = index;
    while (IsDigit(source[i])) i++;
    if (source[i] === ".")
    {
        i++;
        while (IsDigit(source[i])) i++;
    }
    if (source[i] === "e" || source[i] === "E")
    {
        const exp = i;
        i++;
        if (source[i] === "+" || source[i] === "-") i++;
        const digits = i;
        while (IsDigit(source[i])) i++;
        if (digits === i) return exp;
    }
    return i;
}

function ReadString(source, index)
{
    const quote = source[index];
    let value = "";
    let i = index + 1;
    while (i < source.length)
    {
        const c = source[i++];
        if (c === quote)
        {
            return { value, end: i };
        }
        if (c === "\\")
        {
            const n = source[i++];
            switch (n)
            {
                case "n":
                    value += "\n";
                    break;
                case "r":
                    value += "\r";
                    break;
                case "t":
                    value += "\t";
                    break;
                default:
                    value += n;
                    break;
            }
        }
        else
        {
            value += c;
        }
    }
    throw new ErrTrcExpressionCompile({
        expression: source,
        reason: "Unterminated string",
        position: index
    });
}

function EvaluateNode(node, context, program)
{
    switch (node.type)
    {
        case "literal":
            return node.value;
        case "identifier":
            return ResolveIdentifier(node.name, context);
        case "unary":
            return EvaluateUnary(node.operator, EvaluateNode(node.argument, context, program));
        case "binary":
            return EvaluateBinary(node.operator, node.left, node.right, context, program);
        case "conditional":
            return ToBoolean(EvaluateNode(node.condition, context, program))
                ? EvaluateNode(node.consequent, context, program)
                : EvaluateNode(node.alternate, context, program);
        case "call":
            return EvaluateCall(node, context, program);
        default:
            return 0;
    }
}

function EvaluateUnary(operator, value)
{
    switch (operator)
    {
        case "!":
            return ToBoolean(value) ? 0 : 1;
        case "-":
            return -ToNumber(value);
        case "+":
            return ToNumber(value);
        default:
            return 0;
    }
}

function EvaluateBinary(operator, leftNode, rightNode, context, program)
{
    if (operator === "&&")
    {
        return ToBoolean(EvaluateNode(leftNode, context, program)) && ToBoolean(EvaluateNode(rightNode, context, program)) ? 1 : 0;
    }
    if (operator === "||")
    {
        return ToBoolean(EvaluateNode(leftNode, context, program)) || ToBoolean(EvaluateNode(rightNode, context, program)) ? 1 : 0;
    }

    const left = EvaluateNode(leftNode, context, program);
    const right = EvaluateNode(rightNode, context, program);
    switch (operator)
    {
        case "+":
            return ToNumber(left) + ToNumber(right);
        case "-":
            return ToNumber(left) - ToNumber(right);
        case "*":
            return ToNumber(left) * ToNumber(right);
        case "/":
            return ToNumber(right) === 0 ? 0 : ToNumber(left) / ToNumber(right);
        case "^":
            return Math.pow(ToNumber(left), ToNumber(right));

        case "%":
            return ToNumber(right) === 0 ? 0 : ToNumber(left) % ToNumber(right);
        case "<":
            return ToNumber(left) < ToNumber(right) ? 1 : 0;
        case "<=":
            return ToNumber(left) <= ToNumber(right) ? 1 : 0;
        case ">":
            return ToNumber(left) > ToNumber(right) ? 1 : 0;
        case ">=":
            return ToNumber(left) >= ToNumber(right) ? 1 : 0;
        case "==":
            return left == right ? 1 : 0;
        case "!=":
            return left != right ? 1 : 0;
        default:
            return 0;
    }
}

function EvaluateCall(node, context, program)
{
    const fn = GetFunction(node.name, program.options);
    if (!fn)
    {
        throw new ErrTrcExpressionEvaluate({
            expression: program.source,
            reason: `Unknown function '${node.name}'`
        });
    }
    const args = node.args.map(arg => EvaluateNode(arg, context, program));
    return fn(context || {}, ...args);
}

function ResolveIdentifier(name, context = {})
{
    if (name in CONSTANTS) return CONSTANTS[name];

    if (context.variables)
    {
        if (context.variables instanceof Map && context.variables.has(name))
        {
            return NormalizeValue(context.variables.get(name));
        }
        if (Object.prototype.hasOwnProperty.call(context.variables, name))
        {
            return NormalizeValue(context.variables[name]);
        }
    }

    if (context.controller && context.controller.GetVariableValue)
    {
        const value = context.controller.GetVariableValue(name, undefined);
        if (value !== undefined)
        {
            return NormalizeValue(value);
        }
    }

    // Carbon resolves a bare identifier against ONE table - the compiling
    // controller's own variable view (`Tr2ControllerExpression.cpp:546`) - and
    // treats anything else as a compile error. ccpwgl used to fall through to
    // any property on the context, which quietly turned `controller`, `owner`,
    // `stateMachine` and `time` into identifiers. Only the two clock-ish names
    // survive that, because curve expressions do read them.
    if (CONTEXT_IDENTIFIERS.has(name) && Object.prototype.hasOwnProperty.call(context, name))
    {
        return NormalizeValue(context[name]);
    }

    // Carbon fails the whole condition here, which makes the mistake loud. That
    // is too blunt for ccpwgl, where a hull can legitimately lack a variable
    // another hull declares - so it stays 0, and says so once.
    WarnUnresolvedIdentifier(name, context);
    return 0;
}

const CONTEXT_IDENTIFIERS = new Set([ "time", "stateTime" ]);

const s_warnedIdentifiers = new Set();

/**
 * Reports an identifier that resolved to nothing, once per name per session.
 *
 * An absent variable and an authored zero are otherwise indistinguishable, on
 * both the read and the write side (`Tr2Controller.SetVariableValue` returns
 * false for an unknown name and says nothing either). That ambiguity is what
 * makes "the state machine does nothing" so expensive to diagnose.
 *
 * @param {String} name
 * @param {Object} context
 */
function WarnUnresolvedIdentifier(name, context)
{
    if (s_warnedIdentifiers.has(name)) return;
    s_warnedIdentifiers.add(name);

    const controller = context.controller;
    tw2.Debug({
        name: "Controller expression",
        message: `Unresolved identifier '${name}' evaluates to 0${controller && controller.name ? ` (controller '${controller.name}')` : ""}`
    });
}

function GetFunction(name, options = {})
{
    if (options.functions && options.functions[name])
    {
        return options.functions[name];
    }
    return DEFAULT_FUNCTIONS[name] || null;
}

const DEFAULT_FUNCTIONS = {
    abs: (ctx, x) => Math.abs(ToNumber(x)),
    min: (ctx, ...args) => Math.min(...args.map(ToNumber)),
    max: (ctx, ...args) => Math.max(...args.map(ToNumber)),
    floor: (ctx, x) => Math.floor(ToNumber(x)),
    ceil: (ctx, x) => Math.ceil(ToNumber(x)),
    round: (ctx, x) => Math.round(ToNumber(x)),
    sqrt: (ctx, x) => Math.sqrt(Math.max(0, ToNumber(x))),
    pow: (ctx, x, y) => Math.pow(ToNumber(x), ToNumber(y)),
    sin: (ctx, x) => Math.sin(ToNumber(x)),
    cos: (ctx, x) => Math.cos(ToNumber(x)),
    tan: (ctx, x) => Math.tan(ToNumber(x)),
    // CcpParser std functions (carbonengine parser/src/stdfunctions.cpp);
    // real curve expressions use `rint` (e.g. "rint(input1*input2)*1/input2*0.5")
    asin: (ctx, x) => Math.asin(ToNumber(x)),
    acos: (ctx, x) => Math.acos(ToNumber(x)),
    atan: (ctx, x) => Math.atan(ToNumber(x)),
    sinh: (ctx, x) => Math.sinh(ToNumber(x)),
    cosh: (ctx, x) => Math.cosh(ToNumber(x)),
    tanh: (ctx, x) => Math.tanh(ToNumber(x)),
    asinh: (ctx, x) => Math.asinh(ToNumber(x)),
    acosh: (ctx, x) => Math.acosh(ToNumber(x)),
    atanh: (ctx, x) => Math.atanh(ToNumber(x)),
    log2: (ctx, x) => Math.log2(ToNumber(x)),
    log10: (ctx, x) => Math.log10(ToNumber(x)),
    log: (ctx, x) => Math.log(ToNumber(x)),
    ln: (ctx, x) => Math.log(ToNumber(x)),
    exp: (ctx, x) => Math.exp(ToNumber(x)),
    sign: (ctx, x) => { const v = ToNumber(x); return v > 0 ? 1 : v < 0 ? -1 : 0; },
    rint: (ctx, x) => RoundHalfToEven(ToNumber(x)),
    sum: (ctx, ...args) => args.reduce((total, value) => total + ToNumber(value), 0),
    avg: (ctx, ...args) => args.length ? args.reduce((total, value) => total + ToNumber(value), 0) / args.length : 0,
    clamp: (ctx, x, min, max) => Math.min(ToNumber(max), Math.max(ToNumber(min), ToNumber(x))),
    radians: (ctx, x) => ToNumber(x) * Math.PI / 180,
    mod: (ctx, x, y) => ToNumber(y) === 0 ? 0 : ToNumber(x) % ToNumber(y),
    lerp: (ctx, a, b, x) => ToNumber(a) * (1 - ToNumber(x)) + ToNumber(b) * ToNumber(x),
    random: (ctx, min = 0, max = 1) => ToNumber(min) + Math.random() * (ToNumber(max) - ToNumber(min)),
    randomConstant: (ctx, min = 0, max = 1) => ToNumber(min) + GetRandomConstant(ctx) * (ToNumber(max) - ToNumber(min)),
    randconst: (ctx, min = 0, max = 1) => DEFAULT_FUNCTIONS.randomConstant(ctx, min, max),
    randhash: (ctx, min = 0, max = 1, value = 0) => ToNumber(min) + Hash01(ToNumber(value)) * (ToNumber(max) - ToNumber(min)),
    noise: (ctx, x) => Hash01(ToNumber(x) + GetRandomConstant(ctx)),
    fractal: (ctx, x) => Hash01(ToNumber(x) + GetRandomConstant(ctx)),
    input: (ctx, index) => GetInputValue(ctx, index),
    inputAt: (ctx, index, time) => GetInputValue(ctx, index, time),
    StateTime: ctx => ctx.stateMachine && ctx.stateMachine.GetStateTime ? ctx.stateMachine.GetStateTime() : ToNumber(ctx.stateTime),
    CurveSetTime: (ctx, name) => GetCurveSetTime(ctx, name),
    AnimationTime: (ctx, name) => CallContextFunction(ctx, "AnimationTime", name),
    IsAnimationPlaying: (ctx, name) => CallContextFunction(ctx, "IsAnimationPlaying", name),
    GetExternalControllerVariable: (ctx, name, fallback = 0) => GetExternalControllerVariable(ctx, name, fallback),
    ShipSpeed: ctx => CallContextFunction(ctx, "ShipSpeed"),
    ShipMaxSpeed: ctx => CallContextFunction(ctx, "ShipMaxSpeed", undefined, 1),
    ShipBoosterIntensity: ctx => CallContextFunction(ctx, "ShipBoosterIntensity"),
    KillCount: ctx => CallContextFunction(ctx, "KillCount"),
    BoundingSphereRadius: ctx => CallContextFunction(ctx, "BoundingSphereRadius"),
    ShaderQuality: ctx => GetShaderQuality(ctx),

    // Carbon's integer Random, distinct from the continuous `random` above:
    // `min + rand() % int(max - min)`, i.e. whole numbers in [min, max-1]
    // (`Tr2ControllerExpression.cpp:88-92`). It is deliberately registered
    // without the pure flag there, so it is never constant-folded and never
    // dirty-cached - ccpwgl re-evaluates every condition anyway.
    Random: (ctx, min = 0, max = 1) => CarbonRandom(ToNumber(min), ToNumber(max)),

    // Server clock family (`Tr2ControllerExpression.cpp:238-454`). EVE authors
    // seasonal and event content against these; without them the whole
    // condition failed to compile and the transition was silently dead.
    ServerYear: ctx => GetServerTimeParts(ctx).year,
    ServerMonth: ctx => GetServerTimeParts(ctx).month,
    ServerDay: ctx => GetServerTimeParts(ctx).day,
    ServerDayOfWeek: ctx => GetServerTimeParts(ctx).dayOfWeek,
    ServerHour: ctx => GetServerTimeParts(ctx).hour,
    ServerMinute: ctx => GetServerTimeParts(ctx).minute,
    ServerSecond: ctx => GetServerTimeParts(ctx).second,
    IsWeekend: ctx => GetServerTimeParts(ctx).dayOfWeek % 6 === 0 ? 1 : 0,
    ServerTimePhase: (ctx, period) => ServerTimePhase(ctx, ToNumber(period)),
    ServerTimeGreaterThan: (ctx, ...args) => ServerTimeComparison(ctx, args, (a, b) => a > b, (a, b) => a < b),
    ServerTimeLessThanOrEqual: (ctx, ...args) => ServerTimeComparison(ctx, args, (a, b) => a < b, (a, b) => a > b),
    ServerTimeEqual: (ctx, ...args) => ServerTimeComparison(ctx, args, () => false, (a, b) => a !== b),
    DaysSinceServerTime: (ctx, year = -1, month = -1, day = -1) =>
        DaysSinceServerTime(ctx, ToNumber(year), ToNumber(month), ToNumber(day))
};

/**
 * Functions whose result depends only on their arguments.
 *
 * Carbon registers exactly these as `PURE_FUNC` in CcpParser
 * (`parser/src/stdfunctions.cpp:48-96`); everything Trinity adds on top
 * (`Tr2ControllerExpression.cpp:456-483`) is registered without the flag,
 * including `Random`, the clocks and every ship query. The extra arithmetic
 * helpers ccpwgl carries beyond CcpParser's set are pure by inspection.
 *
 * Used to answer whether an expression can be described by the variables it
 * names. Nothing here gates evaluation - see `HasNonPureFunctions`.
 */
const PURE_FUNCTION_NAMES = new Set([
    "abs", "min", "max", "sum", "avg", "sign", "rint",
    "sin", "cos", "tan", "asin", "acos", "atan",
    "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
    "log", "log2", "log10", "ln", "exp", "sqrt",
    // Beyond CcpParser's table, but deterministic in their arguments.
    "pow", "floor", "ceil", "round", "clamp", "radians", "mod", "lerp"
]);

const SHADER_QUALITY = { lo: 0, hi: 1, depth: 2 };

/**
 * Carbon reads the RENDERER's shader model here, not the object
 * (`Tr2ControllerExpression.cpp:163-178`, `Tr2Renderer::GetShaderModel()`:
 * 0 = LO, 1 = HI, 2 = DEPTH). ccpwgl's equivalent is the device's
 * `shaderModel`, the same value that picks a shader's `.sm_<quality>` variant.
 *
 * An owner may still answer for itself, which keeps any per-object override
 * working; what it must not do is fall through to 0 and claim LOW, which is
 * what happened while nothing implemented the method at all.
 *
 * @param {Object} context
 * @returns {Number}
 */
function GetShaderQuality(context)
{
    if (context.owner && context.owner.ShaderQuality)
    {
        return ToNumber(context.owner.ShaderQuality());
    }

    const model = tw2.device ? tw2.device.shaderModel : null;
    return model && model in SHADER_QUALITY ? SHADER_QUALITY[model] : SHADER_QUALITY.hi;
}

/**
 * Carbon's `Random(min, max)`: `min + rand() % int(max - min)`.
 * Carbon's version is undefined when `max <= min` (a modulo by zero or a
 * negative divisor); ccpwgl returns `min`, which is the value that expression
 * would have produced for an empty range anyway.
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */
function CarbonRandom(min, max)
{
    const range = Math.trunc(max - min);
    if (range <= 0) return min;
    return min + Math.floor(Math.random() * range);
}

// Milliseconds between the FILETIME epoch (1601-01-01) and the unix epoch.
// `ServerTimePhase` takes a modulo against the raw FILETIME value, so the phase
// depends on which epoch the clock counts from - it is not a unix-time modulo.
const FILETIME_EPOCH_OFFSET_MS = 11644473600000;

/**
 * The server calendar, in the field conventions Carbon's expressions use:
 * full year, month 1-12, day of month 1-31, day of week 0 = Sunday.
 *
 * Read in UTC, always. A browser's only clock is the machine's, in the
 * player's timezone: reading local fields would give every player a different
 * answer to `IsWeekend()` and would start an event at a different moment in
 * each timezone. EVE server time is UTC, so the UTC fields are the only ones
 * that mean anything here.
 *
 * That matches Carbon's Windows path, where `FileTimeToSystemTime` does no
 * timezone conversion. Carbon's other platform branch uses `localtime` where
 * the rest of that codebase uses `gmtime` - a defect, deliberately not
 * reproduced.
 *
 * A machine clock is still not the server's, and a browser cannot ask the
 * server itself, so an embedder that knows the real time may supply it. In
 * order of precedence:
 *
 *   context.serverTime                  - a Date or epoch-ms on the eval context
 *   context.functions.GetServerTime()   - a context-supplied clock function
 *   context.owner.GetServerTime()       - the object being animated
 *   Tr2ExpressionProgram.SERVER_TIME_OVERRIDE  - a global pin, for testing
 *   the machine clock
 *
 * The first three are per-evaluation, which is what Carbon's settable
 * `controllerServerTime` is for and what lets two scenes disagree; the static
 * is the blunt instrument for pinning a date while authoring.
 *
 * @param {Object} [context]
 * @returns {{year: Number, month: Number, day: Number, dayOfWeek: Number, hour: Number, minute: Number, second: Number}}
 */
function GetServerTimeParts(context)
{
    const date = GetServerDate(context);
    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        dayOfWeek: date.getUTCDay(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        second: date.getUTCSeconds()
    };
}

/**
 * Resolves the clock the Server* builtins read. See `GetServerTimeParts` for
 * the precedence and why an embedder-supplied time matters in a browser.
 * @param {Object} [context]
 * @returns {Date}
 */
function GetServerDate(context)
{
    const supplied = GetSuppliedServerTime(context);
    if (supplied !== undefined && supplied !== null) return new Date(supplied);

    const override = Tr2ExpressionProgram.SERVER_TIME_OVERRIDE;
    return override === null || override === undefined ? new Date() : new Date(override);
}

/**
 * @param {Object} [context]
 * @returns {Date|Number|undefined}
 */
function GetSuppliedServerTime(context)
{
    if (!context) return undefined;

    if (context.serverTime !== undefined && context.serverTime !== null)
    {
        return context.serverTime;
    }

    if (context.functions && context.functions.GetServerTime)
    {
        return context.functions.GetServerTime(context);
    }

    if (context.owner && context.owner.GetServerTime)
    {
        return context.owner.GetServerTime();
    }

    return undefined;
}

/**
 * Where the current server time sits inside a repeating period.
 *
 * Carbon takes the modulo of the raw FILETIME tick count against the period
 * (`Tr2ControllerExpression.cpp:357-378`), so the result is measured from 1601
 * and the answer is in SECONDS in the range [0, period) - not a 0..1 phase.
 *
 * The arithmetic runs in milliseconds rather than 100ns ticks: the tick count
 * since 1601 is ~1.3e17, past the safe integer range, while the millisecond
 * count is ~1.3e13 and exact. The two agree for any period expressible in whole
 * milliseconds, which covers anything an expression would author.
 *
 * @param {Object} [context]
 * @param {Number} period - seconds; 0 returns 0, negative is used as positive
 * @returns {Number} seconds into the current period
 */
function ServerTimePhase(context, period)
{
    // Truncate to ticks first, as Carbon's TimeFromDouble does, then to ms.
    let periodMs = Math.trunc(period * 10000000) / 10000;
    if (periodMs === 0) return 0;
    if (periodMs < 0) periodMs = -periodMs;

    const now = Math.trunc(GetServerDate(context).getTime()) + FILETIME_EPOCH_OFFSET_MS;
    return (now % periodMs) / 1000;
}

/**
 * Compares the server calendar against an authored one, field by field.
 *
 * Carbon walks year, month, day, hour, minute, second in that order
 * (`Tr2ControllerExpression.cpp:383-433`). A field of -1 is skipped entirely,
 * the first field that decides wins, and running out of fields - all equal, or
 * all skipped - returns 1.
 *
 * @param {Object} [context]
 * @param {Array<Number>} fields - year, month, day, hour, minute, second
 * @param {Function} over - true when the server value settles it as 1
 * @param {Function} dis - true when the server value settles it as 0
 * @returns {Number} 1 or 0
 */
function ServerTimeComparison(context, fields, over, dis)
{
    const
        parts = GetServerTimeParts(context),
        server = [ parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second ];

    for (let i = 0; i < server.length; i++)
    {
        const authored = fields[i] === undefined ? -1 : ToNumber(fields[i]);
        if (authored === -1) continue;
        if (over(server[i], authored)) return 1;
        if (dis(server[i], authored)) return 0;
    }

    return 1;
}

/**
 * Days between an authored date and the server's date, positive when the
 * authored date is in the past (`Tr2ControllerExpression.cpp:435-454`).
 * A field of -1 takes the server's own value for that field.
 *
 * Carbon builds both dates by dropping a 1-BASED month into `tm_mon`, which is
 * 0-based - so both sides land a month late. JS `Date` months are 0-based too,
 * so passing the 1-based month straight in reproduces that shift on both sides
 * rather than silently correcting one of them. The shift cancels for most date
 * pairs and does not for some (month lengths differ), which is Carbon's
 * behaviour and therefore what authored content was tuned against.
 *
 * @param {Number} year
 * @param {Number} month
 * @param {Number} day
 * @returns {Number}
 */
function DaysSinceServerTime(context, year, month, day)
{
    const
        parts = GetServerTimeParts(context),
        targetYear = year === -1 ? parts.year : Math.trunc(year),
        targetMonth = month === -1 ? parts.month : Math.trunc(month),
        targetDay = day === -1 ? parts.day : Math.trunc(day),
        target = Date.UTC(targetYear, targetMonth, targetDay),
        server = Date.UTC(parts.year, parts.month, parts.day);

    return (server - target) / 86400000;
}

function GetRandomConstant(context)
{
    const source = context.curve || context.self || context.expression;
    if (source && source.GetRandomConstant)
    {
        return ToNumber(source.GetRandomConstant());
    }
    if (source && source.randomConstant !== undefined)
    {
        return ToNumber(source.randomConstant);
    }
    return 0;
}

function GetInputValue(context, index, time)
{
    const source = context.curve || context.self || context.expression || context;
    if (source && source.GetInputValue)
    {
        return ToNumber(source.GetInputValue(Math.round(ToNumber(index)), time));
    }

    const inputs = source && source.inputs ? source.inputs : context.inputs;
    const input = inputs && inputs[Math.round(ToNumber(index))];
    if (!input) return 0;
    if (time !== undefined && input.GetValueAt) return ToNumber(input.GetValueAt(ToNumber(time)));
    if (input.GetValueAt) return ToNumber(input.GetValueAt(ToNumber(context.time)));
    if (input.currentValue !== undefined) return ToNumber(input.currentValue);
    return ToNumber(input);
}

function GetCurveSetTime(context, name)
{
    if (context.owner)
    {
        // A "Set/Range" path is a named range lookup — resolve it against GetRangeDuration first;
        // only a bare set name falls through to the whole-set (max curve) duration.
        if (context.owner.GetRangeDuration && typeof name === "string" && name.includes("/"))
        {
            const parts = name.split("/");
            return ToNumber(context.owner.GetRangeDuration(parts[0], parts.slice(1).join("/")));
        }
        if (context.owner.GetCurveSetDuration)
        {
            return ToNumber(context.owner.GetCurveSetDuration(name));
        }
    }
    return CallContextFunction(context, "CurveSetTime", name);
}

function GetExternalControllerVariable(context, name, fallback)
{
    if (context.externalControllerVariables && Object.prototype.hasOwnProperty.call(context.externalControllerVariables, name))
    {
        return ToNumber(context.externalControllerVariables[name]);
    }
    if (context.owner && context.owner.GetControllerValueByName)
    {
        const value = context.owner.GetControllerValueByName(name);
        return value === undefined || value === null ? ToNumber(fallback) : ToNumber(value);
    }
    return ToNumber(fallback);
}

function CallContextFunction(context, name, arg, fallback = 0)
{
    if (context.functions && context.functions[name])
    {
        return ToNumber(context.functions[name](arg, context));
    }
    if (context.owner && context.owner[name])
    {
        return ToNumber(context.owner[name](arg));
    }
    return fallback;
}

/**
 * Round to nearest with ties to even, matching C `rintf` under the default
 * IEEE rounding mode (CcpParser registers `rint` as &rintf).
 * @param {Number} value
 * @returns {Number}
 */
function RoundHalfToEven(value)
{
    const floor = Math.floor(value);
    const diff = value - floor;
    if (diff < 0.5) return floor;
    if (diff > 0.5) return floor + 1;
    return floor % 2 === 0 ? floor : floor + 1;
}

function Hash01(value)
{
    const x = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
}

function NormalizeValue(value)
{
    if (value === true) return 1;
    if (value === false) return 0;
    if (value === undefined || value === null) return 0;
    return value;
}

function ToNumber(value)
{
    value = NormalizeValue(value);
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function ToBoolean(value)
{
    if (typeof value === "string")
    {
        return value.length > 0;
    }
    return ToNumber(value) !== 0;
}

function IsDigit(c)
{
    return c >= "0" && c <= "9";
}

function IsIdentifierStart(c)
{
    return !!c && /[A-Za-z_]/.test(c);
}

function IsIdentifierPart(c)
{
    return !!c && /[A-Za-z0-9_]/.test(c);
}


/**
 * Domain error raised when an expression cannot be parsed into a valid program.
 */
export class ErrTrcExpressionCompile extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error compiling expression at %position=unknown%: %reason=unknown% (%expression%)");
    }
}


/**
 * Domain error raised when a compiled expression fails during evaluation.
 */
export class ErrTrcExpressionEvaluate extends Tw2Error
{
    constructor(data)
    {
        super(data, "Error evaluating expression: %reason=unknown% (%expression%)");
    }
}
