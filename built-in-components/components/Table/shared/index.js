
module.exports = {
  getDefaultProps () {
    return {
      data: [null],
      columns: [{
        name: 'column1',
        value: 'value1'
      }, {
        name: 'column2',
        value: 'value2'
      }]
    }
  },
  getDefaultPropsForFragments (fragmentName) {
    switch (fragmentName) {
      case 'header':
        return {
          text: 'header'
        }
      case 'content':
        return {
          text: 'content'
        }
      case 'footer':
        return {
          text: 'footer'
        }
    }
  },
  helpers: require('./helpers'),
  // TODO: when we have the component API ready
  // replace the inline style tag with the selected standard
  // way of embedding css for components
  template () {
    return (
      `
      <style>
        .Table th, .Table td {
          border: 1px solid black;
        }
      </style>
      <div>
        {{#$renderFragment name="header" inlineTag="span"}}
          <b>{{text}}</b>
          {{#$renderFragment name="content" inlineTag="span"}}
            {{text}}
          {{/$renderFragment}}
        {{/$renderFragment}}
        <table class="Table" style="{{$resolveStyle "style"}}">
          <tr>
            {{#each columns}}
              {{#if (isObject name)}}
                <th>{{$resolveBinding name.binding "/"}}</th>
              {{else}}
                <th>{{name}}</th>
              {{/if}}
            {{/each}}
          </tr>
          {{#each data}}
            <tr>
              {{#each @root.columns}}
                {{#if (isObject value)}}
                  <td>{{$resolveBinding value.binding ../this}}</td>
                {{else}}
                  <td>{{value}}</td>
                {{/if}}
              {{/each}}
            </tr>
          {{/each}}
        </table>
        {{#$renderFragment name="footer" inlineTag="span"}}
          <b>{{text}}</b>
        {{/$renderFragment}}
      </div>
      `
    )
  }
}
