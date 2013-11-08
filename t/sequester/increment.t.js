#!/usr/bin/env node

require('proof')(4, function (equal) {
    var Sequester = require('../..')

    var order = 0
    var sequester = new Sequester
    sequester.share(function () {
        equal(order++, 0, 'first shared')
        sequester.exclude(function () {
            equal(order++, 2, 'exclusive')
            sequester.share(function () {
                equal(order++, 4, 'second shared')
            })
            sequester.increment()
        })
        sequester.increment()
    })
    sequester.unlock()
    equal(order++, 1, 'first unlock')
    sequester.unlock()
    sequester.unlock()
    equal(order++, 3, 'third unlock')
})
