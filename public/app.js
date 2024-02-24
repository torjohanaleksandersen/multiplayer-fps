import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'
import { World } from './World/World.js';
import { LockScreen } from './Classes/UserInterface/Lock-screen-component.js';
import { FBXLoader } from './World/WorldObjects/FBXLoader/FBXLoader.js'
import { AnimationComponent } from './Classes/Animation-component.js'
import { GunAttacher } from './Classes/Gun/Attach-gun-component.js';
import { Arms } from './Classes/Arms-controller.js';
import { GunController } from './Classes/Gun/Gun-controller.js';
import { Crosshair } from './Classes/UserInterface/Crosshair-component.js'
import { UserInterface } from './Classes/UserInterface/UI-controller.js'
import { AudioController } from './Classes/UserInterface/Audio-controller.js';
import { keyStates } from './World/WorldObjects/handle-keydown.js';
import { PickupableManager } from './Classes/UserInterface/Pickupables.js';

const socket = io()

setInterval(() => {
    const start = Date.now();
  
    socket.emit("ping", () => {
        const duration = Date.now() - start;
        document.querySelector('.ping').innerText = 'ping: ' + duration + 'ms'
    });
  }, 1000);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer( { antialias: true } );

export let lockscreen = new LockScreen(camera, renderer, socket)
export let userSettings = lockscreen.settings

let world = new World(scene, camera, renderer)
world.initialize()

export let arms = new Arms(scene, camera)
arms.initialize()

export let player = world.Player

export let userInterface = new UserInterface()

export let gun = new GunController(socket, camera, scene, player)

export let crosshair = new Crosshair()

export let audio = new AudioController(camera)

export let itemManager = new PickupableManager(socket, scene, camera, player)

let callbackStartGame = setInterval(() => {
    if(world.initialized && arms.component) {
        socket.emit('world-initialized')
        clearInterval(callbackStartGame)
        loop()
    }
}, 1000)

let players = {}
let animationComponents = {}
let attachGunComponents = {}

export let mainPlayerArms = null

socket.on('player-update', playersList => {
    playersList.forEach(playerData => {
        const [id, p, yrot, state, inHand, gamertag] = playerData
        const pos = [p[0], p[1] - (player.height / 4), p[2]]

        if (!players.hasOwnProperty(id)) {
            if (socket.id == id) {
                players[id] = arms.component
                players[id].state = state
                players[id].inHand = inHand
                players[id].gamerTag = gamertag
                animationComponents[id] = new AnimationComponent(new THREE.AnimationMixer(arms.component))
                attachGunComponents[id] = new GunAttacher(arms.component)
                if(inHand) attachGunComponents[id].attachGun(inHand)
                mainPlayerArms = attachGunComponents[id]
                lockscreen.addGamertag(gamertag)
            } else {
                players[id] = 'building'
                const loader = new FBXLoader()
                loader.setPath('./Characters/')
                loader.load('soldier-simple-green-black.fbx', (fbx) => {
                    fbx.scale.setScalar(0.005)
                    fbx.position.set(...pos)
                    
        
                    scene.add(fbx)
                    fbx.userData.id = id
                    players[id] = fbx
                    players[id].state = state
                    players[id].inHand = inHand
                    players[id].gamerTag = gamertag
                    animationComponents[id] = new AnimationComponent(new THREE.AnimationMixer(fbx))
                    attachGunComponents[id] = new GunAttacher(fbx)
                    if(inHand) attachGunComponents[id].attachGun(inHand)
                })
            }
        } else {
            if(players[id] == 'building') return
            if(socket.id != id) {
                players[id].position.set(...pos)
                players[id].rotation.y = yrot
            } else {
                if(!lockscreen.locked) return
            }
            if (state && state !== players[id].state) {
                animationComponents[id].playAnimation(state)
                attachGunComponents[id].updateFromPlayerState(state)
                players[id].state = state;
                if(socket.id == id) {
                    arms.changeAction(player.state)
                }
                //handleAudioFromState(state)
            }
            if (inHand && inHand !== players[id].inHand) {
                attachGunComponents[id].attachGun(inHand)
                players[id].inHand = inHand
            }
        }
    })
    
    socket.emit('client-update', [player.position, player.yRotation, player.state, player.inHand, player.health])
})

socket.on('shot-fired', id => {
    attachGunComponents[id].addMuzzleFlash()

    setTimeout(() => {
        attachGunComponents[id].removeMuzzleFlash()
    }, 200)
})

socket.on('being-hit', health => {
    player.health = health
    userInterface.health(health)
})

let spectatingTarget = null
let spectating = false

