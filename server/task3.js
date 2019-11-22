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

        resp.status(200).type('text/plain').send(`uploaded ${req.file.originalname}`);
    }
);