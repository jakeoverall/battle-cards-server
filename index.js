var express = require('express')
var bp = require('body-parser')
var server = express()
var port = process.env.PORT || 8080
var cors = require('cors')

server.use(cors())
server.use(bp.json())
server.use(bp.urlencoded({ extended: true }))

var db = {

}

server.get('/api/todos/:name', (req, res, next) => {
    var todos = db[req.params.name]
    todos ? res.send(todos) : res.status(400).send({ error: 'Sorry invalid request' })
})

server.get('/api/todos/:name/:index', (req, res, next) => {
    var todos = db[req.params.name]
    var todo = todos ? todos[req.params.index] : null
    todo ? res.send(todo) : res.status(400).send({ error: 'Sorry invalid request' })
})

server.post('/api/todos/:name', (req, res, next) => {
    db[req.params.name] = db[req.params.name] || []
    var todos = db[req.params.name]
    todos.push(req.body)
    res.send(todos)
})

server.put('/api/todos/:name/:index', (req, res, next) => {
    var todos = db[req.params.name]
    var index = req.params.index
    if (todos[req.params.index]) {
        todos[req.params.index] = req.body
        res.send({message: 'successfully updated your todo. GOOD JOB!'})
    } else {
        res.status(400).send({ error: 'Sorry invalid request' })
    }
})

server.delete('/api/todos/:name/:index', (req, res, next) => {
    var todos = db[req.params.name]
    var index = req.params.index
    if (todos[req.params.index]) {
        todos.splice(index, 1)
        res.send({message: 'successfully removed todo'})
    } else {
        res.status(400).send({ error: 'Sorry invalid request' })
    }
})

server.listen(port)
