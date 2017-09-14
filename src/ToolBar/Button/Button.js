import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './Button.css'

class Button extends Component {
  render () {
    const { title, titlePosition, text, icon, children, ...restProps } = this.props

    return (
      <div className="Button">
        {!children ? (
          <button {...restProps}>
            <span className={`fa fa-${icon != null ? icon : 'circle'}`}></span>
            {text != null && <span>{text}</span>}
          </button>
        ) : (
          children
        )}
        {title != null && (
          <span className={`Button-tooltip Button-tooltip-${titlePosition || 'top'}`}>{title}</span>
        )}
      </div>
    )
  }
}

Button.propTypes = {
  title: PropTypes.string,
  titlePosition: PropTypes.string,
  icon: PropTypes.string,
  text: PropTypes.string
}

export default Button
