#!/usr/bin/env node

require('proof')(1, function (deepEqual) {
    var Sequester = require('../..')

    var order = []
    library(function () {
        order.push('second')
        deepEqual(order, [ 'first', 'second' ], 'latch')
    })

    function library (callback) {
        var sequester = new Sequester
        sequester.exclude(function () {})
        order.push('first')
        sequester.share(function () {
            callback()
        })
        sequester.unlock()
    }
})
