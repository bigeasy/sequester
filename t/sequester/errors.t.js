#!/usr/bin/env node

require('proof')(2, prove)

function prove (assert) {
    var sequester = require('../..')

    var lock = sequester.createLock()
    try {
        lock.unlock()
    } catch (e) {
        assert(e.message, 'unlock called with no lock held', 'lock not held on unlock')
    }
    try {
        lock.increment()
    } catch (e) {
        assert(e.message, 'increment called with no lock held', 'lock not held on increment')
    }
}
