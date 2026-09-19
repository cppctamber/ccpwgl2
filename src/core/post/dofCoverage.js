/** Retain the material's clipping/animation, then reject invisible output. */
export function DofCoverageSource(source, additive, alphaWeighted = false) 
{
    const outputs = [ ...source.matchAll(/(?:layout\s*\(\s*location\s*=\s*(\d+)\s*\)\s*)?out\s+(?:(?:lowp|mediump|highp)\s+)?vec4\s+(\w+)\s*;/g) ];
    const output = outputs.find(x => x[1] === "0") || (outputs.length === 1 ? outputs[0] : null);
    if (!output || !/void\s+main\s*\(/.test(source)) return null;
    const name = output[2];
    const coverage = additive ? `max(max(abs(${name}.r), abs(${name}.g)), abs(${name}.b))` : `${name}.a`;
    const contribution = additive && alphaWeighted ? `(${coverage}) * clamp(${name}.a, 0.0, 1.0)` : coverage;
    return source.replace(/void\s+main\s*\(/, "void dofMaterialMain(") + `
void main() {
    dofMaterialMain();
    if (!(${contribution} > 0.001)) discard;
}
`;
}
