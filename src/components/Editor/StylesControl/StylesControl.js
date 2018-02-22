import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { generalStyles, generalStylesDefinition } from '../../../lib/configuration'

class StylesControl extends PureComponent {
  constructor (props) {
    super(props)

    this.styles = generalStyles
    this.stylesDefinition = generalStylesDefinition

    this.handleBindingClick = this.handleBindingClick.bind(this)
    this.handleStyleChange = this.handleStyleChange.bind(this)
  }

  handleBindingClick (styleName, styleDisplayName) {
    const { onBindingEditorOpen } = this.props

    onBindingEditorOpen({
      options: {
        styleName,
        styleDisplayName
      }
    })
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
    const { name, bindingEnabled, getComponent, getBindingMeta } = this.props
    const rootStyle = this.props.value != null ? this.props.value : {}
    const styleDef = stylesDefinition[style]
    const component = getComponent()
    const bindingName = `@${name}.${style}`
    const isSpecialValue = component.bindings != null && component.bindings[bindingName] != null

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
              disabled={bindingEnabled === false}
              title='Edit Binding'
              onClick={() => this.handleBindingClick(style, displayName)}
            >
              <span className='fa fa-bolt' />
            </button>
          </div>
        </div>
        {isSpecialValue ? (
          <input
            className={isSpecialValue ? 'propertiesEditor-prop-special-value' : ''}
            type='text'
            readOnly
            value={getBindingMeta(bindingName, 'displayName')}
          />
        ) : (
          React.createElement(control, {
            name: style,
            value: rootStyle[style],
            onChange: this.handleStyleChange
          })
        )}
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
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  bindingEnabled: PropTypes.bool,
  getComponent: PropTypes.func,
  getBindingMeta: PropTypes.func,
  onBindingEditorOpen: PropTypes.func,
  onChange: PropTypes.func
}

export default StylesControl
