const Redis = require('ioredis');
const logger = require('../config/logger');

let redis = null;

const getRedisClient = () => {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 10) {
        logger.error('Redis: max retries reached, giving up');
        return null;
      }
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (err) => logger.warn('Redis error (non-fatal):', { message: err.message }));
  redis.on('close', () => logger.warn('Redis connection closed'));

  return redis;
};

const blacklistToken = async (tokenHash, ttlSeconds) => {
  try {
    const client = getRedisClient();
    if (client.status !== 'ready') return false;
    await client.set(`bl:${tokenHash}`, '1', 'EX', ttlSeconds);
    return true;
  } catch (err) {
    logger.error('Redis blacklist error:', { message: err.message });
    return false;
  }
};

const isBlacklisted = async (tokenHash) => {
  try {
    const client = getRedisClient();
    if (client.status !== 'ready') return false;
    const result = await client.get(`bl:${tokenHash}`);
    return result === '1';
  } catch (err) {
    logger.error('Redis check error:', { message: err.message });
    return false;
  }
};

const storeRefreshTokenFamily = async (family, ttlSeconds) => {
  try {
    const client = getRedisClient();
    if (client.status !== 'ready') return false;
    await client.set(`rf:${family}`, 'active', 'EX', ttlSeconds);
    return true;
  } catch (err) {
    return false;
  }
};

const revokeRefreshTokenFamily = async (family) => {
  try {
    const client = getRedisClient();
    if (client.status !== 'ready') return false;
    await client.del(`rf:${family}`);
    return true;
  } catch (err) {
    return false;
  }
};

const isRefreshTokenFamilyRevoked = async (family) => {
  try {
    const client = getRedisClient();
    if (client.status !== 'ready') return false;
    const result = await client.get(`rf:${family}`);
    return result !== 'active';
  } catch (err) {
    return false;
  }
};

const connectRedis = async () => {
  try {
    const client = getRedisClient();
    await client.connect();
    logger.info('Redis connected successfully');
  } catch (err) {
    logger.warn('Redis not available - running without cache:', { message: err.message });
  }
};

module.exports = {
  getRedisClient,
  connectRedis,
  blacklistToken,
  isBlacklisted,
  storeRefreshTokenFamily,
  revokeRefreshTokenFamily,
  isRefreshTokenFamilyRevoked,
};
