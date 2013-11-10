#!/usr/bin/env node

require('proof')(1, function (deepEqual) {
    var sequester = require('../..')

    var sequester = sequester.createLock()
    var order = []

    sequester.share(function () {})
    sequester.exclude(function () {
        sequester.downgrade(function () {
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
        order.push('exclusive again')
        deepEqual(order, [ 'exclusive', 'shared', 'downgraded', 'exclusive again' ], 'downgrade')
        sequester.unlock()
    })
    sequester.unlock()
    sequester.unlock()
})
