const fs = require('fs')
const { isText } = require('istextorbinary')
const { LeaksPilot } = require('@pown/leaks')
const database = require('@pown/leaks/lib/database')
const { parentPort, workerData } = require('worker_threads')
const { compileDatabase } = require('@pown/leaks/lib/compile')

const { fetch } = require('../../../../lib/data')

const { severity } = workerData

const lp = new LeaksPilot({ database: compileDatabase(database), severity })

parentPort.on('message', async({ dir, oid }) => {
    const data = await fetch({ fs, dir, oid })

    if (isText(null, data)) {
        for await (const leak of lp.iterateOverSearchPerCodeLine(data.toString())) {
            const { check, ...rest } = leak
            const { title, severity } = check

            parentPort.postMessage({ type: 'leak', leak: { ...rest, check: { title, severity } } })
        }
    }

    parentPort.postMessage({ type: 'end' })
})
