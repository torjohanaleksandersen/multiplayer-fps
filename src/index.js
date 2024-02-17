const express = require("express")
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express()
const httpServer = createServer(app);

const io = new Server(httpServer);

const PORT = process.env.PORT || 5000;

const USERS = []

class User {
    constructor(socket) {
        this.socket = socket
        this.id = this.socket.id
        this.initialized = false
        this.position = [0, 3, 0]
        this.yRotation = 0
        this.inHand = null
        this.state = null
        this.health = 100
        this.gamerTag = 'Player_' + Math.round(Math.random() * 1000)
        this.kills = 0
        this.deaths = 0

        this.socket.on("ping", (callback) => {
            callback();
        });

        this.socket.on('world-initialized', () => {
            this.initialized = true
            updateGloballyLeaderboard()
        })
 
        this.socket.on('client-update', data => {
            const [pos, yRot, state, inHand, health] = data
            this.position = [...pos] 
            this.yRotation = yRot
            this.state = state
            this.inHand = inHand
            this.health = health
        })

        this.socket.on('player-hit', data => {
            this.hit(data)
        })

        this.socket.on('settings-change', data => {
            const name = data
            this.gamerTag = name
            updateGloballyLeaderboard()
        })

        this.socket.on('audio', data => {
            this.audioUpdate(data)
        })
    }

    audioUpdate(data) {
        const [url, position] = data
        for (let i = 0; i < USERS.length; i++) {
            if(USERS[i].id != this.id) {
                USERS[i].socket.emit('audio', [url, position])
            }
            
        }
    }

    hit(data) {
        const [damage, gamertag, color] = data
        let target = null
        for (let i = 0; i < USERS.length; i++) {
            if(USERS[i].gamerTag == gamertag) {
                target = USERS[i]
                break
            }
        }
        if(target) {
            if(target.state == 'dead') return
            target.health -= damage
            if(target.health > 0) {
                target.socket.emit('being-hit', target.health)
            } else {
                this.kills++
                target.deaths++
                target.socket.emit('die', this.gamerTag)
            } 
            this.socket.emit('target-hit', [target.health, color, gamertag, target.state])
            updateGloballyLeaderboard()
        }
    }

    updateLeaderboard() {
        let array = []
        for (let j = 0; j < USERS.length; j++) {
            array.push([0, USERS[j].gamerTag, USERS[j].kills, USERS[j].deaths])
        }
        this.socket.emit('leaderboard', array)
    }
}

io.on('connection', socket => {
    let connectedUser = new User(socket) 
    USERS.push(connectedUser)

    socket.on('disconnect', () => {
        const disconnectedUser = USERS.find(user => user.id === socket.id)
        if (disconnectedUser) {
            USERS.splice(USERS.indexOf(disconnectedUser), 1)
 
            io.emit('remove-player', socket.id)
        }
    })
})

function loop() {
    let data = []
    for (let i = 0; i < USERS.length; i++) {
        if(USERS[i].initialized) {
            data.push([USERS[i].id, USERS[i].position, USERS[i].yRotation, USERS[i].state, USERS[i].inHand, USERS[i].gamerTag])
        }
    }
    for (let i = 0; i < USERS.length; i++) {
        USERS[i].socket.emit('player-update', data)
    }
}

function updateGloballyLeaderboard() {
    for (let i = 0; i < USERS.length; i++) {
        USERS[i].updateLeaderboard()
    }
}

setInterval(() => {
    loop()
}, 50)

app.use(express.static("public"))

httpServer.listen(PORT);