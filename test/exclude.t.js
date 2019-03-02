require('proof')(1, prove)

function prove (okay) {
    var sequester = require('..')

    var order = 0
    var lock = sequester.createLock()
    lock.exclude(function () {
        lock.share(function () {
        })
        okay(order++, 0, 'exclusive')
        lock.unlock()
        lock.unlock()
    })
}
