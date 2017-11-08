
let _rootPath = window.location.pathname.indexOf('/designer') === -1 ? window.location.pathname : window.location.pathname.substring(0, window.location.pathname.indexOf('/designer'))

_rootPath = _rootPath[_rootPath.length - 1] === '/' ? _rootPath.substring(0, _rootPath.length - 1) : _rootPath

export let initializeListeners = []
export let readyListeners = []

export let componentTypes = {}
export let componentTypesDefinition = {}

export let toolbarComponents = {
  generalCommands: []
}

export let apiHeaders = {}

export const rootPath = _rootPath

export let extensions = []
