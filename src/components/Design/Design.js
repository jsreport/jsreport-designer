import React, { Component } from 'react'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import PropTypes from 'prop-types'
import memoize from 'lodash/memoize'
import { ComponentDragTypes } from '../../Constants'
import Canvas from './Canvas'
import styles from './Design.scss'

@inject((injected) => ({
  clearSelection: injected.designsActions.clearSelection,
  highlightAreaFromDrag: injected.designsActions.highlightAreaFromDrag,
  clearHighlightArea: injected.designsActions.clearHighlightArea,
  addOrRemoveComponentFromDrag: injected.designsActions.addOrRemoveComponentFromDrag
}))
@observer
class Design extends Component {
  constructor (props) {
    super(props)

    this.handleCanvasClick = this.handleCanvasClick.bind(this)
    this.handleCanvasDrop = this.handleCanvasDrop.bind(this)
    this.handleCanvasDragLeave = this.handleCanvasDragLeave.bind(this)
    this.handleCanvasDragEnd = this.handleCanvasDragEnd.bind(this)

    // memoizing the calculation, only update when the cursor offset has changed
    this.handleCanvasDragOver = memoize(
      this.handleCanvasDragOver.bind(this),
      ({ clientOffset }) => {
        return clientOffset.x + ',' + clientOffset.y
      }
    )
  }

  handleCanvasClick () {
    const { design, clearSelection } = this.props

    // clear design selection when canvas is clicked,
    // the selection is not clear if the click was inside a component
    // because component's click handler prevent the click event to be propagated to the parent
    if (design.selection != null) {
      clearSelection(design.id)
    }
  }

  handleCanvasDragOver (dragPayload) {
    const { design, highlightAreaFromDrag } = this.props

    if (dragPayload) {
      highlightAreaFromDrag(design.id, dragPayload)
    }
  }

  handleCanvasDragLeave () {
    const { design, clearHighlightArea } = this.props

    clearHighlightArea(design.id)
  }

  handleCanvasDragEnd () {
    const { design, clearHighlightArea } = this.props

    clearHighlightArea(design.id)
  }

  handleCanvasDrop (dropPayload) {
    const { design, clearHighlightArea, addOrRemoveComponentFromDrag } = this.props
    const { groups, highlightedArea } = design
    const { dragType, draggedEl, targetCanvas } = dropPayload

    let shouldProcessComponent = (
      highlightedArea != null &&
      !highlightedArea.conflict &&
      highlightedArea.filled
    )

    if (!shouldProcessComponent) {
      return
    }

    if (dragType === ComponentDragTypes.COMPONENT && targetCanvas.item != null) {
      let targetDesignItem = groups[targetCanvas.group].items[targetCanvas.item]

      // process the component if there is a change in group/item or position
      shouldProcessComponent = (
        (draggedEl.canvas.group !== targetCanvas.group &&
        draggedEl.canvas.item !== targetCanvas.item) ||
        (highlightedArea.end > targetDesignItem.end ||
        highlightedArea.start < targetDesignItem.start)
      )
    }

    clearHighlightArea(design.id)

    if (!shouldProcessComponent) {
      return
    }

    addOrRemoveComponentFromDrag(design.id, {
      ...dropPayload,
      start: highlightedArea.start,
      end: highlightedArea.end
    }, { select: true })
  }

  render () {
    const { design, canvasRef } = this.props

    return (
      <div className={styles.design}>
        <Canvas
          nodeRef={canvasRef}
          design={design}
          onClick={this.handleCanvasClick}
          onDragOver={this.handleCanvasDragOver}
          onDragLeave={this.handleCanvasDragLeave}
          onDragEnd={this.handleCanvasDragEnd}
          onDrop={this.handleCanvasDrop}
        />
      </div>
    )
  }
}

Design.wrappedComponent.propTypes = {
  canvasRef: PropTypes.func,
  design: MobxPropTypes.observableObject.isRequired,
  clearSelection: PropTypes.func.isRequired,
  highlightAreaFromDrag: PropTypes.func.isRequired,
  clearHighlightArea: PropTypes.func.isRequired,
  addOrRemoveComponentFromDrag: PropTypes.func.isRequired
}

export default Design
