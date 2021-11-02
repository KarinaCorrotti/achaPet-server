const express = require('express');
const router = express.Router();
const mongoose = require ('mongoose');
const multer = require ('multer');
const multerConfig = require('../config/multer');
const path = require('path');
const aws = require('aws-sdk');
const moment = require('moment');


const User = require('../models/user.model');

const s3 = new aws.S3();

require("dotenv").config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// postsAnimals -------------------------------------------------------------------------

router.post('/postagem', verifyJWT, async(req, res) => {  
  moment.locale('pt-br');  
  try{
    const tipo = {
        id: Math.random() + Math.random(),
        email: req.body.email,
        nome: req.body.nome,
        celular: req.body.celular,
        nomeAnimal: req.body.nomeAnimal,
        animalTipo: req.body.animalTipo,
        raca: req.body.raca,        
        cor: req.body.cor,      
        caracteristicas: req.body.caracteristicas, 
        status: req.body.status,        
        hora: moment().format('LTS'),
        data: moment().format('YYYY-MM-DD'),            
        latitude: req.body.latitude,
        longitude: req.body.longitude,   
        fotos: req.body.fotos.split(','),     
    }
    const tipoPost = req.body.tipo;
    if(tipoPost === 'achados') {
      const user = await User.updateOne(      
        { email: req.body.email },
        { $push: {'achados': tipo}}, 
        { new: true, useFindAndModify: false });
        return res.send((tipo)); 
    }else{
      const user = await User.updateOne(      
        { email: req.body.email },
        { $push: {'perdidos': tipo}}, 
        { new: true, useFindAndModify: false });
        return res.send((tipo));  
    }         
  }catch(error){
    console.log(error)
    return res.status(400).send({ error: 'Registration failed' });  
  }   
});

// delete de post de animais perdidos e achados ------------------------------

router.delete('/deletePostsAnimals', verifyJWT, async(req, res) =>{ //recebe um parametro com ip do post para o delete
  const id = parseFloat(req.body.id);
  const email = req.body.email;
  const tipoPost = req.body.tipo;   
  try{
    if(tipoPost === 'achados'){
      await User.findOneAndUpdate(
        { email: email},
        { $pull: { achados: { id: id } } }, 
        { new: true},
      )
    }else{
      await User.findOneAndUpdate(
        { email: email},
        { $pull: { perdidos: { id: id } } }, 
        { new: true},
      )
    }           
    return res.status(200).send('Post deletado com sucesso');    
  }catch(error){
    console.log(error);
    return res.status(400).send({ error: 'Error delete post' });
  }  
});

// update de post animais perdidos e achados ---------------------------------

router.put('/updatePostsAnimals', verifyJWT, async(req, res) => {  
  const id = parseFloat(req.body.id);
  const email = req.body.email;
  const tipoPost = req.body.tipo;  
  try{    
    if(tipoPost === 'achados'){
      const user = await User.findOneAndUpdate(
        { email: email, "achados.id": id }, 
        { $set: {"achados.$.celular": req.body.celular,
          "achados.$.nomeAnimal": req.body.nomeAnimal,   
          "achados.$.animalTipo": req.body.animalTipo,
          "achados.$.raca": req.body.raca,
          "achados.$.cor": req.body.cor,
          "achados.$.caracteristicas": req.body.caracteristicas,
          "achados.$.status": req.body.status,
          "achados.$.latitude": req.body.latitude,
          "achados.$.longitude": req.body.longitude,
        }},
        { new: true, useFindAndModify: false });             
      return res.send((user.achados));
    }else{
      const user = await User.findOneAndUpdate(
        { email: email, "perdidos.id": id }, 
        { $set: {"achados.$.celular": req.body.celular,
          "achados.$.nomeAnimal": req.body.nomeAnimal,   
          "achados.$.animalTipo": req.body.animalTipo,
          "achados.$.raca": req.body.raca,
          "achados.$.cor": req.body.cor,
          "achados.$.caracteristicas": req.body.caracteristicas,
          "achados.$.status": req.body.status,
          "achados.$.latitude": req.body.latitude,
          "achados.$.longitude": req.body.longitude,
        }},
        { new: true, useFindAndModify: false });             
      return res.send((user.perdidos));
    }    
  }catch(error){    
    return res.status(400).send({ error: 'Error update user' });    
  }  
});

// update de fotos no post animais perdidos e achados ------------------------

