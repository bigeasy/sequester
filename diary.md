# Sequester Design Diary

## Different Lock Recipies

A latch is `exclude` and then `unlock`.

A count-down latch is `share` however many times, followed by `exclude, then
`unlock` however many times.

You might want to do reader preferred and writer preferred.

Reader preference means that new readers get tucked into the first queue, or the
queue after the first writer.

A writer preference moves all of the readers in front of the writer behind it
when the writer is not the second entry in the queue.

A mutext is just everyone called `exclude`. The get called back in order.

Oh, hey, can I have a priority queue? At least a jump the queue priority?
