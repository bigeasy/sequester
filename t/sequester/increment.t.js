#!/usr/bin/env node

require('proof')(4, function (equal) {
    var sequester = require('../..')

    var order = 0
    var lock = sequester.createLock()
    lock.share(function () {
        equal(order++, 0, 'first shared')
        lock.exclude(function () {
            equal(order++, 2, 'exclusive')
            lock.share(function () {
                equal(order++, 4, 'second shared')
            })
            lock.increment(2)
        })
        lock.increment()
    })
    lock.unlock()
    equal(order++, 1, 'first unlock')
    lock.unlock()
    lock.unlock()
    lock.unlock()
    equal(order++, 3, 'fourth unlock')
})
