export const requestIdPattern = /^[A-Za-z0-9._-]{8,100}$/;

export function logEvent(level, event, fields = {}) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: 'nh-terminal-api',
    environment: process.env.APP_ENV || 'development',
    ...fields,
  };
  const output = JSON.stringify(record);
  if (level === 'error') console.error(output);
  else console.log(output);
}
