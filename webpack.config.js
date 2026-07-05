/* eslint-env node */

const
    path = require("path"),
    TerserPlugin = require("terser-webpack-plugin"),
    ProgressBarPlugin = require("progress-bar-webpack-plugin");

module.exports = {

    mode: "development",

    context: path.resolve(__dirname, "./src"),

    entry: {
        "ccpwgl2_int": "./index.js",
        "ccpwgl2_int.min": "./index.js"
    },

    performance: {
        maxEntrypointSize: 2000000,
        maxAssetSize: 2000000
    },

    devtool: "none",

    resolve: {
        alias: {
            "core": path.resolve(__dirname, "./src/core"),
            "curve": path.resolve(__dirname, "./src/curve"),
            "eve": path.resolve(__dirname, "./src/eve"),
            "interior": path.resolve(__dirname, "./src/interior"),
            "particle": path.resolve(__dirname, "./src/particle"),
            "sof": path.resolve(__dirname, "./src/sof"),
            "state": path.resolve(__dirname, "./src/state"),
            "wrapped": path.resolve(__dirname, "./src/wrapped"),
            "unsupported": path.resolve(__dirname, "./src/unsupported"),

            // We'll fix these later
            "global" : path.resolve(__dirname, "./src/global"),
            "math": path.resolve(__dirname, "./src/global/math"),
            "utils": path.resolve(__dirname, "./src/global/utils"),
            "engine": path.resolve(__dirname, "./src/global/engine"),
            "constant": path.resolve(__dirname, "./src/global/constant")
        }
    },

    optimization: {
        minimize: false,
    },

    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: "[name].js",
        //library: "CCPWGL",
        libraryTarget: "umd"
    },

    plugins: [
        new ProgressBarPlugin(),
        new TerserPlugin({
            include: /\.min\.js$/,
            terserOptions: {
                output: {
                    comments: false
                }
            }
        })
    ],

    module: {
        rules: [
            {
                enforce: "pre",
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "eslint-loader",
                options: {
                    "fix": true
                }
            },
            {
                test: /\.js$/,
                // @carbonenginejs/* packages ship modern syntax (private
                // class fields) and must be transpiled like first-party
                // source; everything else in node_modules is left alone.
                exclude: /node_modules\/(?!@carbonenginejs)/,
                loader: "babel-loader",
                options: {
                    // Babel's .babelrc lookup stops at package boundaries,
                    // so node_modules/@carbonenginejs packages (each their
                    // own package root) would otherwise be parsed with no
                    // config at all. Force this project's config onto them.
                    configFile: path.resolve(__dirname, ".babelrc")
                }
            }
        ]
    }
};

