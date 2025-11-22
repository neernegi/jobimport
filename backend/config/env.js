require('dotenv').config();

const required = ['MONGO_URI', 'REDIS_HOST', 'REDIS_PORT'];
for (const k of required) {
  if (!process.env[k]) {
    console.warn(`ENV ${k} not set — please check .env or docker-compose`);
  }
}

module.exports = process.env;
