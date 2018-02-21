import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { DropTarget } from 'react-dnd'
import Selection from './Selection'
import DesignComponent from '../../DesignComponent'
import { ComponentDragTypes } from '../../../Constants'
import styles from '../../../../static/DesignElements.css'
import interactiveStyles from './DesignElementsInteractive.scss'

const itemTarget = {
  hover (props, monitor) {
    const { item, onDragOver } = props

    if (!monitor.isOver()) {
      return
    }

    if (monitor.isOver({ shallow: true })) {
      onDragOver({
        element: item
      })
    }
  },

  drop (props, monitor) {
    const { item } = props

    if (monitor.didDrop()) {
      return undefined
    }

    return { element: item }
  }
}

function collect (connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isDraggingOver: monitor.isOver()
  }
}

@observer
class DesignItem extends Component {
  constructor (props) {
    super(props)

    this.setNode = this.setNode.bind(this)
    this.setComponentSnapshootCloneContainerNode = this.setComponentSnapshootCloneContainerNode.bind(this)
    this.setSelectionNode = this.setSelectionNode.bind(this)
    this.focusSelection = this.focusSelection.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleResizeStart = this.handleResizeStart.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.handleResizeEnd = this.handleResizeEnd.bind(this)
    this.handleComponentDragStart = this.handleComponentDragStart.bind(this)
    this.handleComponentDragEnd = this.handleComponentDragEnd.bind(this)
  }

  componentDidMount () {
    if (this.props.item.selected === true) {
      this.focusSelection()
    }
  }

  componentDidUpdate (prevProps) {
    // after resizing, focus again
    if (prevProps.item.isResizing === true && this.props.item.isResizing === false) {
      this.focusSelection()
    }

    // when selecting an item again, give focus back
    if (prevProps.item.selected === false && this.props.item.selected === true) {
      this.focusSelection()
    }
  }

  getWidthInPercentage ({ numberOfCols, consumedCols }) {
    return 100 / (numberOfCols / consumedCols)
  }

  setNode (el) {
    this.node = el
  }

  setComponentSnapshootCloneContainerNode (el) {
    this.componentSnapshootCloneContainerNode = el
  }

  setSelectionNode (el) {
    this.selectionNode = el
  }

  focusSelection () {
    // in order for key events to work, the selection box must be focused
    if (this.selectionNode) {
      findDOMNode(this.selectionNode).focus()
    }
  }

  handleKeyDown (ev) {
    const { design, item, removeComponent } = this.props

    ev.preventDefault()
    ev.stopPropagation()

    if (item.isResizing) {
      return
    }

    // when backspace or del key is pressed remove the component
    if (ev.keyCode === 8 || ev.keyCode === 46) {
      removeComponent(
        design.id,
        design.selection[design.selection.length - 1],
        { select: true }
      )
    }
  }

  handleClick (ev) {
    const target = ev.target
    const { design, setSelection } = this.props

    if (target.dataset.jsreportComponent && target.dataset.jsreportComponentId) {
      // here we handle component click in item click (through event delegation)
      const componentId = target.dataset.jsreportComponentId

      // stop progagation of component click
      ev.preventDefault()
      ev.stopPropagation()

      setSelection(design.id, componentId)

      setTimeout(() => this.focusSelection(), 0)
    } else if (this.props.item.selected === true) {
      // stop progagation of click when the item is selected
      // this is necessary to prevent cleaning the selection
      ev.preventDefault()
      ev.stopPropagation()
    }
  }

  handleResizeStart (ev, direction) {
    const {
      design,
      item,
      startResizeElement,
      getContainerDimensions
    } = this.props

    const node = this.node

    startResizeElement(design.id, item.id, {
      direction,
      x: ev.clientX,
      y: ev.clientY,
      containerDimensions: getContainerDimensions(),
      elementDimensions: node.getBoundingClientRect()
    })
  }

  handleResize (ev, direction) {
    const { design, item, resizeElement } = this.props

    resizeElement(design.id, item.id, {
      direction,
      x: ev.clientX,
      y: ev.clientY
    })
  }

  handleResizeEnd (ev, direction) {
    const { design, item, endResizeElement } = this.props

    ev.preventDefault()
    ev.stopPropagation()

    endResizeElement(design.id, item.id)
  }

