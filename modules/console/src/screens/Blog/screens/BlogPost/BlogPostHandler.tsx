import React from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps, Link} from 'react-router';
import {replace} from 'react-router-redux';
const ReactMarkdown = require('react-markdown');
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { FormattedDate } from 'react-intl';

import {BlogPostDocument} from '../../types';

import { preloadApi, connectApi, ApiCall, get } from '../../../../api';

const anonProfilePicture = require('file!../../../../ic_pets_black_24dp_2x.png');
const styles = require('./BlogPostHandler.css');

interface RouteParams {
  slug: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams> {
  post: ApiCall<BlogPostDocument>;
}

@preloadApi<RouteParams>(params => ({
  post: get(`${CONFIG_API_SERVER_URL}/blog/posts/${params.slug}`),
}))
@connectApi()
@withStyles(styles)
class BlogPostHandler extends React.Component<HandlerProps, {}> {
  constructor(props: HandlerProps) {
    super(props);
  }

  renderBody() {
    const post = this.props.post.result;
    if (!post) return null;

    const picture = post.author.picture ? `${__CDN_BASE__}/${post.author.picture}` : anonProfilePicture;

    return (
      <div>
        <h1>{post.title}</h1>
        <div className={styles.profile}>
          <FormattedDate
            value={new Date(post.createdAt)}
            year='numeric'
            month='short'
            day='numeric'
          />
          <Link to={`/@${post.author.username}`} className={styles.profilePicture}>
            <img src={picture} />
          </Link>
          <Link to={`/@${post.author.username}`} className={styles.profileUsername}>
            {post.author.username}
          </Link>
        </div>
        <ReactMarkdown source={post.body} className={styles.body} />
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderBody()}
      </div>
    );
  }
}

export default BlogPostHandler;
