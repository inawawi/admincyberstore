module.exports = {
  apps: [
    {
      name: "cyberstore-admin",
      cwd: "./apps/admin",
      script: "scripts/start.mjs",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/admin-error.log",
      out_file: "./logs/admin-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "cyberstore-storefront",
      cwd: "./apps/storefront",
      script: "scripts/start.mjs",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/storefront-error.log",
      out_file: "./logs/storefront-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      env: {
        NODE_ENV: "production",
        PORT: 3100,
      },
    },
  ],
};
