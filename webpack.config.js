const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    entry: './src/js/index.js',
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'js/[name].[contenthash].js',
      clean: true,
      publicPath: '/'
    },
    
    devtool: isDevelopment ? 'source-map' : false,
    
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      hot: true,
      port: 9000,
      host: '0.0.0.0',
      allowedHosts: 'all',
      client: {
        webSocketURL: {
          hostname: '0.0.0.0',
          pathname: '/ws',
          port: 9000,
          protocol: 'ws'
        },
        overlay: {
          warnings: false,
          errors: true
        }
      },
      compress: true,
      historyApiFallback: true,
      open: false
    },
    
    module: {
      rules: [
        // JavaScript
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        
        // SCSS/CSS
        {
          test: /\.scss$/,
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  silenceDeprecations: ['legacy-js-api']
                }
              }
            }
          ]
        },
        
        // Images
        {
          test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'images/[hash][ext][query]'
          }
        },
        
        // Fonts
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[hash][ext][query]'
          }
        }
      ]
    },
    
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        minify: !isDevelopment
      }),
      new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash].css'
      })
    ],
    
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10
          }
        }
      }
    },
    
    performance: {
      hints: false
    }
  };
};
