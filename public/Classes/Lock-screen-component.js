import { FirstPersonCamera } from "../World/WorldObjects/first-person-camera.js";
import { settingsChanges } from "../app.js";

export class LockScreen {
    constructor(camera, renderer) {
        this.controls = new FirstPersonCamera(camera, renderer).controls
        this.DOM = {
            lockscreen : document.querySelector('.lock-screen'),
            backToGameButton : document.querySelector('.back-to-game'),
            pause: document.querySelector('.pause-container'),
            settings: document.querySelector('.settings-container'),
            settingsButton: document.querySelector('.settings'),
            back: document.querySelector('.back-pause')
        }
        this.locked = false
        this.gameStartet = false
        document.addEventListener('mousedown', (e) => {
            if(e.button == 0 && !this.gameStartet) {
                this.controls.lock()
                this.gameStartet = true
            }
        })

        this.DOM.backToGameButton.addEventListener('click', () => {
            this.controls.lock()
        })

        this.DOM.settingsButton.addEventListener('click', () => {
            this.changeScreen('settings')
        })

        this.DOM.back.addEventListener('click', () => {
            this.applySettings()
            this.changeScreen('pause')
        })
    }

    applySettings() {
        let name = document.querySelector('.name-input')
        if(name.value.length != 0) settingsChanges(name.value)

        let sensitivity = document.querySelector('.sens-slider').value
        let sens = sensitivity / 100
        console.log(sens)
        this.controls.pointerSpeed = sens
    }

    changeScreen(screen) {
        if(screen == 'settings') {
            this.DOM.pause.style.display = 'none'
            this.DOM.settings.style.display = 'flex'
        } else if(screen == 'pause') {
            this.DOM.pause.style.display = 'flex'
            this.DOM.settings.style.display = 'none'
        }
    }

    update() {
        this.locked = this.controls.isLocked
        if (!this.controls.isLocked && this.gameStartet) {
            this.DOM.lockscreen.style.display = 'block'
            document.querySelector('.sens-value').innerText = document.querySelector('.sens-slider').value
        } else {
            this.DOM.lockscreen.style.display = 'none'
        }
    }
}