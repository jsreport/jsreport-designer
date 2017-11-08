import { rootPath } from './lib/configuration'

// expose root path to the webpack hot client entry
Object.defineProperty(window, '__root_path__', {
    value: rootPath,
    writable: false
});

// the only purpose of this file is to set the publicPath for webpack assets.
// it is a ES module to ensure that it is loaded by webpack in the right order
// and it is referenced at first entry file (webpack config) in our bundle.
__webpack_public_path__ = rootPath + '/designer/assets/'
