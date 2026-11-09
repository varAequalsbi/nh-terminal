const environments = new Set(['local', 'development', 'test', 'staging', 'production']);

const integer = (name, fallback, minimum, maximum) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return value;
};

export function databaseConfig({ requireUrl = true } = {}) {
  const environment = process.env.APP_ENV || 'development';
  if (!environments.has(environment)) {
    throw new Error(`APP_ENV must be one of: ${[...environments].join(', ')}`);
  }

  const url = process.env.DATABASE_URL?.trim();
  if (requireUrl && !url) throw new Error('DATABASE_URL is required');
  if (url && !/^postgres(?:ql)?:\/\//i.test(url)) {
    throw new Error('DATABASE_URL must use the postgres:// or postgresql:// scheme');
  }

  const sslMode =
    process.env.DATABASE_SSL ||
    (environment === 'local' || environment === 'test' ? 'disable' : 'require');
  if (!['disable', 'require'].includes(sslMode)) {
    throw new Error('DATABASE_SSL must be either disable or require');
  }

  return {
    environment,
    url,
    ssl: sslMode === 'require' ? 'require' : false,
    max: integer('DATABASE_POOL_MAX', 5, 1, 20),
    connectTimeout: integer('DATABASE_CONNECT_TIMEOUT_SECONDS', 10, 1, 60),
  };
}
