exports.yargs = {
    command: 'clone <url> [dir]',
    describe: 'Clone git repository',
    aliases: ['c'],

    builder: {
        'ref': {
            describe: 'Which branch to checkout. By default this is the designated "main branch" of the repository.',
            type: 'string'
        },

        'single-branch': {
            describe: 'Instead of the default behavior of fetching all the branches, only fetch a single branch.',
            type: 'boolean',
            default: true
        },

        'depth': {
            describe: 'Integer. Determines how much of the git repository\'s history to retrieve',
            type: 'number',
            default: 1000
        }
    },

    handler: async(argv) => {
        const { ref, singleBranch, depth, url, dir } = argv

        const fs = require('fs')
        const path = require('path')
        const git = require('isomorphic-git')
        const http = require('isomorphic-git/http/node')

        await git.clone({
            fs: fs,
            http: http,

            url: url,

            dir: dir || path.basename(url),

            ref: ref,

            singleBranch: singleBranch,
            depth: depth
        })
    }
}
