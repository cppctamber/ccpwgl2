/**
 * The light classes' persisted properties must match Carbon's own schema.
 *
 * A property ccpwgl declares as persisted that Carbon does not write is not a
 * harmless extra: the black reader goes looking for it, does not find it, and
 * lands on the next object's type tag. That surfaces as
 * `Unknown property "EveChildContainer" for "Tr2SpotLight"` while loading a
 * perfectly good file — an error that names the wrong class, the wrong property
 * and the wrong file, three steps from the declaration that caused it.
 *
 * `Tr2SpotLight.lightProfile` and `Tr2TexturedPointLight.texture` were both that
 * defect, and both were commented `Read-only in Carbon (Be::READ)` at the point
 * of being declared persisted anyway — so a reader was not going to catch it.
 * A test does.
 *
 * The authority is the generated schema under carbonenginejs-org, whose
 * `black.fields` is the persisted set as Carbon writes it. Run it with the
 * organization checkout present:
 *
 *     node scripts/test-light-persisted-fields.mjs
 *
 * It SKIPS rather than fails when the schema is absent: this repository has to
 * stay testable on a machine with only ccpwgl on it.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const SCHEMA_ROOT = process.env.CARBON_SCHEMA_DIR
    || "E:/carbonenginejs-org/archived/format-carbon/src/schema/lights";

const SOURCES = {
    Tr2SpotLight: "src/core/lighting/Tr2SpotLight.js",
    Tr2PointLight: "src/core/lighting/Tr2PointLight.js",
    Tr2TexturedPointLight: "src/core/lighting/Tr2TexturedPointLight.js",
    Tr2FactionLight: "src/core/lighting/Tr2FactionLight.js",
};

/**
 * Properties carrying a `@meta` type decorator — which is what makes one
 * persisted in the black schema. `notImplemented` and `desc` are annotations
 * rather than types and do not count.
 */
function DeclaredProperties(file)
{
    const source = fs.readFileSync(file, "utf8");
    const found = new Set();
    const pattern = /((?:^[ \t]*@meta\.[^\n]*\n)+)[ \t]*([A-Za-z_][A-Za-z0-9_]*)\s*=/gmu;
    let match;

    while ((match = pattern.exec(source)) !== null)
    {
        const decorators = match[1].match(/@meta\.[a-zA-Z]+/gu) ?? [];
        const typed = decorators.some(name => ![ "@meta.notImplemented", "@meta.desc" ].includes(name));

        if (typed) found.add(match[2]);
    }

    return found;
}

/** The persisted set as Carbon writes it, from the generated schema. */
function SchemaProperties(className)
{
    const file = path.join(SCHEMA_ROOT, `${className}.json`);

    if (!fs.existsSync(file)) return null;

    const schema = JSON.parse(fs.readFileSync(file, "utf8"));

    return new Set(schema.black.fields
        .map(field => Object.entries(field.names).find(([ , role ]) => String(role).includes("fieldName"))?.[0])
        .filter(Boolean));
}

let failures = 0;
let checked = 0;

for (const [ className, file ] of Object.entries(SOURCES))
{
    const expected = SchemaProperties(className);

    if (!expected)
    {
        process.stdout.write(`  skip ${className} - no schema at ${SCHEMA_ROOT}\n`);
        continue;
    }

    checked++;

    const declared = DeclaredProperties(file);
    const extra = [ ...declared ].filter(name => !expected.has(name));
    const missing = [ ...expected ].filter(name => !declared.has(name));

    // An EXTRA declaration is inert, so it is reported rather than failed. The
    // black reader is name-driven — `Tw2BlackPropertyReaders` reads a property
    // name out of the file and looks it up on the object — so a declaration the
    // file never names is never consulted. Tr2TexturedPointLight keeps two on
    // purpose and its class doc says why.
    for (const name of extra)
    {
        process.stdout.write(`  note ${className}.${name} is declared and Carbon does not persist it — inert\n`);
    }

    for (const name of missing)
    {
        failures++;
        process.stdout.write(
            `  FAIL ${className}.${name} is persisted by Carbon and not declared here\n`
            + "       - the reader will not consume it and desynchronise\n",
        );
    }

    if (!extra.length && !missing.length)
    {
        process.stdout.write(`  ok   ${className} - ${expected.size} persisted fields agree\n`);
    }
}

if (!checked)
{
    process.stdout.write("\nno schema available; nothing checked\n");
    process.exit(0);
}

process.stdout.write(failures ? `\n${failures} failure(s)\n` : "\nall passed\n");
process.exit(failures ? 1 : 0);
