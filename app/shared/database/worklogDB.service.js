(function () {
    'use strict';

    // Service Name: worklogDBService
    angular.module('worklogApp')
        .factory('worklogDBService', worklogDBService);

    // Injections for this service
    worklogDBService.$inject = ['pouchDB', '$q'];

    /*
     * Constructor for this services
     */
    function worklogDBService(pouchDB, $q) {

        // Service Constants
        var SERVICE_CONSTANTS = {
            DB_NAME: 'JIRADB',
            LOGIN_DOCUMENT_ID: 'LOGIN_DATA',
            DOCUMENT_ID_HEADER: 'WORKLOG::'
        };

        var db = {};

        initialization();

        // Public interface of this service
        return {
            getWorklog: getWorklog,
            saveWorklog: saveWorklog,
            getLoginData: getLoginData,
            saveLoginData: saveLoginData,
            deleteLoginData: deleteLoginData
        };

        ///////////////////////

        /**
         * This function initialize the worklogDB service.
         */
        function initialization() {
            //Open/Create the database on PouchDB
            db = pouchDB(SERVICE_CONSTANTS.DB_NAME);
        }


        /**
         *  This function recovers from database the user's login information.
         * @returns {*}
         */
        function getLoginData() {
            return db.get(SERVICE_CONSTANTS.LOGIN_DOCUMENT_ID).then(function (loginInfo) {
                return loginInfo;
            }).catch(function (error) {
                console.error('Error getting login data, error info: ' + JSON.stringify(error));
                return null;
            });
        }

        /**
         * This function saves a document in local database. After that returns the new document revision
         * @param doc Document that is going to be stored.
         * @param overwriteConflict Use true if the user wants to overwrite the document in case of conflict. In other case use false.
         * @returns {*}
         */
        function saveDocument(doc, overwriteConflict) {
            var defer = $q.defer();

            db.put(doc).then(function (newDoc) {
                defer.resolve(newDoc.rev);
            }).catch(function (error) {
                if (error.status === 409 && overwriteConflict) {
                    db.get(doc._id).then(function (data) {
                        doc._rev = data._rev;
                        db.put(doc).then(function (newDoc) {
                            defer.resolve(newDoc.rev);
                        });
                    });
                } else {
                    console.error('There was an error saving the document with ID' + doc._id + ', error info: ' + JSON.stringify(error));
                    defer.resolve(null);
                }
            });

            return defer.promise;
        }

        /**
         * This function saves the login data on the local database.
         * @param doc
         * @param overwriteConflict
         * @returns {*}
         */
        function saveLoginData(doc, overwriteConflict) {

            doc._id = SERVICE_CONSTANTS.LOGIN_DOCUMENT_ID;

            return saveDocument(doc, overwriteConflict);
        }

        /**
         * This function delete the login data from the local database.
         * @returns {*}
         */
        function deleteLoginData() {
            return db.get(SERVICE_CONSTANTS.LOGIN_DOCUMENT_ID).then(function (doc) {
                return db.remove(doc._id, doc._rev);
            });
        }

        /**
         * Recovers from database the worklog associated to the date passed by parameters.
         * @param date Date the user wants to know the worklog.
         * @returns {*}
         */
        function getWorklog(date) {
            var docId = getDocumentID(date);
            console.log(docId);
            return db.get(docId).then(function (data) {
                return data;
            }).catch(function (error) {
                console.error('Error getting worklog for day ' + date + ', error info: ' + JSON.stringify(error));
                return null;
            });
        }

        /**
         * Store in database the worklog associated to the date passed by parameters.
         * @param date Date the user wants to store the worklog.
         * @param worklogs Array that contains all worklog entries associated to the date passed by parameters.
         * @param overwriteConflict Use true if the user wants to overwrite the document in case of conflict. In other case use false.
         * @returns {*}
         */

        function saveWorklog(date, worklogs, overwriteConflict) {

            var worklogInfo = {
                _id: getDocumentID(date),
                worklogs: worklogs
            };

            return saveDocument(worklogInfo, overwriteConflict);
        }

        /**
         * This function return the documentID with a given date.
         * @param date
         * @returns {string}
         */
        function getDocumentID(date) {

            return SERVICE_CONSTANTS.DOCUMENT_ID_HEADER + date.toISOString().slice(0, 10).replace(/-/g, "")
        }
    }
})();