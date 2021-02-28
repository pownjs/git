exports.yargs = {
    command: 'git <command>',
    describe: 'Git security toolkit',

    builder: (yargs) => {
        yargs.command(require('./sub/people').yargs)
        yargs.command(require('./sub/leaks').yargs)
    }
}
