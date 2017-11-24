import mitt from 'mitt'
import componentRegistry from '../shared/componentRegistry'
import * as configuration from './lib/configuration.js'

export default ({ getComponentsToLoad, render, mobxStoreExport }) => {
  if (!window.__designer_components_hmr__) {
    Object.defineProperty(window, '__designer_components_hmr__', {
      value: mitt(),
      writable: false
    })
  }

  // hot reload of component files
  window.__designer_components_hmr__.on('designerComponentFileHMR', (componentChanged) => {

    let compName = componentChanged.name
    let compModule = componentChanged.module
    let componentsToReload

    // first delete cache for changed component type (all components of this type will refreshed)
    if (componentRegistry.componentsCache[compName]) {
      Object.keys(componentRegistry.componentsCache[compName]).forEach((compId) => {
        componentRegistry.componentsCache[compName][compId] = undefined
      })
    }

    // then update `configuration.componentTypes`
    if (configuration.componentTypes[compName]) {
      configuration.componentTypes[compName].module = compModule
    }

    componentsToReload = getComponentsToLoad([compName])

    // reload components in registry
    componentRegistry.loadComponents(componentsToReload, true)

    render({ stores: mobxStoreExport.stores, actions: mobxStoreExport.actions })
  })
}
