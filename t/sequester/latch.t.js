#!/usr/bin/env node

require('proof')(2, prove)

function prove (assert) {
    var sequester = require('../..')

    var order = []
    library(function (value) {
        order.push('second')
        assert(order, [ 'first', 'second' ], 'latch')
        assert(value, 1, 'value')
    })

    function library (callback) {
        var lock = sequester.createLock()
        lock.exclude(function () {})
        order.push('first')
        lock.share(function (value) { callback(value) })
        lock.unlock(1)
    }
}
