module.exports = {
    entry: './index.jsx',
    output: {
        filename: 'bundle.js',
    },
    module: {
        loaders: [
            {
                // tell webpack to use babel for all *.jsx files
                test: /\.jsx$/,
                loader: 'babel-loader'
            }
        ]
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    }
};
