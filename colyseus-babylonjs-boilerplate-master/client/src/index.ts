import "./index.css";

import * as BABYLON from "babylonjs";
import 'babylonjs-loaders';
import Keycode from "keycode.js";
import { client } from "./game/network";
import { StateHandler } from "../../server/src/rooms/StateHandler";
import { Coordinate } from "../../server/src/entities/Player";

const canvas = document.getElementById('game') as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true);

// This creates a basic Babylon Scene object (non-mesh)
var scene = new BABYLON.Scene(engine);

scene.actionManager = new BABYLON.ActionManager(scene);

scene.gravity = new BABYLON.Vector3(0, -1, 0);
scene.collisionsEnabled = true;

const PLAYER_HEIGHT = 15;

var Soundfont = require('soundfont-player')
var audioContext = new AudioContext()

class PianoKey {
    box;
    startingNote = 36;
    setKeyAction(triggerKey, changeKey, soundTrigger, pressTrigger, upTrigger, pressColor, originalColor, keyNumber, startingNote, instrument, room, camera) {
        triggerKey.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction(
                    soundTrigger,
                    function () {
                        if (triggerKey == changeKey || (instrument == 'piano' && camera.position.z <= 0) || (instrument == 'celesta' && camera.position.z > 0)) {
                            Soundfont.instrument(audioContext, 'acoustic_grand_piano', { gain: 2 }).then(function (piano) {
                                piano.play(50 + keyNumber).stop(audioContext.currentTime + 0.5);
                            });
                        }
                    })
        );
        const message = {noteNumber: keyNumber, ispressed: false, pressedBy: room.sessionId};
        
        triggerKey.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                pressTrigger,
                function () {
                    if (triggerKey == changeKey || (instrument == 'piano' && camera.position.z <= 0) || (instrument == 'celesta' && camera.position.z > 0)) {
                        changeKey.material.emissiveColor = pressColor;
                        message.ispressed = true;
                        room.send('notes', message);
                        console.log("sent");
                    }
                }
            )
        )
        triggerKey.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                upTrigger,
                function () {
                    if (triggerKey == changeKey || (instrument == 'piano' && camera.position.z <= 0) || (instrument == 'celesta' && camera.position.z > 0)) {
                        changeKey.material.emissiveColor = originalColor;
                        message.ispressed = false;
                        room.send('notes', message);
                    }
                }
            )
        )
            
        // triggerKey.actionManager.registerAction(new BABYLON.SetValueAction(
        //             pressTrigger, 
        //             changeKey.material, 
        //             "emissiveColor", 
        //             pressColor
        // ));
        // triggerKey.actionManager.registerAction(new BABYLON.SetValueAction(
        //             upTrigger, 
        //             changeKey.material, 
        //             "emissiveColor", 
        //             originalColor
        // ));
    }

    constructor(scene, originalColor, pressColor, x, y, z, h, w, d, keyNumber, instrument, room, camera) {
        this.box = BABYLON.MeshBuilder.CreateBox("box", {height: h, width: w, depth: d}, scene);
        this.box.position = new BABYLON.Vector3(x, y, z);
        var mat = new BABYLON.StandardMaterial("ground", scene);
        mat.diffuseColor = originalColor;
        mat.specularColor = originalColor;
        mat.emissiveColor = originalColor;
        this.box.material = mat;

        this.box.actionManager = new BABYLON.ActionManager(scene);
        var keyboard = ['a', 's', 'd', 'f', 'g','h','j','k','l','q','w','e','r','t','y','u','i','o','p','1','2','3','4','5','6','7','8','9','0','z','x','c','v','b','n','m',',','.','/']
        this.setKeyAction(this.box, this.box, BABYLON.ActionManager.OnPickDownTrigger, BABYLON.ActionManager.OnPickDownTrigger, BABYLON.ActionManager.OnPickUpTrigger, pressColor, originalColor, keyNumber, this.startingNote, instrument, room, camera);
        if(keyNumber < keyboard.length) {
            this.setKeyAction(scene, this.box, { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: keyboard[keyNumber] }, 
                { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: keyboard[keyNumber] }, { trigger: BABYLON.ActionManager.OnKeyUpTrigger, parameter: keyboard[keyNumber] }, pressColor, originalColor, keyNumber, this.startingNote, instrument, room, camera);
        }
    }
}