router.post('/fotoPostsAnimals', verifyJWT, multer(multerConfig).single("file"), async(req, res) => {   
  console.log(req.file) 
  const { originalname: nomeFoto, size: tamanho, key, location: url = ""} = req.file; 
  try{       
    return res.status(200).send((url));   
  }catch(error){    
    console.log(error)
    return res.status(400).send({ error: 'Error post da foto' });    
  }  
});



// router.put('/fotoPostsAnimals', verifyJWT, multer(multerConfig).single("file"), async(req, res) => {  
//   const id = parseFloat(req.body.id);
//   const email = req.body.email;
//   const tipoPost = req.body.tipo;  
//   const { originalname: nomeFoto, size: tamanho, key, location: url = ""} = req.file; 
//   const objectFoto = {
//     idFoto: Math.random() + Math.random(),
//     nomeFoto: nomeFoto,
//     tamanho: tamanho,
//     key: key,
//     url: url
//   }  
//   try{    
//     if(tipoPost === 'achados'){
//       const user = await User.findOneAndUpdate(
//         { email: email, "achados.id": id }, 
//         { $push: { 'achados.$.fotos': objectFoto}},
//         { new: true, useFindAndModify: false });             
//       return res.status(200).send((objectFoto.url));
//     }else{
//       const user = await User.findOneAndUpdate(
//         { email: email, "perdidos.id": id }, 
//         { $push: { 'perdidos.$.fotos': objectFoto}},
//         { new: true, useFindAndModify: false });             
//       return res.status(200).send((objectFoto.url));
//     }    
//   }catch(error){    
//     return res.status(400).send({ error: 'Error post da foto' });    
//   }  
// });

// update de fotos no post animais perdidos e achados ------------------------

router.put('/deleteFotoPostsAnimals', verifyJWT, multer(multerConfig).single("file"), async(req, res) => {  
  const id = parseFloat(req.body.id);
  const email = req.body.email;
  const tipoPost = req.body.tipo;  
  const urlFoto = req.body.urlFoto;  
  console.log(urlFoto)
  try{       
    if(tipoPost === 'achados'){
      const user = await User.findOneAndUpdate(
        { email: email, "achados.id": id},
        { $pull: { 'achados.$.fotos': urlFoto } },         
        { new: true, useFindAndModify: false });         
      return res.status(200).send('Foto deletada com sucesso');
    }else{
      const user = await User.findOneAndUpdate(
        { email: email, "perdidos.id": id }, 
        { $pull: { 'perdidos.$.fotos': urlFoto } },
        { new: true, useFindAndModify: false });             
      return res.status(200).send('Foto deletada com sucesso');
    }    
  }catch(error){    
    console.log(error)
    return res.status(400).send({ error: 'Error delete da foto' });    
  }  
});

// lista de animais perdidos e achados ---------------------------------------

router.get('/list', verifyJWT, async(req, res) => {  
  try{
    const listUser = await User.find()  
    const listaFinal = [];
    listUser.forEach((user) => {
      const petList = req.query.tipo === 'achados' ? user.achados : user.perdidos
      petList.forEach((pet) =>{               
          listaFinal.push(pet)
      })
    })
    const sortedList = listaFinal.sort((v1, v2) => {                         
      return `${v1.data + '-' + v1.hora}` > `${v2.data + '-' + v2.hora}` ? 1 : `${v1.data + '-' + v1.hora}` === `${v2.data + '-' + v2.hora}` ? 0 : -1
    })       
    return res.status(200).send(sortedList)
  }catch(error){
    return res.status(400).send({ error: 'Error' }); 
  }
})

router.get('/listAtributoAnimal', verifyJWT, async(req, res) => {    
  const descricao = req.query.descricao;
  const atributo = req.query.atributo;
  try{
    const listUser = await User.find()    
    const listaFinal = [];
    listUser.forEach((user) => {
      const petList = req.query.tipo === 'achados' ? user.achados : user.perdidos
      petList.forEach((pet) =>{   
        if(pet[atributo] === descricao)   
          listaFinal.push(pet)
      })
    })
    const sortedList = listaFinal.sort((v1, v2) => {                         
      return `${v1.data + '-' + v1.hora}` > `${v2.data + '-' + v2.hora}` ? 1 : `${v1.data + '-' + v1.hora}` === `${v2.data + '-' + v2.hora}` ? 0 : -1
    })       
    return res.status(200).send(sortedList)
  }catch(error){
    return res.status(400).send({ error: 'Error' }); 
  }
})

