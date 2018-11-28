require('proof')(4, prove)

function prove (okay) {
    var lock = require('..').createLock()

    var order = 0
    lock.share(function () {
        okay(order++, 0, 'first shared')
    })
    lock.share(function () {
        lock.exclude(function () {
            okay(order++, 2, 'exclusive')
        })
        okay(order++, 1, 'second shared')
        lock.unlock()
        lock.unlock()
        lock.share(function () {
            okay(order++, 3, 'third shared')
        })
        lock.unlock()
    })
}
