const path = require("path");

module.exports = {
    mode: "production",
    target: "web",
    devtool: "source-map",
    entry: "./src/index.js",
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "dist"),
    },
};
