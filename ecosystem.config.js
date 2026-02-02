/**
 * PM2 Ecosystem Configuration
 *
 * Run with: pm2 start ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      name: 'routine-game',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/routine-game',
      instances: 'max', // Use all available CPUs
      exec_mode: 'cluster', // Enable cluster mode for load balancing
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      error_file: '/var/log/pm2/routine-game-error.log',
      out_file: '/var/log/pm2/routine-game-out.log',
      log_file: '/var/log/pm2/routine-game-combined.log',
      time: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
