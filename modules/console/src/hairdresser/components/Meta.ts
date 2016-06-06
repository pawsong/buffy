const invariant = require('fbjs/lib/invariant');
import { Component, Props, PropTypes } from 'react';

interface MetaProps extends Props<Meta> {
  attrs: Object;
  values: Object;
}

class Meta extends Component<MetaProps, {}> {
  static contextTypes = {
    hairdresser: PropTypes.object.isRequired,
  }

  static propTypes = {
    attrs: PropTypes.object.isRequired,
    values: PropTypes.object.isRequired,
  };

  override: any;
  hairdresser: any;

  constructor(props, context) {
    super(props, context);

    this.hairdresser = this.context['hairdresser'];

    invariant(this.hairdresser,
      `Could not find "store" in either the context` +
      `of "${this.constructor['displayName']}". ` +
      `Wrap the root component in a <Provider>.`
    )
  }

  componentWillMount() {
    this.override = this.hairdresser.override().meta(this.props.attrs, () => this.props.values);
  }

  componentDidUpdate() {
    this.override.update();
  }

  componentWillUnmount() {
    this.override.restore();
  }

  render() {
    return null;
  }
}

export default Meta;