router.get('/listAtributoSecondAnimal', verifyJWT, async(req, res) => {    
  const descricao = req.query.descricao;
  const atributo = req.query.atributo;
  const descricaoSecond = req.query.descricaoSecond;
  const atributoSecond = req.query.atributoSecond;
  try{
    const listUser = await User.find()    
    const listaFinal = [];
    listUser.forEach((user) => {
      const petList = req.query.tipo === 'achados' ? user.achados : user.perdidos
      petList.forEach((pet) =>{   
        if(pet[atributo] === descricao && pet[atributoSecond] === descricaoSecond)   
          listaFinal.push(pet)
      })
    })
    const sortedList = listaFinal.sort((v1, v2) => {                         
      return `${v1.data + '-' + v1.hora}` > `${v2.data + '-' + v2.hora}` ? 1 : `${v1.data + '-' + v1.hora}` === `${v2.data + '-' + v2.hora}` ? 0 : -1
    })       
    return res.status(200).send(sortedList)
  }catch(error){
    return res.status(400).send({ error: 'Error' }); 
  }
})


// router.get('/list', verifyJWT, async(req, res) => {
//   const radius = 0.10
//   const maxUserLat = parseFloat(req.query.latitude) + radius;
//   const maxUserLon = parseFloat(req.query.longitude) + radius;
//   const minUserLat = parseFloat(req.query.latitude) - radius;
//   const minUserLon = parseFloat(req.query.longitude) - radius;  
//   console.log('tipo', req.query.tipo)
//   try{
//     const listUser = await User.find()    
//     const listaFinal = [];
//     listUser.forEach((user) => {
//       const petList = req.query.tipo === 'achados' ? user.achados : user.perdidos
//       petList.forEach((pet) =>{        
//         if(pet.latitude <= maxUserLat && pet.latitude >= minUserLat && 
//           pet.longitude <= maxUserLon && pet.longitude >= minUserLon)
//           listaFinal.push(pet)
//       })
//     })
//     const sortedList = listaFinal.sort((v1, v2) => {                         
//       return `${v1.data + '-' + v1.hora}` > `${v2.data + '-' + v2.hora}` ? 1 : `${v1.data + '-' + v1.hora}` === `${v2.data + '-' + v2.hora}` ? 0 : -1
//     })       
//     return res.status(200).send(sortedList)
//   }catch(error){
//     return res.status(400).send({ error: 'Error' }); 
//   }
// })

// router.get('/listAnimal', verifyJWT, async(req, res) => {
//   const radius = 0.10
//   const maxUserLat = parseFloat(req.query.latitude) + radius;
//   const maxUserLon = parseFloat(req.query.longitude) + radius;
//   const minUserLat = parseFloat(req.query.latitude) - radius;
//   const minUserLon = parseFloat(req.query.longitude) - radius;  
//   console.log('tipo', req.query.animal)
//   try{
//     const listUser = await User.find()    
//     const listaFinal = [];
//     listUser.forEach((user) => {
//       const petList = req.query.tipo === 'achados' ? user.achados : user.perdidos
//       petList.forEach((pet) =>{   
//         if(pet.animalTipo === req.query.animalTipo)     
//           if(pet.latitude <= maxUserLat && pet.latitude >= minUserLat && 
//             pet.longitude <= maxUserLon && pet.longitude >= minUserLon)
//             listaFinal.push(pet)
//       })
//     })
//     const sortedList = listaFinal.sort((v1, v2) => {                         
//       return `${v1.data + '-' + v1.hora}` > `${v2.data + '-' + v2.hora}` ? 1 : `${v1.data + '-' + v1.hora}` === `${v2.data + '-' + v2.hora}` ? 0 : -1
//     })       
//     return res.status(200).send(sortedList)
//   }catch(error){
//     return res.status(400).send({ error: 'Error' }); 
//   }
// })

// função de verificação do Token ------------------------------------------------------------

function verifyJWT(req, res, next){    
    const token = req.headers['x-access-token']; 
    if (!token) return res.status(403).json({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, process.env.SECRET, function(err, decoded) { 
      if (err) return res.status(403).json({ auth: false, message: 'Failed to authenticate token.' });
      
      // se tudo estiver ok, salva no request para uso posterior
      // req.userId = decoded.senha;
      // console.log(req.userId);
      next();
    });
  }


module.exports = app => app.use('/postsAnimals', router);