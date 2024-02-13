import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'
import { arms, crosshair, mainPlayerArms, audio } from '../app.js'


export class Gun {
    constructor(socket, camera, scene, player) {
        this.socket = socket
        this.camera = camera
        this.scene = scene
        this.player = player
    }

    getCollidableObjects() {
        let array = []
        this.scene.children.forEach((child) => {
           if(child instanceof THREE.Group) {
                if(child.userData.id) {
                    array.push(child)
                }
           } else if(child.name == 'Scene' || child.name == 'Sketchfab_Scene') {
                array.push(child)
           }
        })
        return array
    }

    spread() {
        let multiplayer = 0.002
        return crosshair.dist * multiplayer * 2 * Math.random() - crosshair.dist * multiplayer
    }

    playAudioForClients(url) {
        this.socket.emit('audio', [url, this.player.position])
    }

    playLocalAudio() {

    }
 
    recoil() {
        arms.recoil()
    }

    handleBulletImpact(hitPoint, hitNormal) {
        var markerGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.02);
        var markerMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 /*, opacity: 0.5 + Math.random() * 0.2, transparent: true */ });
        var marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.name = 'bullet-marker'

        marker.position.copy(hitPoint);
        this.scene.add(marker);

        //hitNormal.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2)
    
        marker.lookAt(hitPoint.clone().add(hitNormal));

    
        setTimeout(() => {
            this.scene.remove(marker);
        }, 10000)
    }

    muzzleFlash() {
        const light = new THREE.PointLight( 0xffffff, 5, 100 );
        light.position.copy(this.camera.position)
        light.rotation.copy(this.camera.rotation);
        light.updateMatrix();
        light.translateZ(-0.8);
        light.translateY(-0.1);
        light.translateX(0.1);
        this.scene.add( light );

        mainPlayerArms.addMuzzleFlash()

        setTimeout(() => {
            this.scene.remove( light );
            mainPlayerArms.removeMuzzleFlash()
        }, 200)
    }
}