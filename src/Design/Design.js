import React, { PureComponent } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
import memoize from 'lodash/memoize'
import arrayFrom from 'array.from'
import {
  isInsideOfCol,
  findStartCol,
  findProjectedFilledArea,
  getDistanceFromCol,
  generateRows,
  updateRows,
  addComponentToDesign,
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
      baseWidth,
      defaultRowHeight,
      defaultNumberOfRows,
      defaultNumberOfCols
    } = this.props

    let initialRows

    this.totalHeightOfRows = null

    this.rowsToGroups = {}
    this.componentsInfo = {}
    this.selectedComponent = null
    this.selectedArea = null
    this.selectedAreaWhenResizing = null
    this.isResizing = false

    initialRows = generateRows({
      baseWidth: baseWidth,
      numberOfRows: defaultNumberOfRows,
      numberOfCols: defaultNumberOfCols,
      height: defaultRowHeight
    })

    // last row is placeholder
    if (initialRows.length > 0) {
      initialRows[initialRows.length - 1].placeholder = true
    }

    this.state = {
      designGroups: [],
      designSelection: null,
      selectedArea: null,
      gridRows: initialRows
    }

    this.totalHeightOfRows = this.getTotalHeightOfRows(this.state.gridRows)

    this.getCanvasRef = this.getCanvasRef.bind(this)
    this.handleGeneralClickOrDragStart = this.handleGeneralClickOrDragStart.bind(this)
    this.onDragEnterCanvas = this.onDragEnterCanvas.bind(this)
    this.onDragLeaveCanvas = this.onDragLeaveCanvas.bind(this)
    this.onDragEndCanvas = this.onDragEndCanvas.bind(this)
    this.onClickCanvas = this.onClickCanvas.bind(this)
    this.onClickDesignComponent = this.onClickDesignComponent.bind(this)
    this.onResizeDesignItemStart = this.onResizeDesignItemStart.bind(this)
    this.onResizeDesignItem = this.onResizeDesignItem.bind(this)
    this.onResizeDesignItemEnd = this.onResizeDesignItemEnd.bind(this)

    // memoizing the calculation, only update when the cursor offset has changed
    this.calculateSelectedAreaWhenDragging = memoize(
      this.calculateSelectedAreaWhenDragging.bind(this),
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

  componentWillUpdate (nextProps, nextState) {
    // re-calculate computed value "totalHeightOfRows" if rows have changed
    if (this.state.gridRows !== nextState.gridRows) {
      this.totalHeightOfRows = this.getTotalHeightOfRows(nextState.gridRows)
    }
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.handleGeneralClickOrDragStart, true)
    window.removeEventListener('dragstart', this.handleGeneralClickOrDragStart, true)
  }

  getCanvasRef (el) {
    this.canvasRef = el
  }

  getTotalHeightOfRows (rows) {
    return rows.reduce((acu, row) => acu + row.height, 0)
  }

  calculateSelectedAreaWhenDragging ({ row, col, colDimensions, item, clientOffset }) {
    let rows = this.state.gridRows
    let isInside = true
    let { x: cursorOffsetX, y: cursorOffsetY } = clientOffset
    let { width, height, top, left } = colDimensions

    let colInfo = {
      col: col.index,
      row: row.index,
      width,
      height,
      top,
      left
    }

    isInside = isInsideOfCol({
      point: { x: cursorOffsetX, y: cursorOffsetY },
      colInfo
    }).isInside

    if (!isInside) {
      return
    }

    let selectedArea = findProjectedFilledArea({
      rows,
      baseColInfo: colInfo,
      consumedRows: item.consumedRows,
      consumedCols: item.consumedCols
    })

    // saving selectedArea in instance because it will be reset later
    // and we want to access this value later when adding the component to canvas
    this.selectedArea = selectedArea

    this.setState({
      selectedArea
    })
  }

  addComponentToCanvas ({ item, clientOffset, row, col, colDimensions }) {
    let shouldAddComponent = (
      this.selectedArea &&
      !this.selectedArea.conflict &&
      this.selectedArea.filled &&
      col &&
      colDimensions
    )

    if (!shouldAddComponent) {
      return
    }

    let {
      baseWidth,
      defaultRowHeight,
      defaultNumberOfCols
    } = this.props

    let originalDesignGroups = this.state.designGroups
    let selectedArea = this.selectedArea
    let originalRowsToGroups = this.rowsToGroups || {}
    let originalComponentsInfo = this.componentsInfo || {}
    let currentRowsToGroups = { ...originalRowsToGroups }
    let currentComponentsInfo = { ...originalComponentsInfo }
    let changedRowsInsideGroups = []

    // TODO: Safari has a bug, if you drop a component and if that component causes the scroll bar to appear
    // then when you scroll the page you will see some part of the drag preview or some lines of the grid
    // getting draw randomly (a painting issue)
    // see: https://stackoverflow.com/questions/22842992/how-to-force-safari-to-repaint-positionfixed-elements-on-scroll
    const {
      rows: newRows,
      updatedBaseRow
    } = updateRows({
      row,
      col,
      colDimensions,
      rows: this.state.gridRows,
      item,
      selectedArea: this.selectedArea,
      defaultRowHeight: defaultRowHeight,
      defaultNumberOfCols: defaultNumberOfCols,
      totalWidth: baseWidth,
      onRowIndexChange: (currentRow, newIndex) => {
        if (currentRowsToGroups[currentRow.index]) {
          changedRowsInsideGroups.push({ old: currentRow.index, new: newIndex })
          // deleting old references in rows-groups map
          delete currentRowsToGroups[currentRow.index]
        }
      }
    })

    // updating rows-groups map with the new row indexes
    changedRowsInsideGroups.forEach((changed) => {
      currentRowsToGroups[changed.new] = originalRowsToGroups[changed.old]
    })

    const {
      designGroups,
      newComponent,
      rowsToGroups,
      componentsInfo
    } = addComponentToDesign({
      type: item.name,
      props: item.props
    }, {
      rows: newRows,
      rowsToGroups: currentRowsToGroups,
      componentsInfo: currentComponentsInfo,
      designGroups: originalDesignGroups,
      referenceRow: updatedBaseRow.index,
      fromCol: {
        start: selectedArea.startCol,
        end: selectedArea.endCol
      }
    })

    const designSelection = this.selectComponent(newComponent.id, {
      componentsInfo: componentsInfo,
      returnSelection: true
    })

    this.selectedArea = null
    this.rowsToGroups = rowsToGroups
    this.componentsInfo = componentsInfo

    this.setState({
      // clean selectedArea when adding a component
      selectedArea: null,
      gridRows: newRows,
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

  onResizeDesignItemStart ({ item, resize, node }) {
    let rows = this.state.gridRows
    let rowsToGroups = this.rowsToGroups
    let designGroups = this.state.designGroups
    let componentsInfo = this.componentsInfo
    let currentDesignGroup
    let currentDesignItem
    let canvasDimensions
    let itemDimensions
    let maxLeftPosition
    let maxRightPosition
    let selectedArea
    let baseArea

    this.isResizing = true

    canvasDimensions = findDOMNode(this.canvasRef).getBoundingClientRect()
    itemDimensions = node.getBoundingClientRect()

    // getting the limits of resizing based on canvas dimensions (rounding values)
    maxLeftPosition = Math.round(itemDimensions.left - canvasDimensions.left)
    maxRightPosition = Math.round(canvasDimensions.right - itemDimensions.right)

    currentDesignGroup = designGroups[
      rowsToGroups[
        componentsInfo[item.components[0].id].rowIndex
      ]
    ]

    if (currentDesignGroup) {
      currentDesignItem = currentDesignGroup.items[item.index]

      baseArea = arrayFrom(
        {
          length: (currentDesignItem.end - currentDesignItem.start) + 1
        },
        (v, i) => currentDesignItem.start + i
      ).reduce((acu, colIdx) => {
        acu[colIdx + ',' + componentsInfo[item.components[0].id].rowIndex] = {
          cold: colIdx,
          row: componentsInfo[item.components[0].id].rowIndex
        }

        return acu
      }, {})

      // getting the initial projected area when the resizing starts
      selectedArea = findProjectedFilledArea({
        rows,
        baseColInfo: {
          col: currentDesignItem.start,
          row: componentsInfo[item.components[0].id].rowIndex,
          top: itemDimensions.top,
          left: itemDimensions.left
        },
        consumedCols: (currentDesignItem.end - currentDesignItem.start) + 1,
        originalArea: baseArea
      })

      this.selectedArea = selectedArea
      this.selectedAreaWhenResizing = selectedArea

      this.setState({
        selectedArea
      })
    }

    return {
      maxLeft: maxLeftPosition,
      maxRight: maxRightPosition
    }
  }

  onResizeDesignItem ({ item, resize, node }) {
    let selectedArea = this.selectedArea
    let selectedAreaWhenResizing = this.selectedAreaWhenResizing
    let rows = this.state.gridRows
    let shouldCalculate = false
    let isGrowing = false
    let prevent = false
    let newSelectedArea
    let step
    let nextCol

    this.isResizing = true

    if (resize.direction === 'left') {
      step = -1
    } else {
      step = 1
    }

    if (resize.prevPosition > resize.position) {
      step = step * -1
    }

    if (
      (resize.direction === 'left' && step === -1) ||
      (resize.direction === 'right' && step === 1)
    ) {
      isGrowing = true
    }

    if (resize.direction === 'left') {
      if (isGrowing) {
        prevent = item.layoutMode === 'grid' ? (
          selectedAreaWhenResizing.startCol === 0
        ) : false
      } else {
        prevent = (
          resize.position === 0 && resize.prevPosition === 0 &&
          selectedAreaWhenResizing.startCol === selectedArea.startCol
        )
      }
    } else {
      if (isGrowing) {
        prevent = item.layoutMode === 'grid' ? (
          selectedAreaWhenResizing.endCol === rows[selectedAreaWhenResizing.row].cols.length - 1
        ) : false
      } else {
        prevent = (
          resize.position === 0 && resize.prevPosition === 0 &&
          selectedAreaWhenResizing.endCol === selectedArea.endCol
        )
      }
    }

    if (prevent) {
      return
    }

    if (item.layoutMode === 'grid') {
      let colReference
      let baseCol
      let startCol
      let baseColLeft
      let colLimit
      let sizeLimit

      if (resize.direction === 'left') {
        colReference = selectedAreaWhenResizing.startCol

        if (colReference === 0 && !isGrowing) {
          baseColLeft = selectedAreaWhenResizing.areaBox.left
        } else {
          colReference = colReference - 1

          baseColLeft = (
            selectedAreaWhenResizing.areaBox.left -
            rows[selectedAreaWhenResizing.row].cols[colReference].width
          )
        }
      } else {
        colReference = selectedAreaWhenResizing.endCol

        if (colReference === rows[selectedAreaWhenResizing.row].cols.length - 1 && !isGrowing) {
          baseColLeft = (
            selectedAreaWhenResizing.areaBox.left +
            selectedAreaWhenResizing.areaBox.width
          ) - rows[selectedAreaWhenResizing.row].cols[colReference].width
        } else {
          colReference = colReference + 1

          baseColLeft = (
            selectedAreaWhenResizing.areaBox.left +
            selectedAreaWhenResizing.areaBox.width
          )
        }
      }

      baseCol = rows[selectedAreaWhenResizing.row].cols[colReference]

      startCol = findStartCol({
        rows,
        point: {
          side: resize.direction === 'left' ? (
            isGrowing ? 'left' : 'right'
          ) : (
            isGrowing ? 'right' : 'left'
          ),
          x: resize.direction === 'left' ? (
            selectedArea.areaBox.left - resize.position
          ) : selectedArea.areaBox.left + selectedArea.areaBox.width + resize.position,
          y: selectedArea.areaBox.top
        },
        baseCol: {
          col: baseCol.index,
          row: selectedArea.row,
          top: selectedArea.areaBox.top,
          left: baseColLeft,
          width: baseCol.width,
          height: selectedArea.areaBox.height
        },
        step
      })

      if (isGrowing) {
        colLimit = resize.direction === 'left' ? 0 : rows[selectedAreaWhenResizing.row].cols.length - 1
        sizeLimit = resize.direction === 'left' ? resize.maxLeft : resize.maxRight
      } else {
        colLimit = resize.direction === 'left' ? selectedArea.startCol : selectedArea.endCol
        sizeLimit = resize.direction === 'left' ? 0 : rows[selectedAreaWhenResizing.row].cols.length - 1
      }

      if (startCol.colCoordinate.col === colLimit && resize.position === sizeLimit) {
        shouldCalculate = true
        nextCol = rows[selectedAreaWhenResizing.row].cols[startCol.colCoordinate.col]
      } else if (startCol.filled) {
        if (isGrowing) {
          shouldCalculate = Math.abs(
            (resize.direction === 'left' ? (
              selectedAreaWhenResizing.startCol
            ) : (
              selectedAreaWhenResizing.endCol
            )) - startCol.colCoordinate.col
          ) > 1
        } else {
          shouldCalculate = Math.max(
            resize.direction === 'left' ? selectedAreaWhenResizing.startCol : selectedAreaWhenResizing.endCol,
            startCol.colCoordinate.col
          ) === startCol.colCoordinate.col ? (
            (
              (resize.direction === 'left' ?
              selectedAreaWhenResizing.startCol :
              selectedAreaWhenResizing.endCol) - startCol.colCoordinate.col
            ) <= 0
          ) : true
        }

        if (resize.direction === 'left') {
          nextCol = rows[selectedAreaWhenResizing.row].cols[startCol.colCoordinate.col + 1]
        } else {
          nextCol = rows[selectedAreaWhenResizing.row].cols[startCol.colCoordinate.col -  1]
        }
      }
    } else {
      let baseColWidth = this.props.baseWidth / this.props.defaultNumberOfCols
      let consumedCols = Math.floor(resize.position / baseColWidth)

      // fixed mode
      shouldCalculate = true

      if (resize.direction === 'left') {
        nextCol = rows[selectedAreaWhenResizing.row].cols[
          (selectedArea.startCol - consumedCols) - 1
        ]
      } else {
        nextCol = rows[selectedAreaWhenResizing.row].cols[
          (selectedArea.endCol + consumedCols) + 1
        ]
      }
    }

    if (!shouldCalculate || !nextCol) {
      return
    }

    newSelectedArea = {
      ...this.selectedAreaWhenResizing,
    }

    newSelectedArea.areaBox = {
      ...this.selectedAreaWhenResizing.areaBox
    }

    if (item.layoutMode === 'grid') {
      let distanceX

      newSelectedArea.startCol = resize.direction === 'left' ? nextCol.index : this.selectedAreaWhenResizing.startCol
      newSelectedArea.endCol = resize.direction === 'right' ? nextCol.index : this.selectedAreaWhenResizing.endCol

      distanceX = getDistanceFromCol({
        rows,
        fromCol: { row: selectedArea.row, col: resize.direction === 'left' ? nextCol.index : this.selectedArea.endCol },
        toCol: { row: selectedArea.row, col: resize.direction === 'left' ? this.selectedArea.startCol : nextCol.index },
        opts: {
          includeFrom: resize.direction === 'left' ? nextCol.index !== this.selectedArea.startCol : undefined,
          includeTo: resize.direction === 'right' ? nextCol.index !== this.selectedArea.startCol : undefined,
        }
      }).distanceX

      newSelectedArea.areaBox.width = this.selectedArea.areaBox.width + distanceX

      newSelectedArea.areaBox.left = resize.direction === 'left' ? (
        this.selectedArea.areaBox.left - distanceX
      ) : this.selectedArea.areaBox.left
    } else {
      newSelectedArea.startCol = resize.direction === 'left' ? nextCol.index : this.selectedAreaWhenResizing.startCol
      newSelectedArea.endCol = resize.direction === 'right' ? nextCol.index : this.selectedAreaWhenResizing.endCol

      newSelectedArea.areaBox.width = this.selectedArea.areaBox.width + resize.position
      newSelectedArea.areaBox.left = resize.direction === 'left' ? (
        this.selectedArea.areaBox.left - resize.position
      ) : this.selectedArea.areaBox.left
    }

    // TODO: update conflict

    this.selectedAreaWhenResizing = newSelectedArea

    this.setState({
      selectedArea: newSelectedArea
    })
  }

  onResizeDesignItemEnd ({ item, resize, node }) {
    // we mark that resizing has ended sometime later,
    // this is needed because we switch "isResizing" on the next interaction
    // "handleGeneralClickOrDragStart", and because some browsers has inconsistences
    // (like not firing click events after resizing) we need to ensure to have
    // "isResizing" in correct state
    setTimeout(() => {
      this.isResizing = false
    }, 100)

    this.selectedArea = null
    this.selectedAreaWhenResizing = null

    this.setState({
      selectedArea: null
    })
  }

  onDragEnterCanvas () {
    // clean selected area when dragging starts on canvas
    this.selectedArea = null
  }

  onDragLeaveCanvas () {
    if (this.state.selectedArea != null) {
      // clean selected area (visually) when dragging outside canvas (only when necessary)
      this.setState({
        selectedArea: null
      })
    }
  }

  onDragEndCanvas () {
    if (this.state.selectedArea != null) {
      // clean selected area (visually) when dragging ends (only when necessary)
      this.setState({
        selectedArea: null
      })
    }
  }

  render () {
    const {
      baseWidth,
      defaultNumberOfCols
    } = this.props

    const {
      designGroups,
      gridRows,
      selectedArea,
      designSelection
    } = this.state

    // using computed value "totalHeightOfRows"
    let totalHeight = this.totalHeightOfRows
    let paddingLeftRight = 25

    return (
      <div className="Design-container">
        {DevTools && (
          <DevTools
            baseWidth={baseWidth}
            numberOfCols={defaultNumberOfCols}
            gridRows={gridRows}
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
            width={baseWidth}
            height={totalHeight}
            numberOfCols={defaultNumberOfCols}
            gridRows={gridRows}
            selectedArea={selectedArea}
            designGroups={designGroups}
            designSelection={designSelection}
            onClick={this.onClickCanvas}
            onClickComponent={this.onClickDesignComponent}
            onDragEnter={this.onDragEnterCanvas}
            onDragLeave={this.onDragLeaveCanvas}
            onDragEnd={this.onDragEndCanvas}
            onDrop={this.addComponentToCanvas}
            onColDragOver={this.calculateSelectedAreaWhenDragging}
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
