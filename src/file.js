const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const path = require('path');
const { http_codes, messages, errorStatus } = require('../constant/index.constant');
const { error } = require('../common/res.common')
const { s3: s3cred, bucketName, bucketUrl } = require('./../common/s3.common')

aws.config.update(s3cred);
const FileUpload = (req, res, next) => {
    req.video_upload = {};
    req.image_upload = {};
    req.document_upload = {}
    upload(req, res, async function (err) {
        if (err) {
            console.log(err);
            return error(http_codes.internalError,  messages.imgNotUpload, errorStatus.imgNotUpload, res)
        } else {
            next()
        }
    })
}

const storage = multerS3({
    s3: new aws.S3(),
    bucket: bucketName,
    acl: 'public-read',
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        
        if( file.mimetype == 'video/mp4' || 
            file.mimetype == 'video/quicktime' || 
            file.mimetype == 'video/x-sgi-movie' || 
            file.mimetype == 'video/x-msvideo'){
            if(req.video_upload[file.fieldname] == undefined){
                req.video_upload[file.fieldname] = []
            }
            let folder = 'uploads/video/_'+Date.now()+'/';
            var file_name = folder + 'video__' + Date.now()+ '_' + parseInt(Math.random()*543541516845) + path.extname(file.originalname);
            req.video_upload[file.fieldname].push(bucketUrl+file_name)

        } else if( file.mimetype == 'image/gif' || 
            file.mimetype == 'image/jpeg' || 
            file.mimetype == 'image/png' || 
            file.mimetype == 'image/jpg' ||
            file.mimetype == 'image/svg+xml') {
            if(req.image_upload[file.fieldname] == undefined){
                req.image_upload[file.fieldname] = []
            }
            let folder = 'uploads/image/';
            var file_name = folder + 'image__' + Date.now()+ '_' + parseInt(Math.random()*543541516845) + path.extname(file.originalname);
            req.image_upload[file.fieldname].push(bucketUrl+file_name)
        } else {
            if(req.document_upload[file.fieldname] == undefined){
                req.document_upload[file.fieldname] = []
            }
            let folder = 'uploads/document/';
            var file_name = folder + 'document__' + Date.now()+ '_' + parseInt(Math.random()*543541516845) + path.extname(file.originalname);
            req.document_upload[file.fieldname].push(bucketUrl+file_name)
        }
        cb(null, file_name);
    }
})

const upload = multer({
    storage: storage
}).any();

module.exports = FileUpload;
