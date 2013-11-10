#!/usr/bin/env node

require('proof')(4, function (equal) {
    var sequester = require('../..')

    var sequester = sequester.createLock(1)

    sequester.share(function (value) {
        equal(value, 1, 'constructor values')
    })
    sequester.unlock()

    sequester.exclude(function () {})
    sequester.share(function (value) {
        equal(value, 2, 'exclude values')
    })
    sequester.unlock(2)

    sequester.share(function (value) {
        equal(value, 2, 'exclude values after unlock')
    })

    sequester.unlock()
    sequester.unlock(3)

    sequester.share(function (value) {
        equal(value, 2, 'values only set by exclude unlock')
    })
    sequester.unlock()
})
