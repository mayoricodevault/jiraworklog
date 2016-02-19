(function () {
    'use strict';

    angular.module('worklogApp')
        .config(configure);

    configure.$inject = ['$routeProvider'];

    function configure($routeProvider) {
        //Define the default page of the application
        $routeProvider.otherwise({redirectTo: '/work'});
        //Worklog Page
        $routeProvider.when('/work', {
            templateUrl: './app/components/work/enterWorklog.html',
            controller: 'EnterWorklogController',
            controllerAs: 'enterWorklogCtrl'
        });
    }
})();