
const rewireForMobX = require('react-app-rewire-mobx');

module.exports = (config, env) => {
  // enabling decorators for mobx
  config = rewireForMobX(config, env);

  return config;
}
