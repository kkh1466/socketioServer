const Redis = require('../index');

let ip = '127.0.0.1';
let port = 6379;

let data = [
    {prefix: "prefix1", value: "1"},
    {prefix: "prefix2", value: "2"},
    {prefix: "prefix3", value: "3"},
];

let key = "my_number";

describe('Redis_prefix', () => {
    test('set', async () => {
        for (const d of data) {
            let client = new Redis({
                port: port,
                host: ip,
                prefix: d.prefix
            });
            client.connect();
            client.call('set', key, d.value);
            client.call('quit');
        }
    });

    test('get', async () => {
        for (const d of data) {
            let client = new Redis({
                port: port,
                host: ip,
                prefix: d.prefix
            });
            client.connect();
            expect(await client.call('get', key)).toBe(d.value);
            client.call('quit');
        }
    });

    test('no_prefix', async () => {
        let client = new Redis({
            port: port,
            host: ip
        });
        client.connect();
        client.call('set', key, "4");
        expect(await client.call('get', key)).toBe("4");
        await client.call('del', key);
        client.call('quit');
    });

    test('delete', async () => {
        for (const d of data) {
            let client = new Redis({
                port: port,
                host: ip,
                prefix: d.prefix
            });
            client.connect();
            await client.call('del', key);
            client.call('quit');
        }
    });
});
