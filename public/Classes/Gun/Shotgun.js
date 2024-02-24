import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'
import { userInterface, audio} from '../../app.js'
import { Gun } from './Gun.js'

export class Shotgun extends Gun {
    constructor(socket, camera, scene, player) {
        super(socket, camera, scene, player)

        this.guns = {
            'S1897': {
                headshot: 30,
                bodyshot: 23,
                range: 3,
                cooldown: 1500,
                reloadTime: 500,

                magazineSize: 8,
                currentAmmo: 8,
                totalAmmo: 10000,
                pellets: 10,
                ammoType: '12 Gauge Ammo'
            },
            'SawedOff': {
                headshot: 70,
                bodyshot: 43,
                range: 3,
                cooldown: 250,
                reloadTime: 1000,

                magazineSize: 2,
                currentAmmo: 2,
                totalAmmo: 10000,
                pellets: 10,
                ammoType: '12 Gauge Ammo'
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
            'S1897': {
                headshot: 30,
                bodyshot: 23,
                range: 3,
                cooldown: 1500,
                reloadTime: 500,

                magazineSize: 8,
                currentAmmo: 8,
                totalAmmo: 10000,
                pellets: 10,
                ammoType: '12 Gauge Ammo'
            },
            'SawedOff': {
                headshot: 70,
                bodyshot: 43,
                range: 3,
                cooldown: 250,
                reloadTime: 1000,

                magazineSize: 2,
                currentAmmo: 2,
                totalAmmo: 10000,
                pellets: 10,
                ammoType: '12 Gauge Ammo'
            }
        }
    }

    shootController(ox, oy, oz) {
        if(this.shotFired) return
        this.shotFired = true
        this.shoot(ox, oy, oz)
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
            audio.playAudio('./Audio/Guns/Shotgun Dry.mp3')
            return
        }
        audio.playAudio('./Audio/Guns/Shotgun Fire-2.mp3')
        super.playAudioForClients('Shotgun Fire-2.mp3')
        super.shoot()

        let damageTotal = 0
        let headshot = false
        let userData = null

        for (let i = 0; i < this.guns[this.type].pellets; i++) {
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
                userData = target.userData
                if(userData.id) {
                    let dam = null
                    let dy = this.intersects[0].point.y - target.position.y

                    let targetPos = target.position
                    let myPos = new THREE.Vector3(...this.player.position)
                    let distance = Math.round(targetPos.distanceTo(myPos))

                    if(dy >= 0.75) {
                        dam = this.guns[this.type].headshot - (distance * this.guns[this.type].range)
                        headshot = true
                    } else {
                        dam = this.guns[this.type].bodyshot - (distance * this.guns[this.type].range)
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
        if(this.reloading || this.guns[this.type].currentAmmo == this.guns[this.type].magazineSize) {
            return
        }
        
        if(this.guns[this.type].totalAmmo <= 0) return
        this.reloading = true

        audio.playAudio('./Audio/Guns/Shotgun Reload.mp3')

        userInterface.reload(this.guns[this.type].reloadTime)

        this.reloadTimeout = setTimeout(() => {
            if (!this.reloading) return
            this.guns[this.type].currentAmmo ++
            if(this.guns[this.type].totalAmmo > 0) this.guns[this.type].totalAmmo --
            this.player.inventory.ammo[this.guns[this.type].ammoType] = this.guns[this.type].totalAmmo
            
            this.reloading = false
            this.updateAmmo()
            if(this.guns[this.type].currentAmmo < this.guns[this.type].magazineSize) {
                this.reload()
            }
        }, this.guns[this.type].reloadTime)
    }
}