class Piano {
    pianoFrame;
    keys = [];
    constructor(x, y, z, scene, instrument, room, camera) {
        this.pianoFrame = BABYLON.SceneLoader.ImportMesh("", "", "./untitled.obj", scene, function (newMeshes) {
            // Set the target of the camera to the first imported mesh
            for(var id in newMeshes) {
                var mesh = newMeshes[id];
                var mat = new BABYLON.StandardMaterial("piano", scene);
                mat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                // mat.emissiveColor = new BABYLON.Color3.Black();
                mesh.material = mat;
                mesh.scaling = new BABYLON.Vector3(2,4,2);
                mesh.position = new BABYLON.Vector3(x, y, z);
            }
        });
        var pianoStand = BABYLON.SceneLoader.ImportMesh("", "", "./stand.obj", scene, function (newMeshes) {
            // Set the target of the camera to the first imported mesh
            for(var id in newMeshes) {
                var mesh = newMeshes[id];
                var mat = new BABYLON.StandardMaterial("stand", scene);
                mat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                // mat.emissiveColor = new BABYLON.Color3.Black();
                mesh.material = mat;
                mesh.scaling = new BABYLON.Vector3(2,2,2);
                mesh.position = new BABYLON.Vector3(x, y, z);
            }
        });
        
        
        var keyNumber = 0;
        for(var i = -13.5; i <= 13.5; i++) {
            if([1,2,4,5,6].includes((i+13.5) % 7)) {
                this.keys.push(new PianoKey(scene, BABYLON.Color3.Black(), BABYLON.Color3.Red(), 2.9 + x, 1.7 + y, i + z - 0.5, 0.5, 5, 0.6, keyNumber++, instrument, room, camera).box);
            }
            this.keys.push(new PianoKey(scene, new BABYLON.Color3(0.8, 0.8, 0.8), BABYLON.Color3.Red(), 3.4 + x, 1 + y, i + z, 1, 6, 0.9, keyNumber++, instrument, room, camera).box);
        }

    }
}

var light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);

light.intensity = 0.7;
light.groundColor = new BABYLON.Color3(1, 1, 1);
light.intensity = 0.7;

const ROOM_X = 150;
const ROOM_Y = 40;
const ROOM_Z = 150;

// Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
/* Boundaries */
var ground = BABYLON.MeshBuilder.CreateGround("ground", 
{width: ROOM_Z + 10, height: ROOM_X + 10}, scene);
ground.checkCollisions = true;

