#!/usr/bin/env node

require('proof')(1, function (equal) {
    var Sequester = require('../..')

    var sequester = new Sequester
    try {
        sequester.unlock()
    } catch (e) {
        equal(e.message, 'unlock called with no lock held', 'lock not held')
    }
})
