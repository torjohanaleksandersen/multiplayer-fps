import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'
import { Octree } from './WorldObjects/Octree.js'
import { Capsule } from './WorldObjects/Capsule.js'
import { GLTFLoader } from './WorldObjects/GLTFLoader.js'
import { Player } from '../Classes/Player.js'
import { keyStates } from './WorldObjects/handle-keydown.js'

export class World {
    constructor(scene, camera, renderer) {
        this.scene = scene
        this.camera = camera
        this.renderer = renderer
        this.initialized = false

        this.player = new Player(this.camera)
    }

    get Player() {
        return this.player
    }

    initialize() {
        this.initVisuals()
    }

    initVisuals() {
        this.clock = new THREE.Clock();
        this.scene.background = new THREE.Color( 0x88ccee );
        this.scene.fog = new THREE.Fog( 0x88ccee, 0, 50 );

        const fillLight1 = new THREE.HemisphereLight( 0x8dc1de, 0x00668d, 1.5 );
        fillLight1.position.set( 2, 1, 1 );
        this.scene.add( fillLight1 );

        const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
        directionalLight.position.set( - 5, 25, - 1 );
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.01;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.right = 30;
        directionalLight.shadow.camera.left = - 30;
        directionalLight.shadow.camera.top	= 30;
        directionalLight.shadow.camera.bottom = - 30;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.radius = 4;
        directionalLight.shadow.bias = - 0.00006;
        this.scene.add( directionalLight );


        const container = document.getElementById( 'container' );

        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.VSMShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        container.appendChild( this.renderer.domElement );

        this.renderMap()
    }

    initPhysics() { 
        this.GRAVITY = 30;
        this.STEPS_PER_FRAME = 5;

        this.playerCollider = new Capsule( new THREE.Vector3( 0, 0.35, 0 ), new THREE.Vector3( 0, 1, 0 ), 0.35 );

        this.playerVelocity = new THREE.Vector3();
        this.playerDirection = new THREE.Vector3();

        this.playerOnFloor = false;

        this.initialized = true

        this.animate()
    }

    playerCollisions() {
        const result = this.worldOctree.capsuleIntersect( this.playerCollider );
        this.playerOnFloor = false;
    
        if ( result ) {
            this.playerOnFloor = result.normal.y > 0;
    
            if ( ! this.playerOnFloor ) {
                this.playerVelocity.addScaledVector( result.normal, - result.normal.dot( this.playerVelocity ) );
            }
    
            this.playerCollider.translate( result.normal.multiplyScalar( result.depth ) );
        }
    }
    
    updatePlayer( deltaTime ) {
    
        let damping = Math.exp( - 4 * deltaTime ) - 1;
    
        if ( ! this.playerOnFloor ) {
            this.playerVelocity.y -= this.GRAVITY * deltaTime;
            // small air resistance
            damping *= 0.1;
        }
    
        this.playerVelocity.addScaledVector( this.playerVelocity, damping );
    
        const deltaPosition = this.playerVelocity.clone().multiplyScalar( deltaTime );
        this.playerCollider.translate( deltaPosition );
    
        this.playerCollisions();
    
        this.camera.position.copy( this.playerCollider.end );
    
    }
    
    getForwardVector() {
    
        this.camera.getWorldDirection( this.playerDirection );
        this.playerDirection.y = 0;
        this.playerDirection.normalize();
    
        return this.playerDirection;
    
    }
    
    getSideVector() {
    
        this.camera.getWorldDirection( this.playerDirection );
        this.playerDirection.y = 0;
        this.playerDirection.normalize();
        this.playerDirection.cross( this.camera.up );
    
        return this.playerDirection;
    
    }
    
    controls( deltaTime ) {
        if(this.player.state == 'dead') return
        
        this.speed = this.player.speed
    
        // gives a bit of air control
        const speedDelta = deltaTime * ( this.playerOnFloor ? this.speed : this.speed / 3 );
    
        if ( keyStates[ 'KeyW' ] ) {

            if(this.Player.state && this.player.state.includes('run')) {
                this.playerVelocity.add( this.getForwardVector().multiplyScalar( speedDelta * 2 ) );
            } else {
                this.playerVelocity.add( this.getForwardVector().multiplyScalar( speedDelta ) );
            }
    
        }
    
        if ( keyStates[ 'KeyS' ] ) {
    
            this.playerVelocity.add( this.getForwardVector().multiplyScalar( - speedDelta ) );
    
        }
    
        if ( keyStates[ 'KeyA' ] ) {
    
            this.playerVelocity.add( this.getSideVector().multiplyScalar( - speedDelta ) );
    
        }
    
        if ( keyStates[ 'KeyD' ] ) {
    
            this.playerVelocity.add( this.getSideVector().multiplyScalar( speedDelta ) );
    
        }
    
        if ( this.playerOnFloor ) {
    
            if ( keyStates[ 'Space' ] ) {
    
                this.playerVelocity.y = this.player.jumpForce;
    
            }
    
        }
    
    }

    renderMap() {
        this.worldOctree = new Octree();

        const loader = new GLTFLoader()

        loader.load( './World/WorldObjects/de_dust_2_with_real_light.glb', ( gltf ) => {
        
            let s = 0.7
            gltf.scene.scale.set(s, s, s)
            this.map = gltf.scene
            this.map.position.set(-5, -5, 0)
            this.scene.add( gltf.scene );
        
            this.worldOctree.fromGraphNode( gltf.scene );
        
            gltf.scene.traverse( child => {
        
                if ( child.isMesh ) {  
                    /*
                    var newMaterial = new THREE.MeshStandardMaterial();
            
                    // Copy over relevant properties from the original material
                    newMaterial.map = child.material.map; // Copy texture
                    newMaterial.color = child.material.color; // Copy color
                    
                    // Customize the cloned material properties
                    newMaterial.metalness = 0; // Example metalness
                    newMaterial.roughness = 0.1; // Example roughness

                    // Assign the new material to the mesh
                    child.material = newMaterial;
                    */
    
                    if ( child.material.map ) {
        
                        child.material.map.anisotropy = 4;
        
                    }
        
                }
        
            } );

            this.initPhysics()
        
        } );
    }

    
    teleportPlayerIfOob() {

        if ( this.camera.position.y <= - 25 ) {

            this.playerCollider.start.set( 0, 0.35, 0 );
            this.playerCollider.end.set( 0, 1, 0 );
            this.playerCollider.radius = 0.35;
            this.camera.position.copy( this.playerCollider.end );
            this.camera.rotation.set( 0, 0, 0 );

        }

    }
    

    resetPlayerPosition() {
        this.playerCollider.start.set( 0, 0.35, 0 );
        this.playerCollider.end.set( 0, 1, 0 );
        this.playerCollider.radius = 0.35;
        this.camera.position.copy( this.playerCollider.end );
        this.camera.rotation.set( 0, 0, 0 );
        this.player.resetUserdata()
    }

    animate() {
        if(!this.initialized) return

        const deltaTime = Math.min( 0.05, this.clock.getDelta() ) / this.STEPS_PER_FRAME;

        for ( let i = 0; i < this.STEPS_PER_FRAME; i ++ ) {

            this.controls( deltaTime );

            this.updatePlayer( deltaTime );

        }

        this.player.position = [this.playerCollider.start.x, this.playerCollider.start.y, this.playerCollider.start.z]
    }

}