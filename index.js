var express = require('express')
var bp = require('body-parser')
var cors = require('cors')
var uuid = require('uuid')
var port = process.env.PORT || 9080
var Datastore = require('nedb');
var todos = new Datastore({ filename: 'todos.db', autoload: true });
var server = express()

server.use(cors())
server.use(bp.json())
server.use(bp.urlencoded({ extended: true }))

var db = {
    todos
}

function createItem(item) {
    return { ...item, id: uuid.v4() }
}

server.get('/api/:collection', (req, res, next) => {
    var collection = db[req.params.collection] = db[req.params.collection] || []
    if (Array.isArray(collection)) {
        res.send(collection)
    } else {
        collection.find({}, (e, docs) => {
            res.send(docs)
        })
    }
})

server.get('/api/:collection/:id', (req, res, next) => {
    var collection = db[req.params.collection]

    if (Array.isArray(collection)) {
        var item = collection ? collection.find(t => t.id == req.params.id) : null
        item ? res.send(item) : res.status(400).send({ error: 'Sorry invalid request' })
    } else {
        collection.find({ id: req.params.id }, (e, doc) => {
            res.send(doc)
        })
    }
})

server.post('/api/:collection', (req, res, next) => {
    db[req.params.collection] = db[req.params.collection] || []
    var collection = db[req.params.collection]
    var item = createItem(req.body)

    if (Array.isArray(collection)) {
        collection.push(item)
        res.send({ message: 'successfully added item', data: item })
    } else {
        collection.insert(item, (e, doc) => {
            res.send(doc)
        })
    }

})

server.put('/api/:name/:id', (req, res, next) => {
    db[req.params.name] = db[req.params.name] || []
    var collection = db[req.params.name]
    var id = req.params.id
    if (Array.isArray(collection)) {
        var item = collection.find(t => t.id == id)
        if (item) {
            for (var k in req.body) {
                if (k != 'id') {
                    item[k] = req.body[k]
                }
            }
        } else {
            return res.status(400).send({ error: 'Sorry invalid request' })
        }
    } else {
        collection.update({ id: id }, req.body)
    }
    res.send({ message: 'successfully updated your item. GOOD JOB!' })
})

server.delete('/api/:name/:id', (req, res, next) => {
    db[req.params.name] = db[req.params.name] || []
    var collection = db[req.params.name]
    var id = req.params.id

    if (Array.isArray(collection)) {
        var item = collection.find(t => t.id == id)
        var i = collection.indexOf(item)
        if (i != -1) {
            collection.splice(i, 1)
        } else {
            res.status(400).send({ error: 'Sorry invalid request' })
        }
    } else {
        collection.remove({ id: id })
    }
    res.send({ message: 'successfully removed item' })
})


var cards = require('./cards')


server.post('/cards', cards.start)
server.get('/cards', cards.getGames)
server.get('/cards/:id', cards.get)
server.put('/cards/:id', cards.play)
server.delete('/cards/:id', cards.deleteGame)


server.listen(port, () => {
    console.log('running on port: ', port)
})
