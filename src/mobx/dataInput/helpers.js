import evaluateScript from '../../../shared/evaluateScript'

function getProperties (json, _blackList = [], parentType) {
  let indexes = []
  let properties = []
  let blackList = [..._blackList]
  let type
  let result

  // only object and arrays are allowed
  if (typeof json !== 'object' || json == null) {
    return undefined
  }

  if (Array.isArray(json)) {
    type = 'array'
  } else {
    type = 'object'
  }

  for (let key in json) {
    if (!json.hasOwnProperty(key) || (type === 'object' && blackList.indexOf(key) !== -1)) {
      continue
    }

    if (parentType === 'object' && type !== 'array') {
      blackList = []
    }

    if (typeof json[key] === 'object' && json[key] != null) {
      let keyIsArray = Array.isArray(json[key])
      let innerProperties = getProperties(json[key], blackList, type)
      let item

      if (!innerProperties) {
        continue
      }

      item = {
        type: keyIsArray ? 'array' : 'object'
      }

      if (type === 'array') {
        indexes.push([key, Array.isArray(json[key]) ? 'array' : 'object'])

        if (!keyIsArray && innerProperties.properties && innerProperties.properties.length > 0) {
          let nonRepeatedProperties = []

          for (let idx = 0; idx < innerProperties.properties.length; idx++) {
            let propKey = innerProperties.properties[idx]

            if (blackList.indexOf(propKey[0]) === -1) {
              blackList.push(propKey[0])
              nonRepeatedProperties.push(innerProperties.properties[idx])
            }
          }

          properties = properties.concat(nonRepeatedProperties)
        }
      } else {
        item.key = key
        item.properties = innerProperties.properties
      }

      if (keyIsArray) {
        item.indexes = innerProperties.indexes
        properties.push(item)
      } else if (type === 'object' && !keyIsArray) {
        properties.push(item)
      }
    } else {
      let keyType = typeof json[key]

      if (keyType === 'object') {
        keyType = Array.isArray(json[key]) ? 'array' : 'object'
      }

      if (type === 'array') {
        // NOTE: indexes just show the type information at the current index
        // in the future maybe we can allow access to inner properties from indexes
        indexes.push([key, keyType])
      } else {
        properties.push([key, keyType])
      }
    }
  }

  result = {
    type
  }

  if (type === 'array') {
    result.indexes = indexes

    if (properties.length > 0) {
      result.properties = properties
    }
  } else {
    result.properties = properties
  }

  return result
}

function getComputedFieldsMap (computedFields) {
  if (computedFields == null) {
    return
  }

  const computedMap = computedFields.reduce((result, field) => {
    if (field.name == null) {
      throw new Error('computed fields shoud have a "name"')
    }

    if (field.source == null) {
      throw new Error('computed fields shoud have "source" definition')
    }

    result[field.name] = field.source

    return result
  }, {})

  return computedMap
}

function getComputedFunctions (computedSources) {
  if (computedSources == null) {
    return
  }

  const computedFunctions = Object.keys(computedSources).reduce((result, computedName) => {
    const computedFunctionSrc = computedSources[computedName]
    const computedFunction = evaluateScript.getSingleExport(computedFunctionSrc)

    result[computedName] = computedFunction

    return result
  }, {})

  return computedFunctions
}

function getComputedResults (computedFunctions, data) {
  if (computedFunctions == null) {
    return
  }

  const computedResults = Object.keys(computedFunctions).reduce((result, computedName) => {
    const computedFunction = computedFunctions[computedName]

    if (data == null) {
      result[computedName] = undefined
    } else {
      try {
        result[computedName] = computedFunction(data)
      } catch (e) {
        // TODO: decide if just logging the error is enough or if we
        // need to show it in some UI
        console.error('Error while executing computed function:', e)

        result[computedName] = undefined
      }
    }

    return result
  }, {})

  return computedResults
}

function getExpressionName (fieldType, id) {
  let shortFieldTypeName = _getShortFieldTypeName(fieldType)

  if (shortFieldTypeName === '') {
    return ''
  }

  return `${shortFieldTypeName}:${id}`
}

