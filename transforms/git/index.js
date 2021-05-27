const { URL_TYPE } = require('@pown/recon/lib/types')
const { Transform } = require('@pown/recon/lib/transform')

class gitLeaks extends Transform {
    static get alias() {
        return ['git_leaks']
    }

    static get title() {
        return 'Git Leaks'
    }

    static get description() {
        return 'Find git leaks'
    }

    static get group() {
        return 'Git Leaks'
    }

    static get tags() {
        return []
    }

    static get types() {
        return [URL_TYPE]
    }

    static get options() {
        return {}
    }

    static get priority() {
        return 1
    }

    static get noise() {
        return 100
    }

    async * handle({ id: source = '', label }, { singleBranch = true, depth = 1000, concurrency = 10, severity = 0 }) {
        const os = require('os')
        const fs = require('fs')
        const util = require('util')
        const path = require('path')
        const git = require('isomorphic-git')
        const http = require('isomorphic-git/http/node')

        const { scanWithWorker } = require('../../lib/leaks')

        const mkdtempAsync = util.promisify(fs.mkdtemp)

        const url = label

        const dir = await mkdtempAsync(path.join(os.tmpdir(), 'git-leaks-'))

        this.info('clonning', url, 'into', dir)

        await git.clone({
            fs: fs,
            http: http,

            url: url,

            dir: dir,

            singleBranch: singleBranch,
            depth: depth
        })

        this.info('clonning', 'done')

        this.info('scanning', dir)

        for await (let { commit, leak } of scanWithWorker({ fs, dir, depth, concurrency, severity })) {
            const { message, author, committer } = commit

            const { name: authorName = '', email: authorEmail = '', timestamp: authorTimestamp } = author

            const { timestamp: commiterTimestamp } = committer

            const timestamp = (commiterTimestamp || authorTimestamp) * 1000

            const { check, line, index, find } = leak
            const { title, severity } = check

            yield { type: 'git:leak', label: find, props: { title, severity, find, line, index, authorName, authorEmail, message, timestamp }, source: [source] }
        }

        this.info('scanning', 'done')
    }
}

module.exports = {
    gitLeaks
}
