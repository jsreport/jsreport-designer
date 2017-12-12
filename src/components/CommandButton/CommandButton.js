import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styles from './CommandButton.scss'

class CommandButton extends Component {
  render () {
    const { title, titlePosition, text, icon, children, ...restProps } = this.props
    let positionStyle

    if (titlePosition === 'top' || titlePosition == null) {
      positionStyle = styles.commandButtonTooltipTop
    } else if (titlePosition === 'bottom') {
      positionStyle = styles.commandButtonTooltipBottom
    } else {
      positionStyle = ''
    }

    return (
      <div className={styles.commandButton}>
        {!children ? (
          <button {...restProps}>
            <span className={`fa fa-${icon != null ? icon : 'circle'}`} />
            {text != null && <span>{text}</span>}
          </button>
        ) : (
          children
        )}
        {title != null && (
          <span className={`${styles.commandButtonTooltip} ${positionStyle}`}>{title}</span>
        )}
      </div>
    )
  }
}

CommandButton.propTypes = {
  title: PropTypes.string,
  titlePosition: PropTypes.string,
  icon: PropTypes.string,
  text: PropTypes.string,
  children: PropTypes.element
}

export default CommandButton
