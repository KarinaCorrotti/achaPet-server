const express = require('express');
const router = express.Router();
const mongoose = require ('mongoose');
const multer = require ('multer');
const multerConfig = require('../config/multer')

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const User = require('../models/user.model');

router.post('/create', async(req, res) => {  // post para criação de usuário com senha
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

router.post('/authenticate', multer(multerConfig).single("file"), async(req, res) =>{    // post de autenticação 
    const { email, senha } = req.body; 
    
    if(!req.body.senha && !req.body.tokenGoogle){ 
      return res.status(400).send({ error: 'Erro senha e token vazios' });
    }else{
      const { originalname: nomeFoto, size: tamanho, filename: key} = req.file;
      if(req.body.tokenGoogle && !req.body.senha){ 
        const user = await User.findOne({email}).select('+tokenGoogle'); 
        //tentando logar ou criar via google
        if(!user){ 
          const userInfo = { 
            foto: {
              nomeFoto,
              tamanho,
              key,
              url: '',
            },
            ...req.body
          };          
          const user = await User.create(userInfo);
          const token = jwt.sign({ tokenGoogle: req.body.tokenGoogle }, process.env.SECRET, { 
            expiresIn: 300 
          });
          return res.send({ auth: true, user, token }); 
        }else{          
          const token = jwt.sign({ tokenGoogle: req.body.tokenGoogle }, process.env.SECRET, { 
            expiresIn: 300 
          });
          return res.send({ auth: true, user, token });  
        }
      }else if (!req.body.tokenGoogle && req.body.senha){ 
        const user = await User.findOne({email}).select('+senha');
        if(!user.senha)
          return res.status(400).send({error: 'Usuario já tem cadastro pela google'});
        //tentando fazer login normal  
        if(!user)
          return res.status(400).send({error: 'Usuario nao encontrado'});      
        if(!await bcrypt.compare(senha, user.senha))
          return res.status(400).send({error: 'Senha invalida'});  
        const token = jwt.sign({ senha: req.body.senha }, process.env.SECRET, { 
          expiresIn: 300 
        });
        res.send({auth: true, user, token});
      }else {        
        return res.status(400).send({ error: 'Login indevido' }); 
      }
    }
});


function verifyJWT(req, res, next){  // função de verificação do Token
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

router.get('/client', verifyJWT, async(req, res, next) =>{ // GET de teste
  // console.log('body do get:', req.userId);
  console.log("Retornou todos clientes!");  
});

router.post('/logout', async(req, res) =>{  // logout do sistema
  res.send({auth: false, token: null})
});

router.post('/postImage', multer(multerConfig).single("file"), async(req, res) =>{  // logout do sistema
  console.log(req.file);

  return res.json({ hello: "DEU CERTO" })
});


module.exports = app => app.use('/users', router);