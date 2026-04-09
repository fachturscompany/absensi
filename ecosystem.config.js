module.exports = {
    apps: [
        {
            name: "Absensi",
            script: "node_modules/next/dist/bin/next",
            args: "start -p 3007",
            cwd: "./",
            exec_mode: "cluster",
            instances: "max",
            autorestart: true,
            watch: false,
            max_memory_restart: "6G",
            env: {
                NODE_ENV: "production",
            }
        }
    ]
}
