const { URL_TYPE } = require('@pown/recon/lib/types')
const { Transform } = require('@pown/recon/lib/transform')

class gitLeaks extends Transform {
    static alias = ['git_leaks'];

    static title = 'Git Leaks';

    static description = 'Find git leaks';

    static group = 'Git Leaks';

    static tags = [];

    static types = [URL_TYPE];

    static options = {
        ref: {
            alias: 'r',
            describe: 'Which branch to checkout. By default this is the designated "main branch" of the repository.',
            type: 'string'
        },

        depth: {
            alias: 'd',
            describe: 'Determines how much of the git repository\'s history to retrieve.',
            type: 'number',
            default: 10000
        },

        singleBranch: {
            alias: 'b',
            describe: 'Instead of the default behavior of fetching all the branches, only fetch a single branch.',
            type: 'boolean',
            default: true
        },

        concurrency: {
            alias: 'c',
            describe: 'Number of workers.',
            type: 'number',
            default: 1
        },

        severity: {
            alias: 's',
            describe: 'Miminum severity level.',
            type: 'number',
            default: 0
        },

        githubKey: {
            description: 'GitHub API Key. The key is either in the format username:password or username:token.',
            type: 'string'
        }
    };

    static priority = 1;

    static noise = 100;

    async * handle({ id: source = '', label }, { ref, depth, singleBranch, concurrency, severity, githubKey }) {
        const os = require('os')
        const fs = require('fs')
        const url = require('url')
        const util = require('util')
        const path = require('path')

        const { clone } = require('../../lib/clone')
        const { scanWithWorker } = require('../../lib/leaks')

        const mkdtempAsync = util.promisify(fs.mkdtemp)

        let uri = label

        if (githubKey && /github\.com/i.test(uri)) {
            uri = url.parse(uri)

            uri.auth = githubKey

            uri = url.format(uri)
        }

        const dir = await mkdtempAsync(path.join(os.tmpdir(), 'git-leaks-'))

        this.info('clonning', uri, 'into', dir)

        await clone({
            url: uri,

            dir: dir,

            ref: ref,

            depth: depth,

            singleBranch: singleBranch,
        })

        this.info('clonning', 'done')

        this.info('scanning', dir)

        for await (let { commit, leak } of scanWithWorker({ dir, depth, concurrency, severity })) {
            const { message, author, committer } = commit

            const { name: authorName = '', email: authorEmail = '', timestamp: authorTimestamp } = author

            const { timestamp: commiterTimestamp } = committer

            const timestamp = (commiterTimestamp || authorTimestamp) * 1000

            const { check, line, index, find } = leak
            const { title, severity } = check

            yield { type: 'git:leak', label: find, props: { title, severity, find, line, index, authorName, authorEmail, message, timestamp }, edges: [source] }
        }

        this.info('scanning', 'done')
    }
}

module.exports = {
    gitLeaks
}
