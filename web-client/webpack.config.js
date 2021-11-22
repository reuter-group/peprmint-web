const HtmlWebPackPlugin = require("html-webpack-plugin");
const path = require('path');

module.exports = {
    entry: "./src/code/main.ts",
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        // publicPath: '/peprmint',
      },

    mode: "development",
    resolve: {
        modules: [
            path.join(__dirname, 'node_modules')
        ],
        fallback: {
          "fs": false
         },
        extensions: [".ts", ".tsx", ".js"]
    },

    devServer: {
        historyApiFallback: true,
    },
    
    module: {
        rules: [
            {
                test: /\.html$/,
                use: { loader: "html-loader" }
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.(scss)$/,
                use: [{
                  // inject CSS to page
                  loader: 'style-loader'
                }, {
                  // translates CSS into CommonJS modules
                  loader: 'css-loader'
                }, {
                //   // Run postcss actions
                //   loader: 'postcss-loader',
                //   options: {
                //     // `postcssOptions` is needed for postcss 8.x;
                //     // if you use postcss 7.x skip the key
                //     postcssOptions: {
                //       // postcss plugins, can be exported to postcss.config.js
                //       plugins: function () {
                //         return [
                //           require('autoprefixer')
                //         ];
                //       }
                //     }
                //   }
                // }, {
                  // compiles Sass to CSS
                  loader: 'sass-loader'
                }]
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /.*\.(gif|png|jpe?g|svg)$/i,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: 'image/[name]_[hash:7].[ext]',
                    }
                }
            }, {
                test: /.*\.csv$/i,
                use: {
                        loader: 'file-loader',
                        options: {
                            name: "datasets/[name].[ext]",
                            emitFile: true,
                        },
                    },
                
            }   

        ]

    },

    plugins: [
        new HtmlWebPackPlugin({ favicon: './src/image/favicon.svg', template: "./src/index.html", filename: "./index.html" }),
        new HtmlWebPackPlugin({ template: "./src/index.html", filename: "./pepr2vis/index.html" }),
    ],

    performance: { hints: false },
    // watch: true,
    devtool: "source-map"

};
