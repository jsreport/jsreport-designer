import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ChromeColorPicker from 'react-color/lib/components/chrome/Chrome'
import styles from './ColorPicker.scss'

class ColorPicker extends Component {
  constructor (props) {
    super(props)

    this.state = {
      displayColorPicker: false
    }

    this.handleOpen = this.handleOpen.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleRemove = this.handleRemove.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  handleOpen () {
    this.setState(({ displayColorPicker }) => ({
      displayColorPicker: !displayColorPicker
    }))
  }

  handleChange (color) {
    const { onChange } = this.props

    onChange(color.rgb)
  }

  handleRemove (ev) {
    ev.stopPropagation()

    const { onChange } = this.props

    onChange(undefined)
  }

  handleClose () {
    this.setState({ displayColorPicker: false })
  }

  render () {
    const { value } = this.props
    const { displayColorPicker } = this.state

    const colorStyle = value != null ? {
      backgroundColor: `rgba(${value.r}, ${value.g}, ${value.b}, ${value.a})`
    } : {}

    return (
      <div className={styles.container}>
        <div className={styles.swatch} onClick={this.handleOpen}>
          <div
            className={styles.remove}
            onClick={this.handleRemove}
            style={{ display: value == null ? 'none' : 'block' }}
          >
            <span className={styles.removeButton}>x</span>
          </div>
          <div className={styles.color} style={colorStyle}>
            <span style={{ visibility: value == null ? 'visible' : 'hidden' }}>none</span>
          </div>
        </div>
        {displayColorPicker && (
          <div className={styles.popover}>
            <div className={styles.cover} onClick={this.handleClose} />
            <ChromeColorPicker
              color={value == null ? '#fff' : value}
              onChangeComplete={this.handleChange}
            />
          </div>
        )}
      </div>
    )
  }
}

ColorPicker.propTypes = {
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired
}

export default ColorPicker
