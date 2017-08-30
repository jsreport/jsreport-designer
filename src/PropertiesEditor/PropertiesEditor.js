import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import './PropertiesEditor.css'

class PropertiesEditor extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      properties: {
        ...props.properties
      }
    }

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange (ev) {
    const { type, onChange } = this.props
    let target = ev.target
    let valid = true

    this.setState((prevState) => {
      let newProps = {
        ...prevState.properties,
        [target.name]: target.value
      }

      if (type === 'Image' && (target.name === 'width' || target.name === 'height')) {
        valid = target.value != null && !isNaN(target.value)

        if (valid) {
          newProps[target.name] = target.value !== '' ? Number(target.value) : 0
        }
      }

      if (!valid) {
        return
      }

      onChange(newProps)

      return {
        properties: newProps
      }
    })
  }

  render () {
    const {
      type,
      properties
    } = this.props

    return (
      <div className="PropertiesEditor">
        <div className="PropertiesEditor-content">
          <h3 className="PropertiesEditor-title">{type}</h3>
          <hr className="PropertiesEditor-separator" />
          {Object.keys(properties).map((propName) => {
            return (
              <div key={propName} className="PropertiesEditor-prop">
                <label>{propName}</label>
                <input
                  type="text"
                  name={propName}
                  value={this.state.properties[propName]}
                  onChange={this.handleChange}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}

PropertiesEditor.propTypes = {
  type: PropTypes.string.isRequired,
  properties: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

export default PropertiesEditor
