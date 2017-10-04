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
      id: '1',
      name: 'Text',
      icon: 'font',
      propsMeta: {
        text: {
          allowsRichContent: true,
          allowedBindingValueTypes: ['scalar']
        }
      }
    },
    {
      id: '2',
      name: 'Image',
      icon: 'image',
      propsMeta: {
        url: {
          allowedBindingValueTypes: ['scalar']
        },
        width: {
          allowedBindingValueTypes: ['scalar']
        },
        height: {
          allowedBindingValueTypes: ['scalar']
        }
      }
    },
    {
      id: '3',
      name: 'Table',
      icon: 'table',
      propsMeta: {
        data: {
          allowedBindingValueTypes: ['array']
        },
        columns: {
          properties: {
            name: {
              allowedBindingValueTypes: ['scalar']
            },
            value: {
              allowedBindingValueTypes: ['scalar']
            }
          }
        }
      }
    },
    {
      id: '4',
      name: 'Products-Map',
      icon: 'map',
      collection: 'Group1'
    },
    {
      id: '5',
      name: 'Pie-Chart',
      icon: 'pie-chart',
      collection: 'Group2'
    },
    {
      id: '6',
      name: 'QR',
      icon: 'qrcode',
      collection: 'Group2'
    },
    {
      id: '7',
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
