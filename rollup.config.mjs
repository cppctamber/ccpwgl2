import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import alias from "@rollup/plugin-alias";
import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { CLIEngine } = require("eslint");

/**
 * Fails the build on an import whose CASE does not match the file on disk.
 *
 * Windows and macOS resolve `./WbgReader` to `WBGReader.js` without complaint;
 * Linux does not. So a mismatch is invisible to everyone who develops here and
 * stops the build dead for anyone who does not - which is exactly what happened
 * with `./WbgReader` and with `Gr2CurveDataD3I1K16uC16u`, whose file carried a
 * lowercase k. The second one broke the barrel that registers all 21 granny
 * curve formats, so a single letter took out the whole animation path on Linux.
 *
 * Checked at `buildStart` over the whole tree rather than per module in
 * `resolveId`, for two reasons: rollup on a case-insensitive filesystem
 * resolves the wrong spelling successfully and hands back a path that looks
 * right, and a whole-tree pass reports EVERY offender in one run instead of
 * stopping at the first.
 *
 * Only relative specifiers. The aliases (`core`, `math`, `utils`…) name
 * directories this config declares, and a typo there fails everywhere equally.
 */
export function checkImportCasing()
{
    const sourceRoot = path.resolve(root, "src");
    const IMPORT = /(?:from\s*|import\s*\(\s*|export\s*\*\s*from\s*)["'](\.[^"']*)["']/g;

    return {
        name: "import-casing",
        buildStart()
        {
            const problems = [];

            const walk = directory =>
            {
                for (const entry of fs.readdirSync(directory, { withFileTypes: true }))
                {
                    const full = path.join(directory, entry.name);

                    if (entry.isDirectory())
                    {
                        walk(full);
                        continue;
                    }

                    if (!/\.(js|mjs)$/.test(entry.name)) continue;

                    const code = fs.readFileSync(full, "utf8");

                    for (const match of code.matchAll(IMPORT))
                    {
                        const
                            target = path.resolve(path.dirname(full), match[1]),
                            parent = path.dirname(target),
                            base = path.basename(target);

                        let listing;

                        try { listing = fs.readdirSync(parent); }
                        catch { continue; }

                        // An exact hit, with or without the extension the
                        // specifier left off, is the only thing that is safe.
                        if (listing.some(name => name === base || name === `${base}.js` || name === `${base}.mjs`)) continue;

                        const actual = listing.find(name =>
                            name.toLowerCase() === base.toLowerCase()
                            || name.toLowerCase() === `${base}.js`.toLowerCase()
                            || name.toLowerCase() === `${base}.mjs`.toLowerCase());

                        // No match of any casing is a missing file, which every
                        // platform reports for itself. This plugin only owns the
                        // ones that resolve here and nowhere else.
                        if (actual) problems.push(`${path.relative(root, full)}\n      imports "${match[1]}" but the file is "${actual}"`);
                    }
                }
            };

            walk(sourceRoot);

            if (problems.length)
            {
                this.error(`${problems.length} import(s) differ in case from the file on disk - these build here and fail on Linux:\n    ${problems.join("\n    ")}`);
            }
        }
    };
}

function lintSources()
{
    const
        sourceRoot = path.resolve(root, "src"),
        cli = new CLIEngine({ cwd: root, fix: false }),
        formatter = cli.getFormatter("stylish");

    return {
        name: "eslint",
        transform(code, id)
        {
            const relative = path.relative(sourceRoot, id);
            if (
                path.extname(id) !== ".js" ||
                relative.startsWith("..") ||
                path.isAbsolute(relative)
            )
            {
                return null;
            }

            const report = cli.executeOnText(code, id);
            if (report.errorCount)
            {
                this.error(formatter(report.results));
            }
            return null;
        }
    };
}

const entries = [
    { find: "core", replacement: path.resolve(root, "src/core") },
    { find: "curve", replacement: path.resolve(root, "src/curve") },
    { find: "eve", replacement: path.resolve(root, "src/eve") },
    { find: "interior", replacement: path.resolve(root, "src/interior") },
    { find: "particle", replacement: path.resolve(root, "src/particle") },
    { find: "sof", replacement: path.resolve(root, "src/sof") },
    { find: "state", replacement: path.resolve(root, "src/state") },
    { find: "unsupported", replacement: path.resolve(root, "src/unsupported") },
    { find: "api", replacement: path.resolve(root, "src/api") },

    // Legacy aliases retained while the source tree is cleaned up.
    { find: "global", replacement: path.resolve(root, "src/global") },
    { find: "math", replacement: path.resolve(root, "src/global/math") },
    { find: "utils", replacement: path.resolve(root, "src/global/utils") },
    { find: "engine", replacement: path.resolve(root, "src/global/engine") },
    { find: "constant", replacement: path.resolve(root, "src/global/constant") }
];

function plugins()
{
    return [
        alias({ entries }),
        nodeResolve({
            browser: true,
            extensions: [ ".mjs", ".js", ".json" ]
        }),
        json(),
        checkImportCasing(),
        lintSources(),
        commonjs(),
        babel({
            babelHelpers: "bundled",
            extensions: [ ".js" ],
            exclude: /node_modules[\\/](?!@carbonenginejs[\\/])/,
            configFile: path.resolve(root, ".babelrc")
        })
    ];
}

function output(file, extra = {})
{
    return {
        file,
        format: "umd",
        name: "CCPWGL2",
        exports: "named",
        // runtime-audio lazily imports the wem reader with a dynamic import;
        // a single-file UMD build must inline it or rollup refuses the format.
        inlineDynamicImports: true,
        footer: "if (typeof globalThis !== 'undefined' && globalThis.CCPWGL2) Object.assign(globalThis, globalThis.CCPWGL2);",
        sourcemap: false,
        freeze: false,
        ...extra
    };
}

export default [
    {
        input: "src/index.js",
        output: output("dist/ccpwgl2_int.js"),
        plugins: plugins(),
        treeshake: false
    },
    {
        input: "src/index.js",
        output: output("dist/ccpwgl2_int.min.js", {
            plugins: [
                terser({
                    format: {
                        comments: false
                    }
                })
            ]
        }),
        plugins: plugins(),
        treeshake: false
    }
];
