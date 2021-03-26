exports.yargs = {
    command: 'leaks <repo>',
    describe: 'Search for leaks in git repository',
    aliases: ['l', 'leak'],

    builder: {
        ref: {
            alias: 'r',
            describe: 'GIT ref',
            type: 'string'
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
        const process = require('process')
        const { EventEmitter } = require('events')
        const { Worker } = require('worker_threads')
        const { iterateOverEmitter } = require('@pown/async/lib/iterateOverEmitter')

        const { fetch } = require('../../../../lib/data')
        const { enumCommitFiles } = require('../../../../lib/log')

        let outStream

        if (write) {
            outStream = fs.createWriteStream(write)

            const exitHandler = () => {
                outStream.close()

                process.exit(1)
            }

            process.on('SIGINT', exitHandler)
            process.on('uncaughtException', exitHandler)
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

                const { message, author, committer } = commit

                const { name: authorName = '', email: authorEmail = '', timestamp: authorTimestamp } = author

                const authorRef = `${authorName} <${authorEmail}>`

                const { name: committerName = '', email: committerEmail = '', timestamp: commiterTimestamp } = committer

                const committerRef = `${committerName} <${committerEmail}>`

                const timestamp = (commiterTimestamp || authorTimestamp) * 1000

                const printResults = []
                const saveResults = []

                for await (const leak of iterateOverEmitter(ee, 'leak')) {
                    const { check, line, index, find } = leak
                    const { title, severity } = check

                    printResults.push({ title, severity, find, line, index, author: authorRef, message, timestamp })
                    saveResults.push({ title, severity, find, line, index })
                }

                if (printResults.length) {
                    console.group(`${path}@${oid}`)
                    console.table(printResults)
                    console.groupEnd()

                    if (outStream) {
                        const source = (await fetch({ fs, dir, oid })).toString()

                        outStream.write(JSON.stringify({
                            location: { path, oid },

                            source,

                            author: {
                                ...author,

                                timestamp: authorTimestamp * 1000
                            },

                            committer: {
                                ...committer,

                                timestamp: commiterTimestamp * 1000
                            },

                            results: saveResults
                        }))
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
