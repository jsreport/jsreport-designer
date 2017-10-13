import React from 'react'
import ReactDOM from 'react-dom'
import componentRegistry from '@local/shared/componentRegistry'
import * as configuration from './lib/configuration.js'
import defaults from './configurationDefaults.js'
import { createDesigner } from './Designer'
import App from './App'
import './index.css'

let Designer

defaults()

Designer = window.Designer = createDesigner()

const start = async () => {
  // await fetchExtensions()

  // const extensionsArray = await Designer.api.get('/api/extensions')
  // configuration.extensions = zipObject(extensionsArray.map((e) => e.name), extensionsArray)

  await Promise.all([
    Designer.api.get('/api/componentTypes').then((compTypes) => {
      Object.keys(compTypes).forEach((compName) => configuration.componentTypesDefinition[compName] = compTypes[compName])
    })
  ])

  let componentsToLoad = []

  Object.keys(configuration.componentTypesDefinition).map((compName) => {
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

  for (const key in Designer.initializeListeners) {
    await Designer.initializeListeners[key]()
  }

  ReactDOM.render(
    <App />,
    document.getElementById('root')
  )

  for (const key in Designer.readyListeners) {
    await Designer.readyListeners[key]()
  }
}

start()
