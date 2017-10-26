const fs = require('fs');
const path = require('path');

function options (args) {
    return args.reduce((options, arg) => {
        if (arg.indexOf('--') === 0) {
            options[arg.split('--').pop()] = [];
        } else {
            options[Object.keys(options).pop()].push(arg);
        }

        return options;
    }, {});
}

function update (source, names) {
    let data;
    let additions = [];

    try {
        data = JSON.parse(fs.readFileSync(source, 'utf-8'));
    } catch (error) {
        process.stdout.write(`Unable to read "${source}"\n`);
        process.exit(0);
    }

    names.forEach(name => {
        if (data.indexOf(name) === -1) {
            additions.push(name);
            data.push(name);
        }
    });

    if (additions.length) {
        try {
            fs.writeFileSync(source, JSON.stringify(data.sort(), null, 2), 'utf-8');
        } catch (error) {
            process.stdout.write(`Unable to write to "${source}"\n`);
            process.exit(0);
        }

        process.stdout.write(`Added ${additions.length} unique addition${additions.length !== 1 ? 's' : '' } to "${source}" (${additions.join(', ')})\n`);
    } else {
        process.stdout.write(`No unique names to add to "${source}"\n`);
    }
}

const { first, last } = options(process.argv.splice(2));

if (first) {
    update('lib/firstNames.json', first);
}

if (last) {
    update('lib/lastNames.json', last);
}

if (!first && !last) {
    process.stdout.write(`You must specify either a --first or --last name argument followed by a space separated list, for example: --first mike dan robin\n`);
    process.exit(0);
}


