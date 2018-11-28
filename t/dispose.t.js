require('proof')(2, prove)

function prove (okay) {
    var sequester = require('..')

    var lock = sequester.createLock()
    var order = []

    lock.share(function () {
        try {
            lock.dispose()
        } catch (e) {
            okay(e.message, 'locks outstanding', 'dispose with locks outstanding')
        }
        lock.unlock()
        lock.dispose()
        try {
            lock.share(function () {})
        } catch (e) {
            okay(e.message, 'attempt to use disposed lock', 'use disposed lock')
        }
    })
}
