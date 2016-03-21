import {sync as globSync} from 'glob';
import fs from 'fs';
import path from 'path';
import difference from 'lodash/difference';
import concat from 'lodash/concat';

const ROOT_DIR         = `${__dirname}/..`;
const MESSAGE_DIR      = `${ROOT_DIR}/build/dev/client/messages`;
const MESSAGES_PATTERN = `${MESSAGE_DIR}/**/*.json`;
const LANG_DIR         = `${ROOT_DIR}/src/messages/`;

export default function updateLocaleData() {
  const messages = globSync(MESSAGES_PATTERN)
    .map(filename => {
      const relpath = path.relative(MESSAGE_DIR, filename);

      const file = fs.readFileSync(filename, 'utf8');
      const descriptors = JSON.parse(file);

      return descriptors.map(descriptor => ({
        descriptor,
        path: relpath,
      }))
    })
    .reduce((collection, messages) => {
      messages.forEach(message => {
        const { id } = message.descriptor;
        if (collection.hasOwnProperty(id)) {
          throw new Error(`Duplicate message id: ${id}`);
        }
        collection[id] = message;
      });
      return collection;
    }, {});

  const ids = Object.keys(messages).sort();

  fs.readdirSync(LANG_DIR).forEach(file => {
    const filepath = `${LANG_DIR}/${file}`;
    const prevContent = fs.readFileSync(filepath, 'utf8');

    // Invalidate require cache
    delete require.cache[require.resolve(filepath)];

    const localeMessages = require(filepath).default;
    const localeIds = Object.keys(localeMessages);
    const missingIds = difference(localeIds, ids);

    //
    // Output file format
    //
    // export default {
    //   /**
    //    * path: src/messages/abc
    //    * description: abc
    //    * default Message: abc
    //    */
    //   'abc': 'abc',
    //
    //   /**
    //    * path: src/messages/def
    //    * description: def
    //    * default Message: def
    //    */
    // /* translate */ 'def': '',
    // }
    //

    //  ${defaultMessages[id]}
    const content = `export default {\n${concat(
      ids.map(id => {
        const message = messages[id];
        return [
          `  /**`,
          `   * path: ${message.path}`,
          `   * description: ${message.descriptor.description}`,
          `   * defaultMessage: ${message.descriptor.defaultMessage}`,
          `   */`,
          `${!localeMessages[id] ? '/* translate */ ' : '  '}'${id}': '${localeMessages[id] || ''}',\n`
        ].join('\n');
      }),
      missingIds.map(id => `/* [Warning] Message not in use */ '${id}': '${localeMessages[id] || ''}',`)
    ).join('\n')}\n}\n`

    if (prevContent !== content) fs.writeFileSync(filepath, content, 'utf8');
  });
}
