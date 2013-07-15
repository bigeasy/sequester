#!/usr/bin/env node

require('proof')(1, function (deepEqual) {
    var Sequester = require('../..')

    var order = []
    library(function () {
        order.push('second')
        deepEqual(order, [ 'first', 'second' ], 'countdown')
    })

    function library (callback) {
        var sequester = new Sequester
        var count = 10
        for (var i = 0; i < count; i++) {
            sequester.share(function () {})
        }
        sequester.exclude(function () { sequester.unlock() })
        order.push('first')
        sequester.share(function () {
            callback()
        })
        for (var i = 0; i < count; i++) {
            sequester.unlock()
        }
    }
})
