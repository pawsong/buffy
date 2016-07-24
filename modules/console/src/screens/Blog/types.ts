import {User} from '../../reducers/users';

export interface BlogPostDocument {
  id: string;
  author: User;
  slug: string;
  title: string;
  body: string;
  createdAt: string;
}
