import * as React from 'react';
import { Link } from 'react-router';
import Paper from 'material-ui/Paper';
import { grey200 } from 'material-ui/styles/colors';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import IconButton from 'material-ui/IconButton';

import * as Colors from 'material-ui/styles/colors';
import {grey700} from 'material-ui/styles/colors';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import PlayArrow from 'material-ui/svg-icons/av/play-arrow';

import Heart from '../icons/Heart';
import Fork from '../icons/Fork';
import ModeComment from 'material-ui/svg-icons/editor/mode-comment';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';

import getForkItemLabel from '../../utils/getForkItemLabel';

const styles = require('./ModelList.css');

import {
  ModelFileDocument,
} from '../../types';

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
  socialIcon: {
    width: 16,
    height: 16,
  }
};

interface ModelListProps extends React.Props<ModelList> {
  files: ModelFileDocument[];
}

@withStyles(styles)
class ModelList extends React.Component<ModelListProps, {}> {
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
          <div className={styles.itemThumbnailCont}>
            <Link to={modelUrl}><img src={`${__CDN_BASE__}/${file.thumbnail}`} /></Link>
            {file.animated && (
              <IconButton
                className={styles.itemAnimated}
                containerElement={<Link to={`${modelUrl}?animate=1`} />}
              >
                <PlayArrow />
              </IconButton>
            )}
          </div>
          <div className={styles.itemTitleContainer}>
            <Link to={modelUrl}>
              <div className={styles.itemTitle}>{file.name}</div>
            </Link>
            {fork}
          </div>
        </div>
        {username}
        <div className={styles.itemSocialCont}>
          <div className={styles.itemSocial}>
            <Heart style={inlineStyles.socialIcon} color={grey700} />
            <div className={styles.itemSocialNumber}>{file.likeCount}</div>
          </div>
          <div className={styles.itemSocial}>
            <Fork style={inlineStyles.socialIcon} color={grey700} />
            <div className={styles.itemSocialNumber}>{file.forked}</div>
          </div>
          <div className={styles.itemSocial}>
            <ModeComment style={inlineStyles.socialIcon} color={grey700} />
            <div className={styles.itemSocialNumber}>{file.commentCount}</div>
          </div>
        </div>
      </Paper>
    );
  }

  renderBody() {
    const rows = this.props.files.map(course => this.getListItem(course));

    return (
      <div className={styles.root}>{rows}</div>
    );
  }

  render() {
    return !this.props.files ? <div>Fetching...</div> : this.renderBody();
  }
}

export default ModelList;
