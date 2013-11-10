#!/usr/bin/env node

require('proof')(2, function (equal) {
    var sequester = require('../..')

    var lock = sequester.createLock()
    var order = []

    lock.share(function () {
        try {
            lock.dispose()
        } catch (e) {
            equal(e.message, 'locks outstanding', 'dispose with locks outstanding')
        }
        lock.unlock()
        lock.dispose()
        try {
            lock.share(function () {})
        } catch (e) {
            equal(e.message, 'attempt to use disposed lock', 'use disposed lock')
        }
    })
})
