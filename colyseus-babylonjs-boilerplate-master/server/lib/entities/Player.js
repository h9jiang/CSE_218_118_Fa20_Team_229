"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = exports.Position = void 0;
const schema_1 = require("@colyseus/schema");
class Position extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }
}
__decorate([
    schema_1.type("number")
], Position.prototype, "x", void 0);
__decorate([
    schema_1.type("number")
], Position.prototype, "y", void 0);
__decorate([
    schema_1.type("number")
], Position.prototype, "z", void 0);
exports.Position = Position;
class Player extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.position = new Position();
        this.pressedKeys = { x: 0, y: 0 };
    }
}
__decorate([
    schema_1.type("string")
], Player.prototype, "name", void 0);
__decorate([
    schema_1.type(Position)
], Player.prototype, "position", void 0);
exports.Player = Player;
