import React from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps, Link} from 'react-router';
import { push } from 'react-router-redux';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import Dialog from 'material-ui/Dialog';
import Snackbar from 'material-ui/Snackbar';
import FlatButton from 'material-ui/FlatButton';
import update from 'react-addons-update';

import Immutable from 'immutable';

import {
  Step,
  Stepper,
  StepButton,
  StepLabel,
  StepContent,
} from 'material-ui/Stepper';

const styles = require('./DesignTutorial.css');

import DesignTutorialNavbar from './components/DesignTutorialNavbar';
import EditorContainer from './components/EditorContainer';

import { State } from '../../../../reducers';
import { User } from '../../../../reducers/users';

import { requestLogout } from '../../../../actions/auth';

import {
  ModelCommonState,
  ModelFileState,
  PanelType,
  PanelFilter,
} from '../../../../components/ModelEditor';

import DesignTutorialUnit from './units/DesignTutorialUnit';
import PencilUnit from './units/PencilUnit';
import ColorPickerUnit from './units/ColorPickerUnit';
import PaintUnit from './units/PaintUnit';
import EraserUnit from './units/EraserUnit';

interface RouteParams {
  step: string;
  substep: string;
}

interface DesignTutorialProps extends RouteComponentProps<RouteParams, RouteParams> {
  user?: User;
  requestLogout?: typeof requestLogout;
  push?: typeof push;
}

interface DesignTutorialState {
  dialogOpen?: boolean;
  completeDialogOpen?: boolean;
  finished?: boolean;
  finishMessage?: string;
  unitState?: any;
  prevIndex?: number;
  commonState?: ModelCommonState;
  fileState?: ModelFileState;
}

const nullFunc = () => {};

@(connect((state: State) => ({
  user: state.users.get(state.auth.userid),
}), {
  requestLogout,
  push,
}) as any)
@withStyles(styles)
class DesignTutorial extends React.Component<DesignTutorialProps, DesignTutorialState> {
  units: DesignTutorialUnit<any>[];
  unit: DesignTutorialUnit<any>;
  panelFilter: PanelFilter;

  constructor(props: DesignTutorialProps) {
    super(props);

    this.state = {
      dialogOpen: true,
      completeDialogOpen: false,
      prevIndex: -1,
      unitState: {},
      finished: false,
      finishMessage: '',
    };

    this.units = [
      new PencilUnit(this.handleUnitSetState),
      new ColorPickerUnit(this.handleUnitSetState),
      new PaintUnit(this.handleUnitSetState),
      new EraserUnit(this.handleUnitSetState),
    ];
    this.units.forEach((unit, index) => unit.index = index);

    this.unit = this.units[this.getUnitIndex(props.params.substep)];

    this.unit.state = this.unit.getInitialState();
    this.state.unitState[this.unit.slug] = this.unit.state;

    const editorState = this.unit.getInitialEditorState(null);
    this.state.commonState = editorState.common;
    this.state.fileState = editorState.file;

    const unitProps = { editorState };
    this.units.forEach(unit => unit.props = unitProps);

    this.panelFilter = Immutable.Set<PanelType>([
      PanelType.TOOLS,
    ]);
  }

  componentWillReceiveProps(nextProps: DesignTutorialProps) {
    if (this.props.params.substep !== nextProps.params.substep) {
      this.unit = this.units[this.getUnitIndex(nextProps.params.substep)];

      const { common, file } = this.unit.getInitialEditorState({
        common: this.state.commonState,
        file: this.state.fileState,
      });

      this.setState(update(this.state, {
        dialogOpen: { $set: true },
        unitState: { [this.unit.slug]: { $set: this.unit.getInitialState() } },
        commonState: { $set: common },
        fileState: { $set: file },
      }));
    }
  }

  componentWillUpdate(nextProps: DesignTutorialProps, nextState: DesignTutorialState) {
    const unitNextState = nextState.unitState[this.unit.slug];
    if (this.unit.state !== unitNextState) this.unit.onStateUpdated(unitNextState);
    if (
         this.state.commonState !== nextState.commonState
      || this.state.fileState !== nextState.fileState
    ) {
      const unitProps = update(this.unit.props, {
        editorState: {
          common: { $set: nextState.commonState },
          file: { $set: nextState.fileState },
        },
      });
      this.units.forEach(unit => unit.props = unitProps);
    }
  }

