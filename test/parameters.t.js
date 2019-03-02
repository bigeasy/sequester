require('proof')(4, prove)

function prove (okay) {
    var sequester = require('..')

    var lock = sequester.createLock(1)

    lock.share(function (value) {
        okay(value, 1, 'constructor values')
    })
    lock.unlock()

    lock.exclude(function () {})
    lock.share(function (value) {
        okay(value, 2, 'exclude values')
    })
    lock.unlock(2)

    lock.share(function (value) {
        okay(value, 2, 'exclude values after unlock')
    })

    lock.unlock()
    lock.unlock(3)

    lock.share(function (value) {
        okay(value, 2, 'values only set by exclude unlock')
    })
    lock.unlock()
}
