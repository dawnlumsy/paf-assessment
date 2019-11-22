const fs = require('fs');
const uuid = require('uuid');
const aws = require('aws-sdk');
const mysql = require('mysql');
const morgan = require('morgan');
const cors = require('cors');
const multer = require('multer');
const MongoClient = require ('mongodb').MongoClient;
const express = require('express');
const hbs = require('express-handlebars');

const db = require('./dbutil');
const config = require('./config');
//console.info('config: ', config);

const {loadConfig, testConnections } = require('./initdb');
const conns = loadConfig(config);

const PORT = parseInt(process.argv[2] || process.env.APP_PORT || process.env.PORT) || 3000;
const fileUpload = multer({ dest: __dirname + '/tmp' });

// TODO - Task 2
// Configure your databases

// SQL Statments
const LIST_COUNTRY = 'select country from country';
const listCountry = db.mkQueryFromPool(db.mkQuery(LIST_COUNTRY), conns.mysql);

const LIST_COUNTRY_FROM_ISO = 'select country from country where country_iso = ?';
const listCountryFmIso =  db.mkQueryFromPool(db.mkQuery(LIST_COUNTRY_FROM_ISO), conns.mysql);

const CREATE_SONGS = 'insert into songs (title, country_iso, listen_slots, lyrics, filename, posted) values (?, ?, ?, ?, ?, ?)';

const newSongs = db.mkQueryFromPool(db.mkQuery(CREATE_SONGS), conns.mysql);


const FIND_USER = 'select * from users where username = ?';
const findUser = db.mkQueryFromPool(db.mkQuery(LIST_COUNTRY), conns.mysql);


const app = express();
app.use(cors());
app.use(morgan('tiny'));


app.engine('hbs', hbs({ defaultLayout: 'main.hbs' }));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');




app.use('/api/countries',
    (req, resp) => {
        listCountry()
            .then(result => {
                resp.status(200).type('application/json').json(result)
            })
            .catch(error => {
                resp.status(400).type('application/json').json({ error })
            })
});

// TODO - Task 3
// Song Upload


// Able to upload to mongodb
app.post('/upload', fileUpload.single('song'),
    (req, resp, next) => {
        resp.on('finish',
            () => {
                fs.unlink(req.file.path, err => {})
            }
        )
        const username = req.body.username;

        findUser([ username ])
            .then(result => {
                if (result.length)
                    return next();
                resp.status(403).type('text/html')
                    .send(`<h2><code>${uploader}</code> Cannot upload songs</h2>`);
            })
            .catch(error => {
                resp.status(500).type('text/html')
                    .send(`<h2>Error: ${error}</h2>`)
            })
    },
    (req, resp) => {
        console.info('body: ', req.body);
        console.info('file: ', req.file);


        new Promise ((resolve, reject) => {
            fs.readFile(req.file.path, 
                (err, songFile) => {
                    const params = {
                        Bucket: `dawn123`, Key: `mymusic/${req.file.filename}`,
                        Body: songFile, ContentType: req.file.mimetype,
                        ContentLength: req.file.size, ACL: 'public-read'
                    }
                    conns.s3.putObject(params,
                        (error, result) => {
                            if (error)
                                return reject(err)
                            resolve();
                        }
                    )
                }
            )
        })
        .then(()=>
            conns.mongodb.db('music').collection('songs')
            .insertOne({
                username: req.body.username,
                title: req.body.title,
                country: req.body.country,
                listen_slots: req.body.listen_slots,
                lyrics: req.body.lyrics,
                song: req.file.filename,
                checked_out: 0,
                posted: (new Date())
            })
        )
        .then(()=> {
            resp.status(201).type('text/html')
                .send(`<h2>Song ${req.body.title} posted</h2>`);
        })
        .catch((error) => {
            resp.status(500).type('text/html')
                .error(`<h2>Error: ${error}</h2>`)
        })
    }
);


