import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import deepForceUpdate from 'react-deep-force-update'
import { useStrict, toJS } from 'mobx';
import { Provider } from 'mobx-react';
import zipObject from 'lodash/zipObject'
import fetchExtensions from './lib/fetchExtensions'
import componentRegistry from '../shared/componentRegistry'
import * as configuration from './lib/configuration.js'
import defaults from './configurationDefaults.js'
import createStores from './mobx/create'
import { createDesigner } from './Designer'
import App from './components/App'
import './theme/style.scss'

let Designer

defaults()

// enabling the strict mode of Mobx, which means that store updates must happens
// only inside "actions" functions
useStrict(true)

const storesDefaults = {
  editorStore: {
    /*
      base width and base height depends on the target paper format
      A4 -> 980px width, with a factor of 1.414 aprox for height
    */
    defaultBaseWidth: 980,
    defaultRowHeight: 78,
    defaultNumberOfRows: 7,
    defaultNumberOfCols: 12,
    defaultLayoutMode: 'grid'
  }
}

const { stores, actions } = createStores(storesDefaults)

Designer = window.Designer = createDesigner(stores)

// expose utility for debugging
if (__DEVELOPMENT__) {
  const mitt = require('mitt')

  window.observableToJS = toJS

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

    render()
  })
}

class AppContainer extends Component {
  componentWillReceiveProps() {
    // Force-update the whole tree when hot reloading, including
    // components that refuse to update.
    deepForceUpdate(this)
  }

  render() {
    return this.props.children
  }
}

const start = async () => {
  await fetchExtensions()

  const extensionsArray = await Designer.api.get('/api/extensions')
  const extensions = zipObject(extensionsArray.map((e) => e.name), extensionsArray)

  Object.keys(extensions).forEach(extName => configuration.extensions[extName] = extensions[extName])

  await Promise.all([
    Designer.api.get('/api/componentTypes').then((compTypes) => {
      Object.keys(compTypes).forEach((compName) => {
        configuration.componentTypesDefinition[compName] = compTypes[compName]
      })
    })
  ])

  let componentsToLoad = getComponentsToLoad(Object.keys(configuration.componentTypesDefinition))

  componentRegistry.loadComponents(componentsToLoad)

  for (const key in Designer.initializeListeners) {
    await Designer.initializeListeners[key]()
  }

  // create a default design at the start
  actions.designsActions.add()
  actions.editorActions.openDesign(stores.designsStore.designs.keys()[0])

  render()

  for (const key in Designer.readyListeners) {
    await Designer.readyListeners[key]()
  }
}

start()

function getComponentsToLoad (componentsTypes) {
  let componentsToLoad = []

  componentsTypes.forEach((compName) => {
    let compDef = configuration.componentTypesDefinition[compName]

    if (configuration.componentTypes[compDef.name] != null) {
      componentsToLoad.push(
        Object.assign(
          {},
          compDef,
          { module: configuration.componentTypes[compDef.name].module }
        )
      )
    }
  })

  return componentsToLoad
}

function render () {
  if (__DEVELOPMENT__) {
    ReactDOM.render(
      <Provider {...stores} {...actions}>
        <AppContainer>
          <App />
        </AppContainer>
      </Provider>,
      document.getElementById('root')
    )
  } else {
    ReactDOM.render(
      <Provider {...stores} {...actions}>
        <App />
      </Provider>,
      document.getElementById('root')
    )
  }
}
