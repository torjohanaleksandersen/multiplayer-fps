import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'
import { userInterface} from '../../app.js'
import { Gun } from './Gun.js'
import { audio } from '../../app.js'

export class AssaultRifle extends Gun {
    constructor(socket, camera, scene, player) {
        super(socket, camera, scene, player)

        this.guns = {
            'M416': {
                headshot: 54,
                bodyshot: 27,
                range: 0.5,
                cooldown: 250,
                reloadTime: 2500,

                magazineSize: 30,
                currentAmmo: 30,
                totalAmmo: this.player.inventory.ammo['5.56mm Ammo'],
                ammoType: '5.56mm Ammo'
            },
            'AKM': {
                headshot: 65,
                bodyshot: 35,
                range: 0.4,
                cooldown: 275,
                reloadTime: 3000,

                magazineSize: 30,
                currentAmmo: 30,
                totalAmmo: this.player.inventory.ammo['7.62mm Ammo'],
                ammoType: '7.62mm Ammo'
            }
        }

        this.shotFired = false
        this.reloading = false
        this.reloadTimeout = null
        
        this.type = ''
    }

    updateAmmo() {
        this.guns[this.type].totalAmmo = this.player.inventory.ammo[this.guns[this.type].ammoType]
        userInterface.updateAmmo(this.guns[this.type].currentAmmo, this.guns[this.type].totalAmmo)
    }

    resetUserData() {
        this.guns = {
            'M416': {
                headshot: 54,
                bodyshot: 27,
                range: 0.5,
                cooldown: 250,
                reloadTime: 2500,

                magazineSize: 30,
                currentAmmo: 30,
                totalAmmo: this.player.inventory.ammo['5.56mm Ammo'],
                ammoType: '5.56mm Ammo'
            },
            'AKM': {
                headshot: 65,
                bodyshot: 35,
                range: 0.4,
                cooldown: 275,
                reloadTime: 3000,

                magazineSize: 30,
                currentAmmo: 30,
                totalAmmo: this.player.inventory.ammo['7.62mm Ammo'],
                ammoType: '7.62mm Ammo'
            }
        }
    }

    shootController() {
        if(this.shotFired) return
        this.shotFired = true
        this.shoot()
        setTimeout(() => {
            this.shotFired = false
        }, this.guns[this.type].cooldown)
    }

    stopReload() {
        userInterface.stopReload()
        clearTimeout(this.reloadTimeout)
    }

    shoot() {
        if(this.reloading) {
            this.stopReload()
        }
        this.reloading = false
        if(this.guns[this.type].currentAmmo != 0) {
            this.guns[this.type].currentAmmo--;
            this.updateAmmo()
        } else {
            audio.playAudio('./Audio/Guns/Assault Rifle Dry.mp3')
            return
        }
        audio.playAudio('./Audio/Guns/Assault Rifle Fire.mp3')
        super.playAudioForClients('Assault Rifle Fire.mp3')
        super.shoot()
        
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

                let color = 'white'

                if(dy >= 0.75) {
                    dam = this.guns[this.type].headshot - (distance * this.guns[this.type].range)
                    color = 'yellow'
                } else {
                    dam = this.guns[this.type].bodyshot - (distance * this.guns[this.type].range)
                }

                if(dam <= 0) dam = 0
                
                this.socket.emit('player-hit', [dam, userData.id, color])
            } else {
                super.handleBulletImpact(this.intersects[0].point, this.intersects[0].normal)
                
            }
        }
        super.recoil()
        super.muzzleFlash()
    }

    reload() {
        if(this.reloading || this.guns[this.type].currentAmmo == this.guns[this.type].magazineSize) {
            return
        }
        this.reloading = true

        userInterface.reload(this.guns[this.type].reloadTime)

        this.reloadTimeout = setTimeout(() => {
            if(!this.reloading) return
            const ammoNeeded = this.guns[this.type].magazineSize - this.guns[this.type].currentAmmo;
            if (this.guns[this.type].totalAmmo >= ammoNeeded) {
                this.guns[this.type].totalAmmo -= ammoNeeded;
                this.guns[this.type].currentAmmo = this.guns[this.type].magazineSize;
                this.player.inventory.ammo[this.guns[this.type].ammoType] = this.guns[this.type].totalAmmo
            } else {
                this.guns[this.type].currentAmmo += this.guns[this.type].totalAmmo;
                this.guns[this.type].totalAmmo = 0;
                this.player.inventory.ammo[this.guns[this.type].ammoType] = this.guns[this.type].totalAmmo
            }
            this.updateAmmo()
        }, this.guns[this.type].reloadTime)
    }
}

