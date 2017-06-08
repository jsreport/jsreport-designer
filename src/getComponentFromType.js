import React from 'react'

export default function getComponentFromType (type) {
  switch (type) {
    case 'Text':
      return (props) => <span style={{ backgroundColor: 'darkgreen', display: 'inline-block', width: '100%', height: '100%' }}>{props.text}</span>
    case 'Image':
      return (props) => {
        return (
          <img src={props.url} style={{ width: props.width, height: props.height }} />
        )
      }
    default:
      return () => <span>Default empty component</span>
  }
}
