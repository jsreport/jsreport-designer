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
    defaultSize: {
      width: 100,
      height: 100
    },
    props: {
      text: 'Sample text'
    }
  },
  {
    id: 2,
    name: 'Image',
    icon: 'image',
    defaultSize: {
      width: 100,
      height: 100
    },
    props: {
      url: 'http://www.euneighbours.eu/sites/default/files/2017-01/placeholder.png',
      width: '100px',
      height: '100px'
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

    this.ensureInitialPositionOfComponentItem = this.ensureInitialPositionOfComponentItem.bind(this)
    this.cleanInitialPositionOfComponentItem = this.cleanInitialPositionOfComponentItem.bind(this)
    this.cloneComponentItem = this.cloneComponentItem.bind(this)
    this.keepComponentItemCloneAspect = this.keepComponentItemCloneAspect.bind(this)
    this.removeComponentItemClone = this.removeComponentItemClone.bind(this)
  }

  componentDidMount () {
    this.initialComponentBarScroll = this.componentBar.scrollTop
  }

  collapse (collectionId) {
    this.setState({ [collectionId]: !this.state[collectionId] })
  }

  ensureInitialPositionOfComponentItem (ev) {
    let componentItem

    // don't recalculate the initial value if we are dragging still
    if (
      this.componentItemClone != null
    ) {
      return
    }

    componentItem = ev.target

    this.initialTopComponentItemClone = componentItem.getBoundingClientRect().top
  }

  cleanInitialPositionOfComponentItem () {
    // don't clean the value if we are dragging still
    if (this.componentItemClone != null) {
      return
    }

    this.initialTopComponentItemClone = null
  }

  keepComponentItemCloneAspect (ev) {
    let componentBar = ev.target
    let scrollDifference

    // if we are not dragging only recalculate the initial scroll on scroll
    if (this.componentItemClone == null) {
      this.initialComponentBarScroll = componentBar.scrollTop
      return
    }

    // while dragging and scrolling keep the aspect of dragged component relative in the viewport
    scrollDifference = (componentBar.scrollTop - this.initialComponentBarScroll)
    this.componentItemReplacement.style.top = `${this.initialTopComponentItemClone - scrollDifference}px`
  }

  /**
   * Clone the dragged ComponentBarItem an insert a
   * replacement in the same position
   */
  cloneComponentItem (node) {
    let { top, left, width, height } = node.getBoundingClientRect()
    let componentItemClone = node.cloneNode(true)

    // recalculate position and scroll when dragging starts
    this.initialTopComponentItemClone = top
    this.initialComponentBarScroll = this.componentBar.scrollTop

    this.componentItemReplacement.style.display = 'block'
    this.componentItemReplacement.style.top = `${top}px`
    this.componentItemReplacement.style.left = `${left}px`
    this.componentItemReplacement.style.width = `${width}px`
    this.componentItemReplacement.style.height = `${height}px`

    // NOTE: this color should be equal to background color of ComponentBarItem on hover
    componentItemClone.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'
    componentItemClone.style.color = 'inherit'
    componentItemClone.style.opacity = '0.7'

    this.componentItemClone = componentItemClone
    this.componentItemReplacement.appendChild(componentItemClone)
  }

  /**
   * Remove the ComponentBarItem replacement when dragging has finished
   */
  removeComponentItemClone () {
    this.componentItemReplacement.style.display = 'none'

    if (this.componentItemClone) {
      this.componentItemReplacement.removeChild(this.componentItemClone)
      this.componentItemClone = null
      this.initialTopComponentItemClone = null
      this.initialComponentBarScroll = null
    }
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
        <div key={collectionId} className="ComponentBar-component-list">
          {this.renderComponentBarList({
            collapsed: false,
            components
          })}
        </div>
      )
    }

    collectionId = 'ComponentsGroup-' + collection

    return (
      <div
        key={collectionId}
        className="ComponentBar-component-list"
      >
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
        {this.renderComponentBarList({
          collapsed: this.state[collectionId],
          components
        })}
      </div>
    )
  }

  renderComponentBarList ({ components, collapsed }) {
    return (
      <ul className={'ComponentBar-component-list' + (collapsed ? ' collapsed' : '')}>
        {components.map(comp => (
          <li key={comp.id} className="ComponentBar-component-container">
            <ComponentBarItem
              onMouseOver={this.ensureInitialPositionOfComponentItem}
              onMouseLeave={this.cleanInitialPositionOfComponentItem}
              onDragStart={this.cloneComponentItem}
              onDragEnd={this.removeComponentItemClone}
              component={comp}
            />
          </li>
        ))}
      </ul>
    )
  }

  render () {
    const components = COMPONENTS

    return (
      <div
        ref={(el) => this.componentBar = el}
        className="ComponentBar"
        onScroll={this.keepComponentItemCloneAspect}
      >
        {this.groupAndSortComponents(components).map((group) => {
          return this.renderComponentCollection(group)
        })}
        {/* placeholder for the ComponentBarItem replacement while dragging */}
        <div
          draggable="false"
          key='ComponentItem-replacement'
          ref={(el) => this.componentItemReplacement = el}
          style={{
            display: 'none',
            pointerEvents: 'none',
            position: 'fixed'
          }}
        />
      </div>
    )
  }
}

export default ComponentBar
