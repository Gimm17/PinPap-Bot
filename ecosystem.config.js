// ecosystem.config.js
// PM2 configuration untuk PAP Bot

module.exports = {
  apps: [
    {
      name: 'papbot',
      script: 'src/index.js',
      interpreter: 'node',
      node_args: '--max-old-space-size=512',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        STORAGE: 'sqlite',
      },
      env_development: {
        NODE_ENV: 'development',
        DEBUG: 'true',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};