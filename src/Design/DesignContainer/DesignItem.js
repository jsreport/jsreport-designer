import React, { PureComponent } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
import Selection from './Selection'
import DesignComponent from '../../DesignComponent'
import './DesignItem.css'

class DesignItem extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      resizing: null
    }

    this.originalResizeCoord = null
    this.prevPosition = null
    this.minResizeLeft = null
    this.minResizeRight = null
    this.maxResizeLeft = null
    this.maxResizeRight = null

    this.getItem = this.getItem.bind(this)
    this.setItemNode = this.setItemNode.bind(this)
    this.setSelectionNode = this.setSelectionNode.bind(this)
    this.focusSelection = this.focusSelection.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleResizeStart = this.handleResizeStart.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.handleResizeEnd = this.handleResizeEnd.bind(this)
  }

  componentDidMount () {
    this.focusSelection()
  }

  componentDidUpdate () {
    this.focusSelection()
  }

  getWidthInPercentage ({ numberOfCols, consumedCols }) {
    return 100 / (numberOfCols / consumedCols)
  }

  getItem () {
    return {
      id: this.props.id,
      index: this.props.index,
      layoutMode: this.props.layoutMode,
      minSpace: this.props.minSpace,
      space: this.props.space,
      leftSpace: this.props.leftSpace,
      components: this.props.components
    }
  }

  setItemNode (el) {
    this.node = el
  }

  setSelectionNode (el) {
    this.selection = el
  }

  focusSelection () {
    // in order for key events to work, the selection box must be focused
    if (this.selection) {
      findDOMNode(this.selection).focus()
    }
  }

  handleKeyDown (ev) {
    const { onRemoveComponent, selection } = this.props
    const item = this.getItem()

    ev.preventDefault()
    ev.stopPropagation()

    // when backspace or del key is pressed remove the component
    if ((ev.keyCode === 8 || ev.keyCode === 46) && onRemoveComponent) {
      onRemoveComponent({
        item,
        componentId: selection.component
      })
    }
  }

  handleClick (ev) {
    if (this.props.selection != null) {
      // stop progagation of click when the item is selected
      // this is necessary to prevent cleaning the selection
      ev.preventDefault()
      ev.stopPropagation()
    }
  }

  handleResizeStart (ev, direction) {
    let resizeLimits
    let position = 0
    const node = this.node

    const item = this.getItem()

    this.originalResizeCoord = {
      x: ev.clientX,
      y: ev.clientY
    }

    this.prevPosition = null

    if (this.props.onResizeStart) {
      resizeLimits = this.props.onResizeStart({
        item,
        node,
        resize: {
          direction,
          position,
          prevPosition: this.prevPosition,
          x: ev.clientX,
          y: ev.clientY
        }
      })

      this.prevPosition = position

      resizeLimits = (resizeLimits == null) ? {
        minLeft: 0,
        minRight: 0
      } : {
        minLeft: 0,
        minRight: 0,
        ...resizeLimits
      }

      this.minResizeLeft = (resizeLimits.minLeft != null && resizeLimits.minLeft > 0) ? 0 : resizeLimits.minLeft
      this.minResizeRight = (resizeLimits.minRight != null && resizeLimits.minRight > 0) ? 0 : resizeLimits.minRight
      this.maxResizeLeft = resizeLimits.maxLeft
      this.maxResizeRight = resizeLimits.maxRight
    }

    this.setState({
      resizing: {
        direction,
        position
      }
    })
  }

  handleResize (ev, direction) {
    let previousResizingState = 'active'
    let resizingState
    let position
    let resizing
    const node = this.node

    const item = this.getItem()

    if (this.state.resizing) {
      previousResizingState = this.state.resizing.state
    }

    if (direction === 'left') {
      position = this.originalResizeCoord.x - ev.clientX
    } else {
      position = ev.clientX - this.originalResizeCoord.x
    }

    // if for some reason the browser gives us the same position than the previous
    // then don't emit a event and don't update the selection
    if (position === this.prevPosition) {
      return
    }

    if (
      direction === 'left' &&
      this.minResizeLeft != null &&
      position <= 0 &&
      (this.minResizeLeft === 0 || position <= this.minResizeLeft)
    ) {
      position = this.minResizeLeft
    } else if (
      direction === 'right' &&
      this.minResizeRight != null &&
      position <= 0 &&
      (this.minResizeRight === 0 || position <= this.minResizeRight)
    ) {
      position = this.minResizeRight
    }

    if (direction === 'left') {
      if (this.maxResizeLeft != null && position > this.maxResizeLeft) {
        position = this.maxResizeLeft
      }
    } else {
      if (this.maxResizeRight != null && position > this.maxResizeRight) {
        position = this.maxResizeRight
      }
    }

    if (this.props.onResize) {
      resizingState = this.props.onResize({
        item,
        node,
        resize: {
          direction,
          position,
          prevPosition: this.prevPosition,
          minLeft: this.minResizeLeft,
          minRight: this.minResizeRight,
          maxLeft: this.maxResizeLeft,
          maxRight: this.maxResizeRight,
          x: ev.clientX,
          y: ev.clientY
        }
      })

      if (resizingState === false) {
        resizingState = 'invalid'
      } else if (resizingState === true) {
        resizingState = 'active'
      } else {
        resizingState = undefined
      }
    }

    this.prevPosition = position

    resizing = {
      direction,
      position
    }

    if (resizingState !== undefined) {
      resizing.state = resizingState
    } else {
      resizing.state = previousResizingState
    }

    this.setState({
      resizing
    })
  }

  handleResizeEnd (ev, direction) {
    const node = this.node

    const item = this.getItem()

    ev.preventDefault();
    ev.stopPropagation();

    if (this.props.onResizeEnd) {
      this.props.onResizeEnd({
        item,
        node,
        resize: {
          direction,
          position: this.state.resizing.position,
          prevPosition: this.prevPosition,
          minLeft: this.minResizeLeft,
          minRight: this.minResizeRight,
          maxLeft: this.maxResizeLeft,
          maxRight: this.maxResizeRight,
          x: ev.clientX,
          y: ev.clientY
        }
      })
    }

    this.originalResizeCoord = null
    this.prevPosition = null
    this.minResizeLeft = null
    this.minResizeRight = null
    this.maxResizeLeft = null
    this.maxResizeRight = null

    this.setState({
      resizing: null
    })
  }

  render () {
    const {
      numberOfCols,
      layoutMode,
      leftSpace,
      space,
      selection,
      components,
      onClickComponent
    } = this.props

    const {
      resizing
    } = this.state

    let extraProps = {}
    let itemStyles = {}

    if (resizing) {
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

    if (selection != null) {
      extraProps['data-selected'] = true
    }

    extraProps[`data-layout-${layoutMode}-mode`] = true

    return (
      <div
        ref={this.setItemNode}
        className="DesignItem"
        style={itemStyles}
        {...extraProps}
        onClick={this.handleClick}
      >
        {selection && (
          <Selection
            key="selection"
            ref={this.setSelectionNode}
            state={resizing ? resizing.state : undefined}
            left={resizing && resizing.direction === 'left' ? resizing.position : undefined}
            right={resizing && resizing.direction === 'right' ? resizing.position : undefined}
            onKeyDown={this.handleKeyDown}
            onResizeStart={this.handleResizeStart}
            onResize={this.handleResize}
            onResizeEnd={this.handleResizeEnd}
          />
        )}
        {components.map((component) => (
          <DesignComponent
            key={component.id}
            id={component.id}
            type={component.type}
            selected={selection && selection.component === component.id ? true : undefined}
            componentProps={component.props}
            onClick={onClickComponent}
          />
        ))}
      </div>
    )
  }
}

DesignItem.propTypes = {
  id: PropTypes.string,
  index: PropTypes.number.isRequired,
  numberOfCols: PropTypes.number.isRequired,
  layoutMode: PropTypes.oneOf(['grid', 'fixed']).isRequired,
  leftSpace: PropTypes.number,
  minSpace: PropTypes.number.isRequired,
  space: PropTypes.number.isRequired,
  selection: PropTypes.object,
  components: PropTypes.array.isRequired,
  onClickComponent: PropTypes.func,
  onRemoveComponent: PropTypes.func,
  onResizeStart: PropTypes.func,
  onResize: PropTypes.func,
  onResizeEnd: PropTypes.func
}

export default DesignItem
