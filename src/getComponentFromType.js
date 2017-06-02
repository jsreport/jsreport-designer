import React from 'react'

export default function getComponentFromType (type) {
  switch (type) {
    case 'Text':
      return (props) => <span>{props.text}</span>
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
