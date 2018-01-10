import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Designer from 'jsreport-designer'

const PropertyControl = Designer.PropertyControl
const PropertiesGroup = Designer.PropertiesGroup

function getBindingNameForColumn (colIndex, property) {
  if (colIndex == null || property == null) {
    return `@columns`
  }

  return `@columns${colIndex}.${property}`
}

class TablePropertiesEditor extends PureComponent {
  constructor (props) {
    super(props)

    this.interceptChanges = this.interceptChanges.bind(this)
    this.handleColumnsChange = this.handleColumnsChange.bind(this)
    this.handleColumnBindToDataClick = this.handleColumnBindToDataClick.bind(this)
    this.handleColumnAdd = this.handleColumnAdd.bind(this)
    this.handleColumnRemove = this.handleColumnRemove.bind(this)
    this.renderDataPropValue = this.renderDataPropValue.bind(this)
    this.renderColumnPropValue = this.renderColumnPropValue.bind(this)

    this.props.connectToChangesInterceptor(this.interceptChanges)
  }

  interceptChanges ({ origin, propName, context, current, changes }) {
    let newChanges = changes

    if (origin === 'values' && propName === 'columns') {
      let isRemoving = changes.props.columns.length < current.props.columns.length
      let columnBindingForName
      let columnBindingForValue
      let newBindings

      if (!isRemoving) {
        return newChanges
      }

      columnBindingForName = getBindingNameForColumn(context.colIndex, 'name')
      columnBindingForValue = getBindingNameForColumn(context.colIndex, 'value')

      // normalizing column bindings when columns are being removed
      if (current.bindings) {
        newBindings = { ...current.bindings }
      } else {
        newBindings = {}
      }

      if (newBindings[columnBindingForName]) {
        delete newBindings[columnBindingForName]
      }

      if (newBindings[columnBindingForValue]) {
        delete newBindings[columnBindingForValue]
      }

      if (Object.keys(newBindings).length === 0) {
        newBindings = null
      }

      newChanges = {
        ...newChanges,
        bindings: newBindings
      }

      return newChanges
    }

    if (origin !== 'bindings') {
      return newChanges
    }

    if (
      propName === 'data' &&
      (!changes.bindings || changes.bindings.data == null)
    ) {
      let newBindings
      let newProps

      if (changes.bindings != null) {
        newBindings = { ...changes.bindings }
      } else {
        newBindings = {}
      }

      // deleting all bindings based on data prop
      Object.keys(newBindings).forEach((bindingKey) => {
        if (bindingKey.indexOf(getBindingNameForColumn()) === 0) {
          delete newBindings[bindingKey]
        }
      })

      if (Object.keys(newBindings).length === 0) {
        newBindings = null
      }

      newProps = {
        ...current.props,
        columns: current.props.columns.map((col, idx) => {
          if (typeof col.name !== 'object' && typeof col.value !== 'object') {
            return col
          }

          return {
            name: typeof col.name === 'object' ? `column${idx + 1}` : col.name,
            value: typeof col.value === 'object' ? `value${idx + 1}` : col.value
          }
        })
      }

      newChanges = {
        ...newChanges,
        bindings: newBindings,
        props: newProps
      }
    } else if (context != null && (propName === 'columns.name' || propName === 'columns.value')) {
      let propValue
      let newProps

      if (!changes.bindings || !changes.bindings[context.targetBindingName]) {
        propValue = `${context.name === 'name' ? 'column' : 'value'}${context.colIndex + 1}`
      } else {
        propValue = { binding: context.targetBindingName }
      }

      newProps = {
        ...current.props,
        columns: [
          ...current.props.columns.slice(0, context.colIndex),
          {
            ...current.props.columns[context.colIndex],
            [context.name]: propValue
          },
          ...current.props.columns.slice(context.colIndex + 1)
        ]
      }

      newChanges = {
        ...newChanges,
        props: newProps
      }
    }

    return newChanges
  }

  handleColumnsChange ({ propName, value, context }) {
    const { onChange, properties } = this.props

    onChange({
      propName: 'columns',
      context,
      value: [
        ...properties.columns.slice(0, context.colIndex),
        { ...properties.columns[context.colIndex], [context.name]: value },
        ...properties.columns.slice(context.colIndex + 1)
      ]
    })
  }

  handleColumnBindToDataClick (params) {
    const { bindings, getBindingMeta, onBindingEditorOpen } = this.props

    if (params.context.name === 'value' && (!bindings || bindings.data == null)) {
      return
    }

    onBindingEditorOpen({
      ...params,
      bindingName: params.context.targetBindingName,
      options: {
        dataFields: params.context.name === 'name' ? undefined : (
          getBindingMeta(
            'data',
            'dataProperties'
          )
        )
      }
    })
  }

  handleColumnAdd () {
    const { onChange, properties } = this.props

    onChange({
      propName: 'columns',
      value: [
        ...properties.columns,
        {
          name: `column${properties.columns.length + 1}`,
          value: `value${properties.columns.length + 1}`
        }
      ]
    })
  }

