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
    { find: "wrapped", replacement: path.resolve(root, "src/wrapped") },
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
