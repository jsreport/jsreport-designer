import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer, inject } from 'mobx-react'
import omit from 'lodash/omit'
import componentRegistry from '@local/shared/componentRegistry'
import CommandButton from '../CommandButton'
import { componentTypes } from '../../lib/configuration'
import TemplateEditor from './TemplateEditor'
import RichContentEditor from './RichContentEditor'
import BindToDataEditor from './BindToDataEditor'
import './ComponentEditor.css'

@inject((injected) => ({
  dataInput: injected.dataInputStore.value,
  updateComponent: injected.designsActions.updateComponent
}))
@observer
class ComponentEditor extends Component {
  constructor (props) {
    super(props)

    this.state = {
      editComponentTemplate: null,
      bindToDataEditor: null,
      richContentEditor: null
    }

    this.meta = componentRegistry.getComponentDefinition(props.type) || {}

    this.changesInterceptor = null

    this.connectToChangesInterceptor = this.connectToChangesInterceptor.bind(this)
    this.getPropMeta = this.getPropMeta.bind(this)
    this.getValue = this.getValue.bind(this)
    this.handleEditComponentTemplateClick = this.handleEditComponentTemplateClick.bind(this)
    this.handleBindToDataClick = this.handleBindToDataClick.bind(this)
    this.handleEditRichContentClick = this.handleEditRichContentClick.bind(this)
    this.handleTemplateEditorSave = this.handleTemplateEditorSave.bind(this)
    this.handleBindToDataEditorSave = this.handleBindToDataEditorSave.bind(this)
    this.handleEditRichContentSave = this.handleEditRichContentSave.bind(this)
    this.handleTemplateEditorClose = this.handleTemplateEditorClose.bind(this)
    this.handleBindToDataEditorClose = this.handleBindToDataEditorClose.bind(this)
    this.handleEditRichContentClose = this.handleEditRichContentClose.bind(this)
    this.handleChanges = this.handleChanges.bind(this)
    this.handlePropChange = this.handlePropChange.bind(this)
    this.renderPropertiesEditor = this.renderPropertiesEditor.bind(this)
  }

  componentWillUnmount () {
    this.changesInterceptor = null
  }

  connectToChangesInterceptor (changesInterceptor) {
    this.changesInterceptor = changesInterceptor
  }

  getPropertiesEditor (type) {
    return componentTypes[type].propertiesEditor
  }

  getPropMeta (propName) {
    let propsMeta = this.meta.propsMeta != null ? this.meta.propsMeta : {}
    let keys = propName == null ? '' : propName.split('.')
    let context = propsMeta
    let result

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i]

      context = this.getValue(context, key)

      if (i === keys.length - 1) {
        result = context
        break
      }

      if (
        context == null ||
        typeof context !== 'object' ||
        typeof context.properties !== 'object'
      ) {
        result = context
        break
      }

