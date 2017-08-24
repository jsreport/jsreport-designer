import React, { PureComponent } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
import memoize from 'lodash/memoize'
import {
  findProjectedFilledArea,
  generateDesignGroups,
  addComponentToDesign,
  removeComponentInDesign,
  findProjectedFilledAreaWhenResizing,
  updateDesignItem,
  selectComponentInDesign
} from './designUtils'
import { ComponentTypes } from '../Constants'
import Canvas from './Canvas'
import './Design.css'

const IS_DEV = true

let DevTools

if (IS_DEV) {
  DevTools = require('../DevTools').default
}

class Design extends PureComponent {
  constructor (props) {
    super(props)

    let {
      defaultNumberOfRows
    } = this.props

    let initialDesignGroups

    this.componentsInfo = {}
    this.selectedComponent = null
    this.highlightedArea = null
    this.highlightedAreaWhenResizing = null
    this.isResizing = false

    initialDesignGroups = generateDesignGroups({
      numberOfRows: defaultNumberOfRows
    })

    // last designGroup is placeholder
    if (initialDesignGroups.length > 0) {
      initialDesignGroups[initialDesignGroups.length - 1].placeholder = true
    }

    this.state = {
      designGroups: initialDesignGroups,
      designSelection: null,
      highlightedArea: null
    }

    this.getCanvasRef = this.getCanvasRef.bind(this)
    this.handleGeneralClickOrDragStart = this.handleGeneralClickOrDragStart.bind(this)
    this.onCanvasDragEnter = this.onCanvasDragEnter.bind(this)
    this.onCanvasDragLeave = this.onCanvasDragLeave.bind(this)
    this.onCanvasDragEnd = this.onCanvasDragEnd.bind(this)
    this.onCanvasClick = this.onCanvasClick.bind(this)
    this.onDesignComponentClick = this.onDesignComponentClick.bind(this)
    this.onDesignComponentDragStart = this.onDesignComponentDragStart.bind(this)
    this.onDesignComponentRemove = this.onDesignComponentRemove.bind(this)
    this.onDesignItemResizeStart = this.onDesignItemResizeStart.bind(this)
    this.onDesignItemResize = this.onDesignItemResize.bind(this)
    this.onDesignItemResizeEnd = this.onDesignItemResizeEnd.bind(this)

    // memoizing the calculation, only update when the cursor offset has changed
    this.calculateHighlightedAreaWhenDragging = memoize(
      this.calculateHighlightedAreaWhenDragging.bind(this),
      ({ clientOffset }) => {
        return clientOffset.x + ',' + clientOffset.y
      }
    )

    this.addComponentToCanvas = this.addComponentToCanvas.bind(this)
  }

