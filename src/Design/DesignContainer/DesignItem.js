import React, { PureComponent } from 'react'
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
    this.maxResizeLeft = null
    this.maxResizeRight = null

    this.setNode = this.setNode.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleResizeStart = this.handleResizeStart.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.handleResizeEnd = this.handleResizeEnd.bind(this)
  }

  getWidthInPercentage ({ numberOfCols, consumedCols }) {
    return 100 / (numberOfCols / consumedCols)
  }

  setNode (el) {
    this.node = el
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

    const item = {
      id: this.props.id,
      index: this.props.index,
      layoutMode: this.props.layoutMode,
      space: this.props.space,
      leftSpace: this.props.leftSpace,
      components: this.props.components
    }

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

      resizeLimits = (resizeLimits == null) ? { maxLeft: undefined, maxRight: undefined } : resizeLimits
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

    const item = {
      id: this.props.id,
      index: this.props.index,
      layoutMode: this.props.layoutMode,
      space: this.props.space,
      leftSpace: this.props.leftSpace,
      components: this.props.components
    }

    if (this.state.resizing) {
      previousResizingState = this.state.resizing.state
    }

    if (direction === 'left') {
      position = this.originalResizeCoord.x - ev.clientX
    } else {
      position = ev.clientX - this.originalResizeCoord.x
    }

    position = position < 0 ? 0 : position

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

    const item = {
      id: this.props.id,
      index: this.props.index,
      layoutMode: this.props.layoutMode,
      space: this.props.space,
      leftSpace: this.props.leftSpace,
      components: this.props.components
    }

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
          maxLeft: this.maxResizeLeft,
          maxRight: this.maxResizeRight,
          x: ev.clientX,
          y: ev.clientY
        }
      })
    }

    this.originalResizeCoord = null
    this.prevPosition = null
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
        ref={this.setNode}
        className="DesignItem"
        style={itemStyles}
        {...extraProps}
        onClick={this.handleClick}
      >
        {selection && (
          <Selection
            key="selection"
            state={resizing ? resizing.state : undefined}
            left={resizing && resizing.direction === 'left' ? resizing.position : undefined}
            right={resizing && resizing.direction === 'right' ? resizing.position : undefined}
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
  space: PropTypes.number.isRequired,
  selection: PropTypes.object,
  components: PropTypes.array.isRequired,
  onClickComponent: PropTypes.func,
  onResizeStart: PropTypes.func,
  onResize: PropTypes.func,
  onResizeEnd: PropTypes.func
}

export default DesignItem
