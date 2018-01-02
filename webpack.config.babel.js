import path from 'path';
import webpack from 'webpack';
import autoprefixer from 'autoprefixer';

export default () => ({
  entry: {
    app: ['./client'],
    vendor: ['babel-polyfill', 'jquery', 'jquery-ujs', 'popper.js', 'bootstrap'],
  },
  output: {
    path: path.join(__dirname, 'public', 'assets'),
    filename: 'application.js',
    publicPath: '/assets/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
/*       {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader', // Run post css actions
            options: {
              plugins: [
                autoprefixer({
                    browsers:["> 1%", "last 2 versions"]
                })
              ]
            },
          },
        ],
      }, */
      {
        test: /\.(scss)$/,
        use: [{
          loader: 'style-loader', // inject CSS to page
        }, {
          loader: 'css-loader', // translates CSS into CommonJS modules
          options: {
            // sourceMap: true
          }
        }, {
          loader: 'postcss-loader', // Run post css actions
          options: {
            plugins: [
              autoprefixer({
                browsers: ["> 1%", "last 2 versions"],
                sourceMap: true
              })
            ]
          },
        }, {
          loader: 'sass-loader',
          options: {
/*               includePaths: [
                  helpers.root('src', 'styles', 'global'),
              ], */
            sourceMap: true
          }
        }],
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['popper.js', 'default'],
    }),
    new webpack.optimize.CommonsChunkPlugin({
      // This name 'vendor' ties into the entry definition
      name: 'vendor',
      // We don't want the default vendor.js name
      filename: 'vendor.js',
      // Passing Infinity just creates the commons chunk, but moves no modules into it.
      // In other words, we only put what's in the vendor entry definition in vendor-bundle.js
      minChunks: Infinity,
    }),
  ],
});
