// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
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
  // eslint-disable-next-line no-undef
  @observable.ref value = undefined

  // eslint-disable-next-line no-undef
  @observable.ref computedFields = undefined

  // eslint-disable-next-line no-undef
  @computed get valueJSON () {
    if (this.value == null) {
      return
    }

    return JSON.stringify(this.value, null, 2)
  }

  set valueJSON (value) {
    this.value = JSON.parse(value)
  }

  // eslint-disable-next-line no-undef
  @computed get valueProperties () {
    return getProperties(this.value)
  }

  // eslint-disable-next-line no-undef
  @computed get computedFieldsMap () {
    return getComputedFieldsMap(this.computedFields)
  }

  // eslint-disable-next-line no-undef
  @computed get computedFieldsFunctions () {
    return getComputedFunctions(this.computedFieldsMap)
  }

  // eslint-disable-next-line no-undef
  @computed get computedFieldsValues () {
    return getComputedResults(this.computedFieldsFunctions, this.value)
  }

  // eslint-disable-next-line no-undef
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
