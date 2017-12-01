import { observable, computed } from 'mobx'
import {
  getProperties,
  getComputedFieldsMap,
  getComputedFunctions,
  getComputedResults,
  getExpressionName,
  getFullExpressionName,
  getFullExpressionDisplayName,
  getFieldsMeta
} from './helpers'

class DataInput {
  @observable.ref value = undefined
  @observable.ref computedFields = undefined

  @computed get valueJSON () {
    if (this.value == null) {
      return
    }

    return JSON.stringify(this.value, null, 2)
  }

  set valueJSON (value) {
    this.value = JSON.parse(value)
  }

  @computed get valueProperties () {
    return getProperties(this.value)
  }

  @computed get computedFieldsMap () {
    return getComputedFieldsMap(this.computedFields)
  }

  @computed get computedFieldsFunctions () {
    return getComputedFunctions(this.computedFieldsMap)
  }

  @computed get computedFieldsValues () {
    return getComputedResults(this.computedFieldsFunctions, this.value)
  }

  @computed get fieldsMeta () {
    return getFieldsMeta({
      dataFields: this.valueProperties,
      computedFields: this.computedFields
    })
  }

  constructor () {
    this.extractProperties = getProperties
    this.getFieldsMeta = getFieldsMeta
    this.getExpressionName = getExpressionName
    this.getFullExpressionName = getFullExpressionName
    this.getFullExpressionDisplayName = getFullExpressionDisplayName
  }
}

let store = new DataInput()

export { DataInput }
export default store
