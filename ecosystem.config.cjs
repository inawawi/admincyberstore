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
      env: {
        NODE_ENV: "production",
        PORT: 3100,
      },
    },
  ],
};
