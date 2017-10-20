import React from 'react'
import ReactDOM from 'react-dom'
import { useStrict, toJS } from 'mobx';
import { Provider } from 'mobx-react';
import componentRegistry from '@local/shared/componentRegistry'
import * as configuration from './lib/configuration.js'
import defaults from './configurationDefaults.js'
import createStores from './mobx/create'
import { createDesigner } from './Designer'
import App from './App'
import './index.css'

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
window.observableToJS = toJS

const start = async () => {
  await Promise.all([
    Designer.api.get('/api/componentTypes').then((compTypes) => {
      Object.keys(compTypes).forEach((compName) => {
        configuration.componentTypesDefinition[compName] = compTypes[compName]
      })
    })
  ])

  let componentsToLoad = []

  Object.keys(configuration.componentTypesDefinition).forEach((compName) => {
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

  componentRegistry.loadComponents(componentsToLoad)

  // create a default design at the start
  actions.designsActions.add()
  actions.editorActions.openDesign(stores.designsStore.designs.keys()[0])

  for (const key in Designer.initializeListeners) {
    await Designer.initializeListeners[key]()
  }

  ReactDOM.render(
    <Provider {...stores} {...actions}>
      <App />
    </Provider>,
    document.getElementById('root')
  )

  for (const key in Designer.readyListeners) {
    await Designer.readyListeners[key]()
  }
}

start()
