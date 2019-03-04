exports.yargs = {
    command: 'leaks <repo>',
    describe: 'Search for leaks in git repository',

    builder: {
        ref: {
            describe: 'GIT ref',
            type: 'string',
            default: 'master'
        },

        depth: {
            alias: 'd',
            describe: 'Commit history depth',
            type: 'number',
            default: Infinity
        },

        concurrency: {
            alias: 'n',
            describe: 'Number of workers',
            type: 'number',
            default: 10
        },

        match: {
            alias: 'm',
            decribe: 'Search files matching glob',
            type: 'string',
            default: '**'
        },

        skip: {
            alias: 's',
            describe: 'Skip files matching glob',
            type: 'string',
            default: '.{jpeg,jpg,png,gif,avi,mov,mp4,mp3}'
        }
    },

    handler: async(argv) => {
        const { ref, depth, concurrency, match, skip, repo } = argv

        const fs = require('fs')
        const path = require('path')
        const { EventEmitter } = require('events')
        const { Worker } = require('worker_threads')
        const { generateOfParalel } = require('@pown/async/lib/generateOfParalel')
        const { iterateOverEmitter } = require('@pown/async/lib/iterateOverEmitter')

        const { maybeFetch } = require('../lib/helpers')
        const { enumCommitFiles } = require('../../../log')

        const dir = await maybeFetch(repo)

        const runner = async function*(iterable) {
            const worker = new Worker(path.join(__dirname, 'worker.js'))

            const ee = new EventEmitter()

            worker.on('message', ({ type, leak, error }) => {
                if (type === 'leak') {
                    ee.emit('leak', leak)
                }
                else
                if (type === 'done') {
                    ee.emit('done')
                }
            })

            worker.on('error', (error) => {
                ee.emit('error', error)
            })

            worker.on('exit', () => {
                ee.emit('done')
            })

            for await (const commitFile of iterable) {
                const { commit, file } = commitFile

                const { path, oid } = file

                // TODO: match path

                worker.postMessage({ dir, oid })

                for await (const leak of iterateOverEmitter(ee, { yieldEvent: 'leak', doneEvent: 'done' })) {
                    yield { commit, file, leak }
                }
            }

            worker.terminate()
        }

        const enumerator = enumCommitFiles({ fs, dir, ref, depth })
        const workers = Array(concurrency).fill(0).map(() => runner(enumerator))

        const previousLeaks = {}

        for await (const { commit, file, leak } of generateOfParalel(workers)) {
            const { oid } = commit
            const { path } = file
            const { check, index, find } = leak
            const { title, severity } = check

            const sig = `${path}:::${find}`

            if (previousLeaks.hasOwnProperty(sig)) {
                return
            }

            previousLeaks[sig] = 1

            console.info(`title:`, title)
            console.info(`severity:`, severity)
            console.info(`ref: ${oid}`)
            console.info(`path: ${path}`)
            console.info(`index: ${index}`)

            console.log(find)
        }
    }
}
