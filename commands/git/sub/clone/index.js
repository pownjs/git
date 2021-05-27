exports.yargs = {
    command: 'clone <uri> [dir]',
    describe: 'Clone git repository',
    aliases: ['c'],

    builder: {
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

        githubKey: {
            description: 'GitHub API Key. The key is either in the format username:password or username:token.',
            type: 'string'
        }
    },

    handler: async(argv) => {
        const { ref, depth, singleBranch, githubKey, uri, dir } = argv

        const url = require('url')
        const path = require('path')

        const { clone } = require('../../../../lib/clone')

        if (githubKey && /github\.com/i.test(uri)) {
            uri = url.parse(uri)

            uri.auth = githubKey

            uri = url.format(uri)
        }

        await clone({
            url: uri,

            dir: dir || path.basename(url),

            ref: ref,

            depth: depth,

            singleBranch: singleBranch
        })
    }
}
