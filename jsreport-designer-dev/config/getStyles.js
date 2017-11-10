
const flexbugsFixes = require('postcss-flexbugs-fixes')
const autoprefixer = require('autoprefixer')

module.exports = function getStyles ({ modulesEnabled, processor } = {}) {
  let loaders = [{
    loader: 'style-loader',
    options: {
      sourceMap: modulesEnabled === true || processor != null
    }
  }]

  if (modulesEnabled === true) {
    loaders.push({
      loader: 'css-loader',
      options: {
        modules: true,
        localIdentName: '[local]___[hash:base64:5]',
        sourceMap: true,
        importLoaders: processor != null ? 2 : 1
      }
    })
  } else {
    loaders.push({
      loader: 'css-loader',
      options: {
        sourceMap: processor != null,
        importLoaders: processor != null ? 2 : 1
      }
    })
  }

  loaders.push({
    loader: 'postcss-loader',
    options: {
      sourceMap: modulesEnabled === true || processor != null,
      // webpack requires an identifier to support all cases
      ident: 'postcss',
      plugins: () => [
        flexbugsFixes,
        autoprefixer
      ]
    }
  })

  if (processor === 'sass') {
    loaders.push({
      loader: 'sass-loader',
      options: {
        sourceMap: true,
        outputStyle: 'expanded'
      }
    })
  } else if (processor === 'less') {
    loaders.push({
      loader: 'less-loader',
      options: {
        sourceMap: true,
        outputStyle: 'expanded'
      }
    })
  }

  return loaders
}
