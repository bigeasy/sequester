require('proof')(29, async okay => {
    const Sequester = require('..')

    //
    const sequester = new Sequester
    //

    // Because this is a unit test we need to assert something. We're going to
    // check the state of Sequester's mutex queue.
    //
    // The `mutexes` property is really for sake of this unit test. It displays
    // the count of locks for each mutex in the mutex queue array.

    //
    okay(sequester.mutexes, [ 0 ], 'display of empty mutex queue')
    //

    // How to we read the these mutex dumps?
    //
    // Again, each element in the dump is the count of locks for each mutex in
    // the mutex queue array. Let's describe the mutex queue array.
    //
    // The first element is the active mutex. Any additional elements are
    // waiting mutexes. Mutexes alternate shared, exclusive, share, exclusive,
    // etc. The first mutex in the mutex queue array can be either shared or
    // exclusive mutex. The last mutex is always a shared mutex. Because the
    // last mutex is always a shared mutex and mutexes alternate from one type
    // to the other we know that an odd number of mutexes means the active mutex
    // is shared and an even number of mutexes means the active mutex is
    // exclusive.
    //
    // There is always one mutex in the mutex queue array. When there is only
    // one mutex in the mutex queue array, it is a shared mutex.

    //
    okay(sequester.mutexes, [ 0 ], 'single shared mutex with no locks')
    //

    // Enough of that. For more details on how the queue works you can read the
    // documentation in `sequester.js`.

    //
    const log = []
    const count = { shared: 0, exclusive: 0 }
    //

    // For our tutorial we are going to have a function that we must guard with
    // a shared/exclusive lock. We're going to pretend that this function does
    // some reading most of the time and some writing on occasion.

    //
    function guarded (message) {
        log.push(`${message} ${++count[message]}`)
    }
    //

    // Sequester prioritizes shared lock performance. To acquire a shared lock
    // you call `sequester.share()` if it returns `null` the lock was
    // uncontested so a shared lock is acquired immediately and you can proceed
    // to perform shared actions on your guarded code.
    //
    // If the lock is contested &mdash; if there are  exclusive locks active or
    // waiting &mdash; `sequester.share()` returns a `Promise`. When the promise
    // is resolved the shared lock has been acquired and you can proceed to
    // perform actions on your guarded code.
    //
    // By returning a `Promise` only if the lock is contested you can skip the
    // time you'd spend awaiting an `async` call in the `PromiseJob` queue.
    // Sequester simply increments a counter.

    //
    {
        // _Request a shared lock, maybe wait to obtain it._
        const promise = sequester.share()
        if (promise != null) {
            await promise
        }

        // _Our single active shared mutex now has one lock._
        okay(sequester.mutexes, [ 1 ], 'single shared lock')

        // _Do something contentious._
        guarded('shared')


        // _Release the shared lock._
        sequester.unlock()

        // _Check our log._
        okay(log.splice(0), [ 'shared 1' ], 'one shared action')
    }
    //

    // When you are done with your guarded work you release the lock by calling
    // `sequester.unlock()`. You must release the lock, put it in a `finally`
    // block if you code might throw an exception you plan to recover from.
    //
    // To obtain an exclusive lock you call `sequester.exclude()`. If it returns
    // returns `null` the lock was uncontested so a shared lock is acquired
    // immediately and you can proceed to perform shared actions on your guarded
    // code.
    //
    // If the lock is contested &mdash; if there are shared or exclusive locks
    // active or waiting &mdash; `sequester.share()` returns a `Promise`. When
    // the promise is resolved the shared lock has been acquired and you can
    // proceed to perform actions on your guarded code.

    //
    {
        // _Request an exclusive lock, maybe wait to obtain._
        const promise = sequester.exclude()
        if (promise != null) {
            await promise
        }

        // _Our active exclusive mutex now has one lock._
        okay(sequester.mutexes, [ 1, 0 ], 'single exclusive lock, shared mutex with no locks waiting')

        // _Do something contentious._
        guarded('exclusive')

        // _Release the exclusive lock._
        sequester.unlock()

        // _Our mutex queue is idle again._
        okay(sequester.mutexes, [ 0 ], 'single shared mutex with no locks')

        // _Check our log._
        okay(log.splice(0), [ 'exclusive 1' ], 'one exclusive action')
    }
    //

    // Note that you do not have to perform the test for the promise if you
    // don't want to. If you call `await` on a non-promise it will get wrapped
    // in a `Promise` and enter the `PromiseJob` queue. Therefore, you can call
    // `sequester`

    //
    {
        await sequester.exclude()
        okay(sequester.mutexes, [ 1, 0 ], 'single exclusive lock, shared mutex with no locks waiting')
        guarded('exclusive')
        sequester.unlock()
        okay(sequester.mutexes, [ 0 ], 'single shared mutex with no locks')
        okay(log.splice(0), [ 'exclusive 2' ], 'one exclusive action')
    }
    //

    // I use a coverage tool in my unit tests and strive for 100% coverage. This
    // await-only-if-necessary branch can be hard to cover since concurrent code
    // is already difficult to cover. If I'm performing an exclusive lock in
    // order to do file system operations, the file system operations are going
    // to be the bottleneck, not a single pass through the `PromiseJobs` queue,
    // so I in this case I'm okay with skipping this optimization.
    //
    // Shared locks are usually guarding synchronous actions &mdash; reading
    // objects that are already in memory &mdash; the optimization is sure to
    // provide some benefit.

    // The `sequester.unlock()` function unlocks both shared and exclusive
    // locks. One would imagine that this would invite trouble, but it's pretty
    // easy to manage. You **must** wait for your lock to be obtained before
    // proceeding. You **must** pair every lock you obtain with a call to
    // `unlock()`. If you do this you shouldn't lose count of your locks.

    //
    {
        const locks = []

        locks.push(sequester.share())
        locks.push(sequester.share())

        okay(sequester.mutexes, [ 2 ], 'single shared mutex with two locks')

        await locks.shift()
        guarded('shared')
        sequester.unlock()

        okay(sequester.mutexes, [ 1 ], 'shared mutex with one lock')

        await locks.shift()
        guarded('shared')
        sequester.unlock()

        okay(sequester.mutexes, [ 0 ], 'single shared mutex with no locks')

        okay(log.splice(0), [ 'shared 2', 'shared 3' ], 'one exclusive action')
    }
    //

    // We use that `locks` array in our example to ensure that we await each
    // lock separately and release it before awaiting the next lock. If we await
    // two locks in a row we can deadlock.

    // ```
    // // Don't do it!
    // await sequester.share()
    // await sequester.share()
    // // You may never reach this point.
    // sequester.unlock()
    // sequester.unlock()
    // ```

    // There is no deadlock detection. Just follow the rules. For a given path
    // of execution , do not await a new lock until you've unlocked the last
    // lock.

    // What is a path of execution? You can think of that as distinct
    // `async`/`await` call stack rooted from an `async` function call.

    //
    {
        async function reader () {
            await sequester.share()
            guarded('shared')
            sequester.unlock()
        }

        async function writer () {
            await sequester.exclude()
            guarded('exclusive')
            sequester.unlock()
        }

        const promises = [ reader(), reader(), writer() ]

        okay(sequester.mutexes, [ 2, 1, 0 ], 'two shared, one exclusive, empty shared tail')

        for (const promise of promises) {
            await promise
        }

        okay(log.splice(0), [ 'shared 4', 'shared 5', 'exclusive 3' ], 'two shared, one exclusive action')
    }
    //

    // In the above example make three function calls and wait for them to
    // return. We can see the locks build up in the mutex queue. The two calls
    // to `reader` will have to unlock `sequester` before the writer call can
    // obtain its exclusive lock.

    // Each call to `reader` or `writer` made a single call to obtain a lock and
    // a single call to unlock. This is how you ensure that you do not have
    // deadlock. Pair a single call to lock with a single call to unlock within
    // an `async`/`await` call stack. The parallel paths of execution will be
    // able to co-ordinate access to guarded blocks of code.

    // In the above we used `await` directly on our calls to `share()` and
    // `exclude()`. What happens when we await-only-if-necessary?

    //
    {
        async function reader () {
            const promise = sequester.share()
            if (promise != null) {
                await promise
            }
            guarded('shared')
            sequester.unlock()
        }

        async function writer () {
            const promise = sequester.exclude()
            if (promise != null) {
                await promise
            }
            guarded('exclusive')
            sequester.unlock()
        }

        const promises = [ reader(), reader(), writer() ]

        okay(sequester.mutexes, [ 0 ], 'single empty shared mutex')

        for (const promise of promises) {
            await promise
        }

        okay(log.splice(0), [ 'shared 6', 'shared 7', 'exclusive 4' ], 'two shared, one exclusive action')
    }
    //

    // Would you look at that? Both the readers and the writer where able to
    // obtain thier locks immediately so they didn't have to `await` the lock.
    // It was unnecessary. They where able to get straight to work without
    // having to go through the microtask queue.

    // However, we want to show how locks queue up in the mutex queue, so our
    // next few examples are going to use the `await` directly versions of the
    // `reader` and `writer`.

    //
    async function reader () {
        await sequester.share()
        guarded('shared')
        sequester.unlock()
    }

    async function writer () {
        await sequester.exclude()
        guarded('exclusive')
        sequester.unlock()
    }
    //

    // Here we show how readers wait for writers.

    //
    {
        const promises = [ writer(), reader(), reader() ]

        okay(sequester.mutexes, [ 1, 2 ], 'single empty shared mutex')

        for (const promise of promises) {
            await promise
        }

        okay(log.splice(0), [ 'exclusive 5', 'shared 8', 'shared 9' ], 'two shared, one exclusive action')
    }
    //

    // This shows something about how we prevent starvation.

    //
    {
        const promises = [ writer(), writer(), reader() ]

        okay(sequester.mutexes, [ 1, 0, 1, 1 ], 'exclusive, empty shared, exclusive, shared')

        for (const promise of promises) {
            await promise
        }

        okay(log.splice(0), [ 'exclusive 6', 'exclusive 7', 'shared 10' ], 'two shared, one exclusive action')
    }
    //

    // Now that we've clearly established some rules, let's move onto the part
    // where we break them.

    // Sequester also provides the concept of a countdown. There are times in
    // your application when you want to hold a lock, perform number of
    // operations in parallel, releasing the lock when all the parallel
    // operations finish.
    //
    // For this we provide a countdown where once you hold a lock you can
    // increase the number of locks you hold using the `increment()` method.
    //
    // The old rule that says you must call `unlock()` for every `shared()` or
    // `exclusive()` call is modified to say that you must call `unlock()` for
    // every `shared()` or `exclusive()` call plus the number you pass into a
    // call to `increment()` if you call `increment()`.

    //
    {
        async function parallel () {
            sequester.unlock()
        }

        async function counted () {
            await sequester.share()
            sequester.increment(2)
            okay(sequester.mutexes, [ 3, 1, 0 ], 'countdown shared, exclusive, shared tail')
            for (const promise of [ parallel(), parallel(), parallel() ]) {
                await promise
            }
        }

        const promises = [ writer(), counted(), writer() ]

        okay(sequester.mutexes, [ 1, 1, 1, 0 ], 'exclusive, shared, exclusive shared tail')

        for (const promise of promises) {
            await promise
        }
    }
    //

    // `increment()` also works with exclusive locks.


    //
    {
        async function parallel () {
            sequester.unlock()
        }

        async function counted () {
            await sequester.exclude()
            sequester.increment(2)
            okay(sequester.mutexes, [ 3, 1 ], 'countdown exclusive, single shared in tail')
            for (const promise of [ parallel(), parallel(), parallel() ]) {
                await promise
            }
        }

        const promises = [ reader(), counted(), reader() ]

        okay(sequester.mutexes, [ 1, 1, 1 ], 'exclusive, shared, exclusive shared tail')

        for (const promise of promises) {
            await promise
        }
    }
    //
    // It kind of makes an exclusive block seem less exclusive if you can hold
    // multiple locks on it, but keep in mind that the `counted()` method above
    // is following the rule that the lock is held, incremented and released
    // within the same `async`/`await` call stack. The call stack fans out after
    // the lock is acquired.
    //
    // `downgrade()` is a synchronous method will downgrade an exclusive lock to
    // a shared lock that is held immediately after downgrade returns.
    //
    // If the work you plan on doing has a write task followed by read tasks,
    // you can improve through put by downgrading then the writes are complete
    // still holding a lock. This will prevent other strands from changing the
    // guarded data, but allowing other readers to commence with reading the
    // guarded data.
    //
    // I've not had a use for `downgrade()`, but it is easy enough to implement.
    //
    {
        async function downgraded () {
            await sequester.exclude()
            okay(sequester.mutexes, [ 1, 0, 1, 0 ], 'exclusive lock held')
            sequester.downgrade()
            okay(sequester.mutexes, [ 1, 1, 0 ], 'exclusive lock downgraded to shared')
            sequester.unlock()
        }

        const promises = [ downgraded(), writer() ]

        okay(sequester.mutexes, [ 1, 0, 1, 0 ], 'exclusive, empty shared, exclusive, shared tail')

        for (const promise of promises) {
            await promise
        }
    }
})
