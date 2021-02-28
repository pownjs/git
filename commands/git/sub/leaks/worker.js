const fs = require('fs')
const db = require('@pown/leaks/lib/db')
const { isText } = require('istextorbinary')
const { LeaksPilot } = require('@pown/leaks')
const { parentPort, workerData } = require('worker_threads')

const { fetch } = require('../../../../lib/data')

const { severity } = workerData

const lp = new LeaksPilot({ db, severity })

parentPort.on('message', async({ dir, oid }) => {
    const data = await fetch({ fs, dir, oid })

    if (isText(null, data)) {
        for (const leak of lp.iterateOverSearchPerCodeLine(data.toString())) {
            const { check, ...rest } = leak
            const { title, severity } = check

            parentPort.postMessage({ type: 'leak', leak: { ...rest, check: { title, severity } } })
        }
    }

    parentPort.postMessage({ type: 'end' })
})
