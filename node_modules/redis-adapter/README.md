# redis-adapter 🔌 

This is simple Redis client adapter with promises. 

[![Build Status](https://travis-ci.org/jazzpool/redis-adapter.svg?branch=master)](https://travis-ci.org/jazzpool/redis-adapter)

## Methods and usage

 - Create connection
```js 
const Redis = require('redis-adapter');

const client = new Redis({port: 6379, host: '127.0.0.1'});

client.connect()
    .then(() => {
        console.log('Hooray!');
    })
    .catch(error => {
        console.log('Connection failed!');
    });

client.on('end', () => {
    console.log('Connection closed')
});
```
 - Connection with prefix
```js
const client = new Redis({port: 6379, host: '127.0.0.1', prefix: 'prefix'});
```
 - Call methods
```js
client.call('smembers', 'blocks').then(blocks => {
    console.log('List of blocks:', blocks);
});
```

 - Use `shape` for plain shapes:

```js
client.shape({
    blocks: ['smembers', 'blocks'],
    hashName: ['hget', 'data', 'name'],
    range: ['zrange', 'logs', 0, '+inf'],
}).then(({blocks, hashName, range}) => {
    console.log('blocks set:', blocks);
    console.log('hash key "name" value:', hashName);
    console.log('range:', range);
});
```

 - Instant `multi`

```js
client.multi([
    ['smembers', 'blocks'],
    ['hget', 'data', 'name'],
    ['zrange', 'logs', 0, '+inf'],
]).then(([blocks, hashName, range]) => {
    console.log('blocks set:', blocks);
    console.log('hash key "name" value:', hashName);
    console.log('range:', range);
});
```


## Modify response

Methods:
 - map
 - filter
 - reduce
 - some
 - every
 - orderBy
 - sort 
 - paginate
 - count
 - asc
 - desc
 - take
 - takeLast
 - reverse
 - json

```js
client
    .call('smembers', 'items')
    .map(Number)
    .asc()
    .then(console.log);

client
    .call('zrangebyscore', 'somethings', '-inf', '+inf')
    .map(x => Number(x.property))
    .filter(p => p > 0)
    .desc()
    .then(console.log);

client
    .call('smembers')
```

