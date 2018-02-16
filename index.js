var express = require('express')
var bp = require('body-parser')
var cors = require('cors')
var uuid = require('uuid')
var port = process.env.PORT || 9080
var server = express()

server.use(cors())
server.use(bp.json())
server.use(bp.urlencoded({ extended: true }))

var db = {

}

function createItem(item) {
    return { ...item, id: uuid.v4() }
}

server.get('/api/:collection', (req, res, next) => {
    var collection = db[req.params.collection] = db[req.params.collection] || []
    collection ? res.send(collection) : res.status(400).send({ error: 'Sorry invalid request' })
})

server.get('/api/:collection/:id', (req, res, next) => {
    var collection = db[req.params.collection]
    var item = collection ? collection.find(t => t.id == req.params.id) : null
    item ? res.send(item) : res.status(400).send({ error: 'Sorry invalid request' })
})

server.post('/api/:collection', (req, res, next) => {
    db[req.params.collection] = db[req.params.collection] || []
    var collection = db[req.params.collection]
    var item = createItem(req.body)
    collection.push(item)
    res.send({ message: 'successfully added item', data: item })
})

server.put('/api/:name/:id', (req, res, next) => {
    db[req.params.name] = db[req.params.name] || []
    var items = db[req.params.name]
    var id = req.params.id
    var item = items.find(t => t.id == id)
    if (item) {
        for (var k in req.body) {
            if (k != 'id') {
                item[k] = req.body[k]
            }
        }
        res.send({ message: 'successfully updated your item. GOOD JOB!' })
    } else {
        res.status(400).send({ error: 'Sorry invalid request' })
    }
})

server.delete('/api/:name/:id', (req, res, next) => {
    db[req.params.name] = db[req.params.name] || []
    var items = db[req.params.name]
    var id = req.params.id
    var item = items.find(t => t.id == id)
    var i = items.indexOf(item)

    if (i != -1) {
        items.splice(i, 1)
        res.send({ message: 'successfully removed item' })
    } else {
        res.status(400).send({ error: 'Sorry invalid request' })
    }
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
