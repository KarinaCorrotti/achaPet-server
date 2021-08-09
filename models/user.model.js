const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

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
    console.log("save");
    if(this.senha){
        const hash = await bcrypt.hash(this.senha, 10);
        this.senha = hash;        
    } 
    if(!this.foto.url){
        this.foto.url = `${process.env.APP_URL}/files/${this.foto.key}`;
    }
});

UserSchema.pre('remove', async function(){
    console.log(this.foto.key);
    return promisify(fs.unlink)(path.resolve(__dirname, '..', 'tmp', 'uploads', this.foto.key));
})


module.exports = User = mongoose.model('User', UserSchema);
