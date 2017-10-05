import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Resizer from './Resizer'
import './Selection.css'

class Selection extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      isResizing: false
    }

    this.handleResizeStart = this.handleResizeStart.bind(this)
    this.handleResizeEnd = this.handleResizeEnd.bind(this)
  }

  handleResizeStart (...args) {
    if (this.props.onResizeStart) {
      this.props.onResizeStart.apply(undefined, args)
    }

    this.setState({
      isResizing: true
    })
  }

  handleResizeEnd (...args) {
    if (this.props.onResizeEnd) {
      this.props.onResizeEnd.apply(undefined, args)
    }

    this.setState({
      isResizing: false
    })
  }

  render () {
    const { isResizing } = this.state

    const {
      state,
      left,
      right,
      onKeyDown,
      onResize
    } = this.props

    let styles = {}
    let space = 5
    let extraProps = {}

    if (left != null) {
      styles.left = `${(left * -1) - space}px`
    } else {
      styles.left = `${space * -1}px`
    }

    if (right != null) {
      styles.right = `${(right * -1) - space}px`
    } else {
      styles.right = `${space * -1}px`
    }

    if (state === 'default') {
      styles.borderColor = '#18449e'
    } else if (state === 'active') {
      styles.borderColor = '#1b8ac7'
    } else if (state === 'invalid') {
      styles.borderColor = '#c54040'
    }

    if (isResizing) {
      extraProps['data-resizing'] = true
    }

    return [
      <div
        key="selection"
        className="Selection Selection-top Selection-bottom"
        style={styles}
        // tab index necessary to make key events to work
        tabIndex="0"
        draggable={false}
        {...extraProps}
        onKeyDown={onKeyDown}
      />,
      <div
        key="selection-left"
        className="Selection Selection-left"
        style={{ left: styles.left, borderColor: styles.borderColor }}
        // tab index necessary to make key events to work
        tabIndex="1"
        draggable={false}
        {...extraProps}
        onKeyDown={onKeyDown}
      >
        <Resizer
          key="resize-left-picker"
          direction="left"
          onResizeStart={this.handleResizeStart}
          onResize={onResize}
          onResizeEnd={this.handleResizeEnd}
        />
      </div>,
      <div
        key="selection-right"
        className="Selection Selection-right"
        style={{ right: styles.right, borderColor: styles.borderColor }}
        // tab index necessary to make key events to work
        tabIndex="2"
        draggable={false}
        {...extraProps}
        onKeyDown={onKeyDown}
      >
        <Resizer
          key="resize-right-picker"
          direction="right"
          onResizeStart={this.handleResizeStart}
          onResize={onResize}
          onResizeEnd={this.handleResizeEnd}
        />
      </div>
    ]
  }
}

Selection.defaultProps = {
  state: 'default'
}

Selection.propTypes = {
  state: PropTypes.oneOf(['default', 'active', 'invalid']),
  left: PropTypes.number,
  right: PropTypes.number,
  onKeyDown: PropTypes.func,
  onResizeStart: PropTypes.func,
  onResize: PropTypes.func,
  onResizeEnd: PropTypes.func
}

export default Selection