  componentDidMount () {
    document.addEventListener('click', this.handleGeneralClickOrDragStart, true)
    window.addEventListener('dragstart', this.handleGeneralClickOrDragStart, true)
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.handleGeneralClickOrDragStart, true)
    window.removeEventListener('dragstart', this.handleGeneralClickOrDragStart, true)
  }

  getCanvasRef (el) {
    this.canvasRef = el
  }

  calculateHighlightedAreaWhenDragging ({ dragType, canvasInfo, item, clientOffset }) {
    let designGroups = this.state.designGroups
    let { baseWidth, defaultNumberOfCols } = this.props
    let { x: cursorOffsetX } = clientOffset
    let { height, top, left } = canvasInfo.groupDimensions
    let colWidth = baseWidth / defaultNumberOfCols
    let highlightedArea
    let noConflictItem

    let colInfo = {
      height,
      top,
      index: Math.floor((cursorOffsetX - left) / colWidth)
    }

    if (colInfo.index > defaultNumberOfCols - 1) {
      colInfo.index = defaultNumberOfCols - 1
    }

    colInfo.left = left + (colInfo.index * colWidth)

    if (dragType === ComponentTypes.COMPONENT && item.canvas.group === canvasInfo.group) {
      noConflictItem = item.canvas.item
    }

    highlightedArea = findProjectedFilledArea({
      baseWidth,
      totalCols: defaultNumberOfCols,
      designGroups,
      referenceGroup: canvasInfo.group,
      colInfo,
      consumedCols: item.consumedCols,
      noConflictItem
    })

    // saving highlightedArea in instance because it will be reset later
    // and we want to access this value later when adding the component to canvas
    this.highlightedArea = highlightedArea

    this.setState({
      highlightedArea
    })
  }

  addComponentToCanvas ({ dragType, canvasInfo, item }) {
    if (dragType === 'COMPONENT') {
      console.log('dropping from drag component not implement yet..')
      return
    }

    let shouldAddComponent = (
      this.highlightedArea &&
      !this.highlightedArea.conflict &&
      this.highlightedArea.filled &&
      item
    )

    if (!shouldAddComponent) {
      return
    }

    const {
      baseWidth,
      defaultRowHeight,
      defaultNumberOfCols
    } = this.props

    let originalDesignGroups = this.state.designGroups
    let highlightedArea = this.highlightedArea
    let originalComponentsInfo = this.componentsInfo || {}

    const {
      designGroups,
      newComponent,
      componentsInfo
    } = addComponentToDesign({
      type: item.name,
      props: item.props
    }, {
      baseWidth,
      emptyGroupHeight: defaultRowHeight,
      numberOfCols: defaultNumberOfCols,
      componentsInfo: originalComponentsInfo,
      componentSize: item.size,
      designGroups: originalDesignGroups,
      referenceGroup: highlightedArea.group,
      fromArea: {
        start: highlightedArea.start,
        end: highlightedArea.end
      }
    })

    const designSelection = this.selectComponent(newComponent.id, {
      componentsInfo: componentsInfo,
      returnSelection: true
    })

    this.highlightedArea = null
    this.componentsInfo = componentsInfo

    this.setState({
      // clean highlightedArea when adding a component
      highlightedArea: null,
      designGroups,
      designSelection
    })
  }

  selectComponent (componentId, opts = {}) {
    let { componentsInfo, returnSelection } = opts
    let selection
    let _componentsInfo

    if (componentsInfo != null) {
      _componentsInfo = componentsInfo
    } else {
      _componentsInfo = this.componentsInfo
    }

    if (this.selectedComponent === componentId) {
      return
    }

    this.selectedComponent = componentId

    selection = selectComponentInDesign({
      componentId,
      componentsInfo: _componentsInfo
    })

    if (returnSelection === true) {
      return selection
    }

    this.setState({
      designSelection: selection
    })
  }

  clearDesignSelection () {
    if (this.state.designSelection != null) {
      this.selectedComponent = null

      this.setState({
        designSelection: null
      })
    }
  }

  handleGeneralClickOrDragStart (ev) {
    let canvasNode
    let clickOutsideCanvas

    if (this.isResizing) {
      this.isResizing = false

      if (ev.type === 'click') {
        // sometimes after resizing a click event is produced (after releasing the mouse),
        // so we stop this event, this allow us to mantain the component selection after the
        // resizing has ended, no matter where it ended
        ev.preventDefault()
        ev.stopPropagation()
        return
      }
    }

    canvasNode = findDOMNode(this.canvasRef)
    clickOutsideCanvas = !canvasNode.contains(ev.target)

    if (clickOutsideCanvas) {
      this.clearDesignSelection()
    }
  }

  onCanvasClick () {
    // clear design selection when canvas is clicked,
    // the selection is not clear if the click was inside a component
    // because component's click handler prevent the click event to be propagated to the parent
    this.clearDesignSelection()
  }

  onDesignComponentClick (ev, componentId) {
    // stop progagation of click
    ev.preventDefault()
    ev.stopPropagation()

    this.selectComponent(componentId)
  }

  onDesignComponentDragStart (componentInfo, componentNode) {
    const designGroups = this.state.designGroups
    let currentDesignGroup
    let currentDesignItem
    let componentDimensions

    currentDesignGroup = designGroups[componentInfo.group]

    if (!currentDesignGroup) {
      return
    }

    currentDesignItem = currentDesignGroup.items[componentInfo.item]

    if (!currentDesignItem) {
      return
    }

    this.clearDesignSelection()

    componentDimensions = componentNode.getBoundingClientRect()

    return {
      name: componentInfo.type,
      props: componentInfo.props,
      size: {
        width: componentDimensions.width,
        height: componentDimensions.height
      },
      consumedCols: (currentDesignItem.end - currentDesignItem.start) + 1,
      canvas: {
        group: componentInfo.group,
        item: componentInfo.item
      }
    }
  }

  onDesignComponentRemove ({ group, item, componentId }) {
    let originalDesignGroups = this.state.designGroups
    let originalComponentsInfo = this.componentsInfo
    let designSelection
    let stateToUpdate

    if (this.isResizing) {
      return
    }

    const {
      designGroups,
      componentsInfo,
      updatedDesignItem
    } = removeComponentInDesign({
      componentsInfo: originalComponentsInfo,
      designGroups: originalDesignGroups,
      referenceGroup: group,
      referenceItem: item,
      componentId
    })

    if (updatedDesignItem.components.length > 0) {
      designSelection = this.selectComponent(updatedDesignItem.components[0].id, {
        componentsInfo,
        returnSelection: true
      })
    }

    this.componentsInfo = componentsInfo

    stateToUpdate = {
      designGroups
    }

    if (designSelection) {
      stateToUpdate.designSelection = designSelection
    }

    this.setState(stateToUpdate)
  }

  onDesignItemResizeStart ({ group, item, itemDimensions, resize }) {
    const { baseWidth, defaultNumberOfCols } = this.props

    let designGroups = this.state.designGroups
    let colWidth = baseWidth / defaultNumberOfCols
    let currentDesignGroup
    let currentDesignItem
    let canvasDimensions
    let minLeftPosition
    let minRightPosition
    let maxLeftPosition
    let maxRightPosition
    let highlightedArea

    this.isResizing = true

    canvasDimensions = findDOMNode(this.canvasRef).getBoundingClientRect()

    // getting the limits of resizing based on canvas dimensions (rounding values)
    maxLeftPosition = Math.round(itemDimensions.left - canvasDimensions.left)
    maxRightPosition = Math.round(canvasDimensions.right - itemDimensions.right)

    currentDesignGroup = designGroups[group]

    if (!currentDesignGroup) {
      return
    }

    currentDesignItem = currentDesignGroup.items[item]

    if (!currentDesignItem) {
      return
    }

    if (currentDesignItem.space !== currentDesignItem.minSpace) {
      let min = Math.abs(currentDesignItem.space - currentDesignItem.minSpace)

      if (currentDesignGroup.layoutMode === 'grid') {
        min = min * colWidth
      }

      min = Math.round(min) * -1

      minLeftPosition = min
      minRightPosition = min
    } else {
      minLeftPosition = 0
      minRightPosition = 0
    }

    // getting the initial projected area when the resizing starts
    highlightedArea = findProjectedFilledArea({
      baseWidth,
      totalCols: defaultNumberOfCols,
      designGroups,
      referenceGroup: group,
      colInfo: {
        height: itemDimensions.height,
        top: itemDimensions.top,
        left: itemDimensions.left,
        index: currentDesignItem.start
      },
      consumedCols: (currentDesignItem.end - currentDesignItem.start) + 1
    })

    highlightedArea.conflict = false

    this.highlightedArea = highlightedArea
    this.highlightedAreaWhenResizing = highlightedArea

    this.setState({
      highlightedArea
    })

    return {
      minLeft: minLeftPosition,
      minRight: minRightPosition,
      maxLeft: maxLeftPosition,
      maxRight: maxRightPosition
    }
  }

  onDesignItemResize ({ group, item, resize }) {
    const { baseWidth, defaultNumberOfCols } = this.props

    let designGroups = this.state.designGroups
    let highlightedArea = this.highlightedArea
    let highlightedAreaWhenResizing = this.highlightedAreaWhenResizing
    let currentDesignItem

    if (!designGroups[group]) {
      return
    }

    currentDesignItem = designGroups[group].items[item]

    if (!currentDesignItem) {
      return
    }

    this.isResizing = true

    // TODO: Safari has a bug, when resizing if you move the mouse bellow the resized item
    // while resizing you will see that all grid cols bellow the item gets selected (text selection)
    // this must be some way to disable the selection or some way to hide it with CSS

    const newHighlightedArea = findProjectedFilledAreaWhenResizing({
      baseWidth,
      totalCols: defaultNumberOfCols,
      designGroups,
      originalHighlightedArea: highlightedArea,
      highlightedArea: highlightedAreaWhenResizing,
      referenceGroup: group,
      referenceItem: item,
      minSpace: currentDesignItem.minSpace,
      originalSpace: currentDesignItem.space,
      resize
    })

    if (!newHighlightedArea) {
      return
    }

    this.highlightedAreaWhenResizing = newHighlightedArea

    this.setState({
      highlightedArea: newHighlightedArea
    })

    return !newHighlightedArea.conflict
  }

  onDesignItemResizeEnd ({ group, item, resize }) {
    const originalHighlightedArea = this.highlightedArea
    const highlightedArea = this.highlightedAreaWhenResizing
    const originalDesignGroups = this.state.designGroups
    let currentDesignGroup = originalDesignGroups[group]
    let currentDesignItem

    if (!currentDesignGroup) {
      return
    }

    currentDesignItem = currentDesignGroup.items[item]

    if (!currentDesignItem) {
      return
    }

    const cleanup = () => {
      // we mark that resizing has ended sometime later,
      // this is needed because we switch "isResizing" on the next interaction
      // "handleGeneralClickOrDragStart", and because some browsers has inconsistences
      // (like not firing click events after resizing) we need to ensure to have
      // "isResizing" in correct state
      setTimeout(() => {
        this.isResizing = false
      }, 100)

      this.highlightedArea = null
      this.highlightedAreaWhenResizing = null

      this.setState({
        highlightedArea: null
      })
    }

    if (
      (currentDesignItem.layoutMode === 'grid' &&
      originalHighlightedArea.start === highlightedArea.start &&
      originalHighlightedArea.end === highlightedArea.end) ||
      (currentDesignItem.layoutMode === 'fixed' &&
      originalHighlightedArea.areaBox.width === highlightedArea.areaBox.width) ||
      highlightedArea.conflict
    ) {
      return cleanup()
    }

    const newDesignGroups = updateDesignItem({
      designGroups: originalDesignGroups,
      referenceGroup: group,
      referenceItem: item,
      current: {
        start: highlightedArea.start,
        end: highlightedArea.end
      }
    })

    this.setState({
      highlightedArea: null,
      designGroups: newDesignGroups
    })

    cleanup()
  }

  onCanvasDragEnter () {
    // clean selected area when dragging starts on canvas
    this.highlightedArea = null
  }

  onCanvasDragLeave () {
    if (this.state.highlightedArea != null) {
      // clean selected area (visually) when dragging outside canvas (only when necessary)
      this.setState({
        highlightedArea: null
      })
    }
  }

  onCanvasDragEnd () {
    if (this.state.highlightedArea != null) {
      // clean selected area (visually) when dragging ends (only when necessary)
      this.setState({
        highlightedArea: null
      })
    }
  }

  render () {
    const {
      baseWidth,
      defaultRowHeight,
      defaultNumberOfCols
    } = this.props

    const {
      designGroups,
      highlightedArea,
      designSelection
    } = this.state

    let paddingLeftRight = 25

    return (
      <div className="Design-container">
        {DevTools && (
          <DevTools
            baseWidth={baseWidth}
            emptyGroupHeight={defaultRowHeight}
            numberOfCols={defaultNumberOfCols}
            designGroups={designGroups}
          />
        )}
        <div
          className="Design-canvas"
          style={{
            minWidth: baseWidth + (paddingLeftRight * 2) + 'px',
            paddingLeft: paddingLeftRight + 'px',
            paddingRight: paddingLeftRight + 'px',
            paddingBottom: '40px',
            paddingTop: '40px'
          }}
        >
          <Canvas
            ref={this.getCanvasRef}
            baseWidth={baseWidth}
            numberOfCols={defaultNumberOfCols}
            emptyGroupHeight={defaultRowHeight}
            highlightedArea={highlightedArea}
            designGroups={designGroups}
            designSelection={designSelection}
            onClick={this.onCanvasClick}
            onComponentClick={this.onDesignComponentClick}
            onComponentDragStart={this.onDesignComponentDragStart}
            onComponentRemove={this.onDesignComponentRemove}
            onDragEnter={this.onCanvasDragEnter}
            onDragOver={this.calculateHighlightedAreaWhenDragging}
            onDragLeave={this.onCanvasDragLeave}
            onDragEnd={this.onCanvasDragEnd}
            onDrop={this.addComponentToCanvas}
            onItemResizeStart={this.onDesignItemResizeStart}
            onItemResize={this.onDesignItemResize}
            onItemResizeEnd={this.onDesignItemResizeEnd}
          />
        </div>
      </div>
    )
  }
}

Design.propTypes = {
  baseWidth: PropTypes.number.isRequired,
  defaultRowHeight: PropTypes.number.isRequired,
  defaultNumberOfRows: PropTypes.number.isRequired,
  defaultNumberOfCols: PropTypes.number.isRequired
}

export default Design