var wall_N = BABYLON.MeshBuilder.CreatePlane("myPlane", 
{width: ROOM_Z + 10, height: ROOM_Y + 10, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
wall_N.position.y = ROOM_Y / 2;
wall_N.position.z = ROOM_X / 2;
wall_N.checkCollisions = true;

var wall_S = BABYLON.MeshBuilder.CreatePlane("myPlane", 
{width: ROOM_Z + 10, height: ROOM_Y + 10, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
wall_S.position.y = ROOM_Y / 2;
wall_S.position.z = -ROOM_X / 2;
wall_S.checkCollisions = true;

var wall_W = BABYLON.MeshBuilder.CreatePlane("myPlane", 
{width: ROOM_X + 10, height: ROOM_Y + 10, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
wall_W.position.y = ROOM_Y / 2;
wall_W.position.x = -ROOM_Z / 2;
wall_W.rotate(BABYLON.Axis.Y, Math.PI/2, BABYLON.Space.WORLD);
wall_W.checkCollisions = true;

var wall_E = BABYLON.MeshBuilder.CreatePlane("myPlane", 
{width: ROOM_X + 10, height: ROOM_Y + 10, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
wall_E.position.y = ROOM_Y / 2;
wall_E.position.x = ROOM_Z / 2;
wall_E.rotate(BABYLON.Axis.Y, Math.PI/2, BABYLON.Space.WORLD);
wall_E.checkCollisions = true;

var ceiling = BABYLON.MeshBuilder.CreatePlane("myPlane", 
{width: ROOM_Z, height: ROOM_X, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
ceiling.position.y = ROOM_Y;
ceiling.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.WORLD);
// ceiling.checkCollisions = true;

var white_board = BABYLON.MeshBuilder.CreatePlane("whiteboard",         
{width: (ROOM_X + 10)/ 8, height: (ROOM_Y + 10)/ 4, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);    
// white_board.parent = wall_W;
white_board.position.x = ROOM_X / 5 - 35;    
white_board.position.y = 30;
white_board.position.z = 0;
white_board.rotate(BABYLON.Axis.Y,  Math.PI * 1.5, BABYLON.Space.WORLD);
white_board.checkCollisions = true;

/* Textures */
var ground_mat = new BABYLON.StandardMaterial("wood floor", scene);
ground_mat.diffuseTexture = new BABYLON.Texture(
"https://i.imgur.com/wUGRD2s.png", scene);

var window_mat = new BABYLON.StandardMaterial("window wall", scene);
window_mat.diffuseTexture = new BABYLON.Texture(
"https://i.imgur.com/oqodmI9.jpeg", scene);

var wall_mat = new BABYLON.StandardMaterial("chair wall", scene);
wall_mat.diffuseTexture = new BABYLON.Texture(
"https://i.imgur.com/MO034Uh.png", scene);

var door_mat = new BABYLON.StandardMaterial("door wall", scene);
door_mat.diffuseTexture = new BABYLON.Texture(
"https://i.imgur.com/m6WMVCi.jpg", scene);

var ceiling_mat = new BABYLON.StandardMaterial("ceiling", scene);
ceiling_mat.diffuseTexture = new BABYLON.Texture(
"https://i.imgur.com/zVW0Lmk.png", scene);

var board_mat = new BABYLON.StandardMaterial("sheet music", scene);
board_mat.diffuseTexture = new BABYLON.Texture(        
"https://i.imgur.com/AyZgq.png", scene);

/* Boundary Texture Selection */
ground.material = ground_mat;
wall_N.material = window_mat;
wall_S.material = window_mat;
wall_W.material = wall_mat;
wall_E.material = door_mat;
ceiling.material = ceiling_mat;

/* Objects */
// None at the moment
white_board.material = board_mat;

// Attach default camera mouse navigation
// camera.attachControl(canvas);

// Set camera to follow current player
var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 2*PLAYER_HEIGHT, 0), scene);
camera.attachControl(canvas, true);

camera.applyGravity = true; 
camera.checkCollisions = true;

// Player camera
camera.setTarget(new BABYLON.Vector3(0, PLAYER_HEIGHT, 150)); // Look at the north wall
camera.ellipsoid = new BABYLON.Vector3(1, PLAYER_HEIGHT, 1);

// // Move camera using keyboard
// camera.keysUp.push(37); // w
// camera.keysLeft.push(38); // a
// camera.keysDown.push(39); // s
// camera.keysRight.push(40); // d
camera.speed = 0.3;
console.log("camera created!");

// Colyseus / Join Room
client.joinOrCreate<StateHandler>("game").then(room => {
    const playerViews: {[id: string]: BABYLON.Mesh} = {};

    room.state.players.onAdd = function(player, key) {
        if (key === room.sessionId) {
            var pianoSample1 = new Piano(25, 16, 35, scene, "celesta", room, camera);
            var pianoSample2 = new Piano(25, 16, -35, scene, "piano", room, camera);
            player.position.y = 2 * PLAYER_HEIGHT;
            camera.position.set(player.position.x, player.position.y, player.position.z);
        } else {
            playerViews[key] = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);

            // Move the sphere upward 1/2 its height
            player.position.y = 2*PLAYER_HEIGHT;
            playerViews[key].position.set(player.position.x, player.position.y, player.position.z);

            // Update player position based on changes from the server.
            player.position.onChange = () => {
                playerViews[key].position.set(player.position.x, player.position.y, player.position.z);
            };
            console.log("here");

            const keys = [player.keyA1, player.keyA2, player.keyA3, player.keyA4,
                player.keyA5, player.keyA6, player.keyA7, player.keyA8, player.keyA9, 
                player.keyA10, player.keyA11, player.keyA12, player.keyB1, player.keyB2, player.keyB3, 
                player.keyB4, player.keyB5, player.keyB6, player.keyB7, player.keyB8, 
                player.keyB9, player.keyB10, player.keyB11, player.keyB12, player.keyC1, player.keyC2,
                player.keyC3, player.keyC4, player.keyC5, player.keyC6, player.keyC7,
                player.keyC8, player.keyC9, player.keyC10, player.keyC11, player.keyC12, player.keyD1, 
                player.keyD2, player.keyD3, player.keyD4, player.keyD5, player.keyD6,
                player.keyD7, player.keyD8, player.keyD9, player.keyD10, player.keyD11, player.keyD12]  
            for(let i=0;i<keys.length;i++) {
                keys[i].onChange = () => {
                    if (keys[i].pressedBy != room.sessionId) {
                        if (keys[i].ispressed) 
                            console.log(String(i) + " is pressed");
                        else console.log(String(i) + " is released!");
                    }
                }
            }
        }
    };

    room.state.players.onRemove = function(player, key) {
        scene.removeMesh(playerViews[key]);
        delete playerViews[key];
    };

    room.onStateChange((state) => {
        console.log("New room state:", state.toJSON());
    });

    // Keyboard listeners
    const keyboard: Coordinate = { x: 0, z: 0 };
    window.addEventListener("keydown", function(e) {
        if (e.which === Keycode.LEFT || e.which === Keycode.RIGHT || e.which === Keycode.UP || e.which === Keycode.DOWN) {
            keyboard.x = camera.position.x;
            keyboard.z = camera.position.z;
            room.send('position', keyboard);
        }
    });

    window.addEventListener("keyup", function(e) {
        if (e.which === Keycode.LEFT || e.which === Keycode.RIGHT || e.which === Keycode.UP || e.which === Keycode.DOWN) {
            keyboard.x = camera.position.x;
            keyboard.z = camera.position.z;
            room.send('position', keyboard);
        }
    });

    // Resize the engine on window resize
    window.addEventListener('resize', function() {
        engine.resize();
    });
});

// Scene render loop
engine.runRenderLoop(function() {
    scene.render();
});
            
var gunshot = new BABYLON.Sound("gunshot", "gunshot.wav", scene); // Add your own link of the sound!!!