socket.on('die', killer => {
    player.state = 'dead'
    userInterface.health(0)
    userInterface.killed(killer)

    for (const id in players) {
        if(players[id].gamerTag == killer) {
            spectatingTarget = players[id]
        }
    }

    if(!spectatingTarget) return
    
    setTimeout(() => {
        spectating = true
    }, 5000)
})

socket.on('remove-player', id => {
    if ( players[id] ) {
        scene.remove(players[id])
        delete players[id]
        delete animationComponents[id]
        delete attachGunComponents[id]
    }
});

socket.on('target-hit', data => {
    let [health, color, gamertag, state] = data
    if(state.includes('dead')) return
    if(health <= 0) {
        audio.playAudio('./Audio/Other/headshot.mp3')
        setTimeout(() => {
            audio.playAudio('./Audio/Other/kill.mp3')
        }, 200)
        color = 'red'
        userInterface.addKillLine(gamertag)
    } else {
        audio.playAudio('./Audio/Other/headshot.mp3')
    }
    userInterface.hitAnimation(color)

    if(health <= 0) {
        player.kills++
        userInterface.kills(player.kills)
    }
})

socket.on('audio', data => {
    const [url, pos] = data
    let path = './Audio/Guns/' + url
    audio.playPositionalAudio(path, pos)
})

socket.on('leaderboard', players => {
    userInterface.updateLeaderboard(players)
})

socket.on('clock-update', data => {
    let [m, s] = data
    if(s.toString().length == 1) {
        s = '0' + s
    }
    document.getElementById('clock-minutes').innerText = m
    document.getElementById('clock-seconds').innerText = s
})

socket.on('new-round', data => {
    const [pos, round, pickupables] = data
    itemManager.deleteAllPickupables()
    document.getElementById('rounds').innerHTML = round
    world.resetPlayerPosition(pos)
    attachGunComponents[socket.id].detachGun()
    gun.stopReload()
    gun.resetUserData() 
    gun.activeGun = null
    gun.resetAmmo()
    itemManager.updateUI()
    userInterface.health(player.health)
    player.resetUserdata()
    players[socket.id].inHand = null
    crosshair.remove()
    camera.near = 0.1
    camera.updateProjectionMatrix()
    pickupables.forEach(pickupable => {
        const [model, pos] = pickupable
        itemManager.addPickupableToWorld(model, pos)
    })
})

socket.on('waiting-for-match', () => {
    document.querySelector('.waiting-for-round').style.opacity = 1
})

socket.on('match-startet', () => {
    document.querySelector('.waiting-for-round').style.opacity = 0
})

function handleAudioFromState(state) {
    let path = './Audio/Actions/' + state + '.mp3'
    audio.handleActions(path, state)
}

export function keydownHandler(key) {
    if(key == '1' || key == '2' || key == '3' || key == '4') {
        if (player.inventory.guns[parseInt(key) - 1]) {
            changeWeapon(player.inventory.guns[parseInt(key) - 1])
        }
    }
    if(key == 'Shift') {
        world.crouch('down')
    }
    if(key == ' ') {
        keyStates['spaceStillDown'] = true
    }
    if(key == 'e') {
        itemManager.pickupItemRequestToServer()
    }
    if(key == 'g') {
        /*
        let pos = {
            'x': player.position[0],
            'y': player.position[1] - 0.35,
            'z': player.position[2]
        }
        console.table(pos)
        */
        let pos = [
            player.position[0].toFixed(2),
            (player.position[1] - 0.35).toFixed(2),
            player.position[2].toFixed(2),
        ]
        console.log(pos)
    }
}

export function keyupHandler(key) {
    if(key == 'Shift') {
        world.crouch('up')
    }
    if(key == ' ') {
        keyStates['spaceStillDown'] = false
    }
}

function changeWeapon(GUN) {
    player.inHand = GUN
    gun.changeGun(player.inHand)
    arms.changeWeapon()
    crosshair.changeCrosshair(player.inHand)
    mainPlayerArms.removeMuzzleFlash()
}

function loop() {
    requestAnimationFrame(loop);
    renderer.render(scene, camera); 

    for(const id in animationComponents) {
        animationComponents[id].update()
    }

    if (player.state.includes('dead') && spectating) {
        let position = spectatingTarget.position.clone().add(new THREE.Vector3(0, 0.8, 0))
        let rotation = spectatingTarget.rotation.clone()
        rotation.y += Math.PI
        camera.position.copy(position)
        camera.rotation.copy(rotation)
        camera.near = 1
        camera.updateProjectionMatrix()
    }

    arms.update(player.state)
    gun.update()
    player.update()
    crosshair.update(player.state)
    lockscreen.update()
    itemManager.update()
    world.animate()
}