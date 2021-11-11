const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const aws = require('aws-sdk');

const s3 = new aws.S3();

require("dotenv").config();


const UserSchema = new mongoose.Schema({
    nome: { type: String, required: true},
    email: { type: String, require: true},
    senha: { type: String, required: false, select: false},
    celular: { type: Number, required: false}, 
    tokenGoogle: { type: String, require: false, select: false},
    latitude: { type: Number, required: false},
    longitude: { type: Number, required: false},
    achados: { type: Array, require: false, default: []},
    perdidos: { type: Array, require: false, default: []},
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
    if(this.foto){
        if(!this.foto.url){
            this.foto.url = `${process.env.APP_URL}/files/${this.foto.key}`;
            next();
        }
    }    
});

UserSchema.pre('findOneAndUpdate', async function(next){       
    const user = this.getUpdate().$set;
    if(!user){
        next();
    }
    if(!user.senha){
        next();
    }else{
        user.senha = await bcrypt.hash(user.senha, 10);
        next();
    }          
});

UserSchema.pre('remove', async function(){           
    if(this.foto){
        if (process.env.STORAGE_TYPE === 's3'){
            return s3.deleteObject({
                Bucket: 'achapet',
                Key: this.foto.key,
            }).promise()
        } else {
            return promisify(fs.unlink)(path.resolve(__dirname, '..', 'tmp', 'uploads', this.foto.key));
        }
    } 
})


// UserSchema.pre('', async function() {
//     console.log("entrou no schema update");
//     if(!this.foto.url){
//         this.foto.url = `${process.env.APP_URL}/files/${this.foto.key}`;
//     }
//     if (process.env.STORAGE_TYPE === 's3'){
//         return s3.deleteObject({
//             Bucket: 'achapet',
//             Key: this.foto.key,
//         }).promise()
//     } else {
//         return promisify(fs.unlink)(path.resolve(__dirname, '..', 'tmp', 'uploads', this.foto.key));
//     } 
// })

module.exports = User = mongoose.model('User', UserSchema);
