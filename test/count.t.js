require('proof')(3, prove)

function prove (okay) {
    var sequester = require('..')

    var lock = sequester.createLock()
    var order = []

    lock.share(function () {
        lock.increment(1)
        okay(lock.count, 2, 'count is 2')
        lock.unlock()
        okay(lock.count, 1, 'count is 1')
        lock.unlock()
        okay(lock.count, 0, 'count is 0')
    })
}
