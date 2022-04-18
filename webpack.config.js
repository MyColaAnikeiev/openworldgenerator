const path = require('path');


module.exports = {
    mode: "development",
    devtool: 'eval-source-map',
    entry: path.resolve(__dirname,"src/index.ts"),
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist")
    },
    module: {
        rules: [
            {   
                test: /.tsx?$/,
                loader: 'ts-loader'
            },
            {
                test: /.css$/,
                use: [
                    { 
                        loader: "style-loader"
                    }, 
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            },
            {
                test: /.scss$/i,
                use: [
                    {
                        loader: 'sass-loader',
                        options: {
                            implementation: require("sass")
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    }
}
