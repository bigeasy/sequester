#!/usr/bin/env node

require('proof')(1, function (equal) {
    var Sequester = require('../..')

    var order = 0
    var sequester = new Sequester
    sequester.exclude(function () {
        sequester.share(function () {
        })
        equal(order++, 0, 'exclusive')
        sequester.unlock()
        sequester.unlock()
    })
})
