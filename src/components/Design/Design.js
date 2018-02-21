import React, { Component } from 'react'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import PropTypes from 'prop-types'
import throttle from 'lodash/throttle'
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

    // it is important to throttle the launching of the event to avoid having a
    // bad experience while dragging
    this.handleCanvasDragOver = throttle(
      this.handleCanvasDragOver.bind(this),
      100,
      { leading: true, trailing: false }
    )

    // memoizing the calculation, only update when the cursor offset has changed
    this.showHighlight = memoize(
      this.showHighlight.bind(this),
      (designId, dragPayload) => {
        const cache = this.showHighlight.cache
        const { clientOffset, targetCanvas } = dragPayload
        let key

        if (targetCanvas.elementType === 'fragment') {
          key = `${targetCanvas.fragment}${
            targetCanvas.componentBehind != null ? '(with component)/' : ''
          }${clientOffset.x},${clientOffset.y}`
        } else {
          key = `${
            targetCanvas.group != null ? targetCanvas.group + '/' : ''
          }${
            targetCanvas.item != null ? targetCanvas.item + '/' : ''
          }${
            targetCanvas.componentBehind != null ? '(with component)/' : ''
          }${clientOffset.x},${clientOffset.y}`
        }

        // keeping the memoize cache in just one item
        if (
          this.previousHighlightKey != null &&
          this.previousHighlightKey !== key
        ) {
          cache.clear()
        }

        this.previousHighlightKey = key

        return key
      }
    )
  }

  showHighlight (designId, dragPayload) {
    const { highlightAreaFromDrag } = this.props

    highlightAreaFromDrag(designId, dragPayload)
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
    const { showHighlight } = this
    const { design } = this.props

    if (dragPayload) {
      showHighlight(design.id, dragPayload)
    }
  }

  handleCanvasDragLeave () {
    const { design, clearHighlightArea } = this.props

    clearHighlightArea(design.id)
  }

  handleCanvasDragEnd () {
    const { design, clearHighlightArea } = this.props
    const { showHighlight } = this

    this.previousHighlightKey = null

    if (showHighlight.cache) {
      showHighlight.cache.clear()
    }

    clearHighlightArea(design.id)
  }

  handleCanvasDrop (dropPayload) {
    const { design, clearHighlightArea, addOrRemoveComponentFromDrag } = this.props
    const { highlightedArea } = design
    const { dragType, draggedEl, targetCanvas } = dropPayload
    let shouldProcessComponent = false

    if (targetCanvas == null) {
      return clearHighlightArea(design.id)
    }

    if (
      targetCanvas.elementType !== 'fragment' &&
      dragType === ComponentDragTypes.COMPONENT &&
      targetCanvas.item == null &&
      highlightedArea.item != null
    ) {
      // if there is an inconsistence about item detection, don't let it pass
      // `targetCanvas.item` is what is detected from dnd events and
      // `highlightedArea.item` is what is detected using custom logic and math
      // so both values should be the same if item is detected as empty in dnd
      shouldProcessComponent = false
    } else if (targetCanvas.elementType !== 'fragment' && targetCanvas.item != null) {
      // in case that the target is on item then just let it pass if there is context
      // box shown and mark
      shouldProcessComponent = (
        highlightedArea.contextBox != null &&
        highlightedArea.mark != null
      )
    } else {
      // in other cases just check is there is any conflict or if the dragged element
      // is not filled in the highlighted area
      shouldProcessComponent = (
        !highlightedArea.conflict &&
        highlightedArea.filled
      )

      if (
        targetCanvas.elementType !== 'fragment' &&
        shouldProcessComponent === true &&
        dragType === ComponentDragTypes.COMPONENT &&
        highlightedArea.areaBox == null
      ) {
        // but in case of dragged from component
        // (with no context item highlighting) check if the group
        // has changed
        shouldProcessComponent = shouldProcessComponent && (
          draggedEl.canvas.group !== targetCanvas.group
        )
      }
    }

    clearHighlightArea(design.id)

    if (!shouldProcessComponent) {
      return
    }

    let targetCanvasPayload = {
      ...dropPayload.targetCanvas,
      componentAt: highlightedArea.mark != null ? highlightedArea.mark.move : undefined
    }

    if (targetCanvas.elementType !== 'fragment') {
      targetCanvasPayload.start = highlightedArea.start
      targetCanvasPayload.end = highlightedArea.end
    }

    addOrRemoveComponentFromDrag(design.id, {
      ...dropPayload,
      targetCanvas: targetCanvasPayload
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