  componentDidUpdate(prevProps: DesignTutorialProps, prevState: DesignTutorialState) {
    if (!this.state.finished && this.unit.isFinished()) {
      const nextUnit = this.units[this.unit.index + 1];
      if (nextUnit) {
        this.setState({
          finished: true,
          finishMessage: this.unit.finishMessage,
        });
      } else {
        this.setState({
          finished: true,
          completeDialogOpen: true,
        });
      }
    }
  }

  getUnitIndex(slug: string) {
    for (let i = 0, len = this.units.length; i < len; ++i) {
      if (this.units[i].slug === slug) return i;
    }
    return -1;
  }

  handleAction = (action) => this.unit.onAction(action);

  handleUnitSetState = (slug: string, state: any) => {
    this.setState(update(this.state, {
      unitState: { [slug]: { $set: state } },
    }));
  }

  handleNext = () => {
    const nextUnit = this.units[this.unit.index + 1];
    this.props.push(`/tutorial/designer/${this.props.params.step}/${nextUnit.slug}`);
  }

  handleCloseDialog = () => this.setState({
    prevIndex: this.unit.index,
    dialogOpen: false,
    finished: false,
    completeDialogOpen: false,
  });

  handleCommonStateChange = (commonState) => this.setState({ commonState });

  handleFiletateChange = (fileState) => this.setState({ fileState });

  render() {
    const steps = this.units.map(unit => {
      return (
        <Step completed={false} key={unit.slug}>
          <StepButton
            containerElement={<Link to={`/tutorial/designer/${this.props.params.step}/${unit.slug}`} />}
          >
            {unit.label}
          </StepButton>
          <StepContent>
            {unit.renderContent()}
          </StepContent>
        </Step>
      );
    });

    return (
      <div className={styles.root}>
        <DesignTutorialNavbar
          step={this.props.params.step}
          user={this.props.user}
          location={this.props.location}
          onLogout={this.props.requestLogout}
        />
        <div className={styles.body}>
          <div className={styles.sidebar}>
            <Stepper
              activeStep={this.state.prevIndex}
              orientation="vertical"
              linear={false}
            >
              {steps}
            </Stepper>
          </div>
          <div className={styles.editor}>
            <EditorContainer
              onAction={this.handleAction}
              toolFilter={this.unit.toolFilter}
              panelFilter={this.panelFilter}
              commonState={this.state.commonState}
              onCommonStateChange={this.handleCommonStateChange}
              fileState={this.state.fileState}
              onFileStateChange={this.handleFiletateChange}
            />
          </div>
        </div>
        <Snackbar
          open={this.state.finished && !this.state.dialogOpen && !this.state.completeDialogOpen}
          message={this.state.finishMessage}
          action="Next"
          onRequestClose={nullFunc}
          onActionTouchTap={this.handleNext}
        />
        <Dialog
          title={this.unit.label}
          open={this.state.dialogOpen}
          modal={true}
          autoScrollBodyContent={true}
          bodyClassName={styles.dialogBody}
          bodyStyle={{ padding: 24 }}
          actions={[
            <FlatButton
              label={'Continue'}
              primary={true}
              onTouchTap={this.handleCloseDialog}
              keyboardFocused={true}
            />
          ]}
        >
          {this.unit.renderContent()}
        </Dialog>
        <Dialog
          title={'Tutorial complete'}
          open={this.state.completeDialogOpen}
          modal={true}
          bodyClassName={styles.dialogBody}
          actions={[
            <FlatButton
              label={'Go to main'}
              secondary={true}
              containerElement={<Link to="/" />}
            />,
            <FlatButton
              label={'Go to studio'}
              primary={true}
              containerElement={<Link to="/studio" />}
            />
          ]}
        >
          <div className={styles.p}>
            Tutorial has been completed.
          </div>
          <div className={styles.p}>
            Tutorial is under active development,
            so more chapters introducing new features will be added soon!
          </div>
          <div className={styles.p}>
            If you want to start creating a new model, please go to <b>Studio</b>.
            Or you can go to the main page to explore works by other users.
          </div>
        </Dialog>
      </div>
    );
  }
}

export default DesignTutorial;
