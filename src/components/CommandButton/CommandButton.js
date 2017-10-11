import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './CommandButton.css'

class CommandButton extends Component {
  render () {
    const { title, titlePosition, text, icon, children, ...restProps } = this.props

    return (
      <div className="CommandButton">
        {!children ? (
          <button {...restProps}>
            <span className={`fa fa-${icon != null ? icon : 'circle'}`}></span>
            {text != null && <span>{text}</span>}
          </button>
        ) : (
          children
        )}
        {title != null && (
          <span className={`CommandButton-tooltip CommandButton-tooltip-${titlePosition || 'top'}`}>{title}</span>
        )}
      </div>
    )
  }
}

CommandButton.propTypes = {
  title: PropTypes.string,
  titlePosition: PropTypes.string,
  icon: PropTypes.string,
  text: PropTypes.string
}

export default CommandButton
