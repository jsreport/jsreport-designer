import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { generalStyles, generalStylesDefinition } from '../../../lib/configuration'

class StylesControl extends PureComponent {
  constructor (props) {
    super(props)

    this.styles = generalStyles
    this.stylesDefinition = generalStylesDefinition

    this.handleStyleChange = this.handleStyleChange.bind(this)
  }

  handleStyleChange ({ styleName, value: styleValue }) {
    const { value, onChange } = this.props
    let newStyle = value != null ? value : {}

    if (!onChange) {
      return
    }

    if (styleValue !== undefined) {
      newStyle = {
        ...newStyle,
        [styleName]: styleValue
      }
    } else {
      newStyle = {
        ...newStyle
      }

      delete newStyle[styleName]
    }

    if (Object.keys(newStyle).length === 0) {
      newStyle = undefined
    }

    onChange(newStyle)
  }

  renderStyle (style) {
    const { stylesDefinition } = this
    const { onBindingEditorOpen } = this.props
    const rootStyle = this.props.value != null ? this.props.value : {}
    const styleDef = stylesDefinition[style]

    if (styleDef == null) {
      return null
    }

    const { displayName, control } = styleDef

    if (control == null) {
      return null
    }

    return (
      <div key={style} className='propertiesEditor-prop'>
        <div>
          <label>{`${displayName || style} `}</label>
          <div className='propertiesEditor-prop-controls'>
            <button
              className='propertiesEditor-button'
              title='Edit Binding'
              onClick={(ev) => { ev.preventDefault(); onBindingEditorOpen() }}
            >
              <span className='fa fa-bolt' />
            </button>
          </div>
        </div>
        {React.createElement(control, {
          name: style,
          value: rootStyle[style],
          onChange: this.handleStyleChange
        })}
      </div>
    )
  }

  render () {
    const { styles } = this

    return [
      styles.map((style) => (
        this.renderStyle(style)
      ))
    ]
  }
}

StylesControl.propTypes = {
  value: PropTypes.any,
  onBindingEditorOpen: PropTypes.func,
  onChange: PropTypes.func
}

export default StylesControl
