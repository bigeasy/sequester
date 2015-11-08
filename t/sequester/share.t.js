require('proof')(4, prove)

function prove (assert) {
    var lock = require('../..').createLock()

    var order = 0
    lock.share(function () {
        assert(order++, 0, 'first shared')
    })
    lock.share(function () {
        lock.exclude(function () {
            assert(order++, 2, 'exclusive')
        })
        assert(order++, 1, 'second shared')
        lock.unlock()
        lock.unlock()
        lock.share(function () {
            assert(order++, 3, 'third shared')
        })
        lock.unlock()
    })
}
