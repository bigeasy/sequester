#!/usr/bin/env node

require('proof')(4, function (equal) {
    var lock = require('../..').createLock()

    var order = 0
    lock.share(function () {
        equal(order++, 0, 'first shared')
    })
    lock.share(function () {
        lock.exclude(function () {
            equal(order++, 2, 'exclusive')
        })
        equal(order++, 1, 'second shared')
        lock.unlock()
        lock.unlock()
        lock.share(function () {
            equal(order++, 3, 'third shared')
        })
        lock.unlock()
    })
})
