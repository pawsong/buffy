import * as React from 'react';

import Dialog from 'material-ui/lib/dialog';
import FlatButton from 'material-ui/lib/flat-button';
import RaisedButton from 'material-ui/lib/raised-button';
import Colors from 'material-ui/lib/styles/colors';

import SelectField from 'material-ui/lib/select-field';
import MenuItem from 'material-ui/lib/menus/menu-item';

import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';

import GridList from 'material-ui/lib/grid-list/grid-list';
const GridTile = require('material-ui/lib/grid-list/grid-tile');

import RadioButton from 'material-ui/lib/radio-button';
import RadioButtonGroup from 'material-ui/lib/radio-button-group';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./NewRecipeFileDialog.css');

import generateObjectId from '../../../../utils/generateObjectId';

import { SourceFileDB } from '../../../../components/Studio/types';
import { FileType } from '../../../../components/Studio/types';

import CodeEditor from '../../../../components/CodeEditor';
import ModelEditor from '../../../../components/ModelEditor';
import RecipeEditor from '../../../../components/RecipeEditor';

import { receiveThumbnails, ReceiveThumbnailsProps } from '../../../../canvas/ModelManager';

import { NewFileSpec } from '../../types';

interface NewFileDialogProps extends React.Props<NewFileDialog>, ReceiveThumbnailsProps {
  files: SourceFileDB;
  open: boolean;
  onClose: () => any;
  onSubmit: (specs: NewFileSpec[]) => any;
}

const DESIGN_CREATE = 'DESIGN_CREATE';
const DESIGN_LOAD = 'DESIGN_LOAD';

enum Step {
  DESIGN_CREATE_OR_LOAD,
  LOAD_DESIGN,
}

enum DesignSource {
  PROJECT,
  MY_DRIVE,
  PUBLIC_REPO,
}

interface NewFileState {
  robotCodes?: string[];
  design?: string;
  designSource?: DesignSource;
  step?: Step;
  designOption?: string; // DESIGN_CREATE or DESIGN_LOAD
}

const CREATE_NEW_DESIGN_ID = ' ';

const initialState: NewFileState = {
  robotCodes: [],
  design: '',
  designSource: DesignSource.PROJECT,
  step: Step.DESIGN_CREATE_OR_LOAD,
  designOption: DESIGN_CREATE,
}

interface StepSpec {
  title: React.ReactElement<any>;
  body: React.ReactElement<any>;
  actions: React.ReactElement<any>[];
}

enum ActionButtonKeys {
  KEY1,
  KEY2,
  KEY3,
}

@withStyles(styles)
@receiveThumbnails()
class NewFileDialog extends React.Component<NewFileDialogProps, NewFileState> {
  constructor(props) {
    super(props);
    this.state = initialState;
  }

  handleClose() {
    this.props.onClose();
  }

  handleSubmit() {
    const specs: NewFileSpec[] = [];

    let designId;
    if (this.state.designOption === DESIGN_CREATE) {
      designId = generateObjectId();
      specs.push({
        id: designId,
        type: FileType.MODEL,
        modified: true,
        data: ModelEditor.createFileState(designId),
        extraData: ModelEditor.createExtraData(),
      });
    } else {
      designId = this.state.design;
    }

    specs.push({
      id: generateObjectId(),
      type: FileType.ROBOT,
      modified: true,
      data: RecipeEditor.createState({
        design: designId,
        codes: [],
      }),
      extraData: null,
    });

    this.props.onSubmit(specs);
  }

  shouldComponentUpdate(nextProps: NewFileDialogProps) {
    return this.props.open || nextProps.open;
  }

  componentWillReceiveProps(nextProps: NewFileDialogProps) {
    if (!this.props.open && nextProps.open) this.setState(initialState);
  }

  handleSubmitInStep1() {
    if (this.state.designOption === DESIGN_CREATE) return this.handleSubmit();

    this.setState({ step: Step.LOAD_DESIGN });
  }

