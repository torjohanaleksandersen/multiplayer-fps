import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'
import { GLTFLoader } from '../../World/WorldObjects/GLTFLoader.js';
import { gun } from '../../app.js';

export class PickupableManager {
    constructor(socket, scene, camera, player) {
        this.socket = socket
        this.scene = scene
        this.camera = camera
        this.player = player

        this.pickupables = []
        this.ray = null

        this.divFlag = false
        this.target = false

        this.info = {
            'M416': {
                scale: 0.075,
                hitbox: [0.75, 0.5, 0.5],
                rotation: [Math.PI / 2, 0, 0],
                position: [0, 0.01, 0]
            },
            'AKM': {
                scale: 0.075,
                hitbox: [0.75, 0.5, 0.5],
                rotation: [Math.PI / 2, 0, 0],
                position: [0, 0.01, 0]
            },
            'S1897': {
                scale: 0.075,
                hitbox: [0.75, 0.5, 0.5],
                rotation: [Math.PI / 2, 0, 0],
                position: [0, 0.01, 0]
            },
            'SawedOff': {
                scale: 0.075,
                hitbox: [0.75, 0.5, 0.5],
                rotation: [Math.PI / 2, 0, 0],
                position: [0, 0.01, 0]
            },
            '7.62mm Ammo': {
                amount: 30,
                hitbox: [0.25, 0.5, 0.25],
                scale: 0.5,
                rotation: [0, 0, 0],
                position: [0, 0.03, 0]
            },
            '12 Gauge Ammo': {
                amount: 12,
                hitbox: [0.25, 0.5, 0.25],
                scale: 0.5,
                rotation: [0, 0, 0],
                position: [0, 0.05, 0]
            }
        }

        this.socket.on('pick-up-confirmed', () => {
            this.pickupItem()
        })
        
        this.socket.on('pickupable-removed', data => {
            this.removeItem(data)
        })
        

        this.sendRay()
    }

    deleteAllPickupables() {
        // Iterate through pickupables array
        for (let i = this.pickupables.length - 1; i >= 0; i--) {
            const pickupable = this.pickupables[i];
            // Remove gun mesh model
            if (pickupable.userData.model) {
                this.scene.remove(pickupable.userData.model);
            }
            // Remove hitbox mesh
            this.scene.remove(pickupable);
            // Remove from pickupables array
            this.pickupables.splice(i, 1);
        }
    }
    
    
    



    removeItem(data) {
        const [position, gun] = data
        for (let i = 0; i < this.pickupables.length; i++) {
            const mesh = this.pickupables[i];
            if(mesh.userData.name == gun) {
                const isEqual = position[0] === mesh.position.x && position[1] === mesh.position.y && position[2] === mesh.position.z;
                if(isEqual) {
                    const index = this.pickupables.indexOf(mesh);
                    if (index !== -1) { 
                        this.scene.remove(this.pickupables[index]);
                        this.scene.remove(this.pickupables[index].userData.model)
                        this.pickupables.splice(index, 1);
                    }
                }
            }
            
        }
    }
    
    addPickupableDiv(model) {
        const pickupDiv = document.querySelector('.item-pickup')
        const gunDiv = document.getElementById('gun-pickup')
        if(gunDiv.innerText != model)
        this.removePickupableDiv()
        if(this.divFlag) return
        this.divFlag = true

        gunDiv.innerText = model
        pickupDiv.style.opacity = 1
    }

    removePickupableDiv() {
        if(!this.divFlag) return
        this.divFlag = false
        const pickupDiv = document.querySelector('.item-pickup')
        const gunDiv = document.getElementById('gun-pickup')
        gunDiv.innerText = 'tmp'
        pickupDiv.style.opacity = 0
    }

    renderItem(model, position) {
        const geometry = new THREE.BoxGeometry( ...this.info[model].hitbox );
        const material = new THREE.MeshBasicMaterial( { color: 0xffff00, opacity: 0, transparent: true } );
        const mesh = new THREE.Mesh( geometry, material );
        mesh.position.set(...position)
        this.scene.add(mesh)

        const loader = new GLTFLoader()
        let url = './Guns/' + model + '.glb'
        loader.load(url, (gltf) => {
            const object = gltf.scene
            object.scale.set(this.info[model].scale, this.info[model].scale, this.info[model].scale)
            object.rotation.set(...this.info[model].rotation)
            const pos = [];
            for (let i = 0; i < position.length; i++) {
                pos.push(position[i] + this.info[model].position[i]);
            }
            object.position.set( ...pos );
            this.scene.add(object)
            mesh.userData.name = model
            mesh.userData.model = object
            mesh.userData.type = 'pickupable'
            this.pickupables.push(mesh)
        })
    }

    addPickupableToWorld(model, position) {
        this.renderItem(model, position)
    }

    pickupItemRequestToServer() {
        if (!this.target) return;
        let model = ''
        const index = this.pickupables.indexOf(this.target);
        if (index !== -1) {
            model = this.pickupables[index].userData.name
        }
        let position = [this.target.position.x, this.target.position.y, this.target.position.z]

        if(this.player.inventory.guns.length >= this.player.maxGuns && !model.includes('Ammo')) return
        this.socket.emit('pick-up-item-request', [position, model])
    }

    pickupItem() {
        if (!this.target) return;
        if(!this.target.userData.name.includes('Ammo')) {
            let gun = ''
            const index = this.pickupables.indexOf(this.target);
            if (index !== -1) {
                this.scene.remove(this.pickupables[index]);
                this.scene.remove(this.pickupables[index].userData.model)
                gun = this.pickupables[index].userData.name
                this.pickupables.splice(index, 1);
            }
            this.target = null;

            this.player.inventory.guns.push(gun)
        } 
        
        else {
            let name = this.target.userData.name
            let position = this.target.position
            let pos = [position.x, position.y, position.z]

            this.removeItem([pos, name])

            this.player.inventory.ammo[name] += this.info[name].amount
            gun.updateAmmo()
        }
    }

    updateUI() {
        let parent = document.querySelector('.item-displayer')
        for (let i = 0; i < parent.children.length; i++) {
            if(this.player.inventory.guns[i]) {
                const element = this.player.inventory.guns[i];
                parent.children[i].style.opacity = 1
                parent.children[i].querySelector('img').src = './Images/' + element + '.webp'
            } else {
                parent.children[i].style.opacity = 0
            }
        }
    }

    sendRay() {
        if(this.pickupables.length == 0) return
        this.ray = new THREE.Raycaster()
        this.cameraDirection = new THREE.Vector3()
        this.camera.getWorldDirection(this.cameraDirection)
        this.direction = this.cameraDirection.clone()
        this.cameraPosition = new THREE.Vector3()
        this.camera.getWorldPosition(this.cameraPosition)
        this.ray.set(this.cameraPosition, this.direction)
        this.ray.far = 2

        this.intersects = this.ray.intersectObjects(this.pickupables)
        this.ray.ray.origin.copy(this.cameraPosition)

        if(this.intersects.length > 0) {
            let t = this.intersects[0].object
            return t
        } else {
            return false
        }
    }

    update() {
        this.target = this.sendRay()
        if(this.target) {
            this.addPickupableDiv(this.target.userData.name)
        } else {
            this.removePickupableDiv()
        }
        this.updateUI()
    }
}