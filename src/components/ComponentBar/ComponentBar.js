import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import omit from 'lodash/omit'
import groupBy from 'lodash/groupBy'
import ComponentBarItem from './ComponentBarItem'
import styles from './ComponentBar.scss'

class ComponentBar extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {}

    this.ensureInitialPositionOfComponentBarItem = this.ensureInitialPositionOfComponentBarItem.bind(this)
    this.cleanInitialPositionOfComponentBarItem = this.cleanInitialPositionOfComponentBarItem.bind(this)
    this.cloneComponentBarItem = this.cloneComponentBarItem.bind(this)
    this.keepComponentBarItemCloneAspect = this.keepComponentBarItemCloneAspect.bind(this)
    this.removeComponentBarItemClone = this.removeComponentBarItemClone.bind(this)
    this.onItemDragStart = this.onItemDragStart.bind(this)
    this.onItemDragEnd = this.onItemDragEnd.bind(this)
  }

  componentDidMount () {
    this.initialComponentBarScroll = this.componentBar.scrollTop
  }

  collapse (collectionId) {
    this.setState({ [collectionId]: !this.state[collectionId] })
  }

  ensureInitialPositionOfComponentBarItem (ev) {
    let componentBarItem

    // don't recalculate the initial value if we are dragging still
    if (
      this.componentBarItemClone != null
    ) {
      return
    }

    componentBarItem = ev.target

    this.initialTopComponentBarItemClone = componentBarItem.getBoundingClientRect().top
  }

  cleanInitialPositionOfComponentBarItem () {
    // don't clean the value if we are dragging still
    if (this.componentBarItemClone != null) {
      return
    }

    this.initialTopComponentBarItemClone = null
  }

  keepComponentBarItemCloneAspect (ev) {
    let componentBar = ev.target
    let scrollDifference

    // if we are not dragging only recalculate the initial scroll on scroll
    if (this.componentBarItemClone == null) {
      this.initialComponentBarScroll = componentBar.scrollTop
      return
    }

    // while dragging and scrolling keep the aspect of dragged component relative in the viewport
    scrollDifference = (componentBar.scrollTop - this.initialComponentBarScroll)
    this.componentBarItemReplacement.style.top = `${this.initialTopComponentBarItemClone - scrollDifference}px`
  }

  /**
   * Clone the dragged ComponentBarItem an insert a
   * replacement in the same position
   */
  cloneComponentBarItem (node) {
    let { top, left, width, height } = node.getBoundingClientRect()
    let componentBarItemClone = node.cloneNode(true)

    // recalculate position and scroll when dragging starts
    this.initialTopComponentBarItemClone = top
    this.initialComponentBarScroll = this.componentBar.scrollTop

    this.componentBarItemReplacement.style.display = 'block'
    this.componentBarItemReplacement.style.top = `${top}px`
    this.componentBarItemReplacement.style.left = `${left}px`
    this.componentBarItemReplacement.style.width = `${width}px`
    this.componentBarItemReplacement.style.height = `${height}px`

    componentBarItemClone.dataset.draggingPlaceholder = true

    this.componentBarItemClone = componentBarItemClone
    this.componentBarItemReplacement.appendChild(componentBarItemClone)
  }

  /**
   * Remove the ComponentBarItem replacement when dragging has finished
   */
  removeComponentBarItemClone () {
    this.componentBarItemReplacement.style.display = 'none'

    if (this.componentBarItemClone) {
      this.componentBarItemReplacement.removeChild(this.componentBarItemClone)
      this.componentBarItemClone = null
      this.initialTopComponentBarItemClone = null
      this.initialComponentBarScroll = null
    }
  }

  groupAndSortComponents (components) {
    let componentsByGroup = groupBy(components, 'group')
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

  onItemDragStart (componentType, node) {
    this.cloneComponentBarItem(node)

    if (this.props.onItemDragStart) {
      return this.props.onItemDragStart(componentType)
    }

    return {}
  }

  onItemDragEnd (componentType) {
    this.removeComponentBarItemClone()

    if (this.props.onItemDragEnd) {
      return this.props.onItemDragEnd(componentType)
    }
  }

  renderComponentCollection ({ collection, components }) {
    let collectionId

    if (collection == null) {
      collectionId = 'ComponentsGroupStandard'

      return (
        <div key={collectionId} className={styles.componentBarComponentList}>
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
        className={styles.componentBarComponentList}
      >
        <div
          className={styles.componentBarComponentGroup}
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
      <ul className={`${styles.componentBarComponentList} ${collapsed ? ' ' + styles.collapsed : ''}`}>
        {components.map(componentType => (
          <li key={componentType.name} className={styles.componentBarComponentContainer}>
            <div>
              <ComponentBarItem
                onMouseOver={this.ensureInitialPositionOfComponentBarItem}
                onMouseLeave={this.cleanInitialPositionOfComponentBarItem}
                onDragStart={this.onItemDragStart}
                onDragEnd={this.onItemDragEnd}
                componentType={componentType}
              />
            </div>
          </li>
        ))}
      </ul>
    )
  }

  render () {
    const {
      componentCollection
    } = this.props

    return (
      <div
        ref={(el) => { this.componentBar = el }}
        className={styles.componentBar}
        onScroll={this.keepComponentBarItemCloneAspect}
      >
        {this.groupAndSortComponents(componentCollection).map((group) => {
          return this.renderComponentCollection(group)
        })}
        {/* placeholder for the ComponentBarItem replacement while dragging */}
        <div
          draggable='false'
          key='ComponentBarItem-replacement'
          ref={(el) => { this.componentBarItemReplacement = el }}
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

ComponentBar.propTypes = {
  componentCollection: PropTypes.array.isRequired,
  onItemDragStart: PropTypes.func,
  onItemDragEnd: PropTypes.func
}

export default ComponentBar
