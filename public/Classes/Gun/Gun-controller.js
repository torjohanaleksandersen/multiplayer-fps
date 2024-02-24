import { mouseDown, keyStates } from '../../World/WorldObjects/handle-keydown.js'
import { userSettings, lockscreen, userInterface } from '../../app.js'
import { AssaultRifle } from './AssaultRifle.js'
import { Shotgun } from './Shotgun.js'

export class GunController {
    constructor(socket, camera, scene, player) {
        this.player = player

        this.assaultRifle = new AssaultRifle(socket, camera, scene, player)
        this.shotgun = new Shotgun(socket, camera, scene, player)
        this.guns = {
            'M416': this.assaultRifle,
            'AKM': this.assaultRifle,
            'S1897': this.shotgun,
            'SawedOff': this.shotgun
        }
        this.activeGun = null
    }

    resetUserData() {
        if(!this.activeGun) return
        this.activeGun.resetUserData()
    }

    changeGun(key) {
        this.stopReload()
        this.activeGun = this.guns[key]
        this.activeGun.type = key
        this.activeGun.updateAmmo()
    }

    stopReload() {
        if(!this.activeGun) return
        if(this.activeGun.reloading) {
            this.activeGun.stopReload()
        }
    }

    updateAmmo() {
        if(!this.activeGun) return
        this.activeGun.updateAmmo()
    }

    resetAmmo() {
        userInterface.updateAmmo(0, 0)
    }

    update() {
        if(!this.activeGun || !lockscreen.locked) return
        if(mouseDown[0] || keyStates['KeyJ']) {
            if(!userSettings['ADS-required']) {
                if(this.player.state.includes('dead')) {
                    if (!this.player.state.includes('crouch')) {
                        return
                    }
                }
                this.activeGun.shootController()
            } else {
                if(!this.player.state.includes('.ADS') || this.player.state.includes('dead')) {
                    if (!this.player.state.includes('crouch')) {
                        return
                    }
                }
                this.activeGun.shootController()
            }
        }
    }

    reload() {
        if(!this.activeGun) return
        this.activeGun.reload()
    }
}