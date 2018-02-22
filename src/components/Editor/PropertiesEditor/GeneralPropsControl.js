import React, { PureComponent, Component } from 'react'
import PropTypes from 'prop-types'
import generalProps from '../../../../shared/generalProps'

class BlockPropControl extends Component {
  constructor (props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange (ev) {
    const { name, onChange } = this.props

    onChange({
      propName: name,
      value: ev.target.checked === false ? undefined : true
    })
  }

  render () {
    const { value } = this.props

    return (
      <div>
        <input
          type='checkbox'
          checked={value != null ? value : false}
          style={{ marginLeft: '0px' }}
          onChange={this.handleChange}
        />
      </div>
    )
  }
}

BlockPropControl.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired
}

class GeneralPropsControl extends PureComponent {
  constructor (props) {
    super(props)

    this.propsNames = generalProps.propsNames

    this.handleGeneralPropChange = this.handleGeneralPropChange.bind(this)
  }

  handleGeneralPropChange ({ propName, value: propValue }) {
    const { value, onChange } = this.props
    let newValue = value != null ? value : {}

    if (!onChange) {
      return
    }

    if (propValue !== undefined) {
      newValue = {
        ...newValue,
        [propName]: propValue
      }
    } else {
      newValue = {
        ...newValue
      }

      delete newValue[propName]
    }

    if (Object.keys(newValue).length === 0) {
      newValue = undefined
    }

    onChange(newValue)
  }

  renderGeneralProp (generalProp) {
    const { name, bindingEnabled, getComponent, getPropMeta, getBindingMeta, onBindingEditorOpen } = this.props
    const generalPropsValue = this.props.value != null ? this.props.value : {}
    const meta = getPropMeta(`${name}.${generalProp}`)
    const displayName = meta && meta.displayName ? meta.displayName : generalProp
    const component = getComponent()
    const bindingName = `@${name}.${generalProp}`
    const isSpecialValue = component.bindings != null && component.bindings[bindingName] != null

    let content

    if (generalProp === 'block') {
      content = (
        <BlockPropControl
          name={generalProp}
          value={generalPropsValue[generalProp]}
          onChange={this.handleGeneralPropChange}
        />
      )
    } else {
      content = (
        <span>"{generalProp}" not implemented</span>
      )
    }

    return (
      <div key={generalProp} className='propertiesEditor-prop'>
        <div>
          <label>{`${displayName} `}</label>
          <div className='propertiesEditor-prop-controls'>
            {meta && meta.allowsBinding !== false && (
              <button
                className='propertiesEditor-button'
                disabled={bindingEnabled === false}
                title='Edit Binding'
                onClick={onBindingEditorOpen}
              >
                <span className='fa fa-bolt' />
              </button>
            )}
          </div>
        </div>
        {isSpecialValue ? (
          <input
            className={isSpecialValue ? 'propertiesEditor-prop-special-value' : ''}
            type='text'
            readOnly
            value={getBindingMeta(bindingName, 'displayName')}
          />
        ) : content}
      </div>
    )
  }

  render () {
    const { propsNames } = this

    return [
      propsNames.map((propName) => (
        this.renderGeneralProp(propName)
      ))
    ]
  }
}

GeneralPropsControl.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  bindingEnabled: PropTypes.bool,
  getComponent: PropTypes.func,
  getPropMeta: PropTypes.func,
  getBindingMeta: PropTypes.func,
  onBindingEditorOpen: PropTypes.func,
  onChange: PropTypes.func
}

export default GeneralPropsControl
