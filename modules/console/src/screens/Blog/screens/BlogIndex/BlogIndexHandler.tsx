import React from 'react';
import {Link} from 'react-router';
import {List, ListItem} from 'material-ui/List';
import Avatar from 'material-ui/Avatar';
import { FormattedDate } from 'react-intl';
import { defineMessages, InjectedIntlProps } from 'react-intl';
import {BlogPostDocument} from '../../types';

import { preloadApi, connectApi, ApiCall, get } from '../../../../api';

const anonProfilePicture = require('file!../../../../ic_pets_black_24dp_2x.png');

interface HandlerProps {
  posts: ApiCall<BlogPostDocument[]>;
}

@preloadApi(() => ({
  posts: get(`${CONFIG_API_SERVER_URL}/blog-posts`),
}))
@connectApi()
class BlogIndexHandler extends React.Component<HandlerProps, {}> {
  renderPostList() {
    const listItems = this.props.posts.result && this.props.posts.result.map(post => {
      const picture = post.author.picture ? `${__CDN_BASE__}/${post.author.picture}` : anonProfilePicture;

      return (
        <ListItem
          key={post.id}
          primaryText={post.title}
          secondaryText={
            <div>
              <FormattedDate
                value={new Date(post.createdAt)}
                year='numeric'
                month='short'
                day='numeric'
              />
            </div>
          }
          leftAvatar={<Avatar src={picture} />}
          containerElement={<Link to={`/blog/${post.slug}`} />}
        />
      );
    });

    return (
      <List>{listItems}</List>
    );
  }

  render() {
    return (
      <div>
        <h1>Buffy Blog</h1>
        {this.renderPostList()}
      </div>
    );
  }
}

export default BlogIndexHandler;
