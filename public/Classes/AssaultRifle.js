import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'
import { userInterface} from '../app.js'
import { Gun } from './Gun.js'
import { audio } from '../app.js'

export class AssaultRifle extends Gun {
    constructor(socket, camera, scene, player) {
        super(socket, camera, scene, player)

        this.headshot = 54
        this.bodyshot = 27
        this.range = 0.5
        this.cooldown = 250
        this.reloadTime = 3000

        this.magazineSize = 30
        this.currentAmmo = this.magazineSize
        this.totalAmmo = 10000

        this.shotFired = false
        this.reloading = false
        this.reloadTimeout = null
        
    }

    updateAmmo() {
        userInterface.updateAmmo(this.currentAmmo, this.totalAmmo)
    }

    shootController() {
        if(this.shotFired) return
        this.shotFired = true
        this.shoot()
        setTimeout(() => {
            this.shotFired = false
        }, this.cooldown)
    }

    stopReload() {
        userInterface.stopReload()
        clearTimeout(this.reloadTimeout)
    }

    shoot() {
        if(!this.player.state.includes('.ADS') || this.player.state.includes('dead') ) {
            if(!this.player.state.includes('.crouch')) {
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
            audio.playAudio('./Audio/Guns/Assault Rifle Dry.mp3')
            return
        }
        audio.playAudio('./Audio/Guns/Assault Rifle Fire.mp3')
        super.playAudioForClients('Assault Rifle Fire.mp3')
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
            let gamertag = target.gamerTag
            if(gamertag) {
                let dam = null
                let dy = this.intersects[0].point.y - target.position.y

                let targetPos = target.position
                let myPos = new THREE.Vector3(...this.player.position)
                let distance = Math.round(targetPos.distanceTo(myPos))

                let color = 'white'

                if(dy >= 0.75) {
                    dam = this.headshot - (distance * this.range)
                    color = 'yellow'
                } else {
                    dam = this.bodyshot - (distance * this.range)
                }

                if(dam <= 0) dam = 0
                
                this.socket.emit('player-hit', [dam, gamertag, color])
            } else {
                super.handleBulletImpact(this.intersects[0].point, this.intersects[0].normal)
                
            }
        }
        super.recoil()
        super.muzzleFlash()
    }

    reload() {
        if(this.reloading || this.currentAmmo == this.magazineSize) {
            return
        }
        this.reloading = true

        userInterface.reload(this.reloadTime)

        this.reloadTimeout = setTimeout(() => {
            if(!this.reloading) return
            const ammoNeeded = this.magazineSize - this.currentAmmo;
            if (this.totalAmmo >= ammoNeeded) {
                this.totalAmmo -= ammoNeeded;
                this.currentAmmo = this.magazineSize;
            } else {
                this.currentAmmo += this.totalAmmo;
                this.totalAmmo = 0;
            }
            this.updateAmmo()
        }, this.reloadTime)
    }
}

