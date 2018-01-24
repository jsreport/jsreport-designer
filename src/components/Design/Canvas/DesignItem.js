import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { DropTarget } from 'react-dnd'
import Selection from './Selection'
import DesignComponent from '../../DesignComponent'
import getConsumedColsFromWidth from '../../../helpers/getConsumedColsFromWidth'
import { ComponentDragTypes } from '../../../Constants'
import styles from '../../../../static/DesignElements.css'
import interactiveStyles from './DesignElementsInteractive.scss'

const itemTarget = {
  hover (props, monitor, component) {
    const { item, onDragOver } = props

    if (monitor.isOver({ shallow: true })) {
      const clientOffset = monitor.getClientOffset()
      let elementBehind = document.elementFromPoint(clientOffset.x, clientOffset.y)
      let componentBehind

      if (
        elementBehind &&
        elementBehind.dataset &&
        elementBehind.dataset.jsreportComponentId != null &&
        elementBehind.dataset.jsreportInteractiveComponent === 'true'
      ) {
        const {
          top,
          left,
          width,
          height
        } = elementBehind.getBoundingClientRect()

        componentBehind = {
          id: elementBehind.dataset.jsreportComponentId,
          dimensions: {
            top,
            left,
            width,
            height
          }
        }
      }

      onDragOver({
        element: item,
        componentBehind
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
    this.setComponentReplacementNode = this.setComponentReplacementNode.bind(this)
    this.setSelectionNode = this.setSelectionNode.bind(this)
    this.cloneComponent = this.cloneComponent.bind(this)
    this.removeComponentClone = this.removeComponentClone.bind(this)
    this.focusSelection = this.focusSelection.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleResizeStart = this.handleResizeStart.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.handleResizeEnd = this.handleResizeEnd.bind(this)
    this.handleComponentClick = this.handleComponentClick.bind(this)
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

  setComponentReplacementNode (el) {
    this.componentReplacementNode = el
  }

  setSelectionNode (el) {
    this.selectionNode = el
  }

  cloneComponent (componentNode) {
    let designItemDimensions = this.node.getBoundingClientRect()
    let { top, left, width, height } = componentNode.getBoundingClientRect()
    let componentClone = componentNode.cloneNode(true)

    this.componentReplacementNode.style.display = 'block'
    this.componentReplacementNode.style.top = `${top - designItemDimensions.top}px`
    this.componentReplacementNode.style.left = `${left - designItemDimensions.left}px`
    this.componentReplacementNode.style.width = `${width}px`
    this.componentReplacementNode.style.height = `${height}px`

    componentClone.dataset.draggingPlaceholder = true

    this.componentClone = componentClone
    this.componentReplacementNode.appendChild(componentClone)
  }

  removeComponentClone () {
    if (this.componentReplacementNode) {
      this.componentReplacementNode.style.display = 'none'
    }

    if (this.componentClone) {
      if (this.componentReplacementNode) {
        this.componentReplacementNode.removeChild(this.componentClone)
      } else {
        this.componentClone.parentNode && this.componentClone.parentNode.removeChild(this.componentClone)
      }

      this.componentClone = null
    }
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
    if (this.props.item.selected === true) {
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

  handleComponentClick (ev, componentId) {
    const { design, setSelection } = this.props

    // stop progagation of component click
    ev.preventDefault()
    ev.stopPropagation()

    setSelection(design.id, componentId)

    setTimeout(() => this.focusSelection(), 0)
  }

  handleComponentDragStart (component, componentRef) {
    const { design, item, clearSelection } = this.props
    const { colWidth } = design
    let componentDimensions
    let componentConsumedCols
    let consumedCols

    this.cloneComponent(componentRef.node)

    clearSelection(design.id)

    componentDimensions = componentRef.node.getBoundingClientRect()

    componentConsumedCols = getConsumedColsFromWidth({
      baseColWidth: colWidth,
      width: componentDimensions.width
    })

    // if the item containing the component only has one component
    // then preserve design item size in the target
    if (item.components.length === 1) {
      consumedCols = (item.end - item.start) + 1
    } else {
      consumedCols = componentConsumedCols
    }

    return {
      id: component.id,
      name: component.type,
      props: component.props,
      bindings: component.bindings,
      rawContent: componentRef.instance.getRawContent(),
      size: {
        width: componentDimensions.width,
        height: componentDimensions.height
      },
      consumedCols,
      componentConsumedCols,
      canvas: {
        group: item.parent.id,
        item: item.id,
        component: component.id
      }
    }
  }

  handleComponentDragEnd () {
    this.removeComponentClone()
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
            component={component}
            onClick={this.handleComponentClick}
            onDragStart={this.handleComponentDragStart}
            onDragEnd={this.handleComponentDragEnd}
          />
        ))}
        {/* placeholder for the DesignComponent replacement while dragging */}
        <div
          draggable='false'
          key='DesignComponent-replacement'
          ref={this.setComponentReplacementNode}
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
  clearSelection: PropTypes.func.isRequired,
  removeComponent: PropTypes.func.isRequired,
  resizeElement: PropTypes.func.isRequired,
  startResizeElement: PropTypes.func.isRequired,
  endResizeElement: PropTypes.func.isRequired,
  getContainerDimensions: PropTypes.func.isRequired
}

export default inject((injected) => ({
  design: injected.design,
  getContainerDimensions: injected.getCanvasDimensions,
  onDragOver: injected.onDragOver,
  setSelection: injected.designsActions.setSelection,
  clearSelection: injected.designsActions.clearSelection,
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
