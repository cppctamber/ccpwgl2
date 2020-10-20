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
            "global": path.resolve(__dirname, "./src/global"),
            "eve": path.resolve(__dirname, "./src/eve"),
            "interior": path.resolve(__dirname, "./src/interior"),
            "particle": path.resolve(__dirname, "./src/particle"),
            "sof": path.resolve(__dirname, "./src/sof"),
            "state": path.resolve(__dirname, "./src/state"),
            "wrapped": path.resolve(__dirname, "./src/wrapped"),
            "math": path.resolve(__dirname, "./src/global/math"),
            "utils": path.resolve(__dirname, "./src/global/utils"),
            "constant": path.resolve(__dirname, "./src/global/constant")
        }
    },

    optimization: {
        minimize: false,
    },

    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: "[name].js",
        //library: "ccpwgl_int",
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
                exclude: [ /node_modules/ ],
                loader: "babel-loader"
            }
        ]
    }
};

