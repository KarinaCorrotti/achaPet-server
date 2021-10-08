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

router.post('/', verifyJWT, async(req, res) => {
    console.log(req.body);
    moment.locale('pt-br');  
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
  });
  

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

module.exports = app => app.use('/perdidos', router);