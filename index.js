const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
// const { http_codes, messages, errorStatus } = require('../constant/index.constant');

const FileUpload = (req, res, s3credential, next) => {
    const { region, secretAccessKey, accessKeyId, bucketName, bucketUrl = '', videoPrefix = '', imagePrefix = '', documentPrefix = '' } = s3credential
    if(!(region && secretAccessKey && accessKeyId && bucketName && bucketUrl)){
        if(region){
            return 'region must be required'
        } else if(secretAccessKey){
            return 'secretAccessKey must be required'
        } else if(accessKeyId){
            return 'accessKeyId must be required'
        } else if(bucketName){
            return 'bucketName must be required'
        }
    }

    var s3cred = {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
        region: region,
        bucket: bucketName
    }

    aws.config.update(s3cred);
    req.video_upload = {};
    req.image_upload = {};
    req.document_upload = {}
    req.creds3 = s3credential
    upload(req, res, async function (err) {
        if (err) {
            console.log(err);
            return err
            // return error(http_codes.internalError,  messages.imgNotUpload, errorStatus.imgNotUpload, res)
        } else {
            next()
            return req
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
        const { bucketUrl = '', videoPrefix = '', imagePrefix = '', documentPrefix = '' } = req.creds3
        if( file.mimetype == 'video/mp4' || 
            file.mimetype == 'video/quicktime' || 
            file.mimetype == 'video/x-sgi-movie' || 
            file.mimetype == 'video/x-msvideo'){
            if(req.video_upload[file.fieldname] == undefined){
                req.video_upload[file.fieldname] = []
            }
            var file_name = videoPrefix + uuidv4() + path.extname(file.originalname);
            req.video_upload[file.fieldname].push(bucketUrl+file_name)

        } else if( file.mimetype == 'image/gif' || 
            file.mimetype == 'image/jpeg' || 
            file.mimetype == 'image/png' || 
            file.mimetype == 'image/jpg' ||
            file.mimetype == 'image/svg+xml') {
            if(req.image_upload[file.fieldname] == undefined){
                req.image_upload[file.fieldname] = []
            }
            var file_name = imagePrefix + uuidv4() + path.extname(file.originalname);
            req.image_upload[file.fieldname].push(bucketUrl+file_name)
        } else {
            if(req.document_upload[file.fieldname] == undefined){
                req.document_upload[file.fieldname] = []
            }
            var file_name = documentPrefix + uuidv4() + path.extname(file.originalname);
            req.document_upload[file.fieldname].push(bucketUrl+file_name)
        }
        delete req.creds3
        cb(null, file_name);
    }
})

const upload = multer({
    storage: storage
}).any();

module.exports = FileUpload;
