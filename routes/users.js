const express = require('express');
const router = express.Router();
const mongoose = require ('mongoose');
const multer = require ('multer');
const multerConfig = require('../config/multer');
const path = require('path');
const aws = require('aws-sdk');
const moment = require('moment');


const User = require('../models/user.model');
const CepCoords = require("coordenadas-do-cep");

const s3 = new aws.S3();

require("dotenv").config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

 

router.post('/create', async(req, res) => {    
    if(!req.body.senha){ 
        return res.status(400).send({ error: 'Erro, senha vazia' });
    }else {
        try{          
          const { email } = req.body; 
            const user = await User.findOne({email});    
            if(user){
              return res.status(400).send({ error: 'Email já cadastrado' });               
            }else{ 
              const user = await User.create(req.body); 
              user.senha = undefined;   
              const token = jwt.sign({ senha: req.body.senha }, process.env.SECRET, { 
                expiresIn: 300
              });
              return res.send({ auth: true, user, token });          
            }            
          }catch(error){            
            return res.status(400).send({ error: 'Erro no registro' });    
          }
    }    
});

router.post('/authenticate', async(req, res) =>{    // post de autenticação 
    const { email, senha } = req.body;     
    if(!req.body.senha && !req.body.tokenGoogle){ 
      return res.status(400).send({ error: 'Erro senha e token vazios' });
    }else{     
      if(req.body.tokenGoogle && !req.body.senha){ 
        const user = await User.findOne({email}).select('+tokenGoogle'); 
        //tentando logar ou criar via google
        if(!user){                  
          const user = await User.create(req.body);
          const token = jwt.sign({ tokenGoogle: req.body.tokenGoogle }, process.env.SECRET, { 
            // expiresIn: 300  //expira em 5 min o token
          });
          user.tokenGoogle = undefined; 
          return res.send({ auth: true, user, token }); 
        }else{          
          const token = jwt.sign({ tokenGoogle: req.body.tokenGoogle }, process.env.SECRET, { 
            // expiresIn: 300 //expira em 5 min o token
          });
          user.tokenGoogle = undefined; 
          return res.send({ auth: true, user, token });  
        }
      }else if (!req.body.tokenGoogle && req.body.senha){ 
        try{
          const user = await User.findOne({email}).select('+senha');
          if(!user)
            return res.status(400).send({error: 'Usuario nao encontrado'});  
          if(!user.senha)
            return res.status(400).send({error: 'Usuario já tem cadastro pela google'});   //tentando fazer login normal          
          if(!await bcrypt.compare(senha, user.senha))
            return res.status(400).send({error: 'Senha invalida'});  
          const token = jwt.sign({ senha: req.body.senha }, process.env.SECRET, { 
            // expiresIn: 300 //expira em 5 min o token
          });
          user.senha = undefined; 
          res.send({auth: true, user, token});
        }catch(error){
          return res.status(400).send({ error: 'Login indevido' });
        }        
        console.log(user.email)        
      }else {        
        return res.status(400).send({ error: 'Login indevido' }); 
      }
    }
});

router.delete('/deleteUser', verifyJWT, async(req, res) =>{ //recebe um parametro com email do usuario para deletar do banco de dados  
  const { email } = req.body;  
  try{
      const user = await User.findOneAndDelete({email});
    if(user.foto.key){
      await user.remove();
    }  
    return res.status(200).send('Usuario  deletado com sucesso');    
  }catch(error){
    return res.status(400).send({ error: 'Error delete user' });
  }  
});

router.put('/updateUser', verifyJWT, async(req, res) => {   
  try{    
    const user = await User.findOneAndUpdate(
      { email: req.body.email },       
      { $set: req.body},
      { new: true, useFindAndModify: false });             
    return res.send((user));
  }catch(error){    
    return res.status(400).send({ error: 'Error update user' });    
  }  
});

router.put('/putFoto', verifyJWT, multer(multerConfig).single("file"), async(req, res) =>{   
  const { originalname: nomeFoto, size: tamanho, key, location: url = ""} = req.file;
  try{    
    const user = await User.findOneAndUpdate(
      { email: req.body.email }, 
      { $set: { foto: {
          nomeFoto,
          tamanho,
          key,
          url
        }
      }},
      { new: true, useFindAndModify: false });             
    return res.send((user));
  }catch(error){    
    return res.status(400).send({ error: 'Error update user' });    
  }     
});

// logout do sistema -------------------------------------------------------------------------

router.post('/logout', async(req, res) =>{  
  res.send({auth: false, token: null})
});

// função de verificação do Token ------------------------------------------------------------

function verifyJWT(req, res, next){    
  const token = req.headers['x-access-token']; 
  if (!token) return res.status(403).json({ auth: false, message: 'No token provided.' });
  
  jwt.verify(token, process.env.SECRET, function(err, decoded) { 
    if (err) return res.status(403).json({ auth: false, message: 'Failed to authenticate token.' });
    
    next();
  });
}

//Area de rotas para testes --------------------------------------------------------------------

router.post('/postImage', multer(multerConfig).single("file"), async(req, res) =>{  
  return res.json({ hello: "DEU CERTO" })
});

router.get('/client', verifyJWT, async(req, res, next) =>{ // GET de teste  
  console.log("Retornou todos clientes!");  
});

router.post('/obterLatLong', async(req, res) => {  //recebe um parametro com os dados do usuario e registra no banco de dados
  const body = req.body;
  try{
    await CepCoords.getByCep(req.body.cep)
    .then(info => {
      body.latUser = info.lat;
      body.lonUser = info.lon;      
       //retorna o mesmo 'info' da versão em promise
    })
    .catch((error) => {
      return res.status(400).send({ error: 'Invalid Zip Code' });  
       //retorna o mesmo parâmetro 'err' da versão em promise
    })         
    return res.send({body});
  }catch(error){
    return res.status(400).send({ error: 'Registration failed' });    
  }
});

module.exports = app => app.use('/users', router);