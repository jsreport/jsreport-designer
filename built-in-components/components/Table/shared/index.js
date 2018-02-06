
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
        {{#$renderFragment name="label-header" inlineTag="span"}}
          <b>label header<b/>
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
        {{#$renderFragment name="label-footer" inlineTag="span"}}
          <b>label footer</b>
        {{/$renderFragment}}
      </div>
      `
    )
  }
}
