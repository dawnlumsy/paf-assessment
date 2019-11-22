const mysql = require('mysql');
const aws = require('aws-sdk');
const MongoClient = require('mongodb').MongoClient;

const config = require('./config');
const db = require('./dbutil');

//console.info("Enter initdb.js");

const loadConfig = (config) => {
	return {
		mysql: mysql.createPool(config.mysql),
		s3: new aws.S3({
			endpoint: new aws.Endpoint('sgp1.digitaloceanspaces.com'),
			accessKeyId: config.s3.accessKey,
			secretAccessKey: config.s3.secret
		}),
		mongodb: new MongoClient(config.mongodb.url, { useUnifiedTopology: true })
	}
};

/*
const pool = mysql.createPool(config.mysql);

const s3 = new aws.S3({
    endpoint: new aws.Endpoint('sgp1.digitaloceanspaces.com'),
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secret
});

const client = new MongoClient(config.mongodb.url, { useUnifiedTopology: true });
*/


const testConnections = (conns) => {
	const p = [];
	p.push(new Promise(
		(resolve, reject) => {
			conns.mysql.getConnection(
				(err, conn) => {
					if (err)
						return reject(err);
					conn.ping(err => {
						conn.release();
						if (err)
							return reject(err);
						console.info('resolved mysql');
						resolve();
					})
				}
			)
		}
	));

	p.push(new Promise(
		(resolve, reject) => {
			conns.mongodb.connect(
				err => {
					if (err)
						return reject(err);
					console.info('resolved mongodb');
					resolve();
				}
			)
		}
	))

	p.push(new Promise(
		(resolve, reject) => {
			const params = {
				Bucket: 'dawn123',
				Key: 'cat.jpg'
			}
			conns.s3.getObject(params,
				(err, result) => {
					if (err)
						return reject(err);
					console.info('resolved s3');
					resolve();
				}
			)
		}
	))

	return (Promise.all(p))
}


module.exports = { loadConfig, testConnections };