module.exports = {
    /**
     * From this MinIO server
     */
    from: {
        ip: 's3.example.com',
        port: 443,
        useSSL: true,
        access_key: 'minioadmin',
        access_secret: 'minioadmin',
        region: 'eu-west-2'
    },
    /**
     * To this MinIO server
     */
    to: {
        ip: 's3.newexample.com',
        port: 443,
        useSSL: true,
        access_key: 'minioadmin',
        access_secret: 'minioadmin',
        region: 'eu-west-2'
    },
    /**
     * Define a flat array of bucket names to just copy them.
     * - else set as empty array or remove to copy all
     */
    buckets: [],
    /**
     * Enable trace output, i.e show headers
     */
    traceOn: true
}