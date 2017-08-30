import React, { PureComponent } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
import memoize from 'lodash/memoize'
import {
  getConsumedColsFromWidth,
  findProjectedFilledArea,
  generateDesignGroups,
  addComponentToDesign,
  updateComponentInDesign,
  removeComponentInDesign,
  findProjectedFilledAreaWhenResizing,
  updateDesignItem,
  selectComponentInDesign
} from './designUtils'
import { ComponentDragTypes } from '../Constants'
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
    this.handleDropOnCanvas = this.handleDropOnCanvas.bind(this)
    this.handleComponentPropsChange = this.handleComponentPropsChange.bind(this)
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
  }

  componentDidMount () {
    document.addEventListener('click', this.handleGeneralClickOrDragStart, true)
    window.addEventListener('dragstart', this.handleGeneralClickOrDragStart, true)
  }

  componentWillUpdate (nextProps, nextState) {
    if (
      (this.state.designSelection == null && nextState.designSelection != null) ||
      (this.state.designSelection != null && nextState.designSelection == null) ||
      (this.state.designSelection != null && this.state.designSelection !== nextState.designSelection)
    ) {
      nextProps.onDesignSelectionChange && nextProps.onDesignSelectionChange({
        designGroups: nextState.designGroups,
        designSelection: nextState.designSelection,
        onComponentPropsChange: this.handleComponentPropsChange
      })
    }
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
    let targetDesignItemIndex = canvasInfo.item
    let noConflictItem
    let highlightedArea

    let colInfo = {
      height,
      top,
      index: Math.floor((cursorOffsetX - left) / colWidth)
    }

    if (colInfo.index > defaultNumberOfCols - 1) {
      colInfo.index = defaultNumberOfCols - 1
    }

    colInfo.left = left + (colInfo.index * colWidth)

    if (dragType === ComponentDragTypes.COMPONENT && item.canvas.group === canvasInfo.group) {
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

    if (dragType === ComponentDragTypes.COMPONENT && targetDesignItemIndex != null) {
      let targetDesignItem = designGroups[canvasInfo.group].items[targetDesignItemIndex]

      highlightedArea.contextBox = {
        top: highlightedArea.areaBox.top,
        left: left + (targetDesignItem.start * colWidth),
        width: ((targetDesignItem.end - targetDesignItem.start) + 1) * colWidth,
        height: highlightedArea.areaBox.height,
      }
    } else {
      highlightedArea.context = null
    }

    // saving highlightedArea in instance because it will be reset later
    // and we want to access this value later when adding the component to canvas
    this.highlightedArea = highlightedArea

    this.setState({
      highlightedArea
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

    if (this.props.onGlobalClick) {
      clickOutsideCanvas = this.props.onGlobalClick(clickOutsideCanvas, ev.target)
    }

    if (clickOutsideCanvas) {
      this.clearDesignSelection()
    }
  }

  handleComponentPropsChange (canvasInfo, newProps) {
    let originalDesignGroups = this.state.designGroups

    const { designGroups } = updateComponentInDesign({
      designGroups: originalDesignGroups,
      referenceGroup: canvasInfo.group,
      referenceItem: canvasInfo.item,
      referenceComponent: canvasInfo.component,
      props: newProps
    })

    this.setState({
      designGroups
    })
  }

  handleDropOnCanvas ({ dragType, canvasInfo, item }) {
    const {
      baseWidth,
      defaultRowHeight,
      defaultNumberOfCols
    } = this.props

    let originalDesignGroups = this.state.designGroups
    let highlightedArea = this.highlightedArea
    let originalComponentsInfo = this.componentsInfo || {}
    let targetMinSpace
    let currentComponentsInfo
    let currentDesignGroups
    let originDesignItem
    let targetDesignGroup
    let targetDesignItem
    let componentToProcess

    let shouldProcessComponent = (
      highlightedArea != null &&
      !highlightedArea.conflict &&
      highlightedArea.filled &&
      item != null
    )

    targetDesignGroup = originalDesignGroups[canvasInfo.group]

    if (dragType === ComponentDragTypes.COMPONENT) {
      if (item.canvas.item != null) {
        originDesignItem = originalDesignGroups[item.canvas.group].items[item.canvas.item]
      }

      if (canvasInfo.item != null) {
        targetDesignItem = targetDesignGroup.items[canvasInfo.item]
      }
    }

    if (
      shouldProcessComponent &&
      targetDesignItem
    ) {
      // process the component if there is a change in group/item or position
      shouldProcessComponent = (
        (item.canvas.group !== canvasInfo.group &&
        item.canvas.item !== canvasInfo.item) ||
        (highlightedArea.end > targetDesignItem.end ||
        highlightedArea.start < targetDesignItem.start)
      )
    }

    if (!shouldProcessComponent) {
      return
    }

    if (dragType === ComponentDragTypes.COMPONENT) {
      let removeResult

      componentToProcess = originDesignItem.components[item.canvas.component]

      if (targetDesignItem == null) {
        if (targetDesignGroup.layoutMode === 'grid') {
          targetMinSpace = item.componentConsumedCols
        } else {
          targetMinSpace = item.size.width
        }
      }

      removeResult = removeComponentInDesign({
        componentsInfo: originalComponentsInfo,
        designGroups: originalDesignGroups,
        referenceGroup: item.canvas.group,
        referenceItem: item.canvas.item,
        componentId: componentToProcess.id
      })

      currentDesignGroups = removeResult.designGroups
      currentComponentsInfo = removeResult.componentsInfo
    } else {
      componentToProcess = {
        type: item.name,
        props: item.props
      }

      currentDesignGroups = originalDesignGroups
      currentComponentsInfo = originalComponentsInfo
    }

    const {
      designGroups,
      newComponent,
      componentsInfo
    } = addComponentToDesign(componentToProcess, {
      baseWidth,
      emptyGroupHeight: defaultRowHeight,
      numberOfCols: defaultNumberOfCols,
      componentsInfo: currentComponentsInfo,
      componentSize: item.size,
      designGroups: currentDesignGroups,
      referenceGroup: highlightedArea.group,
      area: {
        start: highlightedArea.start,
        end: highlightedArea.end,
        minSpace: targetMinSpace
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
    const { baseWidth, defaultNumberOfCols } = this.props
    let originDesignGroup
    let originDesignItem
    let componentDimensions
    let consumedCols
    let componentConsumedCols

    originDesignGroup = designGroups[componentInfo.group]

    if (!originDesignGroup) {
      return
    }

    originDesignItem = originDesignGroup.items[componentInfo.item]

    if (!originDesignItem) {
      return
    }

    this.clearDesignSelection()

    componentDimensions = componentNode.getBoundingClientRect()

    componentConsumedCols = getConsumedColsFromWidth({
      baseColWidth: baseWidth / defaultNumberOfCols,
      width: componentDimensions.width
    })

    // if the origin component comes from an item that only has one component
    // then preserve design item size in the target
    if (originDesignItem.components.length === 1) {
      consumedCols = (originDesignItem.end - originDesignItem.start) + 1
    } else {
      consumedCols = componentConsumedCols
    }

    return {
      id: componentInfo.id,
      name: componentInfo.type,
      props: componentInfo.props,
      size: {
        width: componentDimensions.width,
        height: componentDimensions.height
      },
      consumedCols,
      componentConsumedCols,
      canvas: {
        group: componentInfo.group,
        item: componentInfo.item,
        component: componentInfo.component
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
    } else {
      stateToUpdate.designSelection = null
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
            onDrop={this.handleDropOnCanvas}
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
  defaultNumberOfCols: PropTypes.number.isRequired,
  onGlobalClick: PropTypes.func,
  onDesignSelectionChange: PropTypes.func
}

export default Design
