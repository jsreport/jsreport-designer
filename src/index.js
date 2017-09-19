import React from 'react'
import ReactDOM from 'react-dom'
import Designer from './Designer'
import './index.css'
const componentRegistry = require('./shared/componentRegistry')

function getRegisteredComponents () {
  // ajax request here...
  // (for now the objets here should match the properties passed
  // to .registerComponent in lib/designer)
  return [
    {
      id: 1,
      name: 'Text',
      icon: 'font',
      propsMeta: {
        text: {
          allowsRichContent: true
        }
      }
    },
    {
      id: 2,
      name: 'Image',
      icon: 'image'
    },
    {
      id: 3,
      name: 'Products-Map',
      icon: 'map',
      collection: 'Group1'
    },
    {
      id: 4,
      name: 'Pie-Chart',
      icon: 'pie-chart',
      collection: 'Group2'
    },
    {
      id: 5,
      name: 'QR',
      icon: 'qrcode',
      collection: 'Group2'
    },
    {
      id: 6,
      name: 'User-Info',
      icon: 'address-card',
      collection: 'Group2'
    }
  ]
}

componentRegistry.loadComponents(getRegisteredComponents()).then(() => {
  ReactDOM.render(
    <Designer />,
    document.getElementById('root')
  )
})
