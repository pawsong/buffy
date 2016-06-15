import * as React from 'react';
import { Link } from 'react-router';
import Paper from 'material-ui/Paper';
import { grey200 } from 'material-ui/styles/colors';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';

import * as Colors from 'material-ui/styles/colors';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import withStyles from 'isomorphic-style-loader/lib/withStyles';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';

import getForkItemLabel from '../../../utils/getForkItemLabel';

const styles = require('./ModelList.css');

import {
  ModelFileDocument,
} from '../../../types';

const inlineStyles = {
  root: {
    marginTop: 60,
  },
  courseInnerDiv: {
    paddingLeft: 163,
    paddingBottom: 39,
  },
  courseImage: {
    width: 128,
    height: 128,
    backgroundPosition: 'center center',
    backgroundSize: 'auto 100%',
  },
  courseDesc: {
    fontSize: 15,
    // lineHeight: '24px',
    height: 48,
  },
  thumbnail: {
    width: 180,
    height: 180,
    margin: 10,
  },
};

interface ModelListProps extends React.Props<ModelList> {
  fetching: boolean;
  courses: ModelFileDocument[];
}

@withStyles(styles)
class ModelList extends React.Component<ModelListProps, {}> {
  handleClickItem = (course) => {
    console.log(course);
  }

  getListItem = (file: ModelFileDocument) => {
    let fork = null;
    if (file.forkParent) {
      fork = (
        <div className={styles.itemSubtitle}>
          forked from <Link to={`/model/${file.forkParent.id}`}>{getForkItemLabel(file.forkParent)}</Link>
        </div>
      );
    }

        // <div style={{ textAlign: 'right', paddingTop: 0 }}>
    let username = null;
    if (file.owner) {
      username = (
        <div className={styles.itemContent}>
          designed by <Link to={`/@${file.owner.username}`}>{file.owner.username}</Link>
        </div>
      );
    }

    const modelUrl = `/model/${file.id}`;

    return (
      <Paper key={file.id} className={styles.item}>
        <div>
          <Link to={modelUrl}>
            <img src={`${__CDN_BASE__}/${file.thumbnail}`} />
          </Link>
          <div className={styles.itemTitleContainer}>
            <Link to={modelUrl}>
              <div className={styles.itemTitle}>{file.name}</div>
            </Link>
            {fork}
          </div>
        </div>
        {username}
      </Paper>
    );
  }

  renderBody() {
    const rows = this.props.courses.map(course => this.getListItem(course));

    return (
      <div className={styles.root}>{rows}</div>
    );
  }

  render() {
    return this.props.fetching ? <div>Fetching...</div> : this.renderBody();
  }
}

export default ModelList;
