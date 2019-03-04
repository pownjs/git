const fs = require('fs')
const { parentPort } = require('worker_threads')

const db = require('@pown/leaks/lib/db')
const { LeaksPilot } = require('@pown/leaks')

const { fetch } = require('../../../data')

const lp = new LeaksPilot({ db })

parentPort.on('message', async({ dir, oid }) => {
    const data = await fetch({ fs, dir, oid: oid })

    for await (const leak of lp.iterateOverSearch(data.toString())) {
        parentPort.postMessage({ type: 'leak', leak })
    }

    parentPort.postMessage({ type: 'done' })
})
