#!/usr/bin/env node

require('proof')(2, function (equal) {
    var sequester = require('../..')

    var lock = sequester.createLock()
    try {
        lock.unlock()
    } catch (e) {
        equal(e.message, 'unlock called with no lock held', 'lock not held on unlock')
    }
    try {
        lock.increment()
    } catch (e) {
        equal(e.message, 'increment called with no lock held', 'lock not held on increment')
    }
})
