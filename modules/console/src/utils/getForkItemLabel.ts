import { ForkItem } from '../types';

export default function getForkItemLabel(forkItem: ForkItem) {
  if (forkItem.owner) {
    return `${forkItem.owner.username}/${forkItem.name}`;
  } else {
    return forkItem.name;
  }
}
