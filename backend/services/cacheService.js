const redis = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

let client = null;
let isConnecting = false;

const connectRedis = async () => {
  if (!config.redis.url || isConnecting) {
    logger.info('Redis: No URL configured - running without cache');
    return;
  }
  
  isConnecting = true;
  try {
    client = redis.createClient({ 
      url: config.redis.url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.warn('Redis: Max reconnection attempts reached, giving up');
            return new Error('Max retries reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    client.on('error', (err) => {
      if (err.message !== 'Connection aborted') {
        logger.warn('Redis Client Error:', err.message);
      }
    });

    client.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    await client.connect();
  } catch (error) {
    logger.warn('Redis connection failed - continuing without cache:', error.message);
    client = null;
  } finally {
    isConnecting = false;
  }
};

const cacheGet = async (key) => {
  if (!client?.isOpen) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

const cacheSet = async (key, value, ttlSeconds = 3600) => {
  if (!client?.isOpen) return false;
  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
};

const cacheDelete = async (key) => {
  if (!client?.isOpen) return false;
  try {
    await client.del(key);
    return true;
  } catch (error) {
    return false;
  }
};

const cacheDeletePattern = async (pattern) => {
  if (!client?.isOpen) return false;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    return false;
  }
};

const invalidateUserCache = async (userId) => {
  await cacheDeletePattern(`user:${userId}:*`);
};

module.exports = {
  connectRedis,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  invalidateUserCache,
  getClient: () => client
};