function getFullExpressionName (expression, fieldType, id) {
  let fullExpression
  const separator = '.'

  if (Array.isArray(expression)) {
    fullExpression = expression.join(separator)
  } else {
    fullExpression = expression
  }

  if (fieldType == null || id == null) {
    return fullExpression
  }

  if (fullExpression === '') {
    return `${getExpressionName(fieldType, id)}`
  }

  return `${fullExpression}${separator}${getExpressionName(fieldType, id)}`
}

function getFullExpressionDisplayName (expression) {
  const separator = '.'

  if (!Array.isArray(expression)) {
    return
  }

  return expression.reduce((acu, expressionItem) => {
    const parts = expressionItem.split(':')
    const name = parts[1] != null ? parts[1] : ''

    if (acu === '') {
      return `${name}`
    } else {
      return `${acu}${separator}${name}`
    }
  }, '')
}

function getFieldsMeta ({
  dataFields,
  computedFields,
  parentType,
  fieldType,
  idParts = [],
  expression = []
}) {
  const idSeparator = '.'
  let result = {}

  // data fields processing
  if (typeof dataFields === 'object' && !Array.isArray(dataFields)) {
    const context = dataFields
    const currentFieldType = parentType == null ? 'root' : fieldType

    result[getFullExpressionName(expression, currentFieldType === 'root' ? currentFieldType : null)] = {
      fieldType: currentFieldType,
      fullId: [...idParts].join(idSeparator),
      dataProperties: context
    }

    if (Array.isArray(context.properties)) {
      const innerFieldType = 'property'

      for (let i = 0; i < context.properties.length; i++) {
        const property = context.properties[i]
        const isSimpleValue = Array.isArray(property)

        if (isSimpleValue) {
          result[getFullExpressionName(expression, innerFieldType, property[0])] = {
            fieldType: innerFieldType,
            fullId: [...idParts, property[0]].join(idSeparator),
            dataProperties: {
              type: property[1]
            }
          }
        } else {
          const innerFields = getFieldsMeta({
            dataFields: property,
            parentType: context.type,
            fieldType: innerFieldType,
            idParts: [...idParts, property.key],
            expression: [...expression, getExpressionName(innerFieldType, property.key)]
          })

          if (innerFields) {
            result = Object.assign(result, innerFields)
          }
        }
      }
    }

    if (Array.isArray(context.indexes)) {
      const innerFieldType = 'index'

      for (let i = 0; i < context.indexes.length; i++) {
        const index = context.indexes[i]
        const isSimpleValue = Array.isArray(index)

        if (isSimpleValue) {
          result[getFullExpressionName(expression, innerFieldType, i)] = {
            fieldType: innerFieldType,
            fullId: [...idParts, i].join(idSeparator),
            dataProperties: {
              type: index[1]
            }
          }
        } else {
          // NOTE: indexes just show the type information at the current index
          // in the future maybe we can show inner properties from index
          result[getFullExpressionName(expression, innerFieldType, i)] = {
            fieldType: innerFieldType,
            fullId: [...idParts, i].join(idSeparator),
            dataProperties: {
              type: index[1]
            }
          }
        }
      }
    }
  }

  // computed fields processing
  if (computedFields != null) {
    result = computedFields.reduce((acu, compField) => {
      result[getExpressionName('computed', compField.name)] = {
        fieldType: 'computed',
        fullId: compField.name
      }

      return result
    }, result)
  }

  result = Object.keys(result).length !== 0 ? result : undefined

  return result
}

function _getShortFieldTypeName (fieldType) {
  let name

  if (fieldType === 'computed') {
    name = 'c'
  } else if (fieldType === 'property') {
    name = 'p'
  } else if (fieldType === 'index') {
    name = 'i'
  } else if (fieldType === 'root') {
    name = ''
  } else {
    throw new Error(`Field type [${fieldType}] is not recognized`)
  }

  return name
}

export { getProperties }
export { getComputedFieldsMap }
export { getComputedFunctions }
export { getComputedResults }
export { getExpressionName }
export { getFullExpressionName }
export { getFullExpressionDisplayName }
export { getFieldsMeta }
