import { FBXLoader } from "../World/WorldObjects/FBXLoader/FBXLoader.js"

export class Arms {
    constructor(scene, camera) {
        this.scene = scene
        this.camera = camera
        this.component = null

        this.changingWeapon = false

        this.dz = 0
        this.dy = 0
    }

    initialize() {
        const loader = new FBXLoader()
        loader.setPath('./Characters/')
        loader.load('fps-arms.fbx', (fbx) => {
            fbx.scale.setScalar(0.005)
            this.component = fbx
            this.scene.add(this.component)
        })
    }

    recoil() {
        let time = 0
        this.dz = - 0.1 / 2
        let interval = setInterval(() => {
            if(time >= 1000) {
                clearInterval(interval)
                this.dz = 0
                return
            }
            time += 100
            this.dz += 0.005 / 2

        }, 10)
    }

    changeAction(type, dir) {
        let origin = 0, direction = 0
        if(type == 'crouch') {
            if (dir == 'down') {

            } else if(dir == 'up') {

            }
        }
        let timeElapsed = 0
        let interval = setInterval(() => {
            timeElapsed += 10

            if (timeElapsed >= 200) {
                clearInterval(interval)
                return
            }
        }, 10)
    }

    changeWeapon() {
        if(this.changingWeapon) return
        this.changingWeapon = true
        let time = 0
        let interval = setInterval(() => {
            if(time >= 1000) {
                clearInterval(interval)
                this.changingWeapon = false
                this.dy = 0
                return
            }
            time += 10
            if(time < 500) {
                this.dy -= 0.005
            } else {
                this.dy += 0.005
            }

        }, 10)
    }

    update(state) {
        
        if(!this.component) return
        this.component.position.copy(this.camera.position);
        this.component.rotation.copy(this.camera.rotation);
        this.component.updateMatrix();
        this.component.rotateY(Math.PI)
        

        if(state.includes('.ADS') && !state.includes('.crouch')) {
            this.component.translateZ(0 + this.dz);
            this.component.translateY(-0.8 + this.dy);
            this.component.translateX(0);
        } else if (state.includes('.crouch')) {
            this.component.translateZ(0.05 + this.dz);
            this.component.translateY(-0.6 + this.dy);
            this.component.translateX(0);
        }  else {
            this.component.translateZ(0.1 + this.dz);
            this.component.translateY(-0.7 + this.dy);
            this.component.translateX(0);
        }
    }
}
