import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'
import { World } from './World/World.js';
import { FirstPersonCamera } from './World/WorldObjects/first-person-camera.js'
import { FBXLoader } from './World/WorldObjects/FBXLoader/FBXLoader.js'
import { AnimationComponent } from './Classes/Animation-component.js'
import { GunAttacher } from './Classes/Attach-gun-component.js';
import { Arms } from './Classes/Arms-controller.js';
import { GunController } from './Classes/Gun-controller.js';
import { Crosshair } from './Classes/Crosshair-component.js'
import { UserInterface } from './Classes/UI-controller.js'
import { AudioController } from './Classes/Audio-controller.js';

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

new FirstPersonCamera(camera, renderer)

let world = new World(scene, camera, renderer)
world.initialize()

export let arms = new Arms(scene, camera)
arms.initialize()

export let player = world.Player

export let userInterface = new UserInterface()

export let gun = new GunController(socket, camera, scene, player)
gun.updateAmmo()

export let crosshair = new Crosshair()

export let audio = new AudioController(camera)


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
        const pos = [p[0], p[1] - (player.height / 2), p[2]]

        if (!players.hasOwnProperty(id)) {
            if (socket.id == id) {
                players[id] = arms.component
                players[id].state = state
                players[id].inHand = inHand
                players[id].gamerTag = gamertag
                animationComponents[id] = new AnimationComponent(new THREE.AnimationMixer(arms.component))
                attachGunComponents[id] = new GunAttacher(arms.component)
                attachGunComponents[id].attachGun(inHand)
                mainPlayerArms = attachGunComponents[id]
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
                    attachGunComponents[id].attachGun(inHand)
                })
            }
        } else {
            if(players[id] == 'building') return
            if(socket.id != id) {
                players[id].position.set(...pos)
                players[id].rotation.y = yrot
            }
            if (state && state !== players[id].state) {
                animationComponents[id].playAnimation(state)
                attachGunComponents[id].updateFromPlayerState(state)
                players[id].state = state;
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

socket.on('being-hit', health => {
    player.health = health
    userInterface.health(health)
})

socket.on('die', killer => {
    player.state = 'dead'
    userInterface.health(0)
    userInterface.killed(killer)
    setTimeout(() => {
        world.resetPlayerPosition()
        userInterface.health(player.health)
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
    if(state == 'dead') return
    if(health <= 0) {
        audio.playAudio('./Audio/Other/headshot.mp3')
        setTimeout(() => {
            audio.playAudio('./Audio/Other/kill.mp3')
        }, 500)
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

function handleAudioFromState(state) {
    let path = './Audio/Actions/' + state + '.mp3'
    audio.handleActions(path, state)
}

export function keydownHandler(eventCode) {
    if(eventCode == 'Digit1') {
        if(player.inHand == 'M416') return
        player.inHand = 'M416'
        gun.changeGun(player.inHand)
        arms.changeWeapon()
        crosshair.changeCrosshair(player.inHand)
    }
    if(eventCode == 'Digit2') {
        if(player.inHand == 'S1897') return
        player.inHand = 'S1897'
        gun.changeGun(player.inHand)
        arms.changeWeapon()
        crosshair.changeCrosshair(player.inHand)
    }
}

function loop() {
    requestAnimationFrame(loop);
    renderer.render(scene, camera); 

    for(const id in animationComponents) {
        animationComponents[id].update()
    }

    gun.update()
    player.update()
    arms.update(player.state)
    crosshair.update(player.state)
    world.animate()
}