  renderDesignCreateOrLoad(): StepSpec {
    const designFiles = Object.keys(this.props.files)
      .map(id => this.props.files[id])
      .filter(file => file.type === FileType.MODEL)
      .map(file => ({
        value: file.id,
        name: file.name,
      }));

    const designMenuItems = [{ value: CREATE_NEW_DESIGN_ID, name: 'Create new design' }]
      .concat(designFiles)
      .map(item => (
        <MenuItem
          key={item.value}
          value={item.value}
          primaryText={item.name}
        />
      ));

    const body = (
      <div>
        <div>Select a design</div>
        <RadioButtonGroup
          name="design"
          valueSelected={this.state.designOption}
          onChange={(e, designOption) => this.setState({ designOption })}
        >
          <RadioButton
            value={DESIGN_CREATE}
            label="Create a new design"
          />
          <RadioButton
            value={DESIGN_LOAD}
            label="Choose from existing files"
          />
        </RadioButtonGroup>
      </div>
    );

    const actions = [
      <FlatButton
        key={ActionButtonKeys.KEY2}
        label={this.state.designOption === DESIGN_CREATE ? 'Submit' : 'Next'}
        primary={true}
        keyboardFocused={true}
        onTouchTap={() => this.handleSubmitInStep1()}
      />
    ];

    return { title: null, body, actions };
  }

  handleLoadDesignTabChange(v: any) {
    this.setState({ design: '', designSource: v })
  }

  renderLoadDesign(): StepSpec {
    const tiles = Object.keys(this.props.files).map(key => this.props.files[key])
      .filter(file => file.type === FileType.MODEL)
      .map(file => {
        const onTouchTap = () => this.setState({ design: file.id });

        let style: any = { cursor: 'pointer' };
        if (this.state.design === file.id) {
          style.border = `6px solid ${Colors.cyan500}`;
        } else {
          style.margin = '6px';
        }

        const thumbnail = this.props.modelThumbnails.get(file.id);

        return (
          <GridTile
            key={file.id}
            title={file.name}
            style={style}
            onTouchTap={onTouchTap}
          >
            <img src={thumbnail} />
          </GridTile>
        )
      });

    const title = (
      <Tabs
        tabItemContainerStyle={{ backgroundColor: 'white', marginTop: 24 }}
        value={this.state.designSource}
        onChange={(v) => this.handleLoadDesignTabChange(v)}
      >
        <Tab label="files in project" className={styles.tab}  value={DesignSource.PROJECT}/>
        <Tab label="my design files" className={styles.tab}  value={DesignSource.MY_DRIVE} />
        <Tab label="search" className={styles.tab}  value={DesignSource.PUBLIC_REPO} />
     </Tabs>
    );

    let body = null;
    switch(this.state.designSource) {
      case DesignSource.PROJECT: {
        body = (
          <GridList
            cellHeight={150}
            cols={4}
            style={{ margin: 10 }}
            padding={10}
          >
            {tiles}
          </GridList>
        );
      }
      case DesignSource.MY_DRIVE: {

      }
      case DesignSource.PUBLIC_REPO: {

      }
    }

    const actions = [
      <FlatButton
        key={ActionButtonKeys.KEY2}
        label={'Prev'}
        secondary={true}
        onTouchTap={() => this.setState({ step: Step.DESIGN_CREATE_OR_LOAD })}
      />,
      <FlatButton
        key={ActionButtonKeys.KEY3}
        label={'Submit'}
        primary={true}
        disabled={this.state.design === ''}
        keyboardFocused={true}
        onTouchTap={() => this.handleSubmit()}
      />
    ];

    return { title, body, actions };
  }

  renderTitleBodyAndAction(): StepSpec {
    switch(this.state.step) {
      case Step.DESIGN_CREATE_OR_LOAD: {
        return this.renderDesignCreateOrLoad();
      }
      case Step.LOAD_DESIGN: {
        return this.renderLoadDesign();
      }
    }
    return { title: null, body: null, actions: [] };
  }

  render() {
    const { title, body, actions } = this.renderTitleBodyAndAction();

    const finalActions = [
      <FlatButton
        key={ActionButtonKeys.KEY1}
        label="Cancel"
        secondary={true}
        onTouchTap={this.props.onClose}
      />,
    ].concat(actions);

    return (
      <Dialog
        title={
          <div>
            <div className={styles.title}>Make a New Recipe</div>
            {title}
          </div>
        }
        actions={finalActions}
        modal={false}
        onRequestClose={() => this.handleClose()}
        open={this.props.open}
        autoScrollBodyContent={true}
      >
        {body}
      </Dialog>
    );
  }
}

export default NewFileDialog;
