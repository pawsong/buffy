import {
  TroveItemType,
} from '../types';

interface TroveItemInfo {
  label: string;
  typename: string;
  commands: string[];
}

const WEAPON_COMMANDS = ['weaponpreview', 'wp'];
const HAIR_COMMANDS = ['hairpreview'];
const HAT_COMMANDS = ['hatpreview'];
const FACE_COMMANDS = ['facepreview'];
const DECO_COMMANDS = ['decopreview'];
const DONGEON_COMMANDS = ['dungeon'];

const infos: { [index: number]: TroveItemInfo } = {
  [TroveItemType.BLUNT]: {
    label: 'Blunt',
    typename: 'blunt',
    commands: WEAPON_COMMANDS,
  },
  [TroveItemType.SWORD]: {
    label: 'Sword',
    typename: 'sword',
    commands: WEAPON_COMMANDS,
  },
  [TroveItemType.AXE]: {
    label: 'Axe',
    typename: 'axe',
    commands: WEAPON_COMMANDS,
  },
  [TroveItemType.PISTOL]: {
    label: 'Pistol',
    typename: 'pistol',
    commands: WEAPON_COMMANDS,
  },
  [TroveItemType.STAFF]: {
    label: 'Staff',
    typename: 'staff',
    commands: WEAPON_COMMANDS,
  },
  [TroveItemType.BOW]: {
    label: 'Bow',
    typename: 'bow',
    commands: WEAPON_COMMANDS,
  },
  [TroveItemType.SPEAR]: {
    label: 'Spear',
    typename: 'spear',
    commands: WEAPON_COMMANDS,
  },
  [TroveItemType.MASK]: {
    label: 'Mask',
    typename: 'mask',
    commands: FACE_COMMANDS,
  },
  [TroveItemType.HAT]: {
    label: 'Hat',
    typename: 'hat',
    commands: HAT_COMMANDS,
  },
  [TroveItemType.HAIR]: {
    label: 'Hair',
    typename: 'hair',
    commands: HAIR_COMMANDS,
  },
  [TroveItemType.DECO]: {
    label: 'Deco',
    typename: 'deco',
    commands: DECO_COMMANDS,
  },
  [TroveItemType.LAIR]: {
    label: 'Lair',
    typename: 'lair',
    commands: [],
  },
  [TroveItemType.DUNGEON]: {
    label: 'Dungeon',
    typename: 'dungeon',
    commands: DONGEON_COMMANDS,
  },
};

export default infos;