      context = context.properties
      result = context
    }

    return result
  }

  getValue (collection, name) {
    if (collection == null) {
      return {}
    }

    if (name != null) {
      return collection[name]
    }

    return collection
  }

  handleEditComponentTemplateClick () {
    if (!this.state.editComponentTemplate) {
      this.setState({
        editComponentTemplate: true
      })
    } else {
      this.setState({
        editComponentTemplate: null
      })
    }
  }

  handleBindToDataClick ({ propName, bindingName, context, dataProperties }) {
    let bindings = this.props.bindings || {}
    let propMeta = this.getPropMeta(propName) || {}
    let targetBindingName = bindingName != null ? bindingName : propName

    if (!this.state.bindToDataEditor) {
      let stateToUpdate = {
        bindToDataEditor: {
          propName,
          context
        }
      }

      stateToUpdate.bindToDataEditor.bindingName = targetBindingName

      if (dataProperties != null) {
        stateToUpdate.bindToDataEditor.dataProperties = dataProperties
      }

      if (bindings[targetBindingName] && bindings[targetBindingName].defaultExpression != null) {
        stateToUpdate.bindToDataEditor.selectedField = {
          expression: bindings[targetBindingName].defaultExpression.value,
          meta: bindings[targetBindingName].defaultExpression.meta,
        }
      }

      if (propMeta == null) {
        stateToUpdate.bindToDataEditor.allowedTypes = ['scalar']
      } else if (Array.isArray(propMeta.allowedBindingValueTypes) || typeof propMeta.allowedBindingValueTypes === 'string') {
        stateToUpdate.bindToDataEditor.allowedTypes = !Array.isArray(propMeta.allowedBindingValueTypes) ? [propMeta.allowedBindingValueTypes] : propMeta.allowedBindingValueTypes
      } else {
        stateToUpdate.bindToDataEditor.allowedTypes = []
      }

      this.setState(stateToUpdate)
    } else {
      this.setState({
        bindToDataEditor: null
      })
    }
  }

  handleEditRichContentClick ({ propName, bindingName, context }) {
    let properties = this.props.properties
    let bindings = this.props.bindings || {}
    let targetBindingName = bindingName != null ? bindingName : propName

    if (!this.state.richContentEditor) {
      let currentBinding = bindings[targetBindingName]
      let currentContent

      if (currentBinding && currentBinding.richContent != null) {
        currentContent = currentBinding.richContent.content
      } else if (typeof properties[propName] === 'string') {
        currentContent = properties[propName]
      }

      this.setState({
        richContentEditor: {
          propName,
          context,
          content: currentContent
        }
      })
    } else {
      this.setState({
        richContentEditor: null
      })
    }
  }

  handleTemplateEditorSave (template) {
    const handleChanges = this.handleChanges

    handleChanges({
      origin: 'template',
      propName: undefined,
      changes: { template }
    })

    this.setState({
      editComponentTemplate: null
    })
  }

  handleEditRichContentSave ({ propName, bindingName, rawContent, html }) {
    const { richContentEditor } = this.state
    const handleChanges = this.handleChanges
    let bindings = this.props.bindings || {}
    let targetBindingName = bindingName != null ? bindingName : propName
    let currentBinding = bindings[targetBindingName]
    let newBinding
    let newBindings

    if (currentBinding) {
      newBinding = {
        ...currentBinding
      }
    } else {
      newBinding = {}
    }

    if (rawContent == null) {
      // editor has removed rich content
      delete newBinding.richContent

      if (Object.keys(newBinding).length === 0) {
        newBinding = null
      }
    } else {
      newBinding.richContent = {
        content: rawContent,
        html: html
      }
    }

    if (newBinding) {
      newBindings = {
        ...bindings,
        [targetBindingName]: newBinding
      }
    } else {
      newBindings = omit(bindings, [propName, targetBindingName])

      if (Object.keys(newBindings).length === 0) {
        newBindings = null
      }
    }

    handleChanges({
      origin: 'bindings',
      propName,
      context: richContentEditor.context,
      changes: { bindings: newBindings }
    })

    this.setState({
      richContentEditor: null
    })
  }

  handleBindToDataEditorSave ({ propName, bindingName, selectedField }) {
    const { bindToDataEditor } = this.state
    const handleChanges = this.handleChanges
    let bindings = this.props.bindings || {}
    let targetBindingName = bindingName != null ? bindingName : propName
    let currentBinding = bindings[targetBindingName]
    let currentFieldHasBindedValue = false
    let newBinding
    let newBindings

    if (currentBinding) {
      newBinding = {
        ...currentBinding
      }
    } else {
      newBinding = {}
    }

    if (
      bindings &&
      currentBinding &&
      currentBinding.defaultExpression != null
    ) {
      currentFieldHasBindedValue = true
    }

    if (selectedField != null) {
      newBinding.defaultExpression = {
        value: selectedField.expression,
        meta: selectedField.meta
      }

      newBindings = {
        ...bindings,
        [targetBindingName]: newBinding
      }
    } else if (selectedField == null && currentFieldHasBindedValue) {
      delete newBinding.defaultExpression

      if (Object.keys(newBinding).length === 0) {
        newBinding = null
      }

      if (newBinding) {
        newBindings = {
          ...bindings,
          [targetBindingName]: newBinding
        }
      } else {
        newBindings = omit(bindings, [propName, targetBindingName])

        if (Object.keys(newBindings).length === 0) {
          newBindings = null
        }
      }
    }

    if (newBindings !== undefined) {
      handleChanges({
        origin: 'bindings',
        propName,
        context: bindToDataEditor.context,
        changes: { bindings: newBindings }
      })
    }

    this.setState({
      bindToDataEditor: null
    })
  }

  handleBindToDataEditorClose () {
    this.setState({
      bindToDataEditor: null
    })
  }

  handleTemplateEditorClose () {
    this.setState({
      editComponentTemplate: null
    })
  }

  handleEditRichContentClose () {
    this.setState({
      richContentEditor: null
    })
  }

  handleChanges ({ origin, propName, context, changes }) {
    const { id, type, template, properties, bindings, onChange } = this.props
    let changesInterceptor = this.changesInterceptor
    let newChanges
    let params

    params = {
      origin,
      id,
      propName,
      context,
      current: {
        componentType: type,
        template,
        props: properties,
        bindings
      },
      changes
    }

    if (changesInterceptor != null) {
      newChanges = changesInterceptor(params)
    } else {
      newChanges = changes
    }

    onChange(id, newChanges)
  }

  handlePropChange ({ propName, context, value }) {
    const handleChanges = this.handleChanges
    const { type, properties } = this.props
    let valid = true

    let newProps = {
      ...properties,
      [propName]: value
    }

    if (type === 'Image' && (propName === 'width' || propName === 'height')) {
      valid = value != null && !isNaN(value)

      if (valid) {
        newProps[propName] = value !== '' ? Number(value) : 0
      }
    }

    if (!valid) {
      return
    }

    handleChanges({
      origin: 'values',
      propName,
      context,
      changes: { props: newProps }
    })
  }

  renderPropertiesEditor () {
    const { type, dataInput, properties, bindings } = this.props

    let props = {
      dataInput,
      componentType: type,
      properties,
      bindings,
      getPropMeta: this.getPropMeta,
      onBindToDataClick: this.handleBindToDataClick,
      onEditRichContentClick: this.handleEditRichContentClick,
      onChange: this.handlePropChange,
      connectToChangesInterceptor: this.connectToChangesInterceptor
    }

    let propertiesEditor = this.getPropertiesEditor(type)

    return (
      React.createElement(propertiesEditor, { ...props })
    )
  }

  render () {
    const { bindToDataEditor, richContentEditor, editComponentTemplate } = this.state

    const {
      type,
      template
    } = this.props

    return (
      <div className="ComponentEditor">
        <div className="ComponentEditor-content">
          <h3 className="ComponentEditor-title">
            <span className={`fa ${(this.meta.icon || '')}`} />
            &nbsp;
            {type}
          </h3>
          <hr className="ComponentEditor-separator" />
          <div className="ComponentEditor-options">
            <CommandButton
              title="Edit component template"
              titlePosition="bottom"
              icon="code"
              onClick={this.handleEditComponentTemplateClick}
            />
          </div>
          {this.renderPropertiesEditor()}
        </div>
        {bindToDataEditor && (
          <BindToDataEditor
            dataProperties={bindToDataEditor.dataProperties}
            componentType={type}
            propName={bindToDataEditor.propName}
            bindingName={bindToDataEditor.bindingName}
            defaultSelectedField={bindToDataEditor.selectedField}
            allowedTypes={bindToDataEditor.allowedTypes}
            onSave={this.handleBindToDataEditorSave}
            onClose={this.handleBindToDataEditorClose}
          />
        )}
        {richContentEditor && (
          <RichContentEditor
            componentType={type}
            propName={richContentEditor.propName}
            initialContent={richContentEditor.content}
            onSave={this.handleEditRichContentSave}
            onRemove={this.handleEditRichContentSave}
            onClose={this.handleEditRichContentClose}
          />
        )}
        {editComponentTemplate && (
          <TemplateEditor
            componentType={type}
            template={template}
            onSave={this.handleTemplateEditorSave}
            onClose={this.handleTemplateEditorClose}
          />
        )}
      </div>
    )
  }
}

ComponentEditor.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  template: PropTypes.string,
  properties: PropTypes.object.isRequired,
  bindings: PropTypes.object,
  onChange: PropTypes.func.isRequired
}

export default ComponentEditor
