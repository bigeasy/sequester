#!/usr/bin/env node

require('proof')(1, function (deepEqual) {
    var Sequester = require('../..')

    var sequester = new Sequester
    var order = []

    sequester.exclude(function () {
        sequester.share(function () {
            order.push('downgraded')
            sequester.unlock()
        })
        order.push('exclusive')
    })
    sequester.share(function () {
        order.push('shared')
        sequester.unlock()
    })
    sequester.exclude(function () {
        deepEqual(order, [ 'exclusive', 'downgraded', 'shared' ], 'downgrade')
        sequester.unlock()
    })
    sequester.unlock()
})
