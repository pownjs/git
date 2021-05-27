const path = require('path')
const { EventEmitter } = require('events')
const { Worker } = require('worker_threads')
const { iterateOverEmitter } = require('@pown/async/lib/iterateOverEmitter')

const { getOptions } = require('../options')
const { enumCommitFiles } = require('../log')

const scanWithWorker = async function*(options) {
    options = getOptions(options)

    const { fs, dir, ref, depth, worker = path.join(__dirname, 'worker.js'), concurrency = 1, severity = 0 } = options

    const em = new EventEmitter()

    Promise.all(Array(concurrency).fill(enumCommitFiles({ fs, dir, ref, depth })).map(async(it) => {
        const ee = new EventEmitter()

        const wk = typeof(worker) === 'string' ? new Worker(worker, { workerData: { severity } }) : worker

        wk.on('message', ({ type, leak, error }) => {
            if (type === 'leak') {
                ee.emit('leak', leak)
            }
            else
            if (type === 'end') {
                ee.emit('end')
            }
        })

        wk.on('error', (error) => {
            ee.emit('error', error)
        })

        wk.on('exit', () => {
            ee.emit('end')
        })

        for await (let { commit, file } of it) {
            const { path, oid } = file

            wk.postMessage({ type: 'scan', dir, path, oid })

            for await (const leak of iterateOverEmitter(ee, 'leak')) {
                em.emit('item', { commit, file, leak })
            }
        }

        wk.terminate()
    })).then(() => em.emit('end')).catch((error) => em.emit('error', error))

    yield* iterateOverEmitter(em, 'item')
}

module.exports = { scanWithWorker }
