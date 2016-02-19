(function() {
    'use strict';

    angular.module('worklogApp')
        .filter('friendlyText',friendlyText)
        .filter('extendedFriendlyText',extendedFriendlyText)
        .filter('toHoursAndMinutes',toHoursAndMinutes);

    function friendlyText() {
        return function (statusCode) {
            var text = '';
            switch (statusCode) {
                case 'SENT':
                    text = 'Sent';
                    break;
                case 'NOT_SENT':
                    text = 'Not Sent';
                    break;
                case 'ERROR_400':
                    text = 'Invalid Input';
                    break;
                case 'ERROR_401':
                    text = 'Invalid Credentials';
                    break;
                case 'ERROR_403':
                    text = 'Insufficient Permissions';
                    break;
                case 'ERROR_404':
                    text = 'Not Found';
                    break;
                case 'ERROR_503':
                    text = 'Invalid Address';
                    break;
                case 'ERROR_ENOTFOUND':
                    text = 'Hostname/IP not found';
                    break;
                case 'ERROR_ETIMEDOUT':
                    text = 'Connection timeout';
                    break;
                default:
                    text = 'Unknown Error: ' + statusCode;
            }
            return text;
        };
    }

    function extendedFriendlyText() {
        return function (statusCode) {
            var text = '';
            switch (statusCode) {
                case 'SENT':
                    text = 'This worklog has been successfully sent to JIRA';
                    break;
                case 'NOT_SENT':
                    text = 'This worklog has not been sent to JIRA';
                    break;
                case 'ERROR_400':
                    text = 'This error can be caused by missing required fields, invalid values, etc. Please check that the information you introduced is valid.';
                    break;
                case 'ERROR_401':
                    text = 'Invalid Credentials. Please check the username and password you introduced.';
                    break;
                case 'ERROR_403':
                    text = 'You don\'t have the required permission level to add a worklog. Please contact with an administrator.';
                    break;
                case 'ERROR_404':
                    text = 'This error can be caused by invalid issue keys, incorrect JIRA URL, etc. Please check that the information you are using is valid.';
                    break;
                case 'ERROR_503':
                    text = 'Hostname/IP doesn\'t match certificate\'s altnames. Please contact with an administrator.';
                    break;
                case 'ERROR_ENOTFOUND':
                    text = 'Hostname/IP not found. Please check the JIRA connection URL.';
                    break;
                case 'ERROR_ETIMEDOUT':
                    text = 'Connection timeout. Please check the JIRA connection URL. ';
                    break;
                default:
                    text = 'Unknown Error: ' + statusCode;
            }
            return text;
        };
    }

    function toHoursAndMinutes() {
        return function(time){
            var hours = Math.abs(time) / 60;
            var minutes = Math.abs(time) % 60;

            return Math.floor(hours) + 'h ' + Math.floor(minutes) + 'm';
        };
    }

})();