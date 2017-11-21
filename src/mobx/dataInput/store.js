import { observable, computed } from 'mobx'
import evaluateScript from '../../../shared/evaluateScript'

class DataInput {
  @observable.ref value = undefined
  @observable.ref computedFieldsValues = undefined

  constructor () {
    this.extractProperties = this.extractProperties.bind(this)
    this.getComputedFunctions = this.getComputedFunctions.bind(this)
  }

  extractProperties (json, _blackList = [], parentType) {
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
        continue;
      }

      if (parentType == null || (parentType === 'object' && type !== 'array')) {
        blackList = []
      }

      if (typeof json[key] === 'object' && json[key] != null) {
        let keyIsArray = Array.isArray(json[key])
        let innerProperties = this.extractProperties(json[key], blackList, type)
        let item

        if (!innerProperties) {
          continue;
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

  getComputedFunctions (computedSources) {
    if (!computedSources) {
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

  @computed get computedFieldsFunctions () {
    if (this.computedFieldsValues == null) {
      return
    }

    return this.getComputedFunctions(this.computedFieldsValues.source)
  }

  @computed get computedFieldsResults () {
    if (this.computedFieldsFunctions == null) {
      return
    }

    const computedResults = Object.keys(this.computedFieldsFunctions).reduce((result, computedName) => {
      const computedFunction = this.computedFieldsFunctions[computedName]

      if (this.value == null) {
        result[computedName] = undefined
      } else {
        result[computedName] = computedFunction(this.value.data)
      }

      return result
    }, {})

    return computedResults
  }
}

let store = new DataInput()

export { DataInput }
export default store
