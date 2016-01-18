import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as axios from 'axios';
import {
  Avatar,
  Toolbar,
  ToolbarGroup,
  ToolbarTitle,
  RaisedButton,
  Tabs,
  Tab,
  IconButton,
} from 'material-ui';

const navbarHeight = 48;

const styles = {
  toolbar: {
    height: navbarHeight,
  },
  editor: {
    position: 'absolute',
    top: navbarHeight,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

const snippet =
`import player from '@pasta/player';
import tutil from '@pasta/util';

tutil.loop(async () => {
  await player.move(1, 1);
  await tutil.sleep(1000);
  await player.move(2, 3);
  await tutil.sleep(1000);
  await player.boom();
  await tutil.sleep(2000);
});`;

interface ContainerProps extends React.Props<Container> {
  store;
  socket;
}

class Container extends React.Component<ContainerProps, {}> {
  editor: AceAjax.Editor;
  child: any;

  constructor(props) {
    super(props);

    this.child = {
      running: false,
    };
  }

  componentDidMount() {
    // Code editor
    const editor = this.editor = ace.edit(this.refs['editor'] as HTMLElement);
    editor.setTheme('ace/theme/twilight');
    editor.session.setMode('ace/mode/javascript');
    editor.setValue(snippet);
    editor.clearSelection();
  }

  _onRun() {
    if (this.child.running) {
      this.child.running = false;
      this.child.worker.terminate();
      this.child.cancelPropagate();
    }

    (async () => {
      const source = this.editor.getValue();
      const res = await axios.post('/addons/code-editor/compile', { source });
      const { url } = res.data;

      this.child.running = true;
      const worker = this.child.worker = new Worker(url);

      worker.addEventListener('message', ({ data }) => {
        const { id, apiName, payload, type } = data;

        // TODO: Validation
        //const api = apis[apiName];
        //if (!api) {
        //  return worker.postMessage({ id, error: 'Invalid api' });
        //}
        this.props.socket.emit(apiName, payload);

        // Wait response or not
        const result = {};
        worker.postMessage({ type: 'response', id, result });
      });

      // Propagate all events for store from socket to worker.
      this.child.cancelPropagate = this.props.store.propagate((event, payload) => {
        worker.postMessage({
          type: 'socket',
          body: { event, payload },
        });
      });

      // Make a fake socket message with in-memory data.
      worker.postMessage({
        type: 'socket',
        body: {
          event: 'init',
          payload: this.props.store.serialize(),
        },
      });

    })().catch(err => {
      // Unhandled exception.
      console.error(err.stack);
    });
  }

  render() {
    return <div>
      <Toolbar style={styles.toolbar}>
        <ToolbarGroup key={0} float="left">
          <RaisedButton label="Run" style={{ marginTop: 6 }}
          primary={true} onClick={this._onRun.bind(this)}/>
        </ToolbarGroup>
      </Toolbar>
      <div ref="editor" style={styles.editor}></div>
    </div>
  }
}

// TODO: submit can be performed by ajax call
export default function init(container, socket, store) {

  ReactDOM.render(
    <Container socket={socket} store={store}/>,
    container
  );

  return {
    destroy() {
      return ReactDOM.unmountComponentAtNode(container);
    },
  };
}
