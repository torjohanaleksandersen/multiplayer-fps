import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'
import { GLTFLoader } from '../../World/WorldObjects/GLTFLoader.js'

let gunPath = {
    'M416': 'M416.glb',
    'AKM': 'AKM.glb',
    'S1897': 'S1897.glb',
    'SawedOff': 'SawedOff.glb'
}

let gunStates = {
    'offsets': {
        'idle': {
            rot: [Math.PI / 1.4, 0, Math.PI * 1.45]
        },
        'walk': {
            rot: [Math.PI / 1.7, 0, Math.PI * 1.5]
        },
        'run': {
            rot: [Math.PI / 1.5, 0, Math.PI * 1.5]
        },
    
        'idle.ADS': {
            rot: [Math.PI / 1.4, 0, Math.PI * 1.5]
        },
    
        'walk.ADS': {
            rot: [Math.PI / 1.4, 0, Math.PI * 1.5]
        },
    
        'run.ADS': {
            rot: [Math.PI / 1.4, 0, Math.PI * 1.5]
        },


        'idle.crouch': {
            rot: [Math.PI / 1.4, 0, Math.PI * 1.5]
        },
        'walk.crouch': {
            rot: [Math.PI / 1.4, 0, Math.PI * 1.5]
        },
        'run.crouch': {
            rot: [Math.PI / 1.4, 0, Math.PI * 1.5]
        },
    
        'idle.crouch.ADS': {
            rot: [Math.PI / 1.4, 0, Math.PI * 1.5]
        },
    
        'walk.crouch.ADS': {
            rot: [Math.PI / 1.4, 0, Math.PI * 1.5]
        },
    
        'run.crouch.ADS': {
            rot: [Math.PI / 1.4, 0, Math.PI * 1.5]
        },
    },
    'M416': {
        'pos': [2, 0, 5],
    },
    'S1897': {
        'pos': [10, 0, 5]
    },
    'AKM': {
        'pos': [2, 0, 5],
    },
    'SawedOff': {
        'pos': [7, 0, 5]
    }
    
}

export class GunAttacher {
    constructor(character) {
        this.character = character
        this.gun = null
        this.gunString = ''
        this.tmpState = ''
    }

    findHand() {
        this.skeleton = new THREE.SkeletonHelper( this.character )
        this.hand = null
        this.skeleton.bones.forEach(bone => {
            if(bone.name == 'mixamorigRightHandMiddle1') {
                this.hand = bone
            }
        })

        return this.hand
    }

    attachGun(gun) {
        this.detachGun()
        this.gunString = gun

        const loader = new GLTFLoader()
        loader.setPath('./Guns/')
        loader.load(gunPath[gun], (gltf) => {
            const model = gltf.scene
            model.scale.set(15, 15, 15)
            model.rotation.set(Math.PI / 1.4, 0, Math.PI * 1.45)
            model.position.set(2, 0, 5)
            this.gun = model

            this.findHand().add(model)
            this.initializeMuzzleFlash()
            this.updateFromPlayerState(this.tmpState)
        })
    }

    initializeMuzzleFlash() {
        const geometry = new THREE.PlaneGeometry( 50, 50 );
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('./Images/muzzle-flash-img-3.png');

        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });

        this.muzzleFlashMesh = new THREE.Mesh( geometry, material );
        
        this.muzzleFlashMesh.position.set(12, 35, -38)
        this.muzzleFlashMesh.rotation.x = 0.7
        this.muzzleFlashMesh.visible = false
        this.findHand().add( this.muzzleFlashMesh );
    }

    addMuzzleFlash() {
        this.muzzleFlashMesh.rotation.z = Math.random() * 2 * Math.PI
        if(this.gunString == 'M416') {
            this.muzzleFlashMesh.position.set(12, 35, -38)
        } else if (this.gunString == 'S1897') {
            this.muzzleFlashMesh.position.set(12, 41, -46)
        }
        this.muzzleFlashMesh.visible = true
    }
    removeMuzzleFlash() {
        if(!this.muzzleFlashMesh) return
        this.muzzleFlashMesh.visible = false
    }

    detachGun() {
        if(!this.gun) return
        this.gun.parent.remove(this.gun)
        this.gun = null
    }

    updateFromPlayerState(state) {
        this.tmpState = state
        if(!this.gun || !this.tmpState) return
        if(state.includes("dead")) return
        this.gun.position.set(...gunStates[this.gunString]['pos'])
        this.gun.rotation.set(...gunStates['offsets'][state].rot)
    }
}