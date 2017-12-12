import React, { Component } from 'react'
import PropTypes from 'prop-types'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Resizer from './Resizer'
import styles from './Selection.scss'

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

    let inlineStyles = {}
    let space = 5
    let extraProps = {}

    if (left != null) {
      inlineStyles.left = `${(left * -1) - space}px`
    } else {
      inlineStyles.left = `${space * -1}px`
    }

    if (right != null) {
      inlineStyles.right = `${(right * -1) - space}px`
    } else {
      inlineStyles.right = `${space * -1}px`
    }

    if (state === 'default') {
      inlineStyles.borderColor = '#18449e'
    } else if (state === 'active') {
      inlineStyles.borderColor = '#1b8ac7'
    } else if (state === 'invalid') {
      inlineStyles.borderColor = '#c54040'
    }

    if (isResizing) {
      extraProps['data-resizing'] = true
    }

    return [
      <div
        key='selection'
        className={`${styles.selection} ${styles.selectionTop} ${styles.selectionBottom}`}
        style={inlineStyles}
        // tab index necessary to make key events to work
        tabIndex='0'
        draggable={false}
        {...extraProps}
        onKeyDown={onKeyDown}
      />,
      <div
        key='selection-left'
        className={`${styles.selection} ${styles.selectionLeft}`}
        style={{ left: inlineStyles.left, borderColor: inlineStyles.borderColor }}
        // tab index necessary to make key events to work
        tabIndex='1'
        draggable={false}
        {...extraProps}
        onKeyDown={onKeyDown}
      >
        <Resizer
          key='resize-left-picker'
          direction='left'
          onResizeStart={onResizeStart}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
        />
      </div>,
      <div
        key='selection-right'
        className={`${styles.selection} ${styles.selectionRight}`}
        style={{ right: inlineStyles.right, borderColor: inlineStyles.borderColor }}
        // tab index necessary to make key events to work
        tabIndex='2'
        draggable={false}
        {...extraProps}
        onKeyDown={onKeyDown}
      >
        <Resizer
          key='resize-right-picker'
          direction='right'
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
