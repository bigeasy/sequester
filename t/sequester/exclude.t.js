#!/usr/bin/env node

require('proof')(1, function (equal) {
    var sequester = require('../..')

    var order = 0
    var sequester = sequester.createLock()
    sequester.exclude(function () {
        sequester.share(function () {
        })
        equal(order++, 0, 'exclusive')
        sequester.unlock()
        sequester.unlock()
    })
})
