Sequester

A read/write lock for evented operations.

### Shared/Exclusive Locks

Sequester implements a write preferenced read/write lock. Writers get preference
over readers.

Seqeuster doesn't actually lock anything. It creates a queue of work, allowing
shared work to proceed in parallel, but exclusive work is performed alone, with
no other shared or exclusive work in progress. Rather than holding a lock
object, you provide a callback to be called either shared, in parallel with
other queued that can be also shared, or exclusive, run alone with no other
queued functions.

To obtain an exclusive lock you call `exclude` with a function to call when the
exclusive lock is held. When your exclusive access work is done, you will call
`unlock()` to release the exclusive lock.

To obtain an shared lock you call `share` with a function to call when the
shared lock is held. When your shared access work is done, you will call
`unlock()` to release the shared lock.

You call `unlock()` to release both exclusive and shared locks. You must be
careful that a single call to `unlock()` matches a call single call to either
`share()` or `exclude()`. There are no checks for mismatched unlocks.

The queue is formed by created an array of arrays of funtions. They arrays of
arrays alternate fro shared to exclusive and back. The queue always has at least
one array of arrays. If it has only one array of arrays, that is an array of
shared functions. If you call `shared()` when there are only shared functions or
no functions in the queue, the function runs immediately.

Otherwise the function is added to the array of arrays at the end of the queue.
The last element of the queue is always an array of shared functions, which is
why an empty queue is would have a single array of array of shared functions
with no functions in it.

If you call `exclude()`, two new new array of arrays are added to the queue. A
single array of arrays that contains the exclusive function, then a new array of
arrays for shared functions. Now as the arrays of functions before this entry
complete, the array of arrays is shifted. The work in each array of functions is
performed in parallel and all the functions must complete, with an unlock,
before the next...

```
function Service () {
    this._lock = sequester.createLock()
}

Service.prototype.read = cadence(function (async) {
    async(function () {
        this._lock.share(async())
    }, [function () {
        this._lock.unlock()
    }], function () {
        fs.readFile('values.json', 'utf8', async())
    }, function (body) {
        return [ JSON.stringify(body) ]
    })
})

Service.prototype.write = cadence(function (async, values) {
    async(function () {
        this._lock.share(async())
    }, [function () {
        this._lock.unlock()
    }],function () {
        fs.writeFile('values.json', JSON.stringify(values), 'utf8', async())
    })
})
```

*Ed: Below is a long example of read/write.*

```
var lock = sequester.createLock()

var order = []
lock.exclude(function () {
    order.push('exclude one')
})

lock.share(function () {
    order.push('share one')
    lock.unlock()
})

lock.share(function () {
    order.push('share two')
    lock.unlock()
})

lock.exclude(function () {
    order.push('exclude one')
    lock.unlock()
})

lock.share(function () {
    order.push('share three')
    lock.unlock()
})

lock.unlock()

lock.share(function () {
    order.push('share four')
})

lock.exclude(function () {
    order.push('exclude two')
    console.log(order)
    lock.unlock()
})

lock.unlock()
```

### Mutexes

We can create a simple mutex. *TK*

### Latches

A latch is used to prevent people from using a new resource until it is ready
for use. To create a latch you create a lock and obtain an exclusive lock. You
can then hand out that lock and people can wait on it with a shared lock.

```
// create a lock
var lock = sequester.createLock()
var resource

// acquire a shared lock
lock.exclude(function () {})

// now we can give that lock to people who need to wait, any share added here is
// going to wait until we unlock once.
lock.share(function () {
    console.log('done waiting, resource is: ' + resource)
})
lock.share(function () {
    console.log('I\'m done waiting too: ' + resource)
})

// initialize our resource.
resource = 1

// we can signal that resources are ready by calling unlock.
lock.unlock()
```

When used for latches, we don't worry about unlocking other than the initial
unlock.

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
