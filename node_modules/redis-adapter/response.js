const NOT_ITERABLE_ERROR = new Error('Response is not iterable');

class Response {
    constructor(promise) {
        this.promise = promise;

        [
            'map',
            'filter',
            'reduce',
            'some',
            'every',
            'reverse',
        ].forEach(method => {
            this[method] = function (...args) {
                return new Response(this.promise.then(data => {
                    if (Array.isArray(data)) {
                        return data[method](...args);
                    }

                    throw NOT_ITERABLE_ERROR;
                }))
            }
        })
    }

    valueOf() {
        return this.data;
    }

    toString() {
        return `[object Response<${this.data.length}>`;
    }

    orderBy(fn) {
        return this.sort(fn);
    }

    take(limit) {
        return _takeWrap(this.promise, limit);
    }

    takeLast(limit) {
        return _takeLastWrap(this.promise, limit);
    }

    sort(fn, asc = true) {
        return _sortWrap(this.promise, fn, asc);
    }

    asc(str) {
        return this.sort(str, true);
    }

    desc(str) {
        return this.sort(str, false);
    }

    count() {
        return _countWrap(this.promise)
    }

    paginate(page, limit) {
        if (page <= 0 || limit <= 0) {
            throw new Error('Page and Limit should be more than 30')
        }

        return _paginateWrap(this.promise, page, limit);
    }

    then(fn) {
        return this.promise.then(fn);
    }

    catch(fn) {
        return this.promise.catch(fn);
    }

    json() {
        return this.promise.then(data => JSON.parse(data));
    }

    or(defaultValue) {
        return this.promise.then(data => data === null ? defaultValue : data);
    }
}

const wrap = fn => (el, ...rest) => {
    return new Response(el.then(data => {
        if (!Array.isArray(data)) {
            throw new Error('Response is not iterable');
        }

        return fn(data, ...rest);
    }))
}

const _countWrap = wrap(data => data.length);
const _takeWrap = wrap((data, limit) => data.slice(0, limit));
const _takeLastWrap = wrap((data, limit) => data.slice(-limit));
const _sortWrap = wrap((data, fn, asc = true) => {
    return data.sort(typeof fn === 'string' ? (a, b) => (asc ? a[fn] - b[fn] : b[fn] - a[fn]) : fn);
});
const _paginateWrap = wrap((data, page, limit) => {
    const start = (page - 1) * limit;
    return data.slice(start, start + limit);
});

module.exports = Response