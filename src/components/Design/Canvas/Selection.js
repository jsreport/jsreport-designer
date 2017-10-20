import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Resizer from './Resizer'
import './Selection.css'

class Selection extends Component {
  render () {
    const {
      state,
      left,
      right,
      onKeyDown,
      onResizeStart,
      onResize,
      onResizeEnd,
      isResizing
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
          onResizeStart={onResizeStart}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
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
          onResizeStart={onResizeStart}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
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
  isResizing: PropTypes.bool,
  onKeyDown: PropTypes.func,
  onResizeStart: PropTypes.func,
  onResize: PropTypes.func,
  onResizeEnd: PropTypes.func
}

@observer
class ObservableSelection extends Component {
  render () {
    const { element, ...restProps } = this.props
    const { resizing } = element

    const selectionProps = {
      state: resizing ? resizing.state : undefined,
      left: resizing && resizing.direction === 'left' ? resizing.position : undefined,
      right: resizing && resizing.direction === 'right' ? resizing.position : undefined,
      isResizing: element.isResizing
    }

    return (
      <Selection {...selectionProps} {...restProps} />
    )
  }
}

ObservableSelection.propTypes = {
  element: MobxPropTypes.observableObject.isRequired
}

export default ObservableSelection
