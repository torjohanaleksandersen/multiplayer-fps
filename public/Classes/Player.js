import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'
import { keyStates, mouseDown } from '../World/WorldObjects/handle-keydown.js'

export class Player {
    constructor(camera) {
        this.camera = camera
        this.collider = null
        this.radius = 0.35
        this.height = 1
        this.position = [0, 0, 0]
        this.kills = 0
        this.health = 100
        this.yRotation = 0
        this.state = 'idle'
        this.inHand = ''
        this.aiming = false
        this.crouching = false
        this.speed = 9
        this.jumpForce = 9
        this.maxGuns = 2
        this.inventory = {
            guns: [],
            ammo: {
                '5.56mm Ammo': 0,
                '7.62mm Ammo': 0,
                '12 Gauge Ammo': 0,
            }
        }
    }

    resetUserdata() {
        this.health = 100
        this.state = 'idle'
        this.aiming = false
        this.inHand = null
        this.inventory = {
            guns: [],
            ammo: {
                '5.56mm Ammo': 0,
                '7.62mm Ammo': 0,
                '12 Gauge Ammo': 0,
            }
        }
    }

    crouch(dir) {
        if (dir == 'down') {
            if (this.crouching == true) return;
            this.crouching = true;
            this.animateCrouch(-0.4, -1); 
        } else if (dir == 'up') {
            this.crouching = false;
            this.animateCrouch(0.4, 1); 
        }
    }
    
    animateCrouch(targetY, multiplayer) {

        let length = 0.01 * multiplayer
        let lengthElapsed = 0
        let interval = setInterval(() => {
            if(Math.abs(lengthElapsed) >= Math.abs(targetY)) {
                clearInterval(interval)
                return
            }
            lengthElapsed += length
            this.collider.end.y += length
        }, 5)
    }

    update() {
        this.updateState()
        
        if(this.state == 'dead') return
        const cameraDirection = new THREE.Vector3()
        this.camera.getWorldDirection(cameraDirection).normalize()

        this.yRotation = Math.atan2(cameraDirection.x, cameraDirection.z)
    }

    updateState() {
        if (this.state.includes('dead')) return;
    
        if (keyStates['KeyW']) {
            this.state = this.crouching ? 'walk' : 'run';
        } else if (keyStates['KeyA'] || keyStates['KeyD'] || keyStates['KeyS']) {
            this.state = 'walk';
        } else {
            this.state = 'idle';
        }
    
        if (this.crouching) {
            this.state += '.crouch';
        }
    
        if (mouseDown[2] || keyStates['KeyC']) {
            this.state += '.ADS';
        }
    }
}