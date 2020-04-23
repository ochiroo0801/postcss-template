const currentTask = process.env.npm_lifecycle_event;
const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const fse = require("fs-extra");

class ExtractIMG {
  apply(compiler) {
    compiler.hooks.done.tap("Copy images", function () {
      fse.copySync("./src/img", "./docs/img");
    });
  }
}

let cssConfig = {
  test: /\.css$/i,
  use: [
    "css-loader",
    {
      loader: "postcss-loader",
      options: {
        plugins: [
          require("postcss-import"),
          require("postcss-mixins"),
          require("postcss-simple-vars"),
          require("postcss-nested"),
          require("autoprefixer"),
          require("cssnano"),
        ],
      },
    },
  ],
};

let pages = fse
  .readdirSync("./src")
  .filter(function (file) {
    return file.endsWith(".html");
  })
  .map(function (page) {
    return new HtmlWebpackPlugin({
      filename: page,
      template: `./src/${page}`,
    });
  });

let config = {
  entry: "./src/bundled.js",
  plugins: pages,
  module: {
    rules: [cssConfig],
  },
};

if (currentTask == "dev") {
  cssConfig.use.unshift("style-loader");
  config.output = {
    path: path.resolve(__dirname, "src"),
    filename: "bundled.js",
  };

  config.mode = "development";

  config.devServer = {
    before: function (app, server) {
      server._watch("./src/**/*.html");
    },
    contentBase: path.join(__dirname, "src"),
    hot: true,
    port: 3000,
    host: "0.0.0.0",
  };
}

if (currentTask == "build") {
  config.module.rules.push({
    test: /\.js$/,
    exclude: /(node_modules)/,
    use: {
      loader: "babel-loader",
      options: {
        presets: ["@babel/preset-env"],
      },
    },
  });
  cssConfig.use.unshift(MiniCssExtractPlugin.loader);
  config.output = {
    path: path.resolve(__dirname, "docs"),
    filename: "[name].[chunkhash].js",
    chunkFilename: "[name].[chunkhash].js",
  };

  config.mode = "production";

  config.optimization = {
    splitChunks: { chunks: "all" },
  };

  config.plugins.push(
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({ filename: "styles.[chunkhash].css" }),
    new ExtractIMG()
  );
}

module.exports = config;
