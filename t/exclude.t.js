require('proof/redux')(1, prove)

function prove (assert) {
    var sequester = require('..')

    var order = 0
    var lock = sequester.createLock()
    lock.exclude(function () {
        lock.share(function () {
        })
        assert(order++, 0, 'exclusive')
        lock.unlock()
        lock.unlock()
    })
}
