#!/usr/bin/env node

require('proof')(2, function (deepEqual) {
    var sequester = require('../..')

    var order = []
    library(function (value) {
        order.push('second')
        deepEqual(order, [ 'first', 'second' ], 'latch')
        deepEqual(value, 1, 'value')
    })

    function library (callback) {
        var lock = sequester.createLock()
        lock.exclude(function () {})
        order.push('first')
        lock.share(function (value) { callback(value) })
        lock.unlock(1)
    }
})
