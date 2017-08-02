import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Resizer from './Resizer'
import './Selection.css'

class Selection extends PureComponent {
  render () {
    const {
      state,
      left,
      right,
      onResizeStart,
      onResize,
      onResizeEnd
    } = this.props

    let styles = {}
    let space = 4

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

    return (
      <div className="Selection" style={styles} draggable={false}>
        <Resizer
          key="resize-left-picker"
          direction="left"
          onResizeStart={onResizeStart}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
        />
        <Resizer
          key="resize-right-picker"
          direction="right"
          onResizeStart={onResizeStart}
          onResize={onResize}
          onResizeEnd={onResizeEnd}
        />
      </div>
    )
  }
}

Selection.defaultProps = {
  state: 'default'
}

Selection.propTypes = {
  state: PropTypes.oneOf(['default', 'active', 'invalid']),
  left: PropTypes.number,
  right: PropTypes.number,
  onResizeStart: PropTypes.func,
  onResize: PropTypes.func,
  onResizeEnd: PropTypes.func
}

export default Selection
