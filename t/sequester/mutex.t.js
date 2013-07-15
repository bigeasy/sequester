#!/usr/bin/env node

require('proof')(1, function (deepEqual) {
    var Sequester = require('../..')

    var sequester = new Sequester
    var order = []

    sequester.exclude(function () {
        order.push('first')
    })
    sequester.exclude(function () {
        order.push('second')
        sequester.unlock()
    })
    sequester.exclude(function () {
        order.push('third')
        sequester.unlock()
    })
    sequester.exclude(function () {
        deepEqual(order, [ 'first', 'second', 'third' ], 'mutex')
    })

    sequester.unlock()
})
