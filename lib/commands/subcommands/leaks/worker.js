const fs = require('fs')
const { parentPort } = require('worker_threads')

const db = require('@pown/leaks/lib/db')
const { LeaksPilot } = require('@pown/leaks')

const { isText } = require('istextorbinary')
const { workerData } = require('worker_threads')

const { fetch } = require('../../../data')

const { severity } = workerData

const lp = new LeaksPilot({ db, severity })

parentPort.on('message', async({ dir, oid }) => {
    const data = await fetch({ fs, dir, oid: oid })

    if (isText(null, data)) {
        for (const leak of lp.iterateOverSearch(data.toString())) {
            parentPort.postMessage({ type: 'leak', leak })
        }
    }

    parentPort.postMessage({ type: 'done' })
})
