import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js'
import { Octree } from './WorldObjects/Octree.js'
import { Capsule } from './WorldObjects/Capsule.js'
import { GLTFLoader } from './WorldObjects/GLTFLoader.js'
import { Player } from '../Classes/Player.js'
import { keyStates } from './WorldObjects/handle-keydown.js'
import { lockscreen } from '../app.js'

export class World {
    constructor(scene, camera, renderer) {
        this.scene = scene
        this.camera = camera
        this.renderer = renderer
        this.initialized = false

        this.player = new Player(this.camera, this.playerOnFloor)
        this.canJump = true

        window.addEventListener('resize', () => {
            this.onWindowResize()
        });
    }

    get Player() {
        return this.player
    }

    crouch(params) {
        if(!lockscreen.locked) return
        this.player.crouch(params)
    }

    getSpawnPosition() {
        this.spawnPossibilities = [
            [4, 0.35, -4],
            [8.7, 0.35, -3.7],
            [-4.3, 0.35, -4.1],
            [-13.7, 0.35, -3.6],
            [-15.5, 0.35, 16.5],
            [-4.7, 0.35, 17.9],
            [8.5, 0.35, 17.5],
            [0.65, 0.35, 5]
        ]

        return this.spawnPossibilities[Math.floor(Math.random() * this.spawnPossibilities.length)]
    }

    initialize() {
        this.initVisuals()
    }

    initVisuals() {
        this.clock = new THREE.Clock();
        this.scene.background = new THREE.Color( 0x88ccee );
        this.scene.fog = new THREE.Fog( 0x88ccee, 0, 50 );

        const fillLight1 = new THREE.HemisphereLight( 0x8dc1de, 0x00668d, 2 );
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

        let spawn = this.getSpawnPosition()
        let x = spawn[0]
        let z = spawn[2]

        this.playerCollider = new Capsule( new THREE.Vector3( x, this.player.radius, z ), new THREE.Vector3( x, this.player.height, z ), this.player.radius );
        this.player.collider = this.playerCollider

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
    
        if(!this.player.state.includes('dead')) this.camera.position.copy( this.playerCollider.end );
    
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
        if(this.player.state == 'dead' || !lockscreen.locked) return
        
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
    
        if ( this.playerOnFloor && this.canJump ) {
    
            if ( keyStates[ 'Space' ] ) {

                this.jumpFatigue()
    
                this.playerVelocity.y = this.player.jumpForce;
    
            }
    
        }
    
    }

    jumpFatigue() {
        this.canJump = false
        let interval = setInterval(() => {
            if(this.playerOnFloor && !keyStates['spaceStillDown']) {
                clearInterval(interval)
                setTimeout(() => {
                    this.canJump = true
                }, 50)
            }
        }, 50)
    }

    renderMap() {
        this.worldOctree = new Octree();

        const loader = new GLTFLoader()

        loader.load( './World/WorldObjects/krunker-shipyard.glb', ( gltf ) => {
        
            let s = 0.08
            gltf.scene.scale.set(s, s, s)
            this.map = gltf.scene
            this.map.receiveShadow = true
            this.map.castShadow = true
            this.scene.add( gltf.scene );
        
            this.worldOctree.fromGraphNode( gltf.scene );

            this.addLattice()
            this.addBarrier()
        
            gltf.scene.traverse( child => {
        
                if ( child.isMesh ) {  

                    if ( child.material.map ) {
                        child.material.map.anisotropy = 4;
                    }
        
                }
        
            } );

            this.initPhysics()
        
        } );
    }

    addLattice() {
        let infos = [
            [[8.8, 0.6, -5.37], 0],
            [[6.3, 0.6, -5.37], 0],
            [[3.8, 0.6, -5.37], 0],
            [[1.3, 0.6, -5.37], 0],
            [[-1.2, 0.6, -5.37], 0],
            [[-3.7, 0.6, -5.37], 0],
            [[-6.2, 0.6, -5.37], 0],
            [[-8.7, 0.6, -5.37], 0],
            [[-11.2, 0.6, -5.37], 0],
            [[-13.7, 0.6, -5.37], 0],
            [[-16.2, 0.6, -5.37], 0],

            [[10.14, 0.3, -1.25], - Math.PI / 2],
            [[10.14, 0.3, 1.25], - Math.PI / 2],

            [[9.5, 1.8, 19.1], Math.PI],
            [[7, 1.8, 19.1], Math.PI],
            [[4.5, 1.8, 19.1], Math.PI],
            [[2, 1.8, 19.1], Math.PI],
            [[-0.5, 1.8, 19.1], Math.PI],
            [[-3, 1.8, 19.1], Math.PI],
            [[-5.5, 1.8, 19.1], Math.PI],
            [[-8, 1.8, 19.1], Math.PI],
            [[-10.5, 1.8, 19.1], Math.PI],
            [[-13, 1.8, 19.1], Math.PI],
            [[-15.5, 1.8, 19.1], Math.PI],

            [[-16.7, 0.3, -4.2], Math.PI / 2],
            [[-16.7, 0.3, -1.7], Math.PI / 2],
            [[-16.7, 0.3, 0.8], Math.PI / 2],
            [[-16.7, 0.3, 8.3], Math.PI / 2],
            [[-16.7, 0.3, 10.8], Math.PI / 2],
        ]
        const geometry = new THREE.PlaneGeometry(2.5, 2.5)

        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('./Images/lattice.png')
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        
        for (let i = 0; i < infos.length; i++) {
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.set(...infos[i][0])
            mesh.rotation.y = infos[i][1]
            this.worldOctree.fromGraphNode(mesh)
            this.scene.add(mesh);
        }
    }

    addBarrier() {
        let infos = [
            [[-3.7, 4, -5.37], [30, 5], 0],
            [[-3.7, 5.5, 19.1], [30, 5], Math.PI],
            [[-16.7, 4, 7], [30, 5], Math.PI / 2],
            [[10.14, 4, 7], [30, 5], - Math.PI / 2],
        ]
        
        for (let i = 0; i < infos.length; i++) {
            const geometry = new THREE.PlaneGeometry(...infos[i][1])
            const material = new THREE.MeshBasicMaterial();
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.set(...infos[i][0])
            mesh.rotation.y = infos[i][2]
            this.worldOctree.fromGraphNode(mesh)
        }
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

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
    

    resetPlayerPosition(position) {
        if(!position) {
            position = this.getSpawnPosition()
        }
        let x = position[0]
        let z = position[2]
        this.playerCollider.start.set( x, 0.35, z );
        this.playerCollider.end.set( x, 1, z );
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