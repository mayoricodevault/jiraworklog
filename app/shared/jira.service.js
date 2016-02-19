(function () {
    'use strict';

    // Service Name: jiraService
    angular.module('worklogApp')
        .factory('jiraService', jiraService);

    // Injections for this service
    jiraService.$inject = ['worklogDBService', '$q'];

    /*
     * Constructor for this services
     */
    function jiraService(worklogDBService, $q) {

        var Client = require('node-rest-client').Client;
        // TODO: Due to certificate problems we are "ignoring" unauthorized error when making rest calls.
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        var client = new Client();

        var constants = {
            worklogResourcePath: '/rest/api/2/issue/##issueKey##/worklog'
        };

        // Public interface of this service
        return {
            sendWorklog: sendWorklog,
            deleteWorklog: deleteWorklog,
            getSuggestions: getSuggestions
        };

        /**
         * This function send a worklog to JIRA.
         * @param worklog
         * @param loadedDate
         * @returns {*}
         */
        function sendWorklog(worklog, loadedDate){

            var defer = $q.defer();

            worklogDBService.getLoginData().then(function (loginData){

                var postUrl = loginData.jiraURL + constants.worklogResourcePath.replace("##issueKey##", worklog.issueKey);

                var duration = moment.duration(moment(worklog.endTime).diff(moment(worklog.startTime)));
                var minutes = Math.round(duration.asMinutes());

                var date = loadedDate.toISOString().slice(0, 11);
                var hour = new Date(worklog.startTime).toISOString().slice(11, 24).replace('Z', '+0000');

                var postData = {
                    "timeSpent": minutes + 'm',
                    "started": date.concat(hour),
                    "comment": worklog.description
                };

                var args = {
                    data: postData,
                    headers: {"Content-Type": "application/json", Authorization: 'Basic ' + btoa(loginData.username + ':' + loginData.password)}
                };

                client.post(postUrl, args, function (data, response) {
                    if(data.hasOwnProperty('id')){
                        defer.resolve(data.id);
                    }else{
                        defer.reject(response.statusCode);
                    }
                }).on('error', function (error) {
                    defer.reject(error.code);
                });
            });

            return defer.promise;
        }

        /**
         * This function delete a worklog from JIRA.
         * @param worklog
         * @returns {*}
         */
        function deleteWorklog(worklog){

            var defer = $q.defer();

            worklogDBService.getLoginData().then(function (loginData){
                var issueKey = worklog.issueKey;
                var worklogId = worklog.worklogId;
                var deleteUrl = loginData.jiraURL + constants.worklogResourcePath.replace("##issueKey##", issueKey) + '/' + worklogId;
                var deleteData = {};

                var args = {
                    data: deleteData,
                    headers: {"Content-Type": "application/json", Authorization: 'Basic ' + btoa(loginData.username + ':' + loginData.password)}
                };

                client.delete(deleteUrl, args, function(data, response){
                    defer.resolve(response);
                });
            });

            return defer.promise;
        }

        /**
         * This function get the suggestions of a issueKey from JIRA.
         * @param issueKey
         * @returns {*}
         */
        function getSuggestions(issueKey) {
            var defer = $q.defer();

            worklogDBService.getLoginData().then(function (loginData){
                var args = {headers: {"Content-Type": "application/json", Authorization: 'Basic ' + btoa(loginData.username + ':' + loginData.password)}};
                var suggestionsUrl = loginData.jiraURL + '/rest/api/2/issue/picker?currentJQL=&query=' + issueKey;

                console.log(suggestionsUrl);
                client.get(suggestionsUrl, args, function (data, response) {
                    if(response.statusCode === 200 && data.sections.length > 0 && data.sections[data.sections.length-1] !== undefined){
                        defer.resolve(data.sections[data.sections.length-1].issues);
                    }
                });
            });

            return defer.promise;
        }
    }
})();