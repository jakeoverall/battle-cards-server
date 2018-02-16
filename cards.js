//@ts-check
var uuid = require('uuid')
var Datastore = require('nedb');
var dbgames = new Datastore({ filename: 'games.db', autoload: true });
var adjectives = ["adamant", "adroit", "amatory", "animistic", "antic", "arcadian", "baleful", "bellicose", "bilious", "boorish", "calamitous", "caustic", "cerulean", "comely", "concomitant", "contumacious", "corpulent", "crapulous", "defamatory", "didactic", "dilatory", "dowdy", "efficacious", "effulgent", "egregious", "endemic", "equanimous", "execrable", "fastidious", "feckless", "fecund", "friable", "fulsome", "garrulous", "guileless", "gustatory", "heuristic", "histrionic", "hubristic", "incendiary", "insidious", "insolent", "intransigent", "inveterate", "invidious", "irksome", "jejune", "jocular", "judicious", "lachrymose", "limpid", "loquacious", "luminous", "mannered", "mendacious", "meretricious", "minatory", "mordant", "munificent", "nefarious", "noxious", "obtuse", "parsimonious", "pendulous", "pernicious", "pervasive", "petulant", "platitudinous", "precipitate", "propitious", "puckish", "querulous", "quiescent", "rebarbative", "recalcitant", "redolent", "rhadamanthine", "risible", "ruminative", "sagacious", "salubrious", "sartorial", "sclerotic", "serpentine", "spasmodic", "strident", "taciturn", "tenacious", "tremulous", "trenchant", "turbulent", "turgid", "ubiquitous", "uxorious", "verdant", "voluble", "voracious", "wheedling", "withering", "zealous"];
var nouns = ["ninja", "chair", "pancake", "statue", "unicorn", "rainbows", "laser", "senor", "bunny", "captain", "nibblets", "cupcake", "carrot", "gnomes", "glitter", "potato", "salad", "toejam", "curtains", "beets", "toilet", "exorcism", "stick figures", "mermaid eggs", "sea barnacles", "dragons", "jellybeans", "snakes", "dolls", "bushes", "cookies", "apples", "ice cream", "ukulele", "kazoo", "banjo", "opera singer", "circus", "trampoline", "carousel", "carnival", "locomotive", "hot air balloon", "praying mantis", "animator", "artisan", "artist", "colorist", "inker", "coppersmith", "director", "designer", "flatter", "stylist", "leadman", "limner", "make-up artist", "model", "musician", "penciller", "producer", "scenographer", "set decorator", "silversmith", "teacher", "auto mechanic", "beader", "bobbin boy", "clerk of the chapel", "filling station attendant", "foreman", "maintenance engineering", "mechanic", "miller", "moldmaker", "panel beater", "patternmaker", "plant operator", "plumber", "sawfiler", "shop foreman", "soaper", "stationary engineer", "wheelwright", "woodworkers"];

var games = {}

function startGame(gameConfig) {
    var game = new Game(gameConfig.playerName, gameConfig.opponets, gameConfig.set)
    dbgames.insert(game)
    return game
}

function getGame(id, cb) {
    dbgames.findOne({ id: id }, (err, game) => {
        game.__proto__ = Game.prototype
        cb(game)
    })
}

function Game(playerName, opponets, set) {
    try {
        this.id = uuid.v4()
        this.set = set || 4
        this.opponets = opponets || 1
        this.players = [this.createPlayer(playerName), this.createPlayer('Dan')]
        this.dead = []
        this.over = false
        this.winner = false
        while (this.players.length < this.opponets + 1) {
            this.players.push(this.createPlayer())
        }
        games[this.id] = this
    } catch (e) {
        console.log(e)
    }
}

Game.prototype.createPlayer = function createPlayer(name) {
    return {
        id: uuid.v4(),
        name: name || randomName(),
        hand: getCards(5, this.set),
        remainingCards: 5,
        dead: false,
    }
}

Game.prototype.findCard = function (playerId, cardId) {
    var p = this.players.find(p => p.id == playerId)
    if (!p) { return }
    return p.hand.find(c => c.id == cardId)
}

Game.prototype.handleAttack = function handleAttack(card1, card2) {
    if (!card1 || !card2) { return }
    card1.health -= card2.attack >= card1.defense ? (card2.attack - card1.defense) : 0
    card2.health -= card1.attack >= card2.defense ? (card1.attack - card2.defense) : 0
    if (card2.health <= 0) {
        card2.dead = true
        card2.health = 0
    }
    if (card1.health <= 0) {
        card1.dead = true
        card1.health = 0
    }
}

Game.prototype.updateState = function () {
    this.players.forEach(p => {
        p.hand = p.hand.filter(c => !c.dead)
        if (p.hand.length < 5 && p.remainingCards > 0) {
            p.hand.push(new Card(this.set))
            p.remainingCards--
        }
        if (p.hand.length == 0) {
            p.dead = true
            this.dead.push(p)
        }
    })

    if (this.dead.length >= this.opponets) {
        this.over = true
        this.winner = this.players.find(p => !p.dead) || 'CAT GAME'
    }
}

Game.prototype.play = function (payload) {
    this.handleAttack(
        this.findCard(payload.playerId, payload.playerCardId),
        this.findCard(payload.opponentId, payload.opponentCardId)
    )
    this.updateState()
    dbgames.update({ id: this.id }, this)
}

function rand(min, max) {
    return Math.floor(Math.random() * max) + min
}

function randomName() {
    var adjective = adjectives[rand(0, adjectives.length)]
    var noun = nouns[rand(0, nouns.length)]

    return `${adjective} ${noun}`
}

function randomImg(id, set) {
    return `https://robohash.org/${id}?set=set${set || 4}`
}

function Card(set) {
    this.attack = rand(1, 4)
    this.health = rand(2, 10)
    this.defense = rand(0, 2)
    this.id = uuid.v4()
    this.img = randomImg(this.id, set)
    this.dead = false
}

function getCards(n, set) {
    var out = []
    while (out.length < n) {
        out.push(new Card(set))
    }
    return out
}

function getCard(set) {
    return new Card(set)
}



function play(req, res, next) {
    var game = getGame(req.params.id, game => {
        if (!game || game.over) {
            return res.send({ message: 'This game is over', data: game })
        }
        try {
            game.play(req.body)
            res.send({ message: 'ready' })
        } catch (e) {
            console.log(e)
            res.status(400).send({ error: e })
        }
    })
}

function start(req, res, next) {
    try {
        console.log(req.body.gameConfig)
        var game = startGame(req.body.gameConfig)
        res.send(game)
    } catch (e) {
        res.status(400).send({ error: e })
    }
}

function get(req, res, next) {
    var game = getGame(req.params.id, game => {
        game ? res.send({ message: 'Game Retrieved', data: game }) : res.status(400).send({ error: 'Unable to find Game' })
    })
}

function deleteGame(req, res, next) {
    dbgames.remove({ id: req.params.id })
    res.send({ message: 'GAME DELORTED' })
}

function getGames(req, res, next) {
    dbgames.find({}, (err, games) => {
        res.send(games)
    })
}

module.exports = {
    start,
    getGames,
    get,
    play,
    deleteGame
}