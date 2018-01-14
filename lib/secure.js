const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const secret = process.env.APP_SALT;

const encrypt = value => crypto.createHmac('sha256', secret)
  .update(value)
  .digest('hex');

module.exports = { secret, encrypt };
