import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'
import { keyStates, mouseDown } from '../World/WorldObjects/handle-keydown.js'

export class Player {
    constructor(camera) {
        this.camera = camera
        this.radius = 0.35
        this.height = 0.40
        this.position = [0, 0, 0]
        this.kills = 0
        this.health = 100
        this.yRotation = 0
        this.state = 'idle'
        this.inHand = 'M416'
        this.aiming = false
        this.speed = 9
        this.jumpForce = 6
    }

    resetUserdata() {
        this.health = 100
        this.state = 'idle'
        this.aiming = false
    }

    walk() {
        console.log('i am so cool')
    }

    update() {
        this.updateState()
        
        if(this.state == 'dead') return
        const cameraDirection = new THREE.Vector3()
        this.camera.getWorldDirection(cameraDirection).normalize()

        this.yRotation = Math.atan2(cameraDirection.x, cameraDirection.z)
    }

    updateState() {
        if(this.state == 'dead') return

        if(keyStates['KeyW']) {
            if(keyStates['ShiftLeft']) {
                this.state = 'run'
            } else {
                this.state = 'walk'
            }
        } else if(keyStates['KeyA'] || keyStates['KeyD'] || keyStates['KeyS']) {
            this.state = 'walk'
        } else {
            this.state = 'idle'
        }

        if(mouseDown[2] || keyStates['KeyC']) {
            if(this.state.includes('.')) {
                this.state.split('.')[1] = 'ADS'
            } else {
                this.state += '.ADS'
            }
        } else {
            this.state = this.state.split('.')[0]
        }
    }
}