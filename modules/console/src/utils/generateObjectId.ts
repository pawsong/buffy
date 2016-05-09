const ObjectId = require('bson/lib/bson/objectid');

function generateObjectId(): string {
  return new ObjectId(null).toHexString();
}

export default generateObjectId;