// Unable to load to mySQL -- Sorry Chuk, this is not working properly
app.post('/uploadsql', fileUpload.single('song'),
    (req, resp, next) => {
        resp.on('finish',
            () => {
                fs.unlink(req.file.path, err => {})
            }
        )
        const username = req.body.username;

        findUser([ username ])
            .then(result => {
                if (result.length)
                    return next();
                resp.status(403).type('text/html')
                    .send(`<h2><code>${uploader}</code> Cannot upload songs</h2>`);
            })
            .catch(error => {
                resp.status(500).type('text/html')
                    .send(`<h2>Error: ${error}</h2>`)
            })
    },
    (req, resp) => {
        console.info('body: ', req.body);
        console.info('file: ', req.file);

        new Promise ((resolve, reject) => {
            fs.readFile(req.file.path, 
                (err, songFile) => {
                    const params = {
                        Bucket: `dawn123`, Key: `mymusic/${req.file.filename}`,
                        Body: songFile, ContentType: req.file.mimetype,
                        ContentLength: req.file.size, ACL: 'public-read'
                    }
                    console.info(params);
                    conns.s3.putObject(params,
                        (error, result) => {
                            if (error)
                                return reject(err)
                            resolve();
                        }
                    )
                }
            )
        })
        .then(()=> {
            const postDate = new Date();
            console.info(postDate);
            
            const params = [
                req.body.title, req.body.country, parseInt(req.body.listen_slots), req.body.lyrics, req.file.filename, postDate
            ];

            console.info('params:', params)
            return (newSongs({ connection: status.connection, params: params }))
        })
        //.then(db.logStatus, db.logError)
        .then(db.commit, db.rollback)
        .then(()=> {
            resp.status(201).type('text/html').send(`<h2>Song ${req.body.title} posted</h2>`);
        })
        .catch((error) => {
            resp.status(500).type('text/html').send(`<h2>Error: ${error}</h2>`)
        })
    }
);


// TODO - Task 4
// List all songs 

app.get('/list', 
    (req, resp) => {

        conns.mongodb.db('music').collection('songs')
            .find({})
            .project({ _id:0, title: 1, country: 1, listen_slots:1, checked_out: 1})
            .toArray()
            .then(result => {
                console.info(result);
                if(result.length> 0)
                    resp.status(200).type('text/html').render('list',{ list: result});
                else
                    resp.status(500).type('text/html').send(`<h2>No record found</h2>`);
            })
            .catch(err => {
                resp.status(500).type('text/html').send(`<h2>Error: ${err}</h2>`); 
            })
});

// TODO - Task 5
// List available songs for listening
app.get('/listenlist', 
    (req, resp) => {

        conns.mongodb.db('music').collection('songs')
            .find({})
            .project({ _id:0, title: 1, country: 1, checked_out: 1})
            .toArray()
            .then(result => {
                console.info(result);
                if(result.length> 0)
                    resp.status(200).type('text/html').render('listenlist',{ listenlist: result});
                else
                    resp.status(500).type('text/html').send(`<h2>No record found</h2>`);
            })
            .catch(err => {
                resp.status(500).type('text/html').send(`<h2>Error: ${err}</h2>`); 
            })
});

// TODO - Task 6
// Listening a song
app.get('/listen/:country',
    (req, resp) => {

        fs.readFile(req.file.path, 
            (err, songFile) => {
                const params = {
                    Bucket: `dawn123`, Key: `mymusic/${req.file.filename}`,
                    Body: songFile, ContentType: req.file.mimetype,
                    ContentLength: req.file.size, ACL: 'public-read'
                }
                conns.s3.putObject(params,
                    (error, result) => {
                        if (error)
                            return reject(err)
                        resolve();
                    }
                )
            }
        )
    
    }
)

app.use(express.static(__dirname + '/public'));


testConnections(conns)
    .then(()=> {
        app.listen(PORT,
            () => {
                console.info(`Application started on port ${PORT} at ${new Date()}`);
            }
        )
    })
    .catch(error => {
        console.error(error);
        process.exit(-1);
    })