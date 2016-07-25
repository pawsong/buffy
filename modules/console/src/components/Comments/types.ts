import { User } from '../../reducers/users';

export interface CommentDocument {
  id: string;
  __v: number;
  body: string;
  user: User;
  createdAt: string;
}
