// Internally, Sequester keeps a queue of lock requests in an array. The lock
// requests always alternate shared, exclusive, shared, etc. The last element of
// the lock queue array is always a shared lock. There is always at least one
// element in the lock queue array. Therefore, when there is only one element in
// the lock queue array it is a shared lock.

// The shared lock has a counter. A shared lock can be held by many. An
// exclusive lock can only be held by one. An exclusive lock does not have a
// counter.

// The lock in the first element of the lock queue array is the active lock. Any
// locks after the first element of the lock queue array are waiting locks.

// When you request an exclusive lock an exclusive lock is pushed onto the lock
// queue array followed by a shared lock so that the last element of the array
// is always a shared lock. You receive a promise that will resolve when the
// exclusive lock reaches the front of the array.

// When you request a shared lock that request is always added by incrementing
// the shared lock counter of the last element of the array. (The last element
// of lock queue array is always a shared lock.) You will receive a promise that
// will resolve when the shared lock reaches the front of the array.

// This is how we implement a reader-preferenced read/write lock and ensure that
// the lock makes progress. Exclusive locks are always pushed onto the array so
// no exclusive lock will be added before it. Shared locks will always increment
// the counter of the shared lock at the end of the array so the counters of all
// the shared locks in front of an exclusive lock can only go down.

// When a shared lock's count reaches zero, if there are locks after it in the
// queue, the lock is shifted from the front of the lock queue array. The next
// lock becomes the active lock. The next lock will be an exclusive lock
// followed by the new shared tail.

// If the count reaches zero and there are no locks waiting, we just leave that
// shared lock in the lock queue array as its single element. When there is no
// contention &mdash; no waiting locks &mdash; Sequester is just a counter going
// up and down. Practically a no-op.

//
module.exports = class Sequester {
    constructor () {
        this._queue = [{ exclusive: false, count: 0, promise: null, resolve: null }]
    }

    get mutexes () {
        return this._queue.map(mutex => mutex.count)
    }

    get state () {
        return this._queue[0].exclusive ? 'exclusive' : 'shared'
    }

    increment (count) {
        this._queue[0].count += count
    }

    share () {
        if (this._queue.length == 1) {
            this._queue[0].count++
            return null
        }
        const shared = this._queue[this._queue.length - 1]
        shared.count++
        return shared.promise
    }

    exclude () {
        const exclusive = {
            exclusive: true,
            count: 1,
            promise: this._queue.length == 1 && this._queue[0].count == 0
                ? null
                : new Promise(resolve => this._queue[this._queue.length - 1].resolve = resolve),
            resolve: null
        }
        const shared = {
            exclusive: false,
            count: 0,
            upgradable: false,
            promise: new Promise(resolve => exclusive.resolve = resolve),
            resolve: null
        }
        this._queue.push(exclusive, shared)
        if (exclusive.promise == null) {
            this._queue.shift()
        }
        return exclusive.promise
    }

    downgrade () {
        this._queue[1].count++
        this.unlock()
    }

    unlock () {
        this._queue[0].count--
        while (this._queue.length != 1 && this._queue[0].count == 0) {
            this._queue.shift().resolve.call()
        }
    }
}
