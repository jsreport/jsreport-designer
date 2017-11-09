import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Provider, observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { DropTarget } from 'react-dnd'
import throttle from 'lodash/throttle'
import { ComponentDragTypes } from '../../../Constants'
import DesignContainer from './DesignContainer'
import styles from './Canvas.scss'

const canvasTarget = {
  hover (props, monitor, component) {
    const { design, onDragOver } = props

    if (!monitor.isOver()) {
      component.dragOverContext = null

      // first time hover
      if (props.onDragEnter) {
        props.onDragEnter({
          dragType: monitor.getItemType(),
          draggedEl: monitor.getItem(),
          initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
          initialClientOffset: monitor.getInitialClientOffset(),
          clientOffset: monitor.getClientOffset()
        })
      }
    }

    let dragOverContext = component.dragOverContext

    if (monitor.isOver({ shallow: true }) || !onDragOver || !dragOverContext) {
      return
    }

    let { element: designElement, groupDimensions } = dragOverContext
    let targetCanvas

    if (!designElement) {
      return
    }

    if (designElement.elementType === 'group') {
      targetCanvas = {
        group: design.canvasRegistry.get(designElement.id).index
      }
    } else if (designElement.elementType === 'item') {
      targetCanvas = {
        group: design.canvasRegistry.get(designElement.parent.id).index,
        item: design.canvasRegistry.get(designElement.id).index
      }
    }

    if (targetCanvas != null) {
      targetCanvas.groupDimensions = groupDimensions
    }

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
    const { design } = props
    const hasDroppedOnChild = monitor.didDrop();

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
          group: design.canvasRegistry.get(designElement.id).index
        }
      } else if (designElement.elementType === 'item') {
        targetCanvas = {
          group: design.canvasRegistry.get(designElement.parent.id).index,
          item: design.canvasRegistry.get(designElement.id).index
        }
      }

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

    this.draggingTimeout = null
    this.dragOverContext = null

    // it is important to throttle the launching of the event to avoid having a
    // bad experience while dragging
    this.handleDragOver = throttle(
      this.handleDragOver.bind(this),
      100,
      { leading: true }
    )
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

  handleDragOver (dragOverContext) {
    // ensuring that "onDragOver" is not being fired when
    // isDraggingOver is not true in Canvas.
    // this scenario is possible just because we are throttling the original
    // event and because of that we can have possible race conditions
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

    if (!isDraggingOver && canDrop) {
      extraProps['data-dragging'] = true
    }

    if (isDraggingOver && canDrop) {
      extraProps['data-can-drop'] = true
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
            onDragOver={this.handleDragOver}
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
  connectDropTarget: PropTypes.func.isRequired,
  canDrop: PropTypes.bool.isRequired,
  isDraggingOver: PropTypes.bool.isRequired,
  onClick: PropTypes.func,
  onDragEnter: PropTypes.func,
  onDragOver: PropTypes.func,
  onDragLeave: PropTypes.func,
  onDragEnd: PropTypes.func,
  onDrop: PropTypes.func
}

export default inject((injected) => ({
  updateDesign: injected.designsActions.update
}))(
  DropTarget([
    ComponentDragTypes.COMPONENT_BAR,
    ComponentDragTypes.COMPONENT,
  ], canvasTarget, collect)(Canvas)
)
