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

//cães postsAnimals -------------------------------------------------------------------------

router.post('/', verifyJWT, async(req, res) => {
    console.log(req.body);
    moment.locale('pt-br');  
    if(req.body.tipo === 'achado'){
      try{
        const achado = {
            id: Math.random() + Math.random(),
            email: req.body.email,
            nome: req.body.nome,
            descricao: req.body.descricao,
            animal: req.body.animal,
            caracteristicas: req.body.caracteristicas,        
            hora: moment().format('LT'),
            data: moment().format('LL'),
            latitude: req.body.latitude,
            longitude: req.body.longitude,        
        }
        const user = await User.updateOne(      
          { email: req.body.email },
          { $push: {'achados': achado}}, 
          { new: true, useFindAndModify: false });
          return res.send((achado));    
      }catch(error){
        console.log(error)
        return res.status(400).send({ error: 'Registration failed' });  
      }
    }else if (req.body.tipo === 'perdido') {
      try{
        const perdido = {
            id: Math.random() + Math.random(),
            email: req.body.email,
            nome: req.body.nome,
            descricao: req.body.descricao,
            animal: req.body.animal,
            caracteristicas: req.body.caracteristicas,        
            hora: moment().format('LT'),
            data: moment().format('LL'),
            longitude: req.body.longitude,
            latitude: req.body.latitude,
        }
        const user = await User.updateOne(      
          { email: req.body.email },
          { $push: {'perdidos': perdido}}, 
          { new: true, useFindAndModify: false });
          return res.send((perdido));    
      }catch(error){
        console.log(error)
        return res.status(400).send({ error: 'Registration failed' });  
      }
    } else {
      return res.status(400).send({ error: 'Tipo não selecionado' });
    }    
  });


// lista de animais perdidos e achados ---------------------------------------

router.get('/list', verifyJWT, async(req, res) => {
  const radius = 0.10
  const maxUserLat = parseFloat(req.query.latitude) + radius;
  const maxUserLon = parseFloat(req.query.longitude) + radius;
  const minUserLat = parseFloat(req.query.latitude) - radius;
  const minUserLon = parseFloat(req.query.longitude) - radius;  
  console.log('tipo', req.query.tipo)
  try{
    const listUser = await User.find()    
    const listaFinal = [];
    listUser.forEach((user) => {
      const petList = req.query.tipo === 'achados' ? user.achados : user.perdidos
      petList.forEach((pet) =>{        
        if(pet.latitude <= maxUserLat && pet.latitude >= minUserLat && 
          pet.longitude <= maxUserLon && pet.longitude >= minUserLon)
          listaFinal.push(pet)
      })
    })
    return res.status(200).send(listaFinal)
  }catch(error){
    return res.status(400).send({ error: 'Error' }); 
  }
})


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