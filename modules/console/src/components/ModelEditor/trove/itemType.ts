import {
  TroveItemType,
} from '../types';

interface TroveItemInfo {
  label: string;
  typename: string;
}

const infos: { [index: number]: TroveItemInfo } = {
  [TroveItemType.BLUNT]: {
    label: 'Blunt',
    typename: 'blunt',
  },
  [TroveItemType.SWORD]: {
    label: 'Sword',
    typename: 'sword',
  },
  [TroveItemType.AXE]: {
    label: 'Axe',
    typename: 'axe',
  },
  [TroveItemType.PISTOL]: {
    label: 'Pistol',
    typename: 'pistol',
  },
  [TroveItemType.STAFF]: {
    label: 'Staff',
    typename: 'staff',
  },
  [TroveItemType.BOW]: {
    label: 'Bow',
    typename: 'bow'
  },
  [TroveItemType.SPEAR]: {
    label: 'Spear',
    typename: 'spear',
  },
  [TroveItemType.MASK]: {
    label: 'Mask',
    typename: 'mask'
  },
  [TroveItemType.HAT]: {
    label: 'Hat',
    typename: 'hat',
  },
  [TroveItemType.HAIR]: {
    label: 'Hair',
    typename: 'hair',
  },
  [TroveItemType.DECO]: {
    label: 'Deco',
    typename: 'deco',
  },
  [TroveItemType.LAIR]: {
    label: 'Lair',
    typename: 'lair',
  },
  [TroveItemType.DUNGEON]: {
    label: 'Dungeon',
    typename: 'dungeon',
  },
};

export default infos;
