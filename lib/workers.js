'use strict';

var uploadThread = require('./helpers/upload.js');

module.exports.addition = function additionQueueWorker(job, cb) {
  uploadThread(job.task, job.anyfetchClient, job.serviceData, job.cache, cb);
};
