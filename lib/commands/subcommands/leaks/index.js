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
        const moment = require('moment')
        const { EventEmitter } = require('events')
        const { Worker } = require('worker_threads')
        const { Bar } = require('@pown/cli/lib/bar')
        const { generateOfParalel } = require('@pown/async/lib/generateOfParalel')
        const { iterateOverEmitter } = require('@pown/async/lib/iterateOverEmitter')

        const { getCommits, enumFiles } = require('../../../log')

        const dir = repo

        const commits = await getCommits({ fs, dir, ref, depth })

        const run = async function*(enumerator) {
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

            for await (const commitFile of enumerator) {
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

        const gen = async function*(commits) {
            const bar = new Bar({ clearOnComplete: true })

            bar.start(commits.length, 0)

            const previousOids = {}

            for await (const commit of commits) {
                for await (const file of enumFiles({ fs, dir, oid: commit.tree })) {
                    if (!previousOids.hasOwnProperty(file.oid)) {
                        previousOids[file.oid] = 1

                        yield { commit, file }
                    }
                }

                bar.increment()
            }

            bar.stop()
        }

        const enumerator = gen(commits)
        const workers = Array(concurrency).fill(0).map(() => run(enumerator))

        const previousLeaks = {}

        for await (const { commit, file, leak } of generateOfParalel(workers)) {
            const { oid, author, committer } = commit
            const { name: authorName, email: authorEmail, timestamp: authorTimestamp } = author
            const { name: commiterName, email: commiterEmail, timestamp: commiterTimestamp } = committer
            const { path } = file
            const { check, index, find } = leak
            const { title, severity } = check

            const timestamp = (authorTimestamp || commiterTimestamp) * 1000

            const sig = `${path}:::${find}`

            if (previousLeaks.hasOwnProperty(sig)) {
                return
            }

            previousLeaks[sig] = 1

            console.warn(`ref: ${oid}`)
            console.warn(`path: ${path}`)
            console.warn(`index: ${index}`)
            console.info(`title:`, title)
            console.info(`severity:`, severity)
            console.info(`timestamp: ${timestamp} (${moment(timestamp).fromNow()})`)
            console.info(`author: ${authorName} <${authorEmail}>`)
            console.info(`committer: ${commiterName} <${commiterEmail}>`)

            console.log(find)
        }
    }
}
