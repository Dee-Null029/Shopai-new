module.exports = {
  apps: [
    {
      name: 'shopai-server',
      cwd: './server',
      script: 'src/app.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      max_memory_restart: '750M',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
