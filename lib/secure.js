import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export const secret = process.env.APP_SALT;

export const encrypt = value => crypto.createHmac('sha256', secret)
  .update(value)
  .digest('hex');
