import * as React from 'react';

import GridList from 'material-ui/GridList/GridList';
// import GridTile from 'material-ui/GridList/GridTile';
const GridTile = require('material-ui/GridList/GridTile').default;

import { cyan500, grey400 } from 'material-ui/styles/colors';

const Waypoint = require('react-waypoint');

export interface GridItem {
  id: string;
  name: string;
  image: string;
}

const inlineStyles = {
  gridChildImg: {
    height: '100%',
    transform: 'translateX(-50%)',
    position: 'relative',
    left: '50%',
  },
  gridChildImgContent: {
    width: '100%',
    height: '100%',
  },
}

interface SelectableGridListProps {
  items: GridItem[];
  selectedItem: string;
  useLoad: boolean;
  loading: boolean;
  loadMore: () => any;
  disabled: boolean;
  onSelect: (id: string) => any;
}

const SelectableGridList: React.StatelessComponent<SelectableGridListProps> = props => {
  const tiles = props.items.map(item => {
    const onTouchTap = () => props.disabled || props.onSelect(item.id);

    let style: any = { cursor: 'pointer' };
    if (props.selectedItem === item.id) {
      style.border = `6px solid ${props.disabled  ? grey400 : cyan500}`;
    } else {
      style.margin = '6px';
    }

    return (
      <GridTile
        key={item.id}
        title={item.name}
        subtitle={<span>by <b>{item.id.substr(0, 5)}</b></span>}
        style={style}
        onTouchTap={onTouchTap}
      >
        <div style={inlineStyles.gridChildImg}>
          <img src={item.image} style={inlineStyles.gridChildImgContent}/>
          {/* Meta data here */}
        </div>
      </GridTile>
    )
  });

  return (
    <div>
      <GridList
        cellHeight={225}
        cols={3}
        padding={10}
      >
        {tiles}
      </GridList>
      {
        !props.useLoad ? null : props.loading
          ? (
            <div>Loading...</div>
          )
          : (
            <Waypoint
              onEnter={props.loadMore}
              threshold={2.0}
            />
          )
      }
    </div>
  );
};

export default SelectableGridList;
