import path from "path";
import { fileURLToPath } from "url";
import alias from "@rollup/plugin-alias";
import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

const root = path.dirname(fileURLToPath(import.meta.url));

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

    // Legacy aliases kept in sync with webpack while the source tree is cleaned up.
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
        commonjs(),
        babel({
            babelHelpers: "bundled",
            extensions: [ ".js" ],
            exclude: "node_modules/**"
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
        sourcemap: false,
        freeze: false,
        ...extra
    };
}

export default [
    {
        input: "src/index.js",
        output: output("dist/rollup/ccpwgl2_int.js"),
        plugins: plugins(),
        treeshake: false
    },
    {
        input: "src/index.js",
        output: output("dist/rollup/ccpwgl2_int.min.js", {
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
