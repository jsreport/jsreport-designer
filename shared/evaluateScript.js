
const vm = require('vm')

function getSingleExport (fn) {
  const sandbox = {}

  try {
    vm.runInNewContext(`
      function evaluateSingleExport () {
        return (
          ${fn}
        );
      }
    `, sandbox)

    return sandbox.evaluateSingleExport()
  } catch (err) {
    throw new Error(`Error while trying to evaluate single export. ${err.message}`)
  }
}

module.exports = {
  getSingleExport
}
