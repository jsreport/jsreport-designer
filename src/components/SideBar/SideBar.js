import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import componentRegistry from '@local/shared/componentRegistry'
import * as configuration from '../../lib/configuration'
import ComponentBar from '../ComponentBar'
import { ComponentEditor } from '../Editor'
import CommandBar from '../CommandBar'
import './SideBar.css'

class SideBar extends PureComponent {
  constructor (props) {
    super(props)

    this.registeredComponents = componentRegistry.getComponents()

    this.registeredComponents = Object.keys(this.registeredComponents).map((compName) => {
      return {
        name: compName,
        icon: configuration.componentTypes[compName].icon,
        group: configuration.componentTypesDefinition[compName].group,
      }
    })
  }

  render () {
    const {
      componentEdition,
      dataInput,
      onComponentEditionChange,
      onCommandSave,
      onItemDragStart,
      onItemDragEnd
    } = this.props

    let extraProps = {}

    if (componentEdition != null) {
      extraProps['data-keep-selection'] = true
    }

    return (
      <div className="SideBar" {...extraProps}>
        <div
          className="SideBar-content"
          style={{
            transform: componentEdition ? 'translateX(-100%)' : undefined
          }}
        >
          <ComponentBar
            componentCollection={this.registeredComponents}
            onItemDragStart={onItemDragStart}
            onItemDragEnd={onItemDragEnd}
          />
          <div className="SideBar-offset" style={{ transform: componentEdition ? 'translateX(0)' : 'translateX(-200%)', opacity: componentEdition ? 1 : 0 }}>
            {componentEdition && (
              <ComponentEditor
                key={componentEdition.id}
                type={componentEdition.type}
                dataInput={dataInput}
                template={componentEdition.template}
                properties={componentEdition.props}
                bindings={componentEdition.bindings}
                onChange={onComponentEditionChange}
              />
            )}
          </div>
        </div>
        <div className="SideBar-footer">
          <CommandBar dataInput={dataInput} onCommandSave={onCommandSave} />
        </div>
      </div>
    )
  }
}

SideBar.propTypes = {
  componentEdition: PropTypes.object,
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onComponentEditionChange: PropTypes.func,
  onCommandSave: PropTypes.func,
  onItemDragStart: PropTypes.func,
  onItemDragEnd: PropTypes.func
}

export default SideBar
