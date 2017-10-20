import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import './Resizer.css'

let events = {
  mouseup: function (ev) {
    if (!this.currentTarget) {
      return
    }

    this.currentTarget.onMouseUp(ev)
  },
  mousemove: function (ev) {
    if (!this.currentTarget) {
      return
    }

    this.currentTarget.onMouseMove(ev)
  },
  addListeners: function (targetNode) {
    let mouseUpListener
    let mouseMoveListener

    if (this.isListening()) {
      return
    }

    mouseUpListener = this.mouseup.bind(this)
    mouseMoveListener = this.mousemove.bind(this)

    targetNode.addEventListener('mouseup', mouseUpListener)
    targetNode.addEventListener('mousemove', mouseMoveListener)

    this.__targetNode = targetNode

    this.__removeListeners = () => {
      targetNode.removeEventListener('mouseup', mouseUpListener)
      targetNode.removeEventListener('mousemove', mouseMoveListener)
    }
  },
  removeListeners: function () {
    if (this.__removeListeners) {
      this.__removeListeners()
      delete this.__removeListeners
      delete this.__targetNode
    }
  },
  isListening: function (eventName) {
    return this.__removeListeners != null
  },
  currentTarget: null
}

class Resizer extends PureComponent {
  constructor (props) {
    super(props)

    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
  }

  componentDidMount () {
    events.addListeners(window)
  }

  componentWillUnmount () {
    events.removeListeners()
    events.currentTarget = null
  }

  onMouseDown (ev) {
    let isLeftClick
    let event = ev.nativeEvent

    // left click detection
    // https://stackoverflow.com/a/12737882/4111743
    if (event.buttons != null) {
      isLeftClick = event.buttons === 1;
    } else if (event.which != null) {
      isLeftClick = event.which === 1;
    } else {
      isLeftClick = event.button === 1;
    }

    if (!isLeftClick) {
      return
    }

    events.currentTarget = this

    if (this.props.onResizeStart) {
      this.props.onResizeStart(ev, this.props.direction)
    }
  }

  onMouseMove (ev) {
    if (this.props.onResize) {
      this.props.onResize(ev, this.props.direction)
    }
  }

  onMouseUp (ev) {
    events.currentTarget = null

    if (this.props.onResizeEnd) {
      this.props.onResizeEnd(ev, this.props.direction)
    }
  }

  render () {
    const {
      direction
    } = this.props

    let className = (direction === 'left') ? 'ResizerLeft' : 'ResizerRight'

    return (
      <div
        className={className}
        draggable={false}
        onMouseDown={this.onMouseDown}
      />
    )
  }
}

Resizer.propTypes = {
  direction: PropTypes.oneOf(['left', 'right']).isRequired,
  onResizeStart: PropTypes.func,
  onResize: PropTypes.func,
  onResizeEnd: PropTypes.func
}

export default Resizer
