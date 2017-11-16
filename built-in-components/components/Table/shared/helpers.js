
module.exports = () => ({
  isObject (value) {
    return typeof value === 'object' && !Array.isArray(value)
  }
})
