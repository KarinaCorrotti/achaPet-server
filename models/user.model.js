const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require("dotenv").config();


const UserSchema = new mongoose.Schema({
    nome: { type: String, required: true},
    email: { type: String, require: true},
    senha: { type: String, required: false, select: false},
    tokenGoogle: { type: String, require: false},
    foto: {
        nomeFoto: {type: String, require: false},
        tamanho: {type: Number, require: false},
        key: {type: String, require: false},
        url: {type: String, require: false},
        createdAt: {type: Date, default: Date.now, require: false}
    }
});


UserSchema.pre('save', async function(next){
    if(this.senha){
        const hash = await bcrypt.hash(this.senha, 10);
        this.senha = hash;
        next();
    } 
    if(!this.foto.url){
        this.foto.url = `${process.env.APP_URL}/files/${this.foto.key}`;
    }
});


module.exports = User = mongoose.model('User', UserSchema);
