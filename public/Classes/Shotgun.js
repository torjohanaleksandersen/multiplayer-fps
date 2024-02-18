import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'
import { userInterface, audio} from '../app.js'
import { Gun } from './Gun.js'

export class Shotgun extends Gun {
    constructor(socket, camera, scene, player) {
        super(socket, camera, scene, player)

        this.headshot = 30
        this.bodyshot = 23
        this.range = 3
        this.cooldown = 1500
        this.reloadTime = 500

        this.magazineSize = 8
        this.currentAmmo = this.magazineSize
        this.totalAmmo = 10000
        this.pellets = 10

        this.shotFired = false
        this.reloading = false
        this.reloadTimeout = null
        
    }

    updateAmmo() {
        userInterface.updateAmmo(this.currentAmmo, this.totalAmmo)
    }

    shootController(ox, oy, oz) {
        if(this.shotFired) return
        this.shotFired = true
        this.shoot(ox, oy, oz)
        setTimeout(() => {
            this.shotFired = false
        }, this.cooldown)
    }

    stopReload() {
        userInterface.stopReload()
        clearTimeout(this.reloadTimeout)
    }

    shoot() {
        if(!this.player.state.includes('.ADS') || this.player.state.includes('dead')) {
            if (!this.player.state.includes('crouch')) {
                return
            }
        }
        if(this.reloading) {
            this.stopReload()
        }
        this.reloading = false
        if(this.currentAmmo != 0) {
            this.currentAmmo--;
            this.updateAmmo()
        } else {
            audio.playAudio('./Audio/Guns/Shotgun Dry.mp3')
            return
        }
        audio.playAudio('./Audio/Guns/Shotgun Fire-2.mp3')
        super.playAudioForClients('Shotgun Fire-2.mp3')

        let damageTotal = 0
        let headshot = false
        let gamertag = ''

        for (let i = 0; i < this.pellets; i++) {
            this.ray = new THREE.Raycaster()
            this.cameraDirection = new THREE.Vector3()
            this.camera.getWorldDirection(this.cameraDirection)
            let spread = new THREE.Vector3(super.spread(), super.spread(), super.spread())
            this.direction = this.cameraDirection.clone().add(spread)
            this.cameraPosition = new THREE.Vector3()
            this.camera.getWorldPosition(this.cameraPosition)
            this.ray.set(this.cameraPosition, this.direction)
            this.ray.far = 50

            this.intersects = this.ray.intersectObjects(super.getCollidableObjects())
            this.ray.ray.origin.copy(this.cameraPosition)

            if(this.intersects.length > 0) {
                let target = this.intersects[0].object.parent
                let userData = target.userData
                if(userData.id) {
                    let dam = null
                    let dy = this.intersects[0].point.y - target.position.y

                    let targetPos = target.position
                    let myPos = new THREE.Vector3(...this.player.position)
                    let distance = Math.round(targetPos.distanceTo(myPos))

                    if(dy >= 0.75) {
                        dam = this.headshot - (distance * this.range)
                        headshot = true
                    } else {
                        dam = this.bodyshot - (distance * this.range)
                    }

                    if(dam <= 0) dam = 0
                    damageTotal += dam
                } else {
                    super.handleBulletImpact(this.intersects[0].point, this.intersects[0].normal)
                    
                }
            }   
        }
        if(damageTotal > 0) {
            let color = 'white'
            if(headshot) {
                color = 'yellow'
            }
            this.socket.emit('player-hit', [damageTotal, userData.id, color])
        } 

        super.recoil()
        super.muzzleFlash()
    }

    reload() {
        if(this.reloading || this.currentAmmo == this.magazineSize) {
            return
        }
        this.reloading = true

        audio.playAudio('./Audio/Guns/Shotgun Reload.mp3')

        userInterface.reload(this.reloadTime)

        this.reloadTimeout = setTimeout(() => {
            if(!this.reloading || this.totalAmmo <= 0) return
            this.currentAmmo ++
            
            this.reloading = false
            this.updateAmmo()
            if(this.currentAmmo < this.magazineSize) {
                this.reload()
            }
        }, this.reloadTime)
    }
}