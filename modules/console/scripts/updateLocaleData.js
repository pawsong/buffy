import {sync as globSync} from 'glob';
const fs = require('fs');
const difference = require('lodash/difference');
const concat = require('lodash/concat');

const MESSAGES_PATTERN = `${__dirname}/../build/dev/client/messages/**/*.json`;
const LANG_DIR         = `${__dirname}/../src/messages/`;

export default function updateLocaleData() {
  const defaultMessages = globSync(MESSAGES_PATTERN)
    .map(filename => fs.readFileSync(filename, 'utf8'))
    .map(file => JSON.parse(file))
    .reduce((collection, descriptors) => {
      descriptors.forEach(({id, defaultMessage}) => {
        if (collection.hasOwnProperty(id)) {
          throw new Error(`Duplicate message id: ${id}`);
        }
        collection[id] = defaultMessage;
      });

      return collection;
    }, {});

  const ids = Object.keys(defaultMessages).sort();

  fs.readdirSync(LANG_DIR).forEach(file => {
    const filepath = `${LANG_DIR}/${file}`;
    const oldContent = fs.readFileSync(filepath, 'utf8');

    // Invalidate require cache
    delete require.cache[require.resolve(filepath)];

    const messages = require(filepath).default;
    const localeIds = Object.keys(messages);
    const missingIds = difference(localeIds, ids);

    const content = `export default {\n${concat(
      ids.map(id => `  '${id}': '${messages[id] || ''}', // ${defaultMessages[id]}`),
      missingIds.map(id => `  /* [Warning] Message not in use */ '${id}': '${messages[id] || ''}',`)
    ).join('\n')}\n}\n`

    if (oldContent !== content) fs.writeFileSync(filepath, content, 'utf8');
  });
}
