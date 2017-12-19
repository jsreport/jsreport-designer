import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styles from './Button.scss'

class Button extends Component {
  constructor (props) {
    super(props)

    this.onToggle = this.onToggle.bind(this)
  }

  onToggle (ev) {
    ev.preventDefault()

    if (this.props.onToggle) {
      this.props.onToggle(this.props.context)
    }
  }

  render () {
    const { label, icon } = this.props
    let className = styles.button

    if (this.props.active) {
      className += ` ${styles.buttonActive}`
    }

    return (
      <span className={className} onMouseDown={this.onToggle}>
        {icon ? (
          <span className={`fa fa-${icon}`} title={label} />
        ) : (
          label
        )}
      </span>
    )
  }
}

Button.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  context: PropTypes.string,
  active: PropTypes.bool,
  onToggle: PropTypes.func
}

export default Button
