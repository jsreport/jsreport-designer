import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { useStrict, toJS } from 'mobx';
import { Provider } from 'mobx-react';
import zipObject from 'lodash/zipObject'
import fetchExtensions from './lib/fetchExtensions'
import componentRegistry from '../shared/componentRegistry'
import * as configuration from './lib/configuration.js'
import defaults from './configurationDefaults.js'
import createStores from './mobx/create'
import connectToEmbedderApp from './connectToEmbedderApp'
import { createDesigner } from './Designer'
import App from './components/App'
import './theme/style.scss'

const mobxStoreExport = {}
let Designer
let AppHMRContainer

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

if (__DEVELOPMENT__) {
  // expose utility for debugging observables
  window.observableToJS = toJS

  // require the App container used to help HMR component source files
  AppHMRContainer = require('./components/AppHMRContainer').default

  // init the setup required to HMR the component source files
  require('./initComponentsSourceHMR').default({
    getComponentsToLoad,
    render,
    mobxStoreExport
  })
}

init()

async function init () {
  const embedderApp = connectToEmbedderApp()

  // only try to connect if we have detected an embedder app
  if (embedderApp) {
    const initialData = await embedderApp.initialize()

    configuration.embedding.app = embedderApp

    start(initialData)
  } else {
    // designer is opened in its main url, start it normally
    start()
  }
}

async function start (initialData) {
  let customDataInputStoreDefaults = {}

  if (initialData != null && initialData.data != null) {
    customDataInputStoreDefaults.value = initialData.data
  }

  if (initialData != null && initialData.design != null && initialData.design.computedFields != null) {
    customDataInputStoreDefaults.computedFields = initialData.design.computedFields
  }

  const storeExport = createStores(Object.assign({}, storesDefaults, {
    dataInputStore: customDataInputStoreDefaults
  }))

  mobxStoreExport.stores = storeExport.stores
  mobxStoreExport.actions = storeExport.actions

  Designer = window.Designer = createDesigner(mobxStoreExport.stores)

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
  mobxStoreExport.actions.designsActions.add({ definition: initialData != null ? initialData.design : undefined })
  mobxStoreExport.actions.editorActions.openDesign(mobxStoreExport.stores.designsStore.designs.keys()[0])

  render({
    stores: mobxStoreExport.stores,
    actions: mobxStoreExport.actions
  })

  for (const key in Designer.readyListeners) {
    await Designer.readyListeners[key]()
  }
}

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

function render ({ stores, actions }) {
  if (AppHMRContainer) {
    ReactDOM.render(
      <Provider {...stores} {...actions}>
        <AppHMRContainer>
          <App />
        </AppHMRContainer>
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
