export interface Key {
  id: string;
  label: string;
  keyCode: number;
}

export const Keys: Key[] = [
  {
    id: 'enter',
    label: 'Enter',
    keyCode: 13,
  },
  {
    id: 'a',
    label: 'a',
    keyCode: 65,
  },
  {
    id: 'd',
    label: 'd',
    keyCode: 68,
  },
  {
    id: 's',
    label: 's',
    keyCode: 83,
  },
  {
    id: 'w',
    label: 'w',
    keyCode: 87,
  },
];
