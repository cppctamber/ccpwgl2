import { meta } from "utils";
import { Tr2ExpressionProgram } from "./Tr2ExpressionProgram";

/**
 * Serializable expression wrapper backed by the constrained expression program.
 */
@meta.type("Tr2Expression")
@meta.ccp.define("Tr2Expression")
export class Tr2Expression extends meta.Model
{
    @meta.expression
    expression = "";

    _program = null;
    _programSource = null;
    _compileError = "";

    Compile(options = {})
    {
        if (!this._program || this._programSource !== this.expression)
        {
            this._program = Tr2ExpressionProgram.Compile(this.expression, options);
            this._programSource = this.expression;
            this._compileError = this._program.error;
        }
        return this._program;
    }

    Evaluate(context = {})
    {
        return this.Compile().Evaluate(context);
    }

    EvaluateBoolean(context = {})
    {
        return this.Compile().EvaluateBoolean(context);
    }

    IsValid()
    {
        return this.Compile().IsValid();
    }

    GetError()
    {
        this.Compile();
        return this._compileError;
    }

    static Compile(expression, options)
    {
        return Tr2ExpressionProgram.Compile(expression, options);
    }
}
