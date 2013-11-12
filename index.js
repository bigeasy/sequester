var __slice = [].slice

function ok (condition, message) {
    if (!condition) throw new Error(message)
}

function Queue () {
    this._identifiers = []
    this._nextIdentifier = 1
    this._queue = [{ count: 0, locks: {} }]
}


Queue.prototype.createLock = function (callback) {
    return new Lock(this, this._identifiers.pop() || this._nextIdentifier++)
}

function Lock (queue, identifier) {
    this._queue = queue
    this._identifier = identifier
}

Lock.prototype._validate = function () {
    ok(this._identifier, 'attempt to use disposed lock')
}

Lock.prototype._enqueue = function (callback, index) {
    var queue = this._queue._queue
    var entry = queue[index == null ? queue.length - 1 : index]

    var lock
    if (!(lock = entry.locks[this._identifier])) {
        entry.locks[this._identifier] = lock = { count: 0, callbacks: [] }
        entry.count++
    }

    lock.count++
    if (callback) lock.callbacks.push(callback)
}

Lock.prototype.share = function (callback) {
    this._validate()

    if (this._queue._queue.length > 1) {
        this._enqueue(callback)
    } else {
        this._enqueue()
        callback.apply(null, this._queue._shared)
    }
}

Lock.prototype.exclude = function (callback) {
    this._validate()

    var queue = this._queue._queue
    var waiting = queue[0].count != 0

    if (!waiting) this._enqueue()
    queue.push({ count: 0, locks: {}, identifier: this._identifier })
    this._enqueue(callback)
    queue.push({ count: 0, locks: {} })
    if (!waiting) this._unlock()
}

Lock.prototype.downgrade = function (callback) {
    var queue = this._queue._queue
    ok(!(queue.length % 2), 'current lock not exclusive')
    ok(this._identifier == queue[0].identifier, 'exclusive lock not held by this lock')
    this._enqueue(callback, 1)
}

Lock.prototype._get = function (operation) {
    var lock = this._queue._queue[0].locks[this._identifier]
    ok(lock, operation + ' called with no lock held')
    return lock
}

Lock.prototype.increment = function (count) {
    this._validate()

    var lock = this._get('increment')
    lock.count += count == null ? 1 : count
}

Lock.prototype.__defineGetter__('count', function () {
    var lock = this._queue._queue[0].locks[this._identifier]
    return lock ? lock.count : 0
})

Lock.prototype.dispose = function () {
    this._validate()

    ok(this.count == 0, 'locks outstanding')

    this._queue._identifiers.push(this._identifier)
    delete this._identifier
}

Lock.prototype.unlock = function () {
    this._validate()

    var lock = this._get('unlock')
    if (!(this._queue._queue.length % 2)) {
        this._queue._shared = __slice.call(arguments)
    }
    this._unlock()
}

Lock.prototype._unlock = function () {
    var queue = this._queue._queue
    var lock = queue[0].locks[this._identifier]

    if (--lock.count == 0) {
        delete queue[0].locks[this._identifier]
        queue[0].count--
    }

    while (queue[0].count == 0 && queue.length != 1) {
        queue.shift()
        for (var identifier in queue[0].locks) {
            queue[0].locks[identifier].callbacks.forEach(function (callback) {
                callback.apply(null, this._queue._shared)
            }, this)
        }
    }
}

function createQueue () {
    var queue = new Queue
    queue._shared = __slice.call(arguments)
    return queue
}

function createLock () {
    return createQueue.apply(null, __slice.call(arguments)).createLock()
}

exports.createLock = createLock
