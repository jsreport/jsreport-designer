import React from 'react'
import ReactDOM from 'react-dom'
import Designer from './Designer'
import './index.css'
const componentRegistry = require('./shared/componentRegistry')

function getRegisteredComponents () {
  // ajax request here...
  return [{ name: 'Text' }, { name: 'Image' }]
}

componentRegistry.loadComponents(getRegisteredComponents()).then(() => {
  ReactDOM.render(
    <Designer />,
    document.getElementById('root')
  )
})
