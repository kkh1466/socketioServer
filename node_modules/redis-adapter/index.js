const redis = require('redis');
const {EventEmitter} = require('events');

const Response = require('./response');

module.exports = class Redis extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
    }

    /**
     * @public
     * @return {Promise<*>}
     */
    connect() {
        return new Promise((resolve, reject) => {
            this.connection = redis.createClient(this.config.port, this.config.host, {
                prefix: this.config.prefix || null,
                connect_timeout: this.config.connectTimeout,
                db: this.config.db,
            });

            if (this.config.password) {
                this.connection.auth(this.config.password, err => {
                    if (err) {
                        this.emit('error', err);
                        reject(err);
                    }
                });
            }

            this.connection.on('ready', data => {
                this.emit('ready');
                resolve(data);
            });

            this.connection.on('error', err => {
                this.emit('error', err);
                reject(err);
            });

            this.connection.on('end', data => this.emit('end', data));
        });
    }

    /**
     * @public
     * @param {string} command
     * @param rest
     * @return {Promise<*>}
     */
    call(command, ...rest) {
        return new Response(new Promise((resolve, reject) => {
            if (this.connection[command]) {
                this.connection[command].apply(this.connection, rest.concat((err, data) => {
                    if (err) {
                        this.emit('error', err);
                        reject(err);
                    }

                    resolve(data);
                }));
            } else {
                reject(new Error(`No such command: ${command}`));
            }
        }));
    }

    /**
     * @public
     * @param {array} cmds
     * @return {Promise<array>}
     */
    multi(cmds) {
        return new Response(new Promise((resolve, reject) => {
            this.connection.multi(cmds).exec((err, data) => {
                if (err) {
                    this.emit('error', err);
                    reject(err);
                }

                resolve(data);
            });
        }));
    }

    /**
     * @public
     * @param {object} shapes
     * @return {Promise<object>}
     */
    shape(shapes) {
        const [commands, keys] = Object.keys(shapes).reduce(([commands, entries], entry) => ([
            commands.concat([shapes[entry]]),
            entries.concat(entry),
        ]), [[], []]);

        return new Promise((resolve, reject) => {
            this.connection.multi(commands).exec((err, replies) => {
                if (err) {
                    this.emit('error', err);
                    reject(err);
                }

                resolve(replies.reduce((acc, reply, replyIndex) => {
                    const key = keys[replyIndex];
                    acc[key] = reply
                    return acc
                }, {}));
            })
        })
    }
}
