import React from 'react';
import {connect} from 'react-redux';
import { RouteComponentProps } from 'react-router';
import {replace} from 'react-router-redux';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import ModelList from '../../components/ModelList';

const Waypoint = require('react-waypoint');

import { preloadApi, connectApi, ApiCall, get } from '../../api';
import { saga, SagaProps, ImmutableTask, wait, isRunning, request } from '../../saga';

import { ModelFileDocument } from '../../types';

const styles = require('./ExploreHandler.css');

const rootClass = [
  'col-xs-12',
  'col-md-offset-2',
  'col-md-8',
].join(' ');

enum SortBy {
  LIKE,
  FORK,
  LATEST,
}

function getSortByQuery (query: any) {
  switch(query.sort) {
    case 'like':
      return SortBy.LIKE;
    case 'fork':
      return SortBy.FORK;
    case 'latest':
      return SortBy.LATEST;
  }

  return SortBy.LIKE;
}

function toStringSortBy(sortBy: SortBy): string {
  switch(sortBy) {
    case SortBy.LIKE:
      return 'like';
    case SortBy.FORK:
      return 'fork';
    case SortBy.LATEST:
      return 'latest';
  }
  return 'like';
}

interface HandlerProps extends RouteComponentProps<void, void>, SagaProps {
  files: ApiCall<ModelFileDocument[]>;
  loadMore?: ImmutableTask<any>;
  replace?: typeof replace;
}

interface HandlerState {
  sortBy?: SortBy;
  files?: ModelFileDocument[];
}

@preloadApi((params, location) => {
  const sortBy = getSortByQuery(location.query);

  let files;

  switch(sortBy) {
    case SortBy.LIKE:
      files = get(`${CONFIG_API_SERVER_URL}/files`, {
        qs: { sort: '-likeCount' },
      });
      break;
    case SortBy.FORK:
      files = get(`${CONFIG_API_SERVER_URL}/files`, {
        qs: { sort: '-forked' },
      });
      break;
    case SortBy.LATEST:
      files = get(`${CONFIG_API_SERVER_URL}/files`);
      break;
  }

  return { files };
})
@connectApi(null, null, { replace })
@saga({
  loadMore: function* (sortBy: SortBy, skip: number, callback: (files: any) => any) {

    // TODO: Use lt query instead of skip for performance reason.
    let response;

    switch(sortBy) {
      case SortBy.LIKE: {
        response = yield request.get(`${CONFIG_API_SERVER_URL}/files?skip=${skip}&sort=${'-likeCount'}`);
        break;
      }
      case SortBy.FORK: {
        response = yield request.get(`${CONFIG_API_SERVER_URL}/files?skip=${skip}&sort=${'-forked'}`);
        break;
      }
      case SortBy.LATEST: {
        response = yield request.get(`${CONFIG_API_SERVER_URL}/files?skip=${skip}`);
        break;
      }
    }

    // TODO: Handle error
    if (response.status !== 200) {
      return;
    }

    callback(response.data);
  },
})
@withStyles(styles)
class ExploreHandler extends React.Component<HandlerProps, HandlerState> {
  constructor(props: HandlerProps) {
    super(props);
    this.state = {
      sortBy: getSortByQuery(props.location.query),
      files: props.files.result || null,
    };
  }

  handleChange = (e, index, value) => {
    this.props.replace({
      pathname: this.props.location.pathname,
      query: { sort: toStringSortBy(value) },
    });
  }

  componentWillReceiveProps(nextProps: HandlerProps) {
    if (this.props.location.query !== nextProps.location.query) {
      this.setState({
        sortBy: getSortByQuery(nextProps.location.query),
        files: null,
      });
    }

    if (this.props.files.state !== 'fulfilled' && nextProps.files.state === 'fulfilled') {
      this.setState({ files: nextProps.files.result });
    }
  }

  handleLoadMore = (e) => {
    // First data should be loaded via preloadApi
    if (!this.state.files) return;

    const lastFile = this.state.files[this.state.files.length - 1];
    this.props.runSaga(this.props.loadMore, this.state.sortBy, this.state.files.length, files => {
      if (this.state.files) {
        this.setState({ files: this.state.files.concat(files) });
      }
    });
  }

  render() {
    return (
      <div className={rootClass}>
        <div>
          <div>
            <h1>Explore models</h1>
          </div>
          <div className={styles.sortByCont}>
            <span style={{ marginRight: 10 }}>Sort by</span>
            <SelectField value={this.state.sortBy} onChange={this.handleChange}>
              <MenuItem value={SortBy.LIKE} primaryText="Like" />
              <MenuItem value={SortBy.FORK} primaryText="Fork" />
              <MenuItem value={SortBy.LATEST} primaryText="Latest" />
            </SelectField>
          </div>
        </div>
        <ModelList
          files={this.state.files}
        />
        <Waypoint
          onEnter={this.handleLoadMore}
        />
      </div>
    );
  }
}

export default ExploreHandler;
