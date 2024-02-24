const express = require("express")
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express()
const httpServer = createServer(app);

const io = new Server(httpServer);

const PORT = process.env.PORT || 5000;

const USERS = []
let lobbyInitialized = false
let round = 0

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
        this.roundsWon = 0

        this.socket.on("ping", (callback) => {
            callback();
        });

        this.socket.on('world-initialized', () => {
            this.initialized = true
            
            //this.socket.emit('initialize-pickupables', pickupables)
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

        this.socket.on('shot-fired', () => {
            this.shotFired()
        })

        this.socket.on('pick-up-item-request', (data) => {
            const [pos, name] = data
            let found = false
            for (let i = 0; i < pickupables.length; i++) {
                const elem = pickupables[i];
                for (let j = 0; j < elem[1].length; j++) {
                    if(elem[1][j] != pos[j]) {
                        continue
                    }
                }
                if(name != elem[0]) continue
                this.socket.emit('pick-up-confirmed')
                pickupables.splice(pickupables.indexOf(elem), 1)
                found = true   
                break
            }
            if(!found) return
            for (let i = 0; i < USERS.length; i++) {
                if(USERS[i].id != this.id) USERS[i].socket.emit('pickupable-removed', data)
            }
        }) 

        this.socket.on('name-change-request', name => {
            for (let i = 0; i < USERS.length; i++) {
                if (USERS[i].gamerTag == name) {
                    return
                }
            }
            this.gamerTag = name
            this.socket.emit('name-verified', name)
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

    shotFired() {
        for (let i = 0; i < USERS.length; i++) {
            if (USERS[i].id != this.id) {
                USERS[i].socket.emit('shot-fired', this.id)
            }
        }
    }

    hit(data) {
        const [damage, id, color] = data
        let target = null
        for (let i = 0; i < USERS.length; i++) {
            if(USERS[i].id == id) {
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
            this.socket.emit('target-hit', [target.health, color, target.gamerTag, target.state])
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
let pickupables = []
function createPickupables() {
    pickupables = []
    let possibleGunPositions = [
        //south west
        [4.14, 0.96, -2.47],
        [3.18, 0.96, -2.49],
        [6.81, 0.72, -1.92],
        [5.90, 0.66, 4.25],

        //south east
        [-15.63, 0.24, -3.78],
        [-15.57, 0.24, -3.09],
        [-8.39, 0.00, -3.73],

        //north east
        [-13.25, 0.66, 9.87],
        [-16.17, 0.25, 18.52],
        [-14.98, 0.25, 18.32],
        [-9.15, 0.00, 14.72],

        //north west
        [-0.31, 0.24, 15.88],
        [-0.28, 0.24, 16.48],
        [8.48, 0.24, 13.85],
        [8.47, 0.24, 14.49],

        //middle / random
        [-0.51, 0.07, 5.06],
    ]

    let possibleGuns = [ 'M416',  'AKM', 'S1897',  'SawedOff' ]

    for (let i = 0; i < possibleGunPositions.length; i++) {
        const pos = possibleGunPositions[i];
        const gun = possibleGuns[Math.floor(Math.random() * possibleGuns.length)]
        pickupables.push([gun, pos])
    }

    let possibleAmmoPositions = [
        //south west
        [3.00, 0.59, 2.16],
        [2.55, 0.59, 2.16],
        [2.55, 0.59, 4.31],
        [6.19, 0.01, -3.12],

        //south east
        [-11.24, 0.62, -1.76],
        [-16.06, 0.93, 4.35],
        [-10.98, 0.00, -4.92],
        [-9.29, 0.01, 2.06],


        //north east
        [-12.86, 0.66, 12.78],
        [-13.40, 0.66, 12.78],
        [-13.96, 0.25, 18.23],
        [-12.60, 0.97, 18.61],


        //north west
        [6.40, 0.67, 15.63],
        [6.40, 0.67, 15.11],
        [8.20, 0.95, 10.34],
        [2.64, 0.59, 9.70],

        //middle / random
        [-0.60, 0.07, 5.51],
    ]

    let possibleAmmos = [ '7.62mm Ammo', '12 Gauge Ammo']

    for (let i = 0; i < possibleAmmoPositions.length; i++) {
        const pos = possibleAmmoPositions[i];
        const ammo = possibleAmmos[Math.floor(Math.random() * possibleAmmos.length)]
        pickupables.push([ammo, pos])
    }
}
createPickupables()

io.on('connection', socket => {
    let connectedUser = new User(socket) 
    USERS.push(connectedUser)

    socket.on('disconnect', () => {
        const disconnectedUser = USERS.find(user => user.id === socket.id)
        if (disconnectedUser) {
            USERS.splice(USERS.indexOf(disconnectedUser), 1)
 
            io.emit('remove-player', socket.id)
            updateGloballyLeaderboard()
        }
    })
})

let clock = null
let waitingForNewRound = false

function serverClock(m, s, callback) {
    clock = setInterval(() => {
        if(s < 0) {
            s = 0
        }
        if(s >= 0) s--
        if(s < 0 && m > 0) {
            m--
            s = 59
        }
        for (let i = 0; i < USERS.length; i++) {
            const user = USERS[i];
            if(user.initialized) {
                user.socket.emit('clock-update', [m, s])
            }
        }
        
        if(s == 0 && m == 0) {
            onClockZero(callback)
            clearInterval(clock)
            return
        }

        if(round > 0) handlePlayersAliveInRound()
    }, 1000)
}


function onClockZero(func) {
    if(func == 'start_match') {
        waitingForNewRound = false
        round++
        matchStartet()
    }
}

function matchStartet() {
    createPickupables()
    let spawns = [
        [4, 0.35, -4],
        [8.7, 0.35, -3.7],
        [-4.3, 0.35, -4.1],
        [-13.7, 0.35, -3.6],
        [-15.5, 0.35, 16.5],
        [-4.7, 0.35, 17.9],
        [8.5, 0.35, 17.5],
        [0.65, 0.35, 5]
    ]
    for (let i = 0; i < USERS.length; i++) {
        const user = USERS[i];
        let index = Math.floor(Math.random() * spawns.length)
        let position = spawns[index]
        spawns.splice(index, 1)
        user.inHand = null
        user.socket.emit('new-round', [position, round, pickupables])
    }
    setTimeout(() => {
        serverClock(1, 59, 'start_match') 
        sendMessageToClients('match-startet')
    }, 1000)
}

function resetRound() {
    clearInterval(clock)
    clock = null

    for (let i = 0; i < USERS.length; i++) {
        const user = USERS[i];
        if(user.initialized) {
            user.socket.emit('clock-update', [0, 0])
            user.socket.emit('new-round', [null, 0])
        }
    }
}

function handlePlayersAliveInRound() {
    let n = 0
    let playersAlive = []
    for (let i = 0; i < USERS.length; i++) {
        const user = USERS[i];
        if(!user.state.includes('dead')) {
            n++
            playersAlive.push(user)
        }
    }
    
    if(n == 1 && !waitingForNewRound) {
        waitingForNewRound = true
        let user = playersAlive[0]
        user.roundsWon ++
        clearInterval(clock)
        serverClock(0, 5, 'start_match')
    }
}



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

    if (USERS.length >= 2 && !lobbyInitialized) {
        lobbyInitialized = true
        sendMessageToClients('waiting-for-match')
        serverClock(1, 59, 'start_match')
    } else if (USERS.length < 2) {
        lobbyInitialized = false
        if(clock) resetRound()
    }
}

function updateGloballyLeaderboard() {
    for (let i = 0; i < USERS.length; i++) {
        USERS[i].updateLeaderboard()
    }
}

function sendMessageToClients(msg) {
    for (let i = 0; i < USERS.length; i++) {
        const user = USERS[i];
        user.socket.emit(msg)
    }
}



setInterval(() => {
    loop()
}, 50)

app.use(express.static("public"))

httpServer.listen(PORT);