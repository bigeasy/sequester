Sequester

A read/write lock for evented operations.

### Latches

### Countdown Locks

Let's say you want do something after waiting on a number of events so
completes, like waiting for a bunch of callbacks to return. You can create a
latch that waits on shared locks.

```javascript
// create a lock
var lock = sequester.createLock()

// add three shared locks, we unlock these as resources become available.
for (var i = 0; i < 3; i++) {
    sequester.share(function () {})
}

// add an exclusive lock as a boundary, it simply unlocks itself.
sequester.exclude(function () { lock.unlock() })

// now we can give the lock to those who need to wait, any share added here is
// going to wait until we call unlock three times.
sequester.share(function () {
    console.log('program ready')
})

// and we can signal that everything is ready by counting down.
lock.unlock() // one
lock.unlock() // two
lock.unlock() // three
```

We can even create a `Countdown` object.

```javascript
function Countdown(count) {
    var lock = sequester.createLock()

    for (var i = 0; i < 3; i++) {
        sequester.share(function () {})
    }

    var countdown = this
    sequester.exclude(function () {
        lock.unlock()
        delete countdown._lock
    })

    this._lock = lock
}

Countdown.prototype.unlock = function () {
    this._lock.unlock()
}

Countdown.prototype.waitFor = function (callback) {
    if (this._lock) this._lock.share(callback)
    else callback()
}

var countdown = new Countdown(3)

// wait for countdown to complete.
countdown.waitFor(function () {
    console.log('waited one')
})

countdown.unlock()
countdown.unlock()

// wait for countdown to complete, won't be long, only one more left to go.
countdown.waitFor(function () {
    console.log('waited two')
})

// countdown!
countdown.unlock()

// will return immeidately, count down is over.
countdown.waitFor(function () {
    console.log('waited three')
})
```

#### `lock = sequester.createLock()`

Crete a new read/write lock.

#### `lock.share(callback)`

Wait for the acquistion of a shared lock on the lock.

#### `lock.exclude(callback)`

Wait for the acquistion of a shared lock on the lock.

#### `lock.count`

Get a count of locks currently held.

#### `lock.dispose()`

I believe this asserts that there are no outstanding locks, not necessary to
call, but very helpful if you're leaking.

#### `lock.unlock()`

Release the lock.

#### `lock.downgrade()`

Downgrade a lock from exclusive to shared.
