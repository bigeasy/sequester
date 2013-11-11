#!/usr/bin/env node

require('proof')(1, function (deepEqual) {
    var sequester = require('../..')

    var lock = sequester.createLock()
    var order = []

    lock.exclude(function () {
        order.push('first')
    })
    lock.exclude(function () {
        order.push('second')
        lock.unlock()
    })
    lock.exclude(function () {
        order.push('third')
        lock.unlock()
    })
    lock.exclude(function () {
        deepEqual(order, [ 'first', 'second', 'third' ], 'mutex')
    })

    lock.unlock()
})
