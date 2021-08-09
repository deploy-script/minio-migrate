//
const config = require('../config')

//
const {
    Client
} = require('minio')

//
const clients = {
    from: new Client({
        endPoint: config.from.ip,
        port: parseInt(config.from.port, 10),
        useSSL: config.from.useSSL,
        accessKey: config.from.access_key,
        secretKey: config.from.access_secret,
        region: config.to.region
    }),
    to: new Client({
        endPoint: config.to.ip,
        port: parseInt(config.to.port, 10),
        useSSL: config.to.useSSL,
        accessKey: config.to.access_key,
        secretKey: config.to.access_secret,
        region: config.to.region
    })
}

//
async function listBuckets(host = '') {
    let buckets = await clients[host].listBuckets()
    return buckets.length ? buckets.map(i => i.name) : []
}

//
async function listObjects(host = '', bucket = '', prefix = '', recursive = false, startAfter = '') {
    return new Promise(async (resolve, reject) => {
        try {
            let objects = []
            await clients[host].listObjectsV2(bucket, prefix, recursive, startAfter)
                .on('data', obj => (obj && (obj.name || obj.prefix)) ? objects.push(obj) : undefined)
                .on('error', e => reject(e))
                .on('end', () => resolve(objects))
        } catch (e) {
            reject(e)
        }
    })
}

//
async function listObjectsAll(host = '', bucket = '', prefix = '', recursive = false, startAfter = '') {
    let files = await listObjects(host, bucket, prefix, recursive, startAfter)
    if (files.length === 1000) {
        let startAfter = files[files.length - 1].name
        return files.concat(await listObjectsAll(host, bucket, prefix, recursive, startAfter))
    } else {
        return files
    }
}

//
async function stream(bucket = '', prefix = '') {
    return new Promise(async (resolve, reject) => {
        try {
            await clients.to.putObject(bucket, prefix, await clients.from.getObject(bucket, prefix))
            console.log('File copied: [%s]: %s', bucket, prefix)
            resolve(true)
        } catch (e) {
            console.log('File not copied: [%s]: %s - %s', bucket, prefix, e.message)
            reject(e)
        }
    })
}

//
;
(async function () {
    try {

        let buckets = []
        if (typeof config.buckets !== 'undefined' && Array.isArray(config.buckets) && config.buckets.length) {
            buckets = config.buckets
        } else {
            buckets = await listBuckets('from')
        }

        if (config.traceOn) clients.to.traceOn(process.stdout)

        // loop over and make all buckets
        for (bucket of buckets) {
            // make bucket
            try {
                await clients.to.makeBucket(bucket, config.to.region)
                console.log('Bucket created: [%s]', bucket)
            } catch (e) {
                console.log('Bucket exists: [%s]', bucket, e)
            }
        }

        // loop over buckets
        for (bucket of buckets) {
            // migrate files
            for (file of await listObjectsAll('from', bucket, '', true)) {
                await stream(bucket, file.name)
            }
        }
    } catch (e) {
        console.error(e)
    }
})()
