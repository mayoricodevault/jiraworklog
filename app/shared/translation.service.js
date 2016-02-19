(function () {
    'use strict';

    // Service Name: translationService
    angular.module('worklogApp')
        .factory('translationService', translationService);

    // Injections for this service
    translationService.$inject = [];

    /*
     * Constructor for this services
     */
    function translationService() {

        var TRANSLATIONS = {
            startTime: 'Start Time',
            endTime: 'End Time',
            issueKey: 'Issue Key'
        };

        // Public interface of this service
        return {
            translate: translate
        };


        function translate(key) {
            return TRANSLATIONS[key];
        }
    }
})();