import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer, inject } from 'mobx-react'
import omit from 'lodash/omit'
import componentRegistry from '../../../shared/componentRegistry'
import expressionUtils from '../../../shared/expressionUtils'
import CommandButton from '../CommandButton'
import { componentTypes } from '../../lib/configuration'
import TemplateEditor from './TemplateEditor'
import RichContentEditor from './RichContentEditor'
import SelectDataFieldEditor from './SelectDataFieldEditor'
import styles from './ComponentEditor.scss'

@inject((injected) => ({
  dataInput: injected.dataInputStore.value,
  dataFieldsMeta: injected.dataInputStore.fieldsMeta,
  getFullExpressionName: injected.dataInputStore.getFullExpressionName,
  getFullExpressionDisplayName: injected.dataInputStore.getFullExpressionDisplayName,
  updateComponent: injected.designsActions.updateComponent
}))
@observer
class ComponentEditor extends Component {
  constructor (props) {
    super(props)

    this.state = {
      editComponentTemplate: null,
      selectedDataFieldEditor: null,
      richContentEditor: null
    }

    this.changesInterceptor = null

    this.connectToChangesInterceptor = this.connectToChangesInterceptor.bind(this)
    this.getMeta = this.getMeta.bind(this)
    this.getValue = this.getValue.bind(this)
    this.getPropMeta = this.getPropMeta.bind(this)
    this.getExpressionMeta = this.getExpressionMeta.bind(this)
    this.handleEditComponentTemplateClick = this.handleEditComponentTemplateClick.bind(this)
    this.handleSelectDataFieldClick = this.handleSelectDataFieldClick.bind(this)
    this.handleEditRichContentClick = this.handleEditRichContentClick.bind(this)
    this.handleTemplateEditorSave = this.handleTemplateEditorSave.bind(this)
    this.handleSelectDataFieldEditorSave = this.handleSelectDataFieldEditorSave.bind(this)
    this.handleEditRichContentSave = this.handleEditRichContentSave.bind(this)
    this.handleTemplateEditorClose = this.handleTemplateEditorClose.bind(this)
    this.handleSelectDataFieldEditorClose = this.handleSelectDataFieldEditorClose.bind(this)
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

  getMeta () {
    return componentRegistry.getComponentDefinition(this.props.type) || {}
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

  getPropMeta (propName) {
    const meta = this.getMeta()
    let propsMeta = meta.propsMeta != null ? meta.propsMeta : {}
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

  getExpressionMeta (bindingName, expressionResolution, keyValue, options = {}) {
    const expressions = this.props.expressions || {}
    const { dataFieldsMeta, getFullExpressionName, getFullExpressionDisplayName } = this.props
    const expression = expressionUtils.getExpression(expressions[bindingName], expressionResolution)
    const expressionName = expression != null ? getFullExpressionName(expression.value) : undefined
    const expressionMeta = expressionName != null ? dataFieldsMeta[expressionName] : undefined

    if (keyValue == null) {
      return expressionMeta
    }

    if (keyValue === 'displayName') {
      const expressionDisplayName = expression != null ? (
        getFullExpressionDisplayName(expression.value)
      ) : undefined

      return `[${options.displayPrefix != null ? options.displayPrefix : ''}${
        expressionDisplayName != null ? (expressionDisplayName === '' ?
        '(root)' : expressionDisplayName) : '(binding)'
      }]`
    }

    return expressionMeta ? expressionMeta[keyValue] : undefined
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

  handleSelectDataFieldClick ({ propName, bindingName, context, dataProperties }) {
    let bindings = this.props.bindings || {}
    let expressions = this.props.expressions || {}
    let propMeta = this.getPropMeta(propName) || {}
    let targetBindingName = bindingName != null ? bindingName : propName

    if (!this.state.selectedDataFieldEditor) {
      let stateToUpdate = {
        selectedDataFieldEditor: {
          propName,
          context
        }
      }

      stateToUpdate.selectedDataFieldEditor.bindingName = targetBindingName

      if (dataProperties != null) {
        stateToUpdate.selectedDataFieldEditor.dataProperties = dataProperties
      }

      if (bindings[targetBindingName] && expressionUtils.isDefault(bindings[targetBindingName].expression)) {
        stateToUpdate.selectedDataFieldEditor.selectedField = {
          expression: expressions[targetBindingName].$default.value
        }
      }

      if (propMeta == null) {
        stateToUpdate.selectedDataFieldEditor.allowedTypes = ['scalar']
      } else if (Array.isArray(propMeta.allowedBindingValueTypes) || typeof propMeta.allowedBindingValueTypes === 'string') {
        stateToUpdate.selectedDataFieldEditor.allowedTypes = !Array.isArray(propMeta.allowedBindingValueTypes) ? [propMeta.allowedBindingValueTypes] : propMeta.allowedBindingValueTypes
      } else {
        stateToUpdate.selectedDataFieldEditor.allowedTypes = []
      }

      this.setState(stateToUpdate)
    } else {
      this.setState({
        selectedDataFieldEditor: null
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
        currentContent = currentBinding.richContent
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

  handleEditRichContentSave ({ propName, bindingName, html }) {
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

    if (html == null) {
      // editor has removed rich content
      delete newBinding.richContent

      if (Object.keys(newBinding).length === 0) {
        newBinding = null
      }
    } else {
      newBinding.richContent = {
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

  handleSelectDataFieldEditorSave ({ propName, bindingName, selectedField }) {
    const { selectedDataFieldEditor } = this.state
    const handleChanges = this.handleChanges
    let bindings = this.props.bindings || {}
    let expressions = this.props.expressions || {}
    let targetBindingName = bindingName != null ? bindingName : propName
    let currentBinding = bindings[targetBindingName]
    let currentExpression = expressions[targetBindingName]
    let currentFieldHasDataBindedValue = false
    let newBinding
    let newBindings
    let newExpression
    let newExpressions

    if (currentBinding) {
      newBinding = { ...currentBinding }
    } else {
      newBinding = {}
    }

    if (currentExpression) {
      newExpression = { ...currentExpression }
    } else {
      newExpression = {}
    }

    if (
      bindings &&
      currentBinding &&
      expressionUtils.isDefault(currentBinding.expression)
    ) {
      currentFieldHasDataBindedValue = true
    }

    if (selectedField != null) {
      newBinding.expression = '$default'

      newExpression.$default = {
        type: 'data',
        value: selectedField.expression
      }

      newBindings = {
        ...bindings,
        [targetBindingName]: newBinding
      }

      newExpressions = {
        ...expressions,
        [targetBindingName]: newExpression
      }
    } else if (selectedField == null && currentFieldHasDataBindedValue) {
      delete newBinding.expression
      delete newExpression.$default

      if (Object.keys(newBinding).length === 0) {
        newBinding = null
      }

      if (Object.keys(newExpression).length === 0) {
        newExpression = null
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

      if (newExpression) {
        newExpressions = {
          ...expressions,
          [targetBindingName]: newExpression
        }
      } else {
        newExpressions = omit(expressions, [propName, targetBindingName])

        if (Object.keys(newExpressions).length === 0) {
          newExpressions = null
        }
      }
    }

    if (newBindings !== undefined || newExpressions !== undefined) {
      handleChanges({
        origin: 'bindings',
        propName,
        context: selectedDataFieldEditor.context,
        changes: { bindings: newBindings, expressions: newExpressions }
      })
    }

    this.setState({
      selectedDataFieldEditor: null
    })
  }

  handleSelectDataFieldEditorClose () {
    this.setState({
      selectedDataFieldEditor: null
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
    const { type, dataInput, properties, bindings, expressions } = this.props

    let props = {
      dataInput,
      componentType: type,
      properties,
      bindings,
      expressions,
      getPropMeta: this.getPropMeta,
      getExpressionMeta: this.getExpressionMeta,
      onSelectDataFieldClick: this.handleSelectDataFieldClick,
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
    const { selectedDataFieldEditor, richContentEditor, editComponentTemplate } = this.state

    const {
      type,
      template
    } = this.props

    return (
      <div className={styles.componentEditor}>
        <div className={styles.componentEditorContent}>
          <h3 className={styles.componentEditorTitle}>
            <span className={`fa ${(this.getMeta().icon || '')}`} />
            &nbsp;
            {type}
          </h3>
          <hr className={styles.componentEditorSeparator} />
          <div className={styles.componentEditorOptions}>
            <CommandButton
              title="Edit component template"
              titlePosition="bottom"
              icon="code"
              onClick={this.handleEditComponentTemplateClick}
            />
          </div>
          {this.renderPropertiesEditor()}
        </div>
        {selectedDataFieldEditor && (
          <SelectDataFieldEditor
            dataProperties={selectedDataFieldEditor.dataProperties}
            componentType={type}
            propName={selectedDataFieldEditor.propName}
            bindingName={selectedDataFieldEditor.bindingName}
            defaultSelectedField={selectedDataFieldEditor.selectedField}
            allowedTypes={selectedDataFieldEditor.allowedTypes}
            onSave={this.handleSelectDataFieldEditorSave}
            onClose={this.handleSelectDataFieldEditorClose}
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
  expressions: PropTypes.object,
  onChange: PropTypes.func.isRequired
}

export default ComponentEditor
