exports.yargs = {
    command: 'leaks <repo>',
    describe: 'Search for leaks in git repository',

    builder: {
        ref: {
            alias: 'r',
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
            alias: 'c',
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
        },

        severity: {
            alias: 't',
            describe: 'Miminum severity level',
            type: 'number',
            default: 5
        }
    },

    handler: async(argv) => {
        const { ref, depth, concurrency, match, skip, severity, repo } = argv

        const fs = require('fs')
        const path = require('path')
        const { EventEmitter } = require('events')
        const { Worker } = require('worker_threads')
        const { generateOfParalel } = require('@pown/async/lib/generateOfParalel')
        const { iterateOverEmitter } = require('@pown/async/lib/iterateOverEmitter')

        const { enumCommitFiles } = require('../../../log')

        const dir = repo

        const runner = async function*(iterable) {
            const worker = new Worker(path.join(__dirname, 'worker.js'), { workerData: { severity } })

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

                worker.postMessage({ type: 'scan', dir, path, oid })

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
            const { oid, author, committer } = commit
            const { name: authorName, email: authorEmail, timestamp: authorTimestamp } = author
            const { name: commiterName, email: commiterEmail, timestamp: commiterTimestamp } = committer
            const { path } = file
            const { check, index, find } = leak
            const { title, severity } = check

            const timestamp = authorTimestamp || commiterTimestamp

            const sig = `${path}:::${find}`

            if (previousLeaks.hasOwnProperty(sig)) {
                return
            }

            previousLeaks[sig] = 1

            console.warn(`ref: ${oid}`)
            console.info(`title:`, title)
            console.info(`severity:`, severity)
            console.info(`timestamp: ${timestamp}`)
            console.info(`author: ${authorName} <${authorEmail}>`)
            console.info(`committer: ${commiterName} <${commiterEmail}>`)
            console.info(`path: ${path}`)
            console.info(`index: ${index}`)

            console.log(find)
        }
    }
}
