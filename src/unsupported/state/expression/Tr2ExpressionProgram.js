import { Tw2Error } from "core";

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
        let node = this.ParseUnary();
        while (true)
        {
            if (this.Match("operator", "*"))
            {
                node = { type: "binary", operator: "*", left: node, right: this.ParseUnary() };
            }
            else if (this.Match("operator", "/"))
            {
                node = { type: "binary", operator: "/", left: node, right: this.ParseUnary() };
            }
            else if (this.Match("operator", "%"))
            {
                node = { type: "binary", operator: "%", left: node, right: this.ParseUnary() };
            }
            else
            {
                return node;
            }
        }
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

        if ("+-*/%<>()!,?:".includes(c))
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

    if (Object.prototype.hasOwnProperty.call(context, name))
    {
        return NormalizeValue(context[name]);
    }

    return 0;
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
    ShaderQuality: ctx => CallContextFunction(ctx, "ShaderQuality")
};

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
        if (context.owner.GetCurveSetDuration)
        {
            return ToNumber(context.owner.GetCurveSetDuration(name));
        }
        if (context.owner.GetRangeDuration && typeof name === "string" && name.includes("/"))
        {
            const parts = name.split("/");
            return ToNumber(context.owner.GetRangeDuration(parts[0], parts.slice(1).join("/")));
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
