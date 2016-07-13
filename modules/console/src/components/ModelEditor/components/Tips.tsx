import React from 'react';
import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import Immutable from 'immutable';

const styles = {
  root: {
    position: 'absolute',
    right: 20,
    bottom: 30 + 48 /* Fullscreen icon height */,
    width: '25%',
  },
};

interface TipProps {
  title: string;
  body: string;
  onClose: () => any;
}

const Tip: React.StatelessComponent<TipProps> = props => {
   return (
     <Paper style={{
      display: 'flex',
      alignItems: 'center',
      padding: '16px 4px 16px 16px',
    }} zDepth={1}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{props.title}</div>
        <div style={{ fontSize: 14 }}>{props.body}</div>
      </div>
      <IconButton
        onTouchTap={props.onClose}
      >
        <FontIcon className="material-icons">close</FontIcon>
      </IconButton>
    </Paper>
   );
}

const tips = [
  {
    id: 'tip.scene.rotation',
    title: 'Tip - Scene rotation',
    body: 'To rotate the scene, move the mouse cursor while right button is pressed :)',
  }
];

interface TipsProps extends React.Props<Tips> {
}

interface TipsState {
  closedTaps: Immutable.Set<string>;
}

class Tips extends React.Component<TipsProps, TipsState> {
  constructor(props) {
     super(props);

     const closedTaps = Immutable.Set<string>().withMutations(mutable => {
       tips.forEach(tip => {
         if (localStorage.getItem(tip.id) === 'closed') mutable.add(tip.id);
       })
     });

     this.state = {
       closedTaps,
     }
  }

  handleTipClose(id: string) {
    this.setState({
      closedTaps: this.state.closedTaps.add(id),
    }, () => localStorage.setItem(id, 'closed'));
  }

  render() {
    const tipList = tips.map(tip => this.state.closedTaps.has(tip.id) ? null : (
      <Tip
        key={tip.id}
        title={tip.title}
        body={tip.body}
        onClose={() => this.handleTipClose(tip.id)}
      />
    ));

    return (
      <div style={styles.root}>
        {tipList}
      </div>
    );
  }
}

export default Tips;
