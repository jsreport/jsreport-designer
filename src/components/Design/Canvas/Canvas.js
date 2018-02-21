import React, { Component } from 'react'
import PropTypes from 'prop-types'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { Provider, observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { DropTarget } from 'react-dnd'
import getConsumedColsFromWidth from '../../../helpers/getConsumedColsFromWidth'
import { ComponentDragTypes } from '../../../Constants'
import DesignContainer from './DesignContainer'
import styles from './Canvas.scss'

const canvasTarget = {
  hover (props, monitor, component) {
    const searchComponentBehind = component.searchComponentBehind
    const { onDragOver } = props
    const clientOffset = monitor.getClientOffset()

    if (!monitor.isOver()) {
      component.dragOverContext = null

      // first time hover
      if (props.onDragEnter) {
        props.onDragEnter({
          dragType: monitor.getItemType(),
          draggedEl: monitor.getItem(),
          initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
          initialClientOffset: monitor.getInitialClientOffset(),
          clientOffset
        })
      }

      return
    }

    let dragOverContext = component.dragOverContext

    if (monitor.isOver({ shallow: true }) || !onDragOver || !dragOverContext) {
      return
    }

    let { element: designElement } = dragOverContext
    let targetCanvas

    if (!designElement) {
      return
    }

    if (designElement.elementType === 'group') {
      targetCanvas = {
        group: designElement.id,
        groupDimensions: document.getElementById(designElement.id).getBoundingClientRect()
      }
    } else if (designElement.elementType === 'item') {
      targetCanvas = {
        group: designElement.parent.id,
        groupDimensions: document.getElementById(designElement.parent.id).getBoundingClientRect(),
        item: designElement.id,
        itemDimensions: document.getElementById(designElement.id).getBoundingClientRect(),
        componentBehind: searchComponentBehind(false, clientOffset.x, clientOffset.y)
      }
    } else if (designElement.elementType === 'fragment') {
      targetCanvas = {
        fragment: designElement.id,
        instance: dragOverContext.instance,
        instanceDimensions: dragOverContext.instanceNode.getBoundingClientRect(),
        componentBehind: searchComponentBehind(true, clientOffset.x, clientOffset.y)
      }
    }

    targetCanvas.elementType = designElement.elementType

    onDragOver({
      dragType: monitor.getItemType(),
      draggedEl: monitor.getItem(),
      targetCanvas: targetCanvas,
      initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
      initialClientOffset: monitor.getInitialClientOffset(),
      clientOffset: monitor.getClientOffset()
    })
  },

  drop (props, monitor, component) {
    const hasDroppedOnChild = monitor.didDrop()

    let dropResult = {
      dragType: monitor.getItemType(),
      draggedEl: monitor.getItem(),
      clientOffset: monitor.getClientOffset()
    }

    if (!props.onDrop) {
      return
    }

    if (hasDroppedOnChild) {
      let { element: designElement } = monitor.getDropResult()
      let targetCanvas

      if (designElement.elementType === 'group') {
        targetCanvas = {
          group: designElement.id
        }
      } else if (designElement.elementType === 'item') {
        targetCanvas = {
          group: designElement.parent.id,
          item: designElement.id
        }
      } else if (designElement.elementType === 'fragment') {
        targetCanvas = {
          fragment: designElement.id
        }
      }

      targetCanvas.elementType = designElement.elementType

      dropResult.targetCanvas = targetCanvas

      return props.onDrop(dropResult)
    }

    props.onDrop(dropResult)
  }
}

function collect (connect, monitor) {
  return {
    dragType: monitor.getItemType(),
    draggedEl: monitor.getItem(),
    connectDropTarget: connect.dropTarget(),
    isDraggingOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  }
}

@observer
class Canvas extends Component {
  constructor (props) {
    super(props)

    this.setNode = this.setNode.bind(this)
    this.getCanvasDimensions = this.getCanvasDimensions.bind(this)
    this.searchComponentBehind = this.searchComponentBehind.bind(this)

    this.draggingTimeout = null
    this.dragOverContext = null
    this.componentClone = null

    this.handleDragStart = this.handleDragStart.bind(this)
    this.handleDragOver = this.handleDragOver.bind(this)
    this.handleDragEnd = this.handleDragEnd.bind(this)
  }

  componentDidMount () {
    const { design, updateDesign } = this.props
    updateDesign(design.id, { isCanvasReady: true })
  }

  componentWillReceiveProps (nextProps) {
    const { design, updateDesign } = nextProps

    if (this.props.canDrop === false && nextProps.canDrop === true) {
      clearTimeout(this.draggingTimeout)

      // show the grid lines a little bit later
      this.draggingTimeout = setTimeout(() => {
        updateDesign(design.id, { gridLinesRemarked: true })
      }, 100)
    } else if (this.props.canDrop === true && nextProps.canDrop === false) {
      clearTimeout(this.draggingTimeout)

      updateDesign(design.id, { gridLinesRemarked: false })
    }

    if (this.props.draggedEl && nextProps.draggedEl && this.props.draggedEl.id === nextProps.draggedEl.id) {
      if (
        (this.props.isDraggingOver === true && !nextProps.isDraggingOver) &&
        // ensure that we don't fire the event when dropping
        // (when dropping, canDrop changes to false)
        (this.props.canDrop === true && nextProps.canDrop === true)
      ) {
        nextProps.onDragLeave && nextProps.onDragLeave({
          dragType: nextProps.dragType,
          draggedEl: nextProps.draggedEl
        })
      }
    }

    if (this.props.draggedEl && !nextProps.draggedEl) {
      this.dragOverContext = null

      nextProps.onDragEnd && nextProps.onDragEnd({
        dragType: this.props.dragType,
        draggedEl: this.props.draggedEl
      })
    }
  }

  setNode (el) {
    this.node = el
    this.props.nodeRef(el)
  }

  getCanvasDimensions () {
    return this.node.getBoundingClientRect()
  }

  searchComponentBehind (fromFragment, x, y) {
    let elementBehind = document.elementFromPoint(x, y)
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
        id: fromFragment ? elementBehind.id : elementBehind.dataset.jsreportComponentId,
        dimensions: {
          top,
          left,
          width,
          height
        }
      }
    }

    return componentBehind
  }

  cloneComponent ({ containerNode, snapshootCloneContainerNode, componentNode }) {
    const containerDimensions = containerNode.getBoundingClientRect()
    const { top, left, width, height } = componentNode.getBoundingClientRect()
    const componentClone = componentNode.cloneNode(true)

    snapshootCloneContainerNode.style.display = 'block'
    snapshootCloneContainerNode.style.top = `${top - containerDimensions.top}px`
    snapshootCloneContainerNode.style.left = `${left - containerDimensions.left}px`
    snapshootCloneContainerNode.style.width = `${width}px`
    snapshootCloneContainerNode.style.height = `${height}px`

    componentClone.dataset.draggingPlaceholder = true

    this.componentClone = componentClone
    snapshootCloneContainerNode.appendChild(componentClone)
  }

  removeComponentClone ({ snapshootCloneContainerNode }) {
    if (snapshootCloneContainerNode) {
      snapshootCloneContainerNode.style.display = 'none'
    }

    if (this.componentClone) {
      if (snapshootCloneContainerNode) {
        snapshootCloneContainerNode.removeChild(this.componentClone)
      } else {
        this.componentClone.parentNode && this.componentClone.parentNode.removeChild(this.componentClone)
      }

      this.componentClone = null
    }
  }

  handleDragStart ({
    parentElement,
    component,
    componentRef,
    containerNode,
    snapshootCloneContainerNode
  }) {
    const { design, clearSelection } = this.props
    const { colWidth } = design
    const componentNode = componentRef.node
    let componentDimensions
    let componentConsumedCols
    let consumedCols
    let canvasPayload

    this.cloneComponent({
      containerNode,
      snapshootCloneContainerNode,
      componentNode
    })

    clearSelection(design.id)

    componentDimensions = componentNode.getBoundingClientRect()

    componentConsumedCols = getConsumedColsFromWidth({
      baseColWidth: colWidth,
      width: componentDimensions.width
    })

    if (parentElement.elementType === 'item') {
      // if the item containing the component only has one component
      // then preserve design item size in the target
      if (parentElement.components.length === 1) {
        consumedCols = (parentElement.end - parentElement.start) + 1
      } else {
        consumedCols = componentConsumedCols
      }

      canvasPayload = {
        group: parentElement.parent.id,
        item: parentElement.id,
        component: component.id
      }
    } else if (parentElement.elementType === 'fragment') {
      consumedCols = componentConsumedCols

      canvasPayload = {
        fragment: parentElement.id,
        component: component.id
      }
    } else {
      throw new Error(`"parent ${parentElement.elementType}" element type is not supported to start a drag`)
    }

    // when dragging from component we just need to pass rawContent
    return {
      id: component.id,
      name: component.type,
      rawContent: componentRef.instance.getRawContent(),
      size: {
        width: componentDimensions.width,
        height: componentDimensions.height
      },
      consumedCols,
      componentConsumedCols,
      canvas: canvasPayload
    }
  }

  handleDragOver (dragOverContext) {
    // ensuring that "onDragOver" is not being fired when
    // isDraggingOver is not true in Canvas.
    // this scenario is possible just because we are throttling the calls to this event and
    // because of that we can have possible race conditions
    // between "onDragLeave", "onDragEnd" and "onDragOver"
    if (!this.props.isDraggingOver) {
      return
    }

    let context = this.dragOverContext || {}

    if (!dragOverContext) {
      return
    }

    context = {
      ...context,
      ...dragOverContext
    }

    this.dragOverContext = context
  }

  handleDragEnd ({ snapshootCloneContainerNode }) {
    this.removeComponentClone({ snapshootCloneContainerNode })
  }

  render () {
    const {
      design,
      connectDropTarget,
      isDraggingOver,
      canDrop,
      onClick
    } = this.props

    const { baseWidth, gridLinesRemarked } = design

    let canvasStyles = {
      width: baseWidth + 'px'
    }

    let extraProps = {}

    if (canDrop) {
      extraProps['data-dragging'] = true
    }

    if (!isDraggingOver && canDrop) {
      extraProps['data-dragging-not-over'] = true
    }

    if (isDraggingOver && canDrop) {
      extraProps['data-dragging-over'] = true
    }

    if (gridLinesRemarked) {
      extraProps['data-grid-lines-remarked'] = true
    }

    return connectDropTarget(
      <div
        ref={this.setNode}
        className={styles.canvas}
        style={canvasStyles}
        onClick={onClick}
        {...extraProps}
      >
        {design.isCanvasReady && (
          <Provider
            design={design}
            onDragStart={this.handleDragStart}
            onDragOver={this.handleDragOver}
            onDragEnd={this.handleDragEnd}
            getCanvasDimensions={this.getCanvasDimensions}
          >
            <DesignContainer />
          </Provider>
        )}
      </div>
    )
  }
}

Canvas.propTypes = {
  nodeRef: PropTypes.func,
  design: MobxPropTypes.observableObject.isRequired,
  draggedEl: PropTypes.any,
  dragType: PropTypes.string,
  connectDropTarget: PropTypes.func.isRequired,
  canDrop: PropTypes.bool.isRequired,
  isDraggingOver: PropTypes.bool.isRequired,
  updateDesign: PropTypes.func.isRequired,
  clearSelection: PropTypes.func.isRequired,
  onClick: PropTypes.func,
  onDragEnter: PropTypes.func,
  onDragOver: PropTypes.func,
  onDragLeave: PropTypes.func,
  onDragEnd: PropTypes.func,
  onDrop: PropTypes.func
}

export default inject((injected) => ({
  updateDesign: injected.designsActions.update,
  clearSelection: injected.designsActions.clearSelection
}))(
  DropTarget([
    ComponentDragTypes.COMPONENT_BAR,
    ComponentDragTypes.COMPONENT
  ], canvasTarget, collect)(Canvas)
)