  handleColumnRemove (colIndex) {
    const { onChange, properties } = this.props

    onChange({
      propName: 'columns',
      context: {
        colIndex
      },
      value: [
        ...properties.columns.slice(0, colIndex),
        ...properties.columns.slice(colIndex + 1)
      ]
    })
  }

  renderDataPropValue ({ binding }) {
    const { getBindingMeta } = this.props
    let currentValue

    if (!binding || binding.expression == null) {
      currentValue = '--no-value--'
    } else {
      currentValue = getBindingMeta('data', 'displayName')
    }

    return (
      <input
        className='propertiesEditor-prop-special-value'
        type='text'
        name='data'
        readOnly
        value={currentValue}
      />
    )
  }

  renderColumnPropValue ({ name, value, context, onChange }) {
    const { getBindingMeta } = this.props
    let valueRefToBinding = typeof value === 'object' && value.binding != null
    let currentValue

    if (valueRefToBinding) {
      if (context.name === 'value') {
        currentValue = getBindingMeta(
          context.targetBindingName,
          'displayName',
          { displayPrefix: '(data) ' }
        )
      } else {
        currentValue = getBindingMeta(value.binding, 'displayName')
      }
    } else {
      currentValue = value
    }

    return (
      <input
        className={valueRefToBinding ? 'propertiesEditor-prop-special-value' : ''}
        type='text'
        name={name}
        readOnly={valueRefToBinding}
        value={currentValue}
        onChange={(ev) => onChange(ev.target.value)}
      />
    )
  }

  render () {
    const {
      componentType,
      properties,
      bindings,
      dataInput,
      getComponent,
      getPropMeta,
      getBindingMeta,
      onChange,
      onBindingEditorOpen
    } = this.props

    return (
      <div className='propertiesEditor'>
        <PropertyControl
          key='data'
          componentType={componentType}
          name='data'
          binding={bindings ? bindings.data : null}
          value={properties.data}
          bindingEnabled={dataInput != null}
          getComponent={getComponent}
          getPropMeta={getPropMeta}
          getBindingMeta={getBindingMeta}
          renderValue={this.renderDataPropValue}
          onBindingEditorOpen={onBindingEditorOpen}
        />
        <div className='propertiesEditor-prop'>
          <div className='propertiesEditor-prop'>
            <label>
              columns
            </label>
          </div>
          {Array.isArray(properties.columns) && properties.columns.map((col, idx) => {
            return (
              <div
                key={`col-${idx}`}
                className='propertiesEditor-box'
                style={{ position: 'relative', border: '2px solid #fff' }}
              >
                <PropertyControl
                  key='columns.name'
                  componentType={componentType}
                  name='columns.name'
                  label='name'
                  value={col.name}
                  bindingEnabled
                  context={{ name: 'name', colIndex: idx, targetBindingName: getBindingNameForColumn(idx, 'name') }}
                  getComponent={getComponent}
                  getPropMeta={getPropMeta}
                  getBindingMeta={getBindingMeta}
                  renderValue={this.renderColumnPropValue}
                  onBindingEditorOpen={this.handleColumnBindToDataClick}
                  onChange={this.handleColumnsChange}
                />
                <PropertyControl
                  key='columns.value'
                  componentType={componentType}
                  name='columns.value'
                  label='value'
                  value={col.value}
                  bindingEnabled={(bindings != null && bindings.data != null)}
                  context={{ name: 'value', colIndex: idx, targetBindingName: getBindingNameForColumn(idx, 'value') }}
                  getComponent={getComponent}
                  getPropMeta={getPropMeta}
                  getBindingMeta={getBindingMeta}
                  renderValue={this.renderColumnPropValue}
                  onBindingEditorOpen={this.handleColumnBindToDataClick}
                  onChange={this.handleColumnsChange}
                />
                <div key='remove-columns'>
                  <span
                    className='fa fa-times-circle'
                    style={{ cursor: 'pointer', position: 'absolute', right: 0, top: 0 }}
                    onClick={() => this.handleColumnRemove(idx)}
                  />
                </div>
              </div>
            )
          })}
          <div key='add-columns'>
            <button onClick={this.handleColumnAdd}>Add column</button>
          </div>
        </div>
        <PropertiesGroup
          key={`group-style`}
          name='style'
        >
          <PropertyControl
            key='style'
            componentType={componentType}
            name='style'
            binding={null}
            value={properties.style}
            bindingEnabled={dataInput != null}
            getComponent={getComponent}
            getPropMeta={getPropMeta}
            getBindingMeta={getBindingMeta}
            onBindingEditorOpen={onBindingEditorOpen}
            onChange={(styleChanges) => onChange(styleChanges)}
          />
        </PropertiesGroup>
      </div>
    )
  }
}

TablePropertiesEditor.propTypes = {
  componentType: PropTypes.string.isRequired,
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  properties: PropTypes.object.isRequired,
  bindings: PropTypes.object,
  getComponent: PropTypes.func.isRequired,
  getPropMeta: PropTypes.func.isRequired,
  getBindingMeta: PropTypes.func.isRequired,
  onBindingEditorOpen: PropTypes.func,
  onChange: PropTypes.func.isRequired,
  connectToChangesInterceptor: PropTypes.func.isRequired
}

export default TablePropertiesEditor
