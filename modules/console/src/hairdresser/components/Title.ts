const invariant = require('fbjs/lib/invariant');
import { Component, Props, PropTypes } from 'react';

interface TitleProps extends Props<Title> {

}

class Title extends Component<TitleProps, {}> {
  static contextTypes = {
    hairdresser: PropTypes.object.isRequired,
  }

  static propTypes = {
    children: PropTypes.string.isRequired,
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
    this.override = this.hairdresser.override().title(() => this.props.children);
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

export default Title;
