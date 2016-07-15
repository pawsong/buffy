import React from 'react';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

import {
  Position,
  SupportFileType,
  TroveMetaData,
  TroveItemType,
} from '../../types';

import troveItemType from '../../trove/itemType';

import {
  ModelFileType,
} from '../../../../types';

const styles = require('../../ModelEditor.css');

const MAX_MODEL_SIZE = 128;

interface SidebarProps extends React.Props<Sidebar> {
  fileType: ModelFileType;
  size: Position;
  trove: TroveMetaData;
  onTroveItemTypeChange: (itemType: TroveItemType) => any;
  onSizeChange: (x: number, y: number, z: number) => any;
}

const troveItemTypes = [];
for(let n in TroveItemType) {
  const val = TroveItemType[n];
  if (typeof val === 'number') {
    troveItemTypes.push(<MenuItem value={val} key={val} primaryText={troveItemType[val].label} />);
  }
}

interface SidebarState {
  sizeX?: string;
  sizeY?: string;
  sizeZ?: string;
}

const patt = /^[0-9]{0,3}$/;

function handleChangeSize(callback: (val: string) => any) {
  return (event: React.FormEvent) => {
    const value: string = event.target['value'];
    patt.test(value) && callback(value);
  };
}

function makeSizeState(size: Position): SidebarState {
  return {
    sizeX: '' + size[0],
    sizeY: '' + size[1],
    sizeZ: '' + size[2],
  };
}

class Sidebar extends React.Component<SidebarProps, SidebarState> {
  constructor(props: SidebarProps) {
    super(props);
    this.state = makeSizeState(props.size);
  }

  componentWillReceiveProps(nextProps: SidebarProps) {
    if (this.props.size !== nextProps.size) {
      this.setState(makeSizeState(nextProps.size));
    }
  }

  handleTroveItemTypeChange = (e, val: TroveItemType) => this.props.onTroveItemTypeChange(val);

  handleChangeSizeX = handleChangeSize((sizeX: string) => this.setState({ sizeX }))
  handleChangeSizeY = handleChangeSize((sizeY: string) => this.setState({ sizeY }))
  handleChangeSizeZ = handleChangeSize((sizeZ: string) => this.setState({ sizeZ }))

  handleChangeSizeKeydown = (e: KeyboardEvent) => {
    if (e.keyCode === 13 /* Enter */) this.commitCanvasSize();
  }

  handleSizeInputBlur = () => this.commitCanvasSize();

  commitCanvasSize() {
    const { sizeX, sizeY, sizeZ } = this.state;
    const { size } = this.props;

    const x = Math.max(Math.min(sizeX ? parseInt(sizeX, 10) : size[0], MAX_MODEL_SIZE), 1);
    const y = Math.max(Math.min(sizeY ? parseInt(sizeY, 10) : size[1], MAX_MODEL_SIZE), 1);
    const z = Math.max(Math.min(sizeZ ? parseInt(sizeZ, 10) : size[2], MAX_MODEL_SIZE), 1);

    if (x === size[0] && y === size[1] && z === size[2]) {
      if (sizeX !== '' + size[0] || sizeY !== '' + size[1] || sizeZ !== '' + size[2]) {
        this.setState(makeSizeState(size));
      }
    } else {
      this.props.onSizeChange(x, y, z);
    }
  }

  render() {
    return (
      <div className={styles.sidebar}>
        <div className={styles.sidebarInner}>
          <div className={styles.item}>
            <div className={styles.itemLabel}>Canvas Size</div>
            <div className={styles.itemBody}>
              <input
                type="text"
                className={styles.sizeInput}
                value={this.state.sizeX}
                onChange={this.handleChangeSizeX}
                onBlur={this.handleSizeInputBlur}
                onKeyDown={this.handleChangeSizeKeydown}
              />
              <span> x </span>
              <input
                type="text"
                className={styles.sizeInput}
                value={this.state.sizeY}
                onChange={this.handleChangeSizeY}
                onBlur={this.handleSizeInputBlur}
                onKeyDown={this.handleChangeSizeKeydown}
              />
              <span> x </span>
              <input
                type="text"
                className={styles.sizeInput}
                value={this.state.sizeZ}
                onChange={this.handleChangeSizeZ}
                onBlur={this.handleSizeInputBlur}
                onKeyDown={this.handleChangeSizeKeydown}
              />
            </div>
          </div>
          {this.props.fileType === ModelFileType.TROVE ? (
            <div className={styles.item}>
              <div className={styles.itemLabel}>Trove Item Type</div>
              <div className={styles.itemBody}>
                <SelectField
                  value={this.props.trove.itemType}
                  onChange={this.handleTroveItemTypeChange}
                  maxHeight={200}
                  fullWidth={true}
                  autoWidth={true}
                  labelStyle={{ color: 'white' }}
                >
                  {troveItemTypes}
                </SelectField>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

export default Sidebar;
