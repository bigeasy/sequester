#!/usr/bin/env node

require('proof')(3, function (equal) {
    var sequester = require('../..')

    var lock = sequester.createLock()
    var order = []

    lock.share(function () {
        lock.increment(1)
        equal(lock.count, 2, 'count is 2')
        lock.unlock()
        equal(lock.count, 1, 'count is 1')
        lock.unlock()
        equal(lock.count, 0, 'count is 0')
    })
})