  handleComponentDragStart (component, componentRef) {
    const { item, onDragStart } = this.props

    return onDragStart({
      parentElement: item,
      component,
      componentRef,
      containerNode: this.node,
      snapshootCloneContainerNode: this.componentSnapshootCloneContainerNode
    })
  }

  handleComponentDragEnd () {
    const { onDragEnd } = this.props

    onDragEnd({
      snapshootCloneContainerNode: this.componentSnapshootCloneContainerNode
    })
  }

  render () {
    const {
      layoutMode,
      connectDropTarget,
      isDraggingOver,
      item,
      design
    } = this.props

    const { numberOfCols } = design
    const { selected, leftSpace, space, components, isResizing } = item

    let extraProps = {}
    let itemStyles = {}

    if (isResizing) {
      itemStyles.opacity = 0.5
    }

    if (layoutMode === 'grid') {
      itemStyles.width = `${this.getWidthInPercentage({ numberOfCols, consumedCols: space })}%`

      if (leftSpace != null) {
        itemStyles.marginLeft = `${this.getWidthInPercentage({ numberOfCols, consumedCols: leftSpace })}%`
      }
    } else {
      itemStyles.width = `${space}px`

      if (leftSpace != null) {
        itemStyles.marginLeft = `${leftSpace}px`
      }
    }

    extraProps[`data-layout-${layoutMode}-mode`] = true

    if (selected === true) {
      extraProps['data-selected'] = true
    }

    if (isDraggingOver) {
      extraProps['data-dragging-over'] = true
    }

    return connectDropTarget(
      <div
        ref={this.setNode}
        id={item.id}
        className={`${styles.designItem} ${interactiveStyles.designItemInteractive}`}
        style={itemStyles}
        {...extraProps}
        onClick={this.handleClick}
      >
        {selected && (
          <Selection
            key='selection'
            ref={this.setSelectionNode}
            element={item}
            onKeyDown={this.handleKeyDown}
            onResizeStart={this.handleResizeStart}
            onResize={this.handleResize}
            onResizeEnd={this.handleResizeEnd}
          />
        )}
        {components.map((component, index) => (
          <DesignComponent
            // type is in key because we want the component to re-mount if type
            // is changed
            key={`${component.type}-${component.id}`}
            source={component}
            onDragStart={this.handleComponentDragStart}
            onDragEnd={this.handleComponentDragEnd}
          />
        ))}
        {/* placeholder for the DesignComponent replacement while dragging */}
        <div
          draggable='false'
          key='design-component-snapshoot-clone-container'
          ref={this.setComponentSnapshootCloneContainerNode}
          data-design-component-snapshoot-clone-container
          style={{
            display: 'none',
            pointerEvents: 'none',
            position: 'absolute'
          }}
        />
      </div>
    )
  }
}

DesignItem.propTypes = {
  design: MobxPropTypes.observableObject.isRequired,
  item: MobxPropTypes.observableObject.isRequired,
  layoutMode: PropTypes.string.isRequired,
  onComponentDragStart: PropTypes.func,
  connectDropTarget: PropTypes.func.isRequired,
  isDraggingOver: PropTypes.bool.isRequired,
  setSelection: PropTypes.func.isRequired,
  removeComponent: PropTypes.func.isRequired,
  resizeElement: PropTypes.func.isRequired,
  startResizeElement: PropTypes.func.isRequired,
  endResizeElement: PropTypes.func.isRequired,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  getContainerDimensions: PropTypes.func.isRequired
}

export default inject((injected) => ({
  design: injected.design,
  getContainerDimensions: injected.getCanvasDimensions,
  onDragStart: injected.onDragStart,
  onDragOver: injected.onDragOver,
  onDragEnd: injected.onDragEnd,
  setSelection: injected.designsActions.setSelection,
  removeComponent: injected.designsActions.removeComponent,
  startResizeElement: injected.designsActions.startResizeElement,
  resizeElement: injected.designsActions.resizeElement,
  endResizeElement: injected.designsActions.endResizeElement
}))(
  DropTarget([
    ComponentDragTypes.COMPONENT_BAR,
    ComponentDragTypes.COMPONENT
  ], itemTarget, collect)(DesignItem)
)
