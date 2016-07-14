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
  subtitle: React.ReactElement<any>;
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

class SelectableGridList extends React.Component<SelectableGridListProps, void> {
  render() {
    const tiles = this.props.items.map(item => {
      const onTouchTap = () => this.props.disabled || this.props.onSelect(item.id);

      let style: any = { cursor: 'pointer' };
      if (this.props.selectedItem === item.id) {
        style.border = `6px solid ${this.props.disabled  ? grey400 : cyan500}`;
      } else {
        style.margin = '6px';
      }

      return (
        <GridTile
          key={item.id}
          title={item.name}
          subtitle={item.subtitle}
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
          style={{ margin: 0 }}
        >
          {tiles}
        </GridList>
        {this.props.useLoad && <Waypoint onEnter={this.props.loadMore} />}
        {this.props.loading && <div>Loading...</div>}
      </div>
    );
  }
}

export default SelectableGridList;
