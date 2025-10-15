module.exports = {
  apps: [
    {
      name: 'call-agent-web',
      cwd: './web',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'call-agent-api',
      cwd: './agent',
      script: 'python',
      args: 'pdf_api.py',
      interpreter: 'python3'
    },
    {
      name: 'call-agent-livekit',
      cwd: './agent',
      script: 'python',
      args: 'main.py',
      interpreter: 'python3'
    }
  ]
}