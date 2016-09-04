require('proof/redux')(4, prove)

function prove (assert) {
    var sequester = require('..')

    var order = 0
    var lock = sequester.createLock()
    lock.share(function () {
        assert(order++, 0, 'first shared')
        lock.exclude(function () {
            assert(order++, 2, 'exclusive')
            lock.share(function () {
                assert(order++, 4, 'second shared')
            })
            lock.increment(2)
        })
        lock.increment()
    })
    lock.unlock()
    assert(order++, 1, 'first unlock')
    lock.unlock()
    lock.unlock()
    lock.unlock()
    assert(order++, 3, 'fourth unlock')
}
