
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
  getDefaultPropsForInlineFragments (fragmentName) {
    switch (fragmentName) {
      case 'header':
        return {
          text: 'header'
        }
      case 'header#content':
        return {
          text: 'hcontent'
        }
      case 'footer':
        return {
          text: 'footer'
        }
      case 'footer#content':
        return {
          text: 'fcontent'
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
        .Table {
          width: 100%;
        }

        .Table th, .Table td {
          border: 1px solid black;
        }
      </style>
      <div>
        {{!--
        {{#$renderFragment name="header" tag="span"}}
          <b>{{text}}</b>
          {{#$renderFragment name="content" tag="span"}}
            {{text}}
          {{/$renderFragment}}
        {{/$renderFragment}}
        --}}
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
        {{!--
          {{#$renderFragment name="footer" tag="span"}}
            <b>{{text}}</b>
            {{#$renderFragment name="content" tag="span"}}
              {{text}}
            {{/$renderFragment}}
          {{/$renderFragment}}
          {{#$renderFragment name="footer" tag="span"}}
            <i>{{text}}</i>
            {{#$renderFragment name="content" tag="span"}}
              {{text}}
            {{/$renderFragment}}
          {{/$renderFragment}}
        --}}
      </div>
      `
    )
  }
}
