#!/usr/bin/env node

require('proof')(2, function (deepEqual) {
    var Sequester = require('../..')

    var order = []
    library(function (value) {
        order.push('second')
        deepEqual(order, [ 'first', 'second' ], 'latch')
        deepEqual(value, 1, 'value')
    })

    function library (callback) {
        var sequester = new Sequester
        sequester.exclude(function () {})
        order.push('first')
        sequester.share(function (value) {
            callback(value)
        })
        sequester.unlock(1)
    }
})
