const Redis = require('../index');

let client = new Redis({
    port: 6379,
    host: '127.0.0.1',
});

const MOCK = [
    'joe.5.shape1',
    'joe.23.shape2',
    'doe.0.shape3',
    'doe.3.shape3',
    'poe.10.shape4',
    'poe.12.shape5',
];

const JSON_MOCK = '{"test": "value", "test2": 123}';

function mock(client) {
    client.connection = {};
    client.connection.hgetall = (_, fn) => fn(null, null);
    client.connection.hget = (_, __, fn) => fn(null, JSON_MOCK);
    client.connection.smembers = (_, fn) => fn(null, MOCK);
    client.connection.multi = cmds => ({exec: fn => fn(null, cmds)});
    return client;
}

describe('Redis', () => {
    it('should fail on real connect', async () => {
        try {
            client.connect();
        } catch(error) {
            expect(error instanceof Error).toBe(true);
        }
    });

    describe('methods', () => {
        beforeAll(() => {
            mock(client);
        });

        it('smembers', async () => { 
            const data = await client.call('smembers', '');
            expect(data).toEqual(MOCK);
        });

        it('multi', async () => { 
            const data = await client.multi([['a'], ['b'], ['c']]);
            expect(data).toEqual([['a'], ['b'], ['c']]);
        });

        it('shape', async () => { 
            const data = await client.shape({
                a: [1, 2, 3],
                b: [5, 6, 7],
            });
            expect(data).toEqual({
                a: [1, 2, 3],
                b: [5, 6, 7],
            });
        });

        it('map', async () => { 
            const data = await client.call('smembers', '').map(x => x.split('.'));
            expect(data).toEqual(MOCK.map(x => x.split('.')));
        });

        it('sort', async () => { 
            const data = await client
                .call('smembers', '')
                .map(x => x.split('.'))
                .map(([name, n, shape]) => ({name, id: Number(n), shape}))
                .sort('id')
                .map(x => x.id);

            expect(data).toEqual([0, 3, 5, 10, 12, 23]);
        });

        it('orderBy', async () => { 
            const data = await client
                .call('smembers', '')
                .map(x => x.split('.'))
                .map(([name, n, shape]) => ({name, id: Number(n), shape}))
                .sort('id')
                .map(x => x.id);

            expect(data).toEqual([0, 3, 5, 10, 12, 23]);
        });

        it('asc', async () => { 
            const data = await client
                .call('smembers', '')
                .map(x => x.split('.'))
                .map(([name, n, shape]) => ({name, id: Number(n), shape}))
                .asc('id')
                .map(x => x.id);

            expect(data).toEqual([0, 3, 5, 10, 12, 23]);
        });

        it('desc', async () => { 
            const data = await client
                .call('smembers', '')
                .map(x => x.split('.'))
                .map(([name, n, shape]) => ({name, id: Number(n), shape}))
                .desc('id')
                .map(x => x.id);

            expect(data).toEqual([0, 3, 5, 10, 12, 23].reverse());
        });


        it('take', async () => { 
            const data = await client
                .call('smembers', '')
                .map(x => null)
                .take(2);
            
            expect(data).toEqual([null, null]);
            expect(data.length).toEqual(2);
        });

        it('takeLast', async () => { 
            const data = await client
                .call('smembers', '')
                .map(x => x.split('.')[1])
                .takeLast(2);
            
            expect(data).toEqual(['10', '12']);
            expect(data.length).toEqual(2);
        });

        it('reverse', async () => { 
            const data = await client
                .call('smembers', '')
                .map(x => x.split('.')[1])
                .reverse();

            expect(data).toEqual([ '12', '10', '3', '0', '23', '5' ]);
        });

        it('json', async () => {
            const data = await client.call('hget', 'a', 'b').json();
            expect(data).toEqual({test: 'value', test2: 123});
        });

        it('or', async () => {
            const data = await client.call('hgetall', 'a').or('DEFAULT_VALUE')
            expect(data).toEqual('DEFAULT_VALUE');
        });
    });
});