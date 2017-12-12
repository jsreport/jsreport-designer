import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import componentRegistry from '../../../shared/componentRegistry'
import CommandButton from '../CommandButton'

class TemplateEditor extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      editedTemplate: props.template != null ? props.template : (
        componentRegistry.getComponent(props.componentType).template()
      ),
      isDirty: false
    }

    this.setTextAreaNode = this.setTextAreaNode.bind(this)
    this.isCustomTemplate = this.isCustomTemplate.bind(this)

    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleGetOriginalTemplateClick = this.handleGetOriginalTemplateClick.bind(this)
    this.handleSave = this.handleSave.bind(this)
  }

  setTextAreaNode (el) {
    this.textAreaNode = el
  }

  isCustomTemplate (currentTemplate) {
    const { componentType } = this.props
    let original = componentRegistry.getComponent(componentType).template()

    return original !== currentTemplate
  }

  handleInputChange (ev) {
    this.setState({
      isDirty: true,
      editedTemplate: ev.target.value
    })
  }

  handleGetOriginalTemplateClick () {
    const { componentType } = this.props

    this.setState({
      isDirty: true,
      editedTemplate: componentRegistry.getComponent(componentType).template()
    })
  }

  handleSave () {
    let newTemplate = this.textAreaNode.value
    const { onSave } = this.props

    this.setState({
      isDirty: false
    })

    if (onSave) {
      onSave(this.isCustomTemplate(newTemplate) ? newTemplate : null)
    }
  }

  render () {
    const { componentType, onClose } = this.props
    const { isDirty, editedTemplate } = this.state

    return (
      <div
        style={{
          position: 'fixed',
          top: '85px',
          left: '10px',
          zIndex: 100,
          color: '#000',
          backgroundColor: 'yellow',
          padding: '8px',
          width: '350px'
        }}
      >
        <h3 style={{ marginTop: '0.3rem', marginBottom: '0.3rem' }}>
          Component Template Editor - {`${componentType}${isDirty ? '*' : ''}`}
        </h3>
        <br />
        <div style={{ fontSize: '0.7rem' }}>
          Change here the template of the component
        </div>
        <br />
        <div>
          <CommandButton
            title='Get original template'
            icon='refresh'
            onClick={this.handleGetOriginalTemplateClick}
          />
        </div>
        <br />
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', right: 0 }}>
            <span style={{
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              paddingLeft: '0.3rem',
              paddingRight: '0.3rem'
            }}>
              {this.isCustomTemplate(this.state.editedTemplate) ? 'Custom' : 'Original'}
            </span>
          </div>
          <textarea
            ref={this.setTextAreaNode}
            style={{ overflow: 'auto', resize: 'none', width: '100%', marginTop: '1rem' }}
            rows='25'
            value={editedTemplate}
            onChange={this.handleInputChange}
          />
        </div>
        <br />
        <button onClick={this.handleSave}>Save</button>
        {' '}
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
}

TemplateEditor.propTypes = {
  componentType: PropTypes.string.isRequired,
  template: PropTypes.string,
  onSave: PropTypes.func,
  onClose: PropTypes.func
}

export default TemplateEditor
