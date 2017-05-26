import React, { Component } from 'react'
import omit from 'lodash/omit'
import groupBy from 'lodash/groupBy'
import ComponentBarItem from './ComponentBarItem'
import './ComponentBar.css'

const COMPONENTS = [
  {
    id: 1,
    name: 'Text',
    icon: 'font',
    props: {
      text: 'Sample text'
    }
  },
  {
    id: 2,
    name: 'Image',
    icon: 'image',
    props: {
      url: 'http://www.euneighbours.eu/sites/default/files/2017-01/placeholder.png',
      width: '138.34px',
      height: '87.83px'
    }
  },
  {
    id: 3,
    name: 'Pie-Chart',
    icon: 'pie-chart',
    collection: 'Group2',
    props: {}
  },
  {
    id: 4,
    name: 'QR',
    icon: 'qrcode',
    collection: 'Group2',
    props: {}
  },
  {
    id: 5,
    name: 'Products-Map',
    icon: 'map',
    collection: 'Group1',
    props: {}
  },
  {
    id: 6,
    name: 'User-Info',
    icon: 'address-card',
    collection: 'Group2',
    props: {}
  }
]

class ComponentBar extends Component {
  constructor (props) {
    super(props)

    this.state = {}
  }

  collapse (collectionId) {
    this.setState({ [collectionId]: !this.state[collectionId] })
  }

  groupAndSortComponents (components) {
    let componentsByGroup = groupBy(components, 'collection')
    let standardComponents = componentsByGroup['undefined'] || []
    let groupsOrdered = Object.keys(omit(componentsByGroup, ['undefined'])).sort()

    let componentsInGroups = groupsOrdered.reduce((acu, group) => {
      acu.push({
        collection: group,
        components: componentsByGroup[group]
      })

      return acu
    }, [])

    return [{ collection: undefined, components: standardComponents }, ...componentsInGroups]
  }

  renderComponentCollection({ collection, components }) {
    let collectionId

    if (collection == null) {
      collectionId = 'ComponentsGroupStandard'

      return (
        <ul key={collectionId} className="ComponentBar-component-list">
          {components.map(comp => (
            <li key={comp.id} className="ComponentBar-component-container">
              <ComponentBarItem component={comp} />
            </li>
          ))}
        </ul>
      )
    }

    collectionId = 'ComponentsGroup-' + collection

    return (
      <div key={collectionId} className="ComponentBar-component-list">
        <div
          className="ComponentBar-component-group"
          onClick={() => this.collapse(collectionId)}
        >
          <span>
            <span className={'fa fa-' + (this.state[collectionId] ? 'plus-square' : 'minus-square')} />
            &nbsp;
            <i>{collection}</i>
          </span>
        </div>
        <ul className={'ComponentBar-component-list' + (this.state[collectionId] ? ' collapsed' : '')}>
          {components.map(comp => (
            <li key={comp.id} className="ComponentBar-component-container">
              <ComponentBarItem component={comp} />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  render () {
    const components = COMPONENTS

    return (
      <div className="ComponentBar">
        {this.groupAndSortComponents(components).map((group) => {
          return this.renderComponentCollection(group)
        })}
      </div>
    )
  }
}

export default ComponentBar
