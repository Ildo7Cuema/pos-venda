'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
process.chdir(root);
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3000';
process.env.HOSTNAME = process.env.HOSTNAME || '127.0.0.1';

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const text = fs.readFileSync(filePath, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq <= 0) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

loadEnvFile(path.join(root, '.env'));
loadEnvFile(path.join(root, '.env.production'));
loadEnvFile(path.join(root, 'config.env'));

const logPath = path.join(root, 'kamba.log');
try {
    const log = fs.createWriteStream(logPath, { flags: 'a' });
    log.write(`\n==== ${new Date().toISOString()} arranque ====\n`);
    const wrap = (stream) => {
        const orig = stream.write.bind(stream);
        stream.write = (chunk, encoding, cb) => {
            try {
                log.write(chunk);
            } catch (_) {
                /* ignore log write errors */
            }
            return orig(chunk, encoding, cb);
        };
    };
    wrap(process.stdout);
    wrap(process.stderr);
} catch (_) {
    /* logging is optional */
}

const pidPath = path.join(root, 'kamba.pid');
try {
    fs.writeFileSync(pidPath, String(process.pid));
} catch (_) {
    /* pid file is optional */
}

const cleanup = () => {
    try {
        fs.unlinkSync(pidPath);
    } catch (_) {
        /* ignore */
    }
};
process.on('exit', cleanup);
process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
});
process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
});

require(path.join(root, 'server.js'));
