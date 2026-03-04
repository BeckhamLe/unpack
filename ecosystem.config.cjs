module.exports = {
  apps: [{
    name: 'unpack',
    script: 'node_modules/.bin/tsx',
    args: 'src/server/main.ts',
    env: {
      NODE_ENV: 'production'
    },
    max_memory_restart: '300M',
    error_file: '/home/ec2-user/unpack/logs/error.log',
    out_file: '/home/ec2-user/unpack/logs/out.log',
    merge_logs: true
  }]
};
