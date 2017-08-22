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
    this.onDragEnterCanvas = this.onDragEnterCanvas.bind(this)
    this.onDragLeaveCanvas = this.onDragLeaveCanvas.bind(this)
    this.onDragEndCanvas = this.onDragEndCanvas.bind(this)
    this.onClickCanvas = this.onClickCanvas.bind(this)
    this.onClickDesignComponent = this.onClickDesignComponent.bind(this)
    this.onDragStartDesignComponent = this.onDragStartDesignComponent.bind(this)
    this.onRemoveDesignComponent = this.onRemoveDesignComponent.bind(this)
    this.onResizeDesignItemStart = this.onResizeDesignItemStart.bind(this)
    this.onResizeDesignItem = this.onResizeDesignItem.bind(this)
    this.onResizeDesignItemEnd = this.onResizeDesignItemEnd.bind(this)

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

  calculateHighlightedAreaWhenDragging ({ group, groupDimensions, item, clientOffset }) {
    let designGroups = this.state.designGroups
    let { baseWidth, defaultNumberOfCols } = this.props
    let { x: cursorOffsetX } = clientOffset
    let { height, top, left } = groupDimensions
    let colWidth = baseWidth / defaultNumberOfCols

    let colInfo = {
      height,
      top,
      index: Math.floor((cursorOffsetX - left) / colWidth)
    }

    if (colInfo.index > defaultNumberOfCols - 1) {
      colInfo.index = defaultNumberOfCols - 1
    }

    colInfo.left = left + (colInfo.index * colWidth)

    let highlightedArea = findProjectedFilledArea({
      baseWidth,
      totalCols: defaultNumberOfCols,
      designGroups,
      referenceGroup: group,
      colInfo,
      consumedCols: item.consumedCols
    })

    // saving highlightedArea in instance because it will be reset later
    // and we want to access this value later when adding the component to canvas
    this.highlightedArea = highlightedArea

    this.setState({
      highlightedArea
    })
  }

  addComponentToCanvas ({ item }) {
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

  onClickCanvas () {
    // clear design selection when canvas is clicked,
    // the selection is not clear if the click was inside a component
    // because component's click handler prevent the click event to be propagated to the parent
    this.clearDesignSelection()
  }

  onClickDesignComponent (ev, componentId) {
    // stop progagation of click
    ev.preventDefault()
    ev.stopPropagation()

    this.selectComponent(componentId)
  }

  onDragStartDesignComponent () {
    this.clearDesignSelection()


  }

  onRemoveDesignComponent ({ group, item, componentId }) {
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

  onResizeDesignItemStart ({ group, item, itemDimensions, resize }) {
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

  onResizeDesignItem ({ group, item, resize }) {
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

  onResizeDesignItemEnd ({ group, item, resize }) {
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

  onDragEnterCanvas () {
    // clean selected area when dragging starts on canvas
    this.highlightedArea = null
  }

  onDragLeaveCanvas () {
    if (this.state.highlightedArea != null) {
      // clean selected area (visually) when dragging outside canvas (only when necessary)
      this.setState({
        highlightedArea: null
      })
    }
  }

  onDragEndCanvas () {
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
            onClick={this.onClickCanvas}
            onClickComponent={this.onClickDesignComponent}
            onDragStartComponent={this.onDragStartDesignComponent}
            onRemoveComponent={this.onRemoveDesignComponent}
            onDragEnter={this.onDragEnterCanvas}
            onDragOver={this.calculateHighlightedAreaWhenDragging}
            onDragLeave={this.onDragLeaveCanvas}
            onDragEnd={this.onDragEndCanvas}
            onDrop={this.addComponentToCanvas}
            onResizeItemStart={this.onResizeDesignItemStart}
            onResizeItem={this.onResizeDesignItem}
            onResizeItemEnd={this.onResizeDesignItemEnd}
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
