import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styles from './NumericInput.scss'

let events = {
  mouseup: function (ev) {
    if (!this.currentTarget) {
      return
    }

    this.currentTarget.handleSwipeMouseUp(ev)
  },
  mousemove: function (ev) {
    if (!this.currentTarget) {
      return
    }

    this.currentTarget.handleSwipeMouseMove(ev)
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

class NumericInput extends Component {
  constructor (props) {
    super(props)

    this.originalMoveData = null

    this.state = {
      text: null
    }

    this.sanitizeValue = this.sanitizeValue.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleSwipeMouseDown = this.handleSwipeMouseDown.bind(this)
    this.handleSwipeMouseMove = this.handleSwipeMouseMove.bind(this)
    this.handleSwipeMouseUp = this.handleSwipeMouseUp.bind(this)
  }

  componentDidMount () {
    events.addListeners(window)
  }

  componentWillUnmount () {
    events.removeListeners()
    events.currentTarget = null
  }

  sanitizeValue (oldValue, { newValue, step }) {
    const numRegExp = /^(-\d+\.\d+|\d+\.\d+|-\d+|\d+)(.*)$/
    const { min, max } = this.props
    let evaluatedValue
    let text

    if (min != null && oldValue < min) {
      oldValue = min
    } else if (max != null && oldValue > max) {
      oldValue = max
    }

    if (newValue != null) {
      if (newValue === '') {
        evaluatedValue = undefined
      } else {
        const matches = newValue.match(numRegExp)
        let matchedValue

        if (matches != null) {
          matchedValue = matches[1]
          evaluatedValue = matchedValue

          if (matches[0].slice(-1) === '.') {
            text = matches[0]
          }
        }
      }
    } else if (step != null) {
      if (oldValue == null) {
        evaluatedValue = 1
        evaluatedValue += step
      } else {
        const matches = String(oldValue).match(numRegExp)
        let matchedValue = matches[1]
        let decimal

        if (matchedValue.indexOf('.') !== -1) {
          const parts = matchedValue.split('.')

          decimal = parts[1]
          evaluatedValue = Number(parts[0])
        } else {
          evaluatedValue = Number(matchedValue)
        }

        evaluatedValue += step

        if (decimal != null) {
          evaluatedValue = parseFloat(`${evaluatedValue}.${decimal}`)
        }
      }
    }

    if (evaluatedValue == null) {
      return {
        value: undefined,
        text: ''
      }
    }

    evaluatedValue = !isNaN(Number(evaluatedValue)) ? parseFloat(evaluatedValue) : undefined

    if (evaluatedValue == null || evaluatedValue > Number.MAX_SAFE_INTEGER) {
      // invalid input just return previous value
      evaluatedValue = oldValue
      text = undefined
    }

    if (min != null && evaluatedValue < min) {
      evaluatedValue = min
      text = undefined
    } else if (max != null && evaluatedValue > max) {
      evaluatedValue = max
      text = undefined
    }

    if (text == null) {
      text = String(evaluatedValue)
    }

    return {
      value: evaluatedValue,
      text
    }
  }

  handleInputChange (ev) {
    const { value, onChange } = this.props
    const { sanitizeValue } = this
    const currentValue = ev.target.value
    const result = sanitizeValue(value, { newValue: currentValue.trim() })

    if (String(result.value) !== result.text) {
      this.setState({ text: result.text })
    } else {
      this.setState({ text: null })
    }

    onChange(result.value)
  }

  handleSwipeMouseDown (ev) {
    let isLeftClick
    let event = ev.nativeEvent
    const { value } = this.props

    ev.preventDefault()
    ev.stopPropagation()

    // left click detection
    // https://stackoverflow.com/a/12737882/4111743
    if (event.buttons != null) {
      isLeftClick = event.buttons === 1
    } else if (event.which != null) {
      isLeftClick = event.which === 1
    } else {
      isLeftClick = event.button === 1
    }

    if (!isLeftClick) {
      return
    }

    this.originalMoveData = {
      x: ev.clientX,
      y: ev.clientY,
      value
    }

    // we need this to not loose the resize cursor when resizing
    document.body.classList.add('resizing-control-y')

    events.currentTarget = this
  }

  handleSwipeMouseMove (ev) {
    const { onChange } = this.props
    const { originalMoveData, sanitizeValue } = this
    const inc = 1
    const step = Math.floor((originalMoveData.y - ev.clientY) / 2) * inc
    const result = sanitizeValue(originalMoveData.value, { step })

    if (String(result.value) !== result.text) {
      this.setState({ text: result.text })
    } else {
      this.setState({ text: null })
    }

    onChange(result.value)
  }

  handleSwipeMouseUp (ev) {
    events.currentTarget = null
    this.originalMoveData = null

    // we need to remove the class a little later to keep
    // component selection active.
    // (because some browsers fire mouse click event after mouse events and
    // we have some logic to clear selection when a click event occurs)
    setTimeout(() => {
      document.body.classList.remove('resizing-control-y')
    }, 100)
  }

  render () {
    const { text } = this.state
    const { value } = this.props

    return (
      <div className={styles.container}>
        <input
          type='text'
          className={styles.input}
          value={text != null ? text : value == null ? '' : value}
          onChange={this.handleInputChange}
        />
        <span
          className={styles.swipe}
          onMouseDown={this.handleSwipeMouseDown}
        >
          <i />
        </span>
      </div>
    )
  }
}

NumericInput.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
  value: PropTypes.number,
  onChange: PropTypes.func
}

export default NumericInput
