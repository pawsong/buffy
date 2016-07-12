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

interface SidebarProps extends React.Props<Sidebar> {
  fileType: ModelFileType;
  size: Position;
  trove: TroveMetaData;
  onTroveItemTypeChange: (itemType: TroveItemType) => any;
}

const troveItemTypes = [];
for(let n in TroveItemType) {
  const val = TroveItemType[n];
  if (typeof val === 'number') {
    troveItemTypes.push(<MenuItem value={val} key={val} primaryText={troveItemType[val].label} />);
  }
}

class Sidebar extends React.Component<SidebarProps, {}> {
  handleTroveItemTypeChange = (e, val: TroveItemType) => this.props.onTroveItemTypeChange(val);

  render() {
    return (
      <div className={styles.sidebar}>
        <div className={styles.sidebarInner}>
          <div className={styles.item}>
            <div className={styles.itemLabel}>Canvas Size</div>
            <div className={styles.itemBody}>
              <span>{this.props.size[0]}</span>
              <span> x </span>
              <span>{this.props.size[1]}</span>
              <span> x </span>
              <span>{this.props.size[2]}</span>
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
