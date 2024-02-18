import { FBXLoader } from "../World/WorldObjects/FBXLoader/FBXLoader.js"

export class Arms {
    constructor(scene, camera) {
        this.scene = scene
        this.camera = camera
        this.component = null

        this.changingWeapon = false

        this.dz = 0
        this.dy = 0

        this.offsetValues = {
            aimingNoCrouch : {
                x: 0,
                y: -0.8,
                z: 0
            },
            crouch : {
                x: 0,
                y: -0.6,
                z: 0.05
            },
            noAction : {
                x: 0,
                y: -0.7,
                z: 0.1
            }
        }

        this.offset = {
            x: null,
            y: null,
            z: null
        }

        this.lastState = ''
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

    changeAction(state) {
        let o = null;
        if (state.includes('.ADS') && !state.includes('.crouch')) {
            o = this.offsetValues.aimingNoCrouch;
        } else if (state.includes('.crouch')) {
            o = this.offsetValues.crouch;
        } else {
            o = this.offsetValues.noAction;
        }

        let lastOffset = null;
        if (state !== this.lastState) {
            if (this.lastState.includes('.ADS') && !this.lastState.includes('.crouch')) {
                lastOffset = this.offsetValues.aimingNoCrouch;
            } else if (this.lastState.includes('.crouch')) {
                lastOffset = this.offsetValues.crouch;
            } else {
                lastOffset = this.offsetValues.noAction;
            }
        } else {
            lastOffset = o
        }

        this.lastState = state;
    
        let dx = o.x - lastOffset.x;
        let dy = o.y - lastOffset.y;
        let dz = o.z - lastOffset.z;
    
        let timeElapsed = 0;
        let time = 200;
    
        let interval = setInterval(() => {
            timeElapsed += 10;
            let xElapsed = lastOffset.x + (dx / time * timeElapsed);
            let yElapsed = lastOffset.y + (dy / time * timeElapsed);
            let zElapsed = lastOffset.z + (dz / time * timeElapsed);
    
            this.offset = {
                x: xElapsed,
                y: yElapsed,
                z: zElapsed
            };
    
            if (timeElapsed >= time) {
                clearInterval(interval);
            }
        }, 10);
    }
    

    update() {
        if(!this.component) return
        this.component.position.copy(this.camera.position);
        this.component.rotation.copy(this.camera.rotation);
        this.component.updateMatrix();
        this.component.rotateY(Math.PI)

        this.component.translateZ(this.offset.z + this.dz);
        this.component.translateY(this.offset.y + this.dy);
        this.component.translateX(this.offset.x);
    }
}
