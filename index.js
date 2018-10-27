const validator = require('validator');
const express   = require('express');
const exec      = require('await-exec')
const dns       = require('dns');

const webPort   = process.env['PORT']   || 3005;
const sender    = process.env['SENDER'] || 'sender@example.com';
const mailPorts = [ 25, 587, 465 ]; // We will test for mail servers on these ports.

// list of free/temp providers from https://gist.github.com/adamloving/4401361
const freeProviders = require('fs').readFileSync('freeproviders.txt');

const app = express();

app.listen(webPort, () => {
    console.log(`App listening on port ${webPort}!`);
});

// Takes an e query param (the email address) and returns a success 1 if valid and a reachable 1 if 
app.get('/:email', async (req, res) => {
    let email = req.params.email;

    if (!validator.isEmail(email))
        return res.json(bad('email invalid'));
    
    let domain  = email.split('@')[1];
    
    let records;
    
    try {
        records = await resolveMx(domain);
    } catch(e) {
        return res.json(bad('domain invalid'))
    }

    if (records.length > 5)
        records = records.splice(0, 5);

    let permutations = [];

    for (let record of records)
        for (let port of mailPorts)
            permutations.push(checkForkMailbox(email, record.exchange, port));
    
    // Check if its from a free provider.
    let free = freeProviders.indexOf(domain) > -1 ? 1 : 0;

    try {
        // If this throws it returns the exeption straight away
        // If you know a better way please create a PR.
        let responses = await Promise.all(permutations);
    } catch (e) {

        return res.json(ok(1, 1, free));
    }

    return res.json(ok(1, 0, free));
});

async function checkForkMailbox(email, server, port) {
    // Dangerous function, verify inoputs before use. If anyone has a better way please PR.
    let response = await exec(`./check.tcl ${email} ${server} ${port} ${sender}`, {
        timeout: 3000
    }).catch(e => {});

    response = response || { stdout: "" }
    if (response.stdout.indexOf('2.1.5') > -1)
        throw 'true'; // Seems weird IK but with this the Promise.all will return straight away

    return false;
}

async function resolveMx(domain) {
    return new Promise((res, rej) => {
        dns.resolveMx(domain, function(err, records) {
            if (err)
                return rej(err);
            return res(records);
        });
    });
}

let ok = (valid, reachable, free) => {
    let response = {
        success: 1,
        valid, 
        reachable
    };

    if (typeof free != 'undefined')
        response.free = free;

    return response
}

let bad = (error) => {
    return {
        success: 0,
        error,
        valid: 0,
        reachable: 0
    }
}