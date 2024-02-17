import { mouseDown, keyStates } from '../World/WorldObjects/handle-keydown.js'
import { AssaultRifle } from './AssaultRifle.js'
import { Shotgun } from './Shotgun.js'

export class GunController {
    constructor(socket, camera, scene, player) {

        this.assaultRifle = new AssaultRifle(socket, camera, scene, player)
        this.shotgun = new Shotgun(socket, camera, scene, player)
        this.guns = {
            'M416': this.assaultRifle,
            'S1897': this.shotgun
        }
        this.activeGun = this.assaultRifle
    }

    changeGun(key) {
        this.stopReload()
        this.activeGun = this.guns[key]
        this.activeGun.updateAmmo()
    }

    stopReload() {
        if(this.activeGun.reloading) {
            this.activeGun.stopReload()
        }
    }

    updateAmmo() {
        this.activeGun.updateAmmo()
    }

    update() {
        if(mouseDown[0] || keyStates['KeyJ']) {
            this.activeGun.shootController()
        }
    }

    reload() {
        this.activeGun.reload()
    }
}