#!/usr/bin/env node

require('proof')(1, function (equal) {
    var sequester = require('../..')

    var order = 0
    var lock = sequester.createLock()
    lock.exclude(function () {
        lock.share(function () {
        })
        equal(order++, 0, 'exclusive')
        lock.unlock()
        lock.unlock()
    })
})
