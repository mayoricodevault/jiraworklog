(function () {
    'use strict';

    angular.module('worklogApp')
        .factory('intervalBackupService',['$interval', function ($interval) {

            var INTERVAL_TIME = 1000 * 60 * 5;
            var interval;

            /**
             * This function init the interval timer of the service.
             * @param callback
             */
            function init (callback) {
                interval = $interval(callback, INTERVAL_TIME);
            }

            /*Return public API*/
            return {
                init: init
            };


    }]);

})();