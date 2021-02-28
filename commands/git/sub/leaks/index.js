exports.yargs = {
    command: 'leaks <repo>',
    describe: 'Search for leaks in git repository',
    aliases: ['l', 'leak'],

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

        severity: {
            alias: 't',
            describe: 'Miminum severity level',
            type: 'number',
            default: 0
        },

        write: {
            alias: 'w',
            describe: 'Write results to file',
            type: 'string',
            default: ''
        }
    },

    handler: async(argv) => {
        const { ref, depth, concurrency, severity, write, repo: dir } = argv

        const fs = require('fs')
        const path = require('path')
        const { EventEmitter } = require('events')
        const { Worker } = require('worker_threads')
        const { iterateOverEmitter } = require('@pown/async/lib/iterateOverEmitter')

        const { fetch } = require('../../../../lib/data')
        const { enumCommitFiles } = require('../../../../lib/log')

        let outStream

        if (write) {
            outStream = fs.createWriteStream(write)
        }

        await Promise.all(Array(concurrency).fill(enumCommitFiles({ fs, dir, ref, depth })).map(async(it) => {
            const worker = new Worker(path.join(__dirname, 'worker.js'), { workerData: { severity } })

            const ee = new EventEmitter()

            worker.on('message', ({ type, leak, error }) => {
                if (type === 'leak') {
                    ee.emit('leak', leak)
                }
                else
                if (type === 'end') {
                    ee.emit('end')
                }
            })

            worker.on('error', (error) => {
                ee.emit('error', error)
            })

            worker.on('exit', () => {
                ee.emit('end')
            })

            for await (let { commit, file } of it) {
                const { path, oid } = file

                console.debug(`scanning ${dir} ${path}@${oid}`)

                worker.postMessage({ type: 'scan', dir, path, oid })

                const results = []

                for await (const leak of iterateOverEmitter(ee, 'leak')) {
                    const { message, author, committer } = commit
                    const { check, index, find } = leak

                    const { name: authorName = '', email: authorEmail = '' } = author

                    const authorRef = `${authorName} <${authorEmail}>`

                    const { name: committerName = '', email: committerEmail = '' } = committer

                    const committerRef = `${committerName} <${committerEmail}>`

                    results.push({ find, index, author: authorRef, commiter: committerRef, message })
                }

                if (results.length) {
                    console.group(`${oid}/${path}`)
                    console.table(results)
                    console.groupEnd()

                    if (outStream) {
                        const source = (await fetch({ fs, dir, oid })).toString()

                        outStream.write(JSON.stringify({ location: { path, oid }, source, results }))
                    }
                }
            }

            worker.terminate()
        }))

        if (outStream) {
            outStream.close()
        }
    